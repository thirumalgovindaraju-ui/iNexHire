// src/services/toastmasters/meetingsApi.ts
import { apiClient } from '../api';
import type { TmClub, TmMeeting } from './types';

export const clubApi = {
  get: async (): Promise<TmClub | null> => {
    const res = await apiClient.get('/toastmasters/club');
    return res.data.club;
  },
  upsert: async (data: Partial<TmClub>) => {
    const res = await apiClient.put('/toastmasters/club', data);
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
    const res = await apiClient.get('/toastmasters');
    return res.data.meetings;
  },
  get: async (id: string): Promise<TmMeeting> => {
    const res = await apiClient.get(`/toastmasters/${id}`);
    return res.data.meeting;
  },
  create: async (data: CreateMeetingInput): Promise<TmMeeting> => {
    const res = await apiClient.post('/toastmasters', data);
    return res.data.meeting;
  },
  update: async (id: string, data: Partial<CreateMeetingInput & { status: string }>): Promise<TmMeeting> => {
    const res = await apiClient.patch(`/toastmasters/${id}`, data);
    return res.data.meeting;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/toastmasters/${id}`);
  },
};
