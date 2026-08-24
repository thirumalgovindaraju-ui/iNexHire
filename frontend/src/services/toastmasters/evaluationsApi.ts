// src/services/toastmasters/evaluationsApi.ts
import { tm } from './httpClient';
import type { TmEducationSession, TmEvaluation, TmGeneralEvaluation } from './types';

export interface SubmitEvaluationInput {
  speakerRoleId: string; evaluatorRoleId: string; commendations?: string; recommendations?: string;
  ratingContent?: number; ratingDelivery?: number; ratingLanguage?: number; overallRating?: number;
  openingFeedback?: string; bodyFeedback?: string; conclusionFeedback?: string;
  status?: 'DRAFT' | 'SUBMITTED';
}

export const evaluationsApi = {
  list: async (meetingId: string): Promise<TmEvaluation[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/evaluations`);
    return res.data.evaluations;
  },
  submit: async (meetingId: string, data: SubmitEvaluationInput): Promise<TmEvaluation> => {
    const res = await tm.post(`/toastmasters/${meetingId}/evaluations`, data);
    return res.data.evaluation;
  },
};

export const generalEvaluationApi = {
  get: async (meetingId: string): Promise<TmGeneralEvaluation | null> => {
    const res = await tm.get(`/toastmasters/${meetingId}/general-evaluation`);
    return res.data.generalEvaluation;
  },
  upsert: async (meetingId: string, data: Partial<{
    overallFeedback: string; evaluatorFeedback: { evaluatorRoleId: string; feedback: string }[];
    bestSpeakerRoleId: string; status: 'DRAFT' | 'SUBMITTED';
  }>): Promise<TmGeneralEvaluation> => {
    const res = await tm.put(`/toastmasters/${meetingId}/general-evaluation`, data);
    return res.data.generalEvaluation;
  },
};

export const educationApi = {
  list: async (meetingId: string): Promise<TmEducationSession[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/education`);
    return res.data.educationSessions;
  },
  create: async (meetingId: string, data: { topic: string; presenterId?: string; durationMins?: number }): Promise<TmEducationSession> => {
    const res = await tm.post(`/toastmasters/${meetingId}/education`, data);
    return res.data.educationSession;
  },
  update: async (sessionId: string, data: Partial<{ topic: string; presenterId: string | null; durationMins: number }>): Promise<TmEducationSession> => {
    const res = await tm.patch(`/toastmasters/education/${sessionId}`, data);
    return res.data.educationSession;
  },
  remove: async (sessionId: string): Promise<void> => {
    await tm.delete(`/toastmasters/education/${sessionId}`);
  },
};
