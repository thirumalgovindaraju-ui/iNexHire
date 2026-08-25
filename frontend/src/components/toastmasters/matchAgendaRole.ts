// src/components/toastmasters/matchAgendaRole.ts — infer which role an agenda
// activity belongs to by name, for agenda items that were never explicitly
// linked to a TmRoleAssignment at creation time.
import type { TmRoleAssignment } from '../../services/toastmasters';

const ACTIVITY_ROLE_PATTERNS: [RegExp, string][] = [
  [/\bSAA\b/i, 'SAA'],
  [/\bPO'?s?\b/i, 'PO'],
  [/\bTimer\b/i, 'TIMER'],
  [/\bTable\s*Topics?\b/i, 'TABLE_TOPICS_MASTER'],
  [/\bGeneral\s+Evaluat/i, 'GENERAL_EVALUATOR'],
  [/\bGrammarian\b/i, 'GRAMMARIAN'],
  [/\bAh\s*Counter\b/i, 'AH_COUNTER'],
  [/\bSpeaker\s*1\b/i, 'SPEAKER_1'],
  [/\bSpeaker\s*2\b/i, 'SPEAKER_2'],
  [/\bSpeaker\s*3\b/i, 'SPEAKER_3'],
  [/\bEvaluator\s*1\b/i, 'EVALUATOR_1'],
  [/\bEvaluator\s*2\b/i, 'EVALUATOR_2'],
  [/\bEvaluator\s*3\b/i, 'EVALUATOR_3'],
  [/\bTMOD\b|\bToastmaster\s+of\s+the\s+Day\b/i, 'TMOD'],
  [/\bMentor\b/i, 'MENTOR'],
];

export function roleNameForActivity(activityName: string): string | null {
  for (const [pattern, roleName] of ACTIVITY_ROLE_PATTERNS) {
    if (pattern.test(activityName)) return roleName;
  }
  return null;
}

export function findRoleForActivity(activityName: string, roles: TmRoleAssignment[]): TmRoleAssignment | undefined {
  const roleName = roleNameForActivity(activityName);
  return roleName ? roles.find((r) => r.roleName === roleName) : undefined;
}
