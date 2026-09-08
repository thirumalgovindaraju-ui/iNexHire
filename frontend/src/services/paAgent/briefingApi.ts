// src/services/paAgent/briefingApi.ts
import { pa } from './httpClient';
import type { PaActionItem, PaBriefing } from './types';

export const briefingApi = {
  today: async (): Promise<{ briefing: PaBriefing; actionItems: PaActionItem[] }> => {
    const res = await pa.get('/pa/briefing/today');
    return { briefing: res.data.briefing, actionItems: res.data.actionItems };
  },
  refresh: async (): Promise<{ briefing: PaBriefing; actionItems: PaActionItem[] }> => {
    const res = await pa.post('/pa/briefing/refresh');
    return { briefing: res.data.briefing, actionItems: res.data.actionItems };
  },
  markActionItem: async (id: string, status: 'DONE' | 'DISMISSED' | 'PENDING'): Promise<PaActionItem> => {
    const res = await pa.patch(`/pa/action-items/${id}`, { status });
    return res.data.item;
  },
};
