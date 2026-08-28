// src/services/ai.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

import { generateCommunicationAssessment, scoreToCefrBand } from './ai.service';

function textResponse(obj: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(obj) }] };
}

const VALID_PAYLOAD = {
  linguisticAccuracy: { score: 80, comments: 'Good grammar', errorTypes: ['Article Misuse'] },
  phoneticClarity: { score: 70, comments: 'Clear enough', errorTypes: [] },
  vocalProsody: { score: 60, comments: 'A bit flat', errorTypes: ['Monotone Delivery'] },
  operationalFluency: { score: 75, comments: 'Some fillers', errorTypes: ['Excessive Fillers'] },
  lexicalInteractiveIntelligence: { score: 85, comments: 'Strong vocabulary', errorTypes: [] },
  summary: 'Solid communicator overall.',
};
const EXPECTED_AVG = Math.round((80 + 70 + 60 + 75 + 85) / 5);

describe('scoreToCefrBand', () => {
  it('maps every band boundary to the correct CEFR level', () => {
    expect(scoreToCefrBand(0)).toBe('A1');
    expect(scoreToCefrBand(39)).toBe('A1');
    expect(scoreToCefrBand(40)).toBe('A2');
    expect(scoreToCefrBand(54)).toBe('A2');
    expect(scoreToCefrBand(55)).toBe('B1');
    expect(scoreToCefrBand(69)).toBe('B1');
    expect(scoreToCefrBand(70)).toBe('B2');
    expect(scoreToCefrBand(84)).toBe('B2');
    expect(scoreToCefrBand(85)).toBe('C1');
    expect(scoreToCefrBand(94)).toBe('C1');
    expect(scoreToCefrBand(95)).toBe('C2');
    expect(scoreToCefrBand(100)).toBe('C2');
  });
});

describe('generateCommunicationAssessment', () => {
  const meta = { startedAt: new Date('2026-01-01T10:00:00Z'), endedAt: new Date('2026-01-01T10:20:00Z') };

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('parses a valid JSON response, averages the 5 sub-scores, and derives the CEFR band', async () => {
    mockCreate.mockResolvedValueOnce(textResponse(VALID_PAYLOAD));

    const result = await generateCommunicationAssessment('transcript text', meta);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.communicationScore).toBe(EXPECTED_AVG);
    expect(result.overallScore).toBe(EXPECTED_AVG);
    expect(result.communicationLevel).toBe(scoreToCefrBand(EXPECTED_AVG));
    expect(result.linguisticAccuracy.errorTypes).toEqual(['Article Misuse']);
    expect(result.durationSeconds).toBe(1200);
    expect(result.summary).toBe('Solid communicator overall.');
  });

  it('retries once on malformed JSON and succeeds on the second attempt', async () => {
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json' }] })
      .mockResolvedValueOnce(textResponse(VALID_PAYLOAD));

    const result = await generateCommunicationAssessment('transcript text', meta);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.communicationScore).toBe(EXPECTED_AVG);
  });

  it('falls back to a typed default when both attempts return malformed JSON', async () => {
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'still not valid json' }] });

    const result = await generateCommunicationAssessment('transcript text', meta);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.communicationLevel).toBe('B1');
    expect(result.summary).toBe('Communication assessment unavailable.');
    expect(result.durationSeconds).toBe(1200);
  });

  it('clamps out-of-range sub-scores into 0-100', async () => {
    mockCreate.mockResolvedValueOnce(textResponse({
      ...VALID_PAYLOAD,
      linguisticAccuracy: { score: 150, comments: 'x', errorTypes: [] },
      phoneticClarity: { score: -20, comments: 'y', errorTypes: [] },
    }));

    const result = await generateCommunicationAssessment('transcript text', meta);

    expect(result.linguisticAccuracy.score).toBe(100);
    expect(result.phoneticClarity.score).toBe(0);
  });
});
