// src/services/paAgent/types.ts

export interface PaActionItem {
  id: string;
  title: string;
  description: string | null;
  sourceType: 'EMAIL' | 'CALENDAR' | 'MANUAL';
  sourceRef: string | null;
  status: 'PENDING' | 'DONE' | 'DISMISSED';
  createdAt: string;
}

export interface PaBriefingSummary {
  actionItems: { title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; sourceGmailId?: string }[];
  needsReply: { from: string; subject: string; gmailId: string }[];
  scheduleHighlights: { title: string; time: string }[];
}

export interface PaBriefing {
  id: string;
  userId: string;
  date: string;
  summary: PaBriefingSummary;
  generatedAt: string;
}

export interface PaEmailDraft {
  id: string;
  instruction: string;
  toEmail: string | null;
  subject: string;
  body: string;
  gmailDraftId: string | null;
  status: 'DRAFT' | 'CREATED_IN_GMAIL' | 'DISMISSED';
  createdAt: string;
}
