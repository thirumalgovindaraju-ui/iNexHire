// src/routes/communicationAssessment.routes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const { mockPrisma, mockGenerateCommunicationAssessment } = vi.hoisted(() => ({
  mockPrisma: {
    interview: { findFirst: vi.fn(), findUnique: vi.fn() },
    communicationAssessment: { findUnique: vi.fn(), upsert: vi.fn() },
  },
  mockGenerateCommunicationAssessment: vi.fn(),
}));

vi.mock('../config/db', () => ({ prisma: mockPrisma }));

vi.mock('../services/ai.service', () => ({
  generateCommunicationAssessment: mockGenerateCommunicationAssessment,
}));

// interview.routes.ts fires this on completion — not exercised by these tests, but it
// imports the same route module, so keep the import graph mock-safe.
vi.mock('../jobs/evaluation.job', () => ({ enqueueEvaluation: vi.fn() }));
vi.mock('../services/sseProctoring.service', () => ({ broadcastProctoringEvent: vi.fn() }));

import { createApp } from '../app';
import { env } from '../config/env';

const app = createApp();

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

function authToken(organizationId = ORG_ID) {
  return jwt.sign(
    { userId: 'user-1', email: 'recruiter@nexhire.test', role: 'RECRUITER', organizationId },
    env.jwtSecret,
    { expiresIn: '15m' },
  );
}

function ownedInterview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'interview-1',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    completedAt: new Date('2026-01-01T10:20:00Z'),
    createdAt: new Date('2026-01-01T09:55:00Z'),
    candidate: { opening: { organizationId: ORG_ID } },
    responses: [{ transcript: 'I think the answer is X because...' }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/interviews/:id/assessment', () => {
  it('returns the stored assessment for an interview owned by the caller\'s org', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview());
    mockPrisma.communicationAssessment.findUnique.mockResolvedValueOnce({ id: 'assessment-1', communicationScore: 82 });

    const res = await request(app)
      .get('/api/interviews/interview-1/assessment')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, assessment: { id: 'assessment-1', communicationScore: 82 } });
  });

  it('returns null when no assessment has been generated yet', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview());
    mockPrisma.communicationAssessment.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/interviews/interview-1/assessment')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, assessment: null });
  });

  it('404s when the interview belongs to a different organization', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview({ candidate: { opening: { organizationId: OTHER_ORG_ID } } }));

    const res = await request(app)
      .get('/api/interviews/interview-1/assessment')
      .set('Authorization', `Bearer ${authToken(ORG_ID)}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401s without an auth token', async () => {
    const res = await request(app).get('/api/interviews/interview-1/assessment');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/interviews/:id/assessment/generate', () => {
  const generatedResult = {
    overallScore: 82,
    communicationScore: 82,
    communicationLevel: 'B2',
    summary: 'Clear and fluent.',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: new Date('2026-01-01T10:20:00Z'),
    durationSeconds: 1200,
    linguisticAccuracy: { score: 80, comments: '', errorTypes: [] },
    phoneticClarity: { score: 80, comments: '', errorTypes: [] },
    vocalProsody: { score: 80, comments: '', errorTypes: [] },
    operationalFluency: { score: 85, comments: '', errorTypes: [] },
    lexicalInteractiveIntelligence: { score: 85, comments: '', errorTypes: [] },
  };

  it('generates and persists a scorecard for an owned interview', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview());
    mockPrisma.interview.findUnique.mockResolvedValueOnce(ownedInterview());
    mockGenerateCommunicationAssessment.mockResolvedValueOnce(generatedResult);
    mockPrisma.communicationAssessment.upsert.mockResolvedValueOnce({ id: 'assessment-1', ...generatedResult });

    const res = await request(app)
      .post('/api/interviews/interview-1/assessment/generate')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.assessment.id).toBe('assessment-1');
    expect(mockPrisma.communicationAssessment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { interviewId: 'interview-1' } }),
    );
  });

  it('404s when the interview belongs to a different organization', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview({ candidate: { opening: { organizationId: OTHER_ORG_ID } } }));

    const res = await request(app)
      .post('/api/interviews/interview-1/assessment/generate')
      .set('Authorization', `Bearer ${authToken(ORG_ID)}`);

    expect(res.status).toBe(404);
    expect(mockGenerateCommunicationAssessment).not.toHaveBeenCalled();
  });

  it('400s when the interview has no transcripts to score', async () => {
    mockPrisma.interview.findFirst.mockResolvedValueOnce(ownedInterview({ responses: [] }));
    mockPrisma.interview.findUnique.mockResolvedValueOnce(ownedInterview({ responses: [] }));

    const res = await request(app)
      .post('/api/interviews/interview-1/assessment/generate')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(400);
    expect(mockGenerateCommunicationAssessment).not.toHaveBeenCalled();
  });
});
