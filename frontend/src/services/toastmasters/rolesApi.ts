// src/services/toastmasters/rolesApi.ts
import { apiClient } from '../api';
import type { TmRoleAssignment } from './types';

export interface UpdateRoleInput {
  memberId?: string | null;
  speechTitle?: string;
  speechProject?: string;
  manualNumber?: string;
  pathwaysProject?: string;
  greenMins?: number;
  yellowMins?: number;
  redMins?: number;
}

export const rolesApi = {
  list: async (meetingId: string): Promise<TmRoleAssignment[]> => {
    const res = await apiClient.get(`/toastmasters/${meetingId}/roles`);
    return res.data.roles;
  },
  update: async (roleId: string, data: UpdateRoleInput): Promise<TmRoleAssignment> => {
    const res = await apiClient.patch(`/toastmasters/roles/${roleId}`, data);
    return res.data.role;
  },
};
