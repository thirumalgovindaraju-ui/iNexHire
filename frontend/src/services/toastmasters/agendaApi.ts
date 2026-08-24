// src/services/toastmasters/agendaApi.ts
import { apiClient } from '../api';
import type { TmAgendaItem } from './types';

export interface AgendaItemInput {
  sequence: number;
  activityName: string;
  durationMins?: number;
  plannedStart?: string;
  plannedEnd?: string;
  roleAssignmentId?: string;
  notes?: string;
}

export const agendaApi = {
  list: async (meetingId: string): Promise<TmAgendaItem[]> => {
    const res = await apiClient.get(`/toastmasters/${meetingId}/agenda`);
    return res.data.agendaItems;
  },
  create: async (meetingId: string, data: AgendaItemInput): Promise<TmAgendaItem> => {
    const res = await apiClient.post(`/toastmasters/${meetingId}/agenda`, data);
    return res.data.agendaItem;
  },
  replaceAll: async (meetingId: string, items: AgendaItemInput[]): Promise<TmAgendaItem[]> => {
    const res = await apiClient.post(`/toastmasters/${meetingId}/agenda/bulk`, { items });
    return res.data.agendaItems;
  },
  update: async (itemId: string, data: Partial<AgendaItemInput & { actualStart: string | null; actualEnd: string | null }>): Promise<TmAgendaItem> => {
    const res = await apiClient.patch(`/toastmasters/agenda/${itemId}`, data);
    return res.data.agendaItem;
  },
  remove: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/toastmasters/agenda/${itemId}`);
  },
};
