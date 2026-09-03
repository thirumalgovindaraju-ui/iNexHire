// src/services/toastmasters/types.ts — shared Toastmasters Meeting Manager types

export const TM_ROLE_NAMES = [
  'MENTOR', 'SAA', 'PO', 'GENERAL_EVALUATOR', 'TABLE_TOPICS_MASTER', 'TIMER', 'TMOD',
  'SPEAKER_1', 'EVALUATOR_1', 'SPEAKER_2', 'EVALUATOR_2', 'SPEAKER_3', 'EVALUATOR_3',
  'AH_COUNTER', 'GRAMMARIAN',
] as const;

export const TM_ROLE_LABELS: Record<string, string> = {
  MENTOR: 'Mentor',
  SAA: "Sergeant At Arms",
  PO: 'Presiding Officer',
  GENERAL_EVALUATOR: 'General Evaluator',
  TABLE_TOPICS_MASTER: 'Table Topics Master',
  TIMER: 'Timer',
  TMOD: 'Toastmaster of the Day',
  SPEAKER_1: 'Speaker 1',
  EVALUATOR_1: 'Evaluator 1',
  SPEAKER_2: 'Speaker 2',
  EVALUATOR_2: 'Evaluator 2',
  SPEAKER_3: 'Speaker 3',
  EVALUATOR_3: 'Evaluator 3',
  AH_COUNTER: 'Ah Counter',
  GRAMMARIAN: 'Grammarian',
};

// Short codes as printed on the physical iOpex agenda card (vs. the full labels above)
export const TM_ROLE_SHORT_LABELS: Record<string, string> = {
  MENTOR: 'Mentor',
  SAA: 'SAA',
  PO: 'PO',
  GENERAL_EVALUATOR: 'GE',
  TABLE_TOPICS_MASTER: 'TT Master',
  TIMER: 'Timer',
  TMOD: 'TMod',
  SPEAKER_1: 'Speaker 1',
  EVALUATOR_1: 'Evaluator 1',
  SPEAKER_2: 'Speaker 2',
  EVALUATOR_2: 'Evaluator 2',
  SPEAKER_3: 'Speaker 3',
  EVALUATOR_3: 'Evaluator 3',
  AH_COUNTER: 'Ah Counter',
  GRAMMARIAN: 'Grammarian',
};

export const TM_ROLE_PLAYERS_LEFT = ['SAA', 'PO', 'GENERAL_EVALUATOR'];
export const TM_ROLE_PLAYERS_RIGHT = ['TABLE_TOPICS_MASTER', 'TIMER', 'TMOD'];

// Display order for the role assignment grid
export const TM_ROLE_ASSIGNMENT_ORDER = [
  'SAA', 'PO', 'TMOD', 'GENERAL_EVALUATOR',
  'SPEAKER_1', 'EVALUATOR_1', 'SPEAKER_2', 'EVALUATOR_2', 'SPEAKER_3', 'EVALUATOR_3',
  'TIMER', 'AH_COUNTER', 'GRAMMARIAN', 'TABLE_TOPICS_MASTER', 'MENTOR',
];

export const TM_SPEAKER_EVALUATOR_PAIRS: [string, string][] = [
  ['SPEAKER_1', 'EVALUATOR_1'],
  ['SPEAKER_2', 'EVALUATOR_2'],
  ['SPEAKER_3', 'EVALUATOR_3'],
];

export const TM_FILLER_WORDS = ['um', 'uh', 'so', 'like', 'er', 'you_know', 'other'] as const;

export const TM_FILLER_LABELS: Record<string, string> = {
  um: 'Um', uh: 'Uh', so: 'So', like: 'Like', er: 'Er', you_know: 'You know', other: 'Other',
};

export const TM_FILLER_COUNT_KEY: Record<string, string> = {
  um: 'umCount', uh: 'uhCount', so: 'soCount', like: 'likeCount',
  er: 'erCount', you_know: 'youKnowCount', other: 'otherCount',
};

export interface TmClub {
  id: string;
  name: string;
  charterNumber?: string | null;
  area?: string | null;
  division?: string | null;
  district?: string | null;
}

export interface TmMember {
  id: string;
  name: string;
  email?: string | null;
  memberNumber?: string | null;
  pathwaysPath?: string | null;
  level?: string | null;
  active: boolean;
}

export type TmAssigneeType = 'HUMAN' | 'AI_AGENT';
export type TmAgentStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export interface TmRoleAssignment {
  id: string;
  meetingId: string;
  roleName: string;
  memberId?: string | null;
  member?: TmMember | null;
  speechTitle?: string | null;
  speechProject?: string | null;
  manualNumber?: string | null;
  pathwaysProject?: string | null;
  greenMins?: number | null;
  yellowMins?: number | null;
  redMins?: number | null;
  assigneeType: TmAssigneeType;
  agentStatus?: TmAgentStatus | null;
  agentOutput?: { note?: string; topics?: string[] } | null;
  agentRunAt?: string | null;
}

export interface TmAgendaItem {
  id: string;
  meetingId: string;
  sequence: number;
  activityName: string;
  durationMins?: number | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  notes?: string | null;
  roleAssignmentId?: string | null;
  roleAssignment?: TmRoleAssignment | null;
}

export interface TmEducationSession {
  id: string;
  meetingId: string;
  topic: string;
  presenterId?: string | null;
  presenter?: TmMember | null;
  durationMins?: number | null;
}

export interface TmEvaluation {
  id: string;
  meetingId: string;
  speakerRoleId: string;
  evaluatorRoleId: string;
  speaker?: TmRoleAssignment;
  evaluator?: TmRoleAssignment;
  commendations?: string | null;
  recommendations?: string | null;
  ratingContent?: number | null;
  ratingDelivery?: number | null;
  ratingLanguage?: number | null;
  overallRating?: number | null;
  openingFeedback?: string | null;
  bodyFeedback?: string | null;
  conclusionFeedback?: string | null;
  status: 'DRAFT' | 'SUBMITTED';
  generatedByAgent?: boolean;
}

export interface TmGeneralEvaluation {
  id: string;
  meetingId: string;
  overallFeedback?: string | null;
  evaluatorFeedback?: { evaluatorRoleId: string; feedback: string }[] | null;
  bestSpeakerRoleId?: string | null;
  status: 'DRAFT' | 'SUBMITTED';
  generatedByAgent?: boolean;
}

export interface TmTimerLog {
  id: string;
  meetingId: string;
  roleAssignmentId: string;
  roleAssignment?: TmRoleAssignment;
  actualDurationSecs: number;
  result: 'UNDER' | 'WITHIN' | 'OVER';
  notes?: string | null;
}

export interface TmAhCounter {
  id: string;
  meetingId: string;
  memberId: string;
  member?: TmMember;
  umCount: number;
  uhCount: number;
  soCount: number;
  likeCount: number;
  erCount: number;
  youKnowCount: number;
  otherCount: number;
}

export interface TmGrammarianLog {
  id: string;
  meetingId: string;
  wordOfDay?: string | null;
  correctUses: number;
  incorrectUses: number;
  goodGrammarExamples?: string | null;
  errorsNoted?: string | null;
  generatedByAgent?: boolean;
}

export interface TmTableTopicResponse {
  id: string;
  meetingId: string;
  speakerName: string;
  isMember: boolean;
  memberId?: string | null;
  member?: TmMember | null;
  topicGiven?: string | null;
  durationSecs?: number | null;
  timerResult?: 'UNDER' | 'WITHIN' | 'OVER' | null;
}

export interface SpeechGrammarError { text: string; correction: string; rule: string }

export interface SpeechFillerWordCounts {
  um: number; uh: number; so: number; like: number; er: number; you_know: number;
  total: number; ratePerMinute: number; worstOffender: string;
}

export interface TmSpeechAnalysis {
  id: string;
  meetingId: string;
  roleAssignmentId: string;
  roleAssignment?: TmRoleAssignment;
  transcript: string;
  wordCount: number;
  durationSeconds?: number | null;
  grammarScore?: number | null;
  grammarErrors: SpeechGrammarError[];
  grammarSuggestions: string[];
  fillerWordCounts: SpeechFillerWordCounts;
  contentScore?: number | null;
  deliveryScore?: number | null;
  languageScore?: number | null;
  overallScore?: number | null;
  commendations: string[];
  recommendations: string[];
  openingFeedback?: string | null;
  bodyFeedback?: string | null;
  conclusionFeedback?: string | null;
  wordOfDayUsed: boolean;
  summary?: string | null;
  generatedByAgent?: boolean;
}

export interface TmMeeting {
  id: string;
  title: string;
  theme?: string | null;
  meetingNumber?: number | null;
  wordOfDay?: string | null;
  wordMeaning?: string | null;
  wordType?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  club?: TmClub | null;
  roleAssignments?: TmRoleAssignment[];
  agendaItems?: TmAgendaItem[];
  educationSessions?: TmEducationSession[];
  evaluations?: TmEvaluation[];
  grammarianLog?: TmGrammarianLog | null;
  agentInputTokens?: number;
  agentOutputTokens?: number;
  agentCostUsd?: number;
  _count?: { evaluations: number };
  roleCount?: { filled: number; total: number };
}

export interface TmMeetingFullReport extends TmMeeting {
  ahCounters?: TmAhCounter[];
  timerLogs?: TmTimerLog[];
  tableTopicResponses?: TmTableTopicResponse[];
  speechAnalyses?: TmSpeechAnalysis[];
  report?: { bestSpeakerRoleId?: string | null; bestTableTopicId?: string | null; bestEvaluatorRoleId?: string | null } | null;
}
