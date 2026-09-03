// src/services/toastmasters/rolesApi.ts
import { tm } from './httpClient';
import type { TmAssigneeType, TmRoleAssignment } from './types';

export interface UpdateRoleInput {
  memberId?: string | null;
  assigneeType?: TmAssigneeType;
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
    const res = await tm.get(`/toastmasters/${meetingId}/roles`);
    return res.data.roles;
  },
  update: async (roleId: string, data: UpdateRoleInput): Promise<TmRoleAssignment> => {
    const res = await tm.patch(`/toastmasters/roles/${roleId}`, data);
    return res.data.role;
  },
  runAgent: async (roleId: string): Promise<{
    role: TmRoleAssignment; result: unknown;
    usage: { inputTokens: number; outputTokens: number; costUsd: number };
  }> => {
    const res = await tm.post(`/toastmasters/roles/${roleId}/run-agent`, {});
    return { role: res.data.role, result: res.data.result, usage: res.data.usage };
  },
};
