// src/services/paAgent/googleAuthApi.ts
import { pa } from './httpClient';

export const googleAuthApi = {
  connect: async (): Promise<{ url: string }> => {
    const res = await pa.get('/integrations/google/connect');
    return { url: res.data.url };
  },
  status: async (): Promise<{ connected: boolean; googleEmail: string | null }> => {
    const res = await pa.get('/integrations/google/status');
    return { connected: res.data.connected, googleEmail: res.data.googleEmail };
  },
  disconnect: async (): Promise<void> => {
    await pa.delete('/integrations/google/disconnect');
  },
};
