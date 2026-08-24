// src/routes/toastmasters/helpers.ts
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

export const TM_ROLE_NAMES = [
  'MENTOR', 'SAA', 'PO', 'GENERAL_EVALUATOR', 'TABLE_TOPICS_MASTER', 'TIMER', 'TMOD',
  'SPEAKER_1', 'EVALUATOR_1', 'SPEAKER_2', 'EVALUATOR_2', 'SPEAKER_3', 'EVALUATOR_3',
  'AH_COUNTER', 'GRAMMARIAN',
] as const;

export const TM_SPEAKER_EVALUATOR_PAIRS: [string, string][] = [
  ['SPEAKER_1', 'EVALUATOR_1'],
  ['SPEAKER_2', 'EVALUATOR_2'],
  ['SPEAKER_3', 'EVALUATOR_3'],
];

export async function findOwnedMeeting(meetingId: string, organizationId: string) {
  const meeting = await prisma.tmMeeting.findFirst({ where: { id: meetingId, organizationId } });
  if (!meeting) throw new AppError(404, 'Meeting not found');
  return meeting;
}
