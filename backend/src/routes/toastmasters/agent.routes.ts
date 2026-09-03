// src/routes/toastmasters/agent.routes.ts — "Run Agent": AI fulfillment of an
// AI_AGENT-assigned role, writing into the same tables a human would.
import { Router } from 'express';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import {
  analyzeSpeech, computeAgentCostUsd, generateAgentEvaluation, generateAgentGeneralEvaluation,
  generateAgentGrammarianReport, generateAgentSpeech, generateAgentTableTopics,
} from '../../services/ai.service';
import type { AgentUsage } from '../../services/ai.service';
import { TM_SPEAKER_EVALUATOR_PAIRS } from './helpers';

const router = Router();
router.use(authenticate);

const SPEAKER_ROLES = new Set(TM_SPEAKER_EVALUATOR_PAIRS.map(([s]) => s));
const EVALUATOR_TO_SPEAKER = new Map(TM_SPEAKER_EVALUATOR_PAIRS.map(([s, e]) => [e, s]));
const PROCEDURAL_ROLES = new Set(['TIMER', 'SAA', 'PO', 'TMOD', 'MENTOR']);

// POST /api/toastmasters/roles/:roleId/run-agent
router.post('/roles/:roleId/run-agent', async (req, res, next) => {
  let roleId: string | undefined;
  try {
    let role = await prisma.tmRoleAssignment.findFirst({
      where: { id: req.params.roleId, meeting: { organizationId: req.user!.organizationId } },
      include: { meeting: true },
    });
    if (!role) throw new AppError(404, 'Role not found');
    if (role.assigneeType !== 'AI_AGENT') throw new AppError(400, 'This role is not assigned to an AI agent');
    roleId = role.id;

    await prisma.tmRoleAssignment.update({ where: { id: role.id }, data: { agentStatus: 'RUNNING' } });

    let result: unknown = null;
    const usageTotal: AgentUsage = { inputTokens: 0, outputTokens: 0 };
    function addUsage(u: AgentUsage) {
      usageTotal.inputTokens += u.inputTokens;
      usageTotal.outputTokens += u.outputTokens;
    }

    if (SPEAKER_ROLES.has(role.roleName)) {
      const generated = await generateAgentSpeech({
        roleName: role.roleName,
        speechTitle: role.speechTitle ?? undefined,
        pathwaysProject: role.pathwaysProject ?? undefined,
        manualNumber: role.manualNumber ?? undefined,
        wordOfDay: role.meeting.wordOfDay ?? undefined,
        theme: role.meeting.theme ?? undefined,
      });
      addUsage(generated.usage);
      if (!generated.transcript.trim()) throw new Error('Agent produced an empty speech transcript');

      const analysis = await analyzeSpeech({
        transcript: generated.transcript,
        wordOfDay: role.meeting.wordOfDay ?? undefined,
      });
      addUsage(analysis.usage);
      const wordCount = generated.transcript.trim().split(/\s+/).filter(Boolean).length;

      const speechAnalysis = await prisma.tmSpeechAnalysis.upsert({
        where: { roleAssignmentId: role.id },
        create: {
          meetingId: role.meetingId, roleAssignmentId: role.id, transcript: generated.transcript, wordCount,
          grammarScore: analysis.grammar.score, grammarErrors: analysis.grammar.errors as any, grammarSuggestions: analysis.grammar.suggestions as any,
          fillerWordCounts: analysis.fillerWords as any,
          contentScore: analysis.evaluation.contentScore, deliveryScore: analysis.evaluation.deliveryScore,
          languageScore: analysis.evaluation.languageScore, overallScore: analysis.evaluation.overallScore,
          commendations: analysis.evaluation.commendations as any, recommendations: analysis.evaluation.recommendations as any,
          openingFeedback: analysis.evaluation.openingFeedback, bodyFeedback: analysis.evaluation.bodyFeedback,
          conclusionFeedback: analysis.evaluation.conclusionFeedback, wordOfDayUsed: analysis.wordOfDayUsed,
          summary: analysis.summary, generatedByAgent: true,
        },
        update: {
          transcript: generated.transcript, wordCount,
          grammarScore: analysis.grammar.score, grammarErrors: analysis.grammar.errors as any, grammarSuggestions: analysis.grammar.suggestions as any,
          fillerWordCounts: analysis.fillerWords as any,
          contentScore: analysis.evaluation.contentScore, deliveryScore: analysis.evaluation.deliveryScore,
          languageScore: analysis.evaluation.languageScore, overallScore: analysis.evaluation.overallScore,
          commendations: analysis.evaluation.commendations as any, recommendations: analysis.evaluation.recommendations as any,
          openingFeedback: analysis.evaluation.openingFeedback, bodyFeedback: analysis.evaluation.bodyFeedback,
          conclusionFeedback: analysis.evaluation.conclusionFeedback, wordOfDayUsed: analysis.wordOfDayUsed,
          summary: analysis.summary, generatedByAgent: true,
        },
      });

      if (!role.speechTitle) {
        await prisma.tmRoleAssignment.update({ where: { id: role.id }, data: { speechTitle: generated.title } });
      }
      result = speechAnalysis;
    } else if (EVALUATOR_TO_SPEAKER.has(role.roleName)) {
      const speakerRoleName = EVALUATOR_TO_SPEAKER.get(role.roleName)!;
      const speakerRole = await prisma.tmRoleAssignment.findFirst({
        where: { meetingId: role.meetingId, roleName: speakerRoleName },
        include: { speechAnalysis: true },
      });
      if (!speakerRole?.speechAnalysis?.transcript) {
        throw new AppError(400, `${speakerRoleName}'s speech hasn't been recorded or generated yet — run that first`);
      }

      const { usage: evalUsage, ...evaluation } = await generateAgentEvaluation({
        speechTranscript: speakerRole.speechAnalysis.transcript,
        speechTitle: speakerRole.speechTitle ?? undefined,
        wordOfDay: role.meeting.wordOfDay ?? undefined,
      });
      addUsage(evalUsage);

      result = await prisma.tmEvaluation.upsert({
        where: { meetingId_speakerRoleId: { meetingId: role.meetingId, speakerRoleId: speakerRole.id } },
        create: { meetingId: role.meetingId, speakerRoleId: speakerRole.id, evaluatorRoleId: role.id, ...evaluation, generatedByAgent: true },
        update: { evaluatorRoleId: role.id, ...evaluation, generatedByAgent: true },
      });
    } else if (role.roleName === 'GENERAL_EVALUATOR') {
      const evaluations = await prisma.tmEvaluation.findMany({
        where: { meetingId: role.meetingId },
        include: { speaker: { include: { member: true } } },
      });
      const generated = await generateAgentGeneralEvaluation({
        meetingTitle: role.meeting.title,
        theme: role.meeting.theme ?? undefined,
        evaluations: evaluations.map((e) => ({
          speakerName: e.speaker.member?.name ?? 'Unassigned',
          speechTitle: e.speaker.speechTitle ?? undefined,
          overallRating: e.overallRating ?? undefined,
        })),
      });
      addUsage(generated.usage);
      const bestSpeaker = evaluations
        .filter((e) => e.overallRating != null)
        .sort((a, b) => (b.overallRating ?? 0) - (a.overallRating ?? 0))[0];

      result = await prisma.tmGeneralEvaluation.upsert({
        where: { meetingId: role.meetingId },
        create: {
          meetingId: role.meetingId, overallFeedback: generated.overallFeedback,
          evaluatorFeedback: generated.evaluatorFeedback as any,
          bestSpeakerRoleId: bestSpeaker?.speakerRoleId, generatedByAgent: true,
        },
        update: {
          overallFeedback: generated.overallFeedback, evaluatorFeedback: generated.evaluatorFeedback as any,
          bestSpeakerRoleId: bestSpeaker?.speakerRoleId, generatedByAgent: true,
        },
      });
    } else if (role.roleName === 'GRAMMARIAN') {
      const analyses = await prisma.tmSpeechAnalysis.findMany({
        where: { meetingId: role.meetingId },
        include: { roleAssignment: { include: { member: true } } },
      });
      const { usage: grammarUsage, ...generated } = await generateAgentGrammarianReport({
        wordOfDay: role.meeting.wordOfDay ?? undefined,
        transcripts: analyses.map((a) => ({ speakerName: a.roleAssignment.member?.name ?? 'Speaker', transcript: a.transcript })),
      });
      addUsage(grammarUsage);

      result = await prisma.tmGrammarianLog.upsert({
        where: { meetingId: role.meetingId },
        create: { meetingId: role.meetingId, wordOfDay: role.meeting.wordOfDay ?? undefined, ...generated, generatedByAgent: true },
        update: { wordOfDay: role.meeting.wordOfDay ?? undefined, ...generated, generatedByAgent: true },
      });
    } else if (role.roleName === 'AH_COUNTER') {
      const analyses = await prisma.tmSpeechAnalysis.findMany({
        where: { meetingId: role.meetingId },
        include: { roleAssignment: true },
      });
      const totals = new Map<string, { umCount: number; uhCount: number; soCount: number; likeCount: number; erCount: number; youKnowCount: number; otherCount: number }>();
      for (const a of analyses) {
        const memberId = a.roleAssignment.memberId;
        if (!memberId) continue;
        const f = a.fillerWordCounts as any;
        const prev = totals.get(memberId) ?? { umCount: 0, uhCount: 0, soCount: 0, likeCount: 0, erCount: 0, youKnowCount: 0, otherCount: 0 };
        totals.set(memberId, {
          umCount: prev.umCount + (f?.um ?? 0), uhCount: prev.uhCount + (f?.uh ?? 0), soCount: prev.soCount + (f?.so ?? 0),
          likeCount: prev.likeCount + (f?.like ?? 0), erCount: prev.erCount + (f?.er ?? 0),
          youKnowCount: prev.youKnowCount + (f?.you_know ?? 0), otherCount: prev.otherCount,
        });
      }

      const meetingId = role.meetingId;
      result = await prisma.$transaction(
        Array.from(totals.entries()).map(([memberId, counts]) => prisma.tmAhCounter.upsert({
          where: { meetingId_memberId: { meetingId, memberId } },
          create: { meetingId, memberId, ...counts },
          update: counts,
          include: { member: true },
        }))
      );
    } else if (role.roleName === 'TABLE_TOPICS_MASTER') {
      const { usage: topicsUsage, ...generated } = await generateAgentTableTopics({
        theme: role.meeting.theme ?? undefined,
        wordOfDay: role.meeting.wordOfDay ?? undefined,
      });
      addUsage(topicsUsage);
      result = generated;
      await prisma.tmRoleAssignment.update({ where: { id: role.id }, data: { agentOutput: generated as any } });
    } else if (PROCEDURAL_ROLES.has(role.roleName)) {
      const note = { note: 'Assigned to AI Agent — role slot filled; no generated content applies to this duty.' };
      result = note;
      await prisma.tmRoleAssignment.update({ where: { id: role.id }, data: { agentOutput: note as any } });
    } else {
      throw new AppError(400, `Unknown role type: ${role.roleName}`);
    }

    const costUsd = computeAgentCostUsd(usageTotal);
    await prisma.tmMeeting.update({
      where: { id: role.meetingId },
      data: {
        agentInputTokens: { increment: usageTotal.inputTokens },
        agentOutputTokens: { increment: usageTotal.outputTokens },
        agentCostUsd: { increment: costUsd },
      },
    });

    role = await prisma.tmRoleAssignment.update({
      where: { id: role.id },
      data: { agentStatus: 'DONE', agentRunAt: new Date() },
      include: { meeting: true, member: true },
    });

    res.json({
      success: true, role, result,
      usage: { inputTokens: usageTotal.inputTokens, outputTokens: usageTotal.outputTokens, costUsd },
    });
  } catch (err) {
    if (roleId) {
      await prisma.tmRoleAssignment.update({ where: { id: roleId }, data: { agentStatus: 'FAILED' } }).catch(() => {});
    }
    next(err);
  }
});

export default router;
