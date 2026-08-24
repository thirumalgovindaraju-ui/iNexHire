// src/services/toastmasters/meetingsApi.ts
import { tm } from './httpClient';
import type { TmClub, TmMeeting } from './types';

export const clubApi = {
  get: async (): Promise<TmClub | null> => {
    const res = await tm.get('/toastmasters/club');
    return res.data.club;
  },
  upsert: async (data: Partial<TmClub>) => {
    const res = await tm.put('/toastmasters/club', data);
    return res.data.club as TmClub;
  },
};

export interface CreateMeetingInput {
  title: string;
  date: string;
  theme?: string;
  meetingNumber?: number;
  wordOfDay?: string;
  wordMeaning?: string;
  wordType?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
}

export const meetingsApi = {
  list: async (): Promise<TmMeeting[]> => {
    const res = await tm.get('/toastmasters');
    return res.data.meetings;
  },
  get: async (id: string): Promise<TmMeeting> => {
    const res = await tm.get(`/toastmasters/${id}`);
    return res.data.meeting;
  },
  create: async (data: CreateMeetingInput): Promise<TmMeeting> => {
    const res = await tm.post('/toastmasters', data);
    return res.data.meeting;
  },
  update: async (id: string, data: Partial<CreateMeetingInput & { status: string }>): Promise<TmMeeting> => {
    const res = await tm.patch(`/toastmasters/${id}`, data);
    return res.data.meeting;
  },
  remove: async (id: string): Promise<void> => {
    await tm.delete(`/toastmasters/${id}`);
  },
};
