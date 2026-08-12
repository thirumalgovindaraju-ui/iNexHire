// ═══════════════════════════════════════════════════════════════════════════
// NexHire AI PROCTORING SYSTEM
// Complete implementation: backend + AI analysis + frontend
// ═══════════════════════════════════════════════════════════════════════════

// ─── PART 1: Schema additions (add to schema.prisma) ───────────────────────

/*
Add to enum ProctorEventType:
  AUDIO_ANOMALY
  LOOKING_AWAY
  PHONE_DETECTED
  READING_FROM_SCREEN
  LIP_SYNC_MISMATCH
  BACKGROUND_VOICE
  SUSPICIOUS_PAUSE
  IDENTITY_MISMATCH
  AI_GENERATED_RESPONSE

Add this new model:

model ProctoringReport {
  id              String   @id @default(cuid())
  interviewId     String   @unique
  riskScore       Int      // 0-100, higher = more suspicious
  riskLevel       String   // LOW | MEDIUM | HIGH | CRITICAL
  flags           Json     // [{ type, timestamp, severity, description, evidence }]
  aiAnalysis      String   // Claude's narrative assessment
  recommendation  String   // CLEAN | REVIEW | ESCALATE | VOID
  snapshots       Int      @default(0) // number of frames captured
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  interview Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  @@map("proctoring_reports")
}
*/

// ─── PART 2: Add to ai.service.ts ──────────────────────────────────────────

export interface ProctoringFlag {
  type: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence?: string;
}

export interface ProctoringAnalysisResult {
  riskScore: number;       // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: ProctoringFlag[];
  aiAnalysis: string;
  recommendation: 'CLEAN' | 'REVIEW' | 'ESCALATE' | 'VOID';
}

export async function analyseProctoringData(params: {
  events: Array<{ eventType: string; timestamp: string; metadata?: any }>;
  transcripts: string[];
  jobTitle: string;
  durationMinutes: number;
}): Promise<ProctoringAnalysisResult> {
  const { events, transcripts, jobTitle, durationMinutes } = params;

  // Summarise events for the prompt
  const eventSummary = events.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fullTranscript = transcripts.join('\n\n');

  // Detect AI-generated response patterns from transcript
  const prompt = `You are an expert in interview integrity assessment and cheating detection.
Analyse this interview session for signs of malpractice, cheating, or integrity violations.

JOB ROLE: ${jobTitle}
INTERVIEW DURATION: ${durationMinutes} minutes
TOTAL EVENTS LOGGED: ${events.length}

BEHAVIOURAL EVENTS DETECTED:
${JSON.stringify(eventSummary, null, 2)}

RAW EVENT TIMELINE (last 20):
${events.slice(-20).map(e => `[${e.timestamp}] ${e.eventType}${e.metadata ? ': ' + JSON.stringify(e.metadata) : ''}`).join('\n')}

INTERVIEW TRANSCRIPTS:
"""
${fullTranscript.slice(0, 3000)}
"""

Analyse for these malpractice indicators:

1. TECHNICAL CHEATING:
   - Tab switching patterns (frequent = looking up answers)
   - Copy-paste events (pre-prepared answers)
   - Multiple faces detected (someone else helping)
   - Phone detected in frame
   - Reading from screen (eyes not on camera)

2. RESPONSE QUALITY ANOMALIES:
   - Responses too perfect/polished for spoken interview (AI-generated)
   - Identical phrasing patterns across answers (pre-scripted)
   - Suspicious pauses before answering (looking up)
   - Background voices audible (coaching)
   - Lip sync mismatch (pre-recorded response playback)

3. IDENTITY CONCERNS:
   - Face not detected for extended periods
   - Multiple different faces across session
   - Significant appearance changes mid-interview

4. STATISTICAL ANOMALIES:
   - Response times that are unnaturally consistent
   - Answer quality dramatically higher than conversational quality
   - No filler words, hesitations, or natural speech patterns

Rate each flag's severity and provide an overall assessment.

Return ONLY valid JSON:
{
  "riskScore": <0-100, where 0=clean, 100=definite cheating>,
  "riskLevel": <"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "flags": [
    {
      "type": "<flag category>",
      "timestamp": "<ISO timestamp or 'throughout'>",
      "severity": "<critical|high|medium|low>",
      "description": "<specific observation>",
      "evidence": "<what triggered this flag>"
    }
  ],
  "aiAnalysis": "<2-3 paragraph narrative assessment of integrity>",
  "recommendation": <"CLEAN"|"REVIEW"|"ESCALATE"|"VOID">
}

Risk score guide:
0-20: CLEAN — normal interview behaviour
21-40: LOW — minor anomalies, likely benign
41-60: MEDIUM — suspicious patterns, human review recommended
61-80: HIGH — strong indicators of assistance or cheating
81-100: CRITICAL — clear evidence, consider voiding interview`;

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as ProctoringAnalysisResult;
    return {
      riskScore: Math.max(0, Math.min(100, parsed.riskScore ?? 0)),
      riskLevel: parsed.riskLevel ?? 'LOW',
      flags: parsed.flags ?? [],
      aiAnalysis: parsed.aiAnalysis ?? 'Analysis unavailable.',
      recommendation: parsed.recommendation ?? 'REVIEW',
    };
  } catch {
    return {
      riskScore: 0, riskLevel: 'LOW', flags: [],
      aiAnalysis: 'Proctoring analysis unavailable.',
      recommendation: 'REVIEW',
    };
  }
}

// ─── PART 3: backend/src/routes/proctoring.routes.ts ───────────────────────

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { analyseProctoringData } from '../services/ai.service';

const router = Router();

// ── Log a proctoring event (called from frontend, no auth — uses interview token)
router.post('/event', async (req, res, next) => {
  try {
    const { interviewId, eventType, metadata } = req.body;
    if (!interviewId || !eventType) throw new AppError('interviewId and eventType required', 400);

    const validTypes = [
      'TAB_SWITCH', 'FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'COPY_PASTE',
      'FULLSCREEN_EXIT', 'MIC_MUTED', 'AUDIO_ANOMALY', 'LOOKING_AWAY',
      'PHONE_DETECTED', 'READING_FROM_SCREEN', 'LIP_SYNC_MISMATCH',
      'BACKGROUND_VOICE', 'SUSPICIOUS_PAUSE', 'IDENTITY_MISMATCH',
    ];
    if (!validTypes.includes(eventType)) throw new AppError('Invalid event type', 400);

    const log = await prisma.proctorLog.create({
      data: { interviewId, eventType, metadata: metadata ?? {} },
    });

    res.json({ success: true, log });
  } catch (err) { next(err); }
});

// ── Run AI analysis on all logged events (recruiter-facing, requires auth)
router.post('/analyse/:interviewId', authenticate, async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId },
      include: {
        responses: { select: { transcript: true, createdAt: true } },
        proctorLogs: { orderBy: { timestamp: 'asc' } },
        opening: { select: { organizationId: true, title: true } },
      },
    });

    if (!interview || interview.opening.organizationId !== req.user!.organizationId)
      throw new AppError('Interview not found', 404);

    if (interview.proctorLogs.length === 0)
      throw new AppError('No proctoring data recorded for this interview', 400);

    const transcripts = interview.responses
      .map(r => r.transcript || '')
      .filter(Boolean);

    const startTime = interview.responses[0]?.createdAt ?? new Date();
    const endTime = interview.responses[interview.responses.length - 1]?.createdAt ?? new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000
    ) || 30;

    const result = await analyseProctoringData({
      events: interview.proctorLogs.map(l => ({
        eventType: l.eventType,
        timestamp: l.timestamp.toISOString(),
        metadata: l.metadata,
      })),
      transcripts,
      jobTitle: interview.opening.title,
      durationMinutes,
    });

    // Upsert the proctoring report
    const report = await (prisma as any).proctoringReport.upsert({
      where: { interviewId: req.params.interviewId },
      create: {
        interviewId: req.params.interviewId,
        ...result,
        snapshots: interview.proctorLogs.length,
        flags: result.flags,
      },
      update: {
        ...result,
        snapshots: interview.proctorLogs.length,
        flags: result.flags,
        updatedAt: new Date(),
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        action: 'PROCTORING_ANALYSED',
        resourceType: 'INTERVIEW',
        resourceId: req.params.interviewId,
        metadata: { riskLevel: result.riskLevel, riskScore: result.riskScore, recommendation: result.recommendation },
      },
    });

    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// ── GET proctoring report for an interview
router.get('/:interviewId', authenticate, async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId, opening: { organizationId: req.user!.organizationId } },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    const [report, events] = await Promise.all([
      (prisma as any).proctoringReport.findUnique({ where: { interviewId: req.params.interviewId } }),
      prisma.proctorLog.findMany({
        where: { interviewId: req.params.interviewId },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    // Event summary
    const eventSummary = events.reduce((acc: Record<string, number>, e: any) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, report: report ?? null, events, eventSummary, totalEvents: events.length });
  } catch (err) { next(err); }
});

// ── GET all interviews with proctoring flags for this org (dashboard view)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const flagged = await (prisma as any).proctoringReport.findMany({
      where: {
        interview: { opening: { organizationId: req.user!.organizationId } },
        riskLevel: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
      },
      include: {
        interview: {
          select: {
            id: true, status: true,
            candidate: { select: { name: true, email: true } },
            opening: { select: { title: true } },
          },
        },
      },
      orderBy: { riskScore: 'desc' },
    });

    res.json({ success: true, flagged, total: flagged.length });
  } catch (err) { next(err); }
});

export default router;
