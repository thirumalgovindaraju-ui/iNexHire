// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'RECRUITER' | 'ADMIN';
  organizationId: string;
  organization?: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface Opening {
  id: string;
  title: string;
  department?: string;
  location?: string;
  jobDescription: string;
  skills: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { candidates: number; questions: number };
  questions?: Question[];
}

export interface Question {
  id: string;
  openingId: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  order: number;
  timeLimit: number;
  answered?: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  openingId: string;
  opening?: { id: string; title: string };
  interviews?: Interview[];
  createdAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  inviteToken: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED' | 'EXPIRED';
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
  candidate?: Candidate;
  report?: Report;
}

export interface Report {
  id: string;
  interviewId: string;
  overallScore: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NEUTRAL' | 'REJECT';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillScores: Record<string, number>;
  decision: 'MOVE_FORWARD' | 'REJECT' | 'ON_HOLD' | 'PENDING';
  decisionNotes?: string;
  createdAt: string;
  interview?: Partial<Interview>;
  candidate?: Candidate;
  opening?: Partial<Opening>;
  responses?: ResponseItem[];
  proctorSummary?: { totalEvents: number; events: ProctorEvent[] };
}

export interface ResponseItem {
  question: string;
  questionType: string;
  transcript?: string;
  score?: number;
  feedback?: string;
  duration?: number;
}

export interface ProctorEvent {
  type: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalOpenings: number;
  activeOpenings: number;
  totalCandidates: number;
  totalInterviews: number;
  completedInterviews: number;
  evaluatedInterviews: number;
  avgScore: number;
  completionRate: number;
  recommendationCounts: Record<string, number>;
}

// Interview session (candidate side)
export interface InterviewSession {
  interviewId: string;
  candidate: { id: string; name: string; email: string };
  opening: { title: string; organization: string };
  questions: Question[];
  totalQuestions: number;
  answeredCount: number;
}
