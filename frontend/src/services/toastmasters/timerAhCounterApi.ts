// src/services/toastmasters/timerAhCounterApi.ts
import { tm } from './httpClient';
import type { TmAhCounter, TmGrammarianLog, TmMeetingFullReport, TmTableTopicResponse, TmTimerLog } from './types';

export const timerApi = {
  list: async (meetingId: string): Promise<TmTimerLog[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/timer-logs`);
    return res.data.timerLogs;
  },
  submit: async (meetingId: string, data: {
    roleAssignmentId: string; actualDurationSecs: number; result: 'UNDER' | 'WITHIN' | 'OVER'; notes?: string;
  }): Promise<TmTimerLog> => {
    const res = await tm.post(`/toastmasters/${meetingId}/timer-logs`, data);
    return res.data.timerLog;
  },
};

export const ahCounterApi = {
  list: async (meetingId: string): Promise<TmAhCounter[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/ah-counter`);
    return res.data.counters;
  },
  tap: async (meetingId: string, memberId: string, fillerWord: string): Promise<TmAhCounter> => {
    const res = await tm.post(`/toastmasters/${meetingId}/ah-counter`, { memberId, fillerWord });
    return res.data.counter;
  },
  saveAll: async (meetingId: string, counters: Array<{
    memberId: string; umCount: number; uhCount: number; soCount: number;
    likeCount: number; erCount: number; youKnowCount: number; otherCount: number;
  }>): Promise<TmAhCounter[]> => {
    const res = await tm.post(`/toastmasters/${meetingId}/ah-counter/bulk`, { counters });
    return res.data.counters;
  },
};

export const grammarianApi = {
  get: async (meetingId: string): Promise<TmGrammarianLog | null> => {
    const res = await tm.get(`/toastmasters/${meetingId}/grammarian`);
    return res.data.log;
  },
  upsert: async (meetingId: string, data: Partial<{
    wordOfDay: string; correctUses: number; incorrectUses: number; goodGrammarExamples: string; errorsNoted: string;
  }>): Promise<TmGrammarianLog> => {
    const res = await tm.put(`/toastmasters/${meetingId}/grammarian`, data);
    return res.data.log;
  },
};

export const tableTopicsApi = {
  list: async (meetingId: string): Promise<TmTableTopicResponse[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/table-topics`);
    return res.data.responses;
  },
  create: async (meetingId: string, data: {
    speakerName: string; isMember?: boolean; memberId?: string; topicGiven?: string;
    durationSecs?: number; timerResult?: 'UNDER' | 'WITHIN' | 'OVER';
  }): Promise<TmTableTopicResponse> => {
    const res = await tm.post(`/toastmasters/${meetingId}/table-topics`, data);
    return res.data.response;
  },
  update: async (responseId: string, data: Partial<{
    speakerName: string; isMember: boolean; memberId: string; topicGiven: string;
    durationSecs: number; timerResult: 'UNDER' | 'WITHIN' | 'OVER';
  }>): Promise<TmTableTopicResponse> => {
    const res = await tm.patch(`/toastmasters/table-topics/${responseId}`, data);
    return res.data.response;
  },
};

export const reportApi = {
  get: async (meetingId: string): Promise<TmMeetingFullReport> => {
    const res = await tm.get(`/toastmasters/${meetingId}/report`);
    return res.data.report;
  },
  generate: async (meetingId: string, data?: { bestSpeakerRoleId?: string; bestTableTopicId?: string; bestEvaluatorRoleId?: string }) => {
    const res = await tm.post(`/toastmasters/${meetingId}/report/generate`, data ?? {});
    return res.data.report;
  },
};
