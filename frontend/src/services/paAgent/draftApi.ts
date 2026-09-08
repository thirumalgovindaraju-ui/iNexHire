// src/services/paAgent/draftApi.ts
import { pa } from './httpClient';
import type { PaEmailDraft } from './types';

export const draftApi = {
  create: async (instruction: string, context?: string): Promise<PaEmailDraft> => {
    const res = await pa.post('/pa/drafts', { instruction, context });
    return res.data.draft;
  },
  list: async (): Promise<PaEmailDraft[]> => {
    const res = await pa.get('/pa/drafts');
    return res.data.drafts;
  },
};
