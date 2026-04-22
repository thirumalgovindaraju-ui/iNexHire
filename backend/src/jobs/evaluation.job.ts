// src/jobs/evaluation.job.ts
import { Worker, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { evaluateResponse, generateReport } from '../services/ai.service';
import { logger } from '../utils/logger';

export const EVALUATION_QUEUE = 'interview-evaluation';

// ─── Queue (used to enqueue jobs) ─────────────────────────────────────────────

export const evaluationQueue = new Queue(EVALUATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function enqueueEvaluation(interviewId: string) {
  await evaluationQueue.add('evaluate', { interviewId }, { jobId: interviewId });
  logger.info(`[Queue] Evaluation job enqueued for interview: ${interviewId}`);
}

// ─── Worker (processes jobs) ───────────────────────────────────────────────────

export function startEvaluationWorker() {
  const worker = new Worker(
    EVALUATION_QUEUE,
    async (job) => {
      const { interviewId } = job.data;
      logger.info(`[Worker] Starting evaluation for interview: ${interviewId}`);

      // 1. Load interview + responses + questions
      const interview = await prisma.interview.findUniqueOrThrow({
        where: { id: interviewId },
        include: {
          responses: { include: { question: true } },
          candidate: { include: { opening: true } },
        },
      });

      const { candidate } = interview;
      const { opening } = candidate;

      if (interview.responses.length === 0) {
        logger.warn(`[Worker] No responses found for interview: ${interviewId}`);
        return;
      }

      // 2. Evaluate each response
      const evaluatedResponses: Array<{
        question: string;
        answer: string;
        score: number;
        feedback: string;
        responseId: string;
      }> = [];

      for (const response of interview.responses) {
        if (!response.transcript) {
          await prisma.response.update({
            where: { id: response.id },
            data: { score: 0, feedback: 'No response provided' },
          });
          evaluatedResponses.push({
            question: response.question.text,
            answer: '',
            score: 0,
            feedback: 'No response provided',
            responseId: response.id,
          });
          continue;
        }

        const result = await evaluateResponse({
          question: response.question.text,
          answer: response.transcript,
          jobTitle: opening.title,
          skills: opening.skills,
        });

        await prisma.response.update({
          where: { id: response.id },
          data: { score: result.score, feedback: result.feedback },
        });

        evaluatedResponses.push({
          question: response.question.text,
          answer: response.transcript,
          score: result.score,
          feedback: result.feedback,
          responseId: response.id,
        });

        logger.info(`[Worker] Response scored: ${result.score}/100`);
      }

      // 3. Generate overall report
      const report = await generateReport({
        jobTitle: opening.title,
        skills: opening.skills,
        responses: evaluatedResponses,
      });

      // 4. Save report
      await prisma.report.create({
        data: {
          interviewId,
          overallScore: report.overallScore,
          recommendation: report.recommendation,
          summary: report.summary,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          skillScores: report.skillScores,
        },
      });

      // 5. Mark interview as evaluated
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'EVALUATED' },
      });

      logger.info(`[Worker] Evaluation complete. Score: ${report.overallScore}/100`);
    },
    { connection: redis, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  logger.info('[Worker] Evaluation worker started');
  return worker;
}
