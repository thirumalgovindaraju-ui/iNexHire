// src/services/toastmasters/speechAnalysisApi.ts
import { tm } from './httpClient';
import type { TmSpeechAnalysis } from './types';

export const speechAnalysisApi = {
  listForMeeting: async (meetingId: string): Promise<TmSpeechAnalysis[]> => {
    const res = await tm.get(`/toastmasters/${meetingId}/speech-analysis`);
    return res.data.analyses;
  },
  getForRole: async (roleAssignmentId: string): Promise<TmSpeechAnalysis | null> => {
    const res = await tm.get(`/toastmasters/roles/${roleAssignmentId}/speech-analysis`);
    return res.data.analysis;
  },
  analyze: async (meetingId: string, data: {
    roleAssignmentId: string; transcript: string; durationSeconds?: number;
  }): Promise<TmSpeechAnalysis> => {
    // Speech analysis runs a full Claude call — give it more room than the
    // standard 60s Toastmasters timeout before treating it as a cold-start retry.
    const res = await tm.post(`/toastmasters/${meetingId}/analyze-speech`, data, { timeout: 90000 });
    return res.data.analysis;
  },
};
