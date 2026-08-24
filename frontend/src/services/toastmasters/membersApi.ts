// src/services/toastmasters/membersApi.ts
import { apiClient } from '../api';
import type { TmMember } from './types';

export const membersApi = {
  list: async (): Promise<TmMember[]> => {
    const res = await apiClient.get('/toastmasters/members');
    return res.data.members;
  },
  create: async (data: { name: string; email?: string; memberNumber?: string; pathwaysPath?: string; level?: string }): Promise<TmMember> => {
    const res = await apiClient.post('/toastmasters/members', data);
    return res.data.member;
  },
  update: async (memberId: string, data: Partial<{ name: string; email: string; memberNumber: string; pathwaysPath: string; level: string; active: boolean }>): Promise<TmMember> => {
    const res = await apiClient.patch(`/toastmasters/members/${memberId}`, data);
    return res.data.member;
  },
  lastEvaluator: async (memberId: string): Promise<TmMember | null> => {
    const res = await apiClient.get(`/toastmasters/members/${memberId}/last-evaluator`);
    return res.data.evaluatorMember;
  },
};
