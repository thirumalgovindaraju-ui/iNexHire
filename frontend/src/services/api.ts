// src/services/api.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return 'Something went wrong';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: { name: string; email: string; password: string; orgName?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.user;
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

// ─── Openings ─────────────────────────────────────────────────────────────────

export const openingsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get('/openings', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/openings/${id}`);
    return res.data.opening;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/openings', data);
    return res.data.opening;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/openings/${id}`, data);
    return res.data.opening;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/openings/${id}`);
  },
  generateJD: async (params: { title: string; department?: string; skills?: string[]; level?: string }) => {
    const res = await apiClient.post('/openings/generate-jd', params);
    return res.data;
  },
  generateQuestions: async (id: string, params: { difficulty?: string; count?: number; replace?: boolean }) => {
    const res = await apiClient.post(`/openings/${id}/generate-questions`, params);
    return res.data;
  },
};

// ─── Candidates ───────────────────────────────────────────────────────────────

export const candidatesApi = {
  list: async (params?: { openingId?: string; page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get('/candidates', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/candidates/${id}`);
    return res.data.candidate;
  },
  add: async (data: { name: string; email: string; phone?: string; openingId: string; sendInvite?: boolean }) => {
    const res = await apiClient.post('/candidates', data);
    return res.data;
  },
  bulkAdd: async (data: { openingId: string; candidates: any[]; sendInvites?: boolean }) => {
    const res = await apiClient.post('/candidates/bulk', data);
    return res.data;
  },
  sendInvite: async (id: string) => {
    const res = await apiClient.post(`/candidates/${id}/send-invite`);
    return res.data;
  },
};

// ─── Interviews ───────────────────────────────────────────────────────────────

export const interviewsApi = {
  list: async (params?: { openingId?: string; status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/interviews', { params });
    return res.data;
  },

  // Candidate-facing (no auth)
  startSession: async (token: string) => {
    const res = await apiClient.get(`/interviews/start/${token}`);
    return res.data;
  },
  submitResponse: async (interviewId: string, data: {
    questionId: string;
    transcript?: string;
    audioUrl?: string;
    duration?: number;
  }) => {
    const res = await apiClient.post(`/interviews/${interviewId}/respond`, data);
    return res.data;
  },
  logProctorEvent: async (interviewId: string, eventType: string, metadata?: any) => {
    await apiClient.post(`/interviews/${interviewId}/proctor-event`, { eventType, metadata });
  },
  complete: async (interviewId: string) => {
    const res = await apiClient.post(`/interviews/${interviewId}/complete`);
    return res.data;
  },
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  get: async (interviewId: string) => {
    const res = await apiClient.get(`/reports/${interviewId}`);
    return res.data;
  },
  setDecision: async (interviewId: string, decision: string, notes?: string) => {
    const res = await apiClient.patch(`/reports/${interviewId}/decision`, { decision, notes });
    return res.data;
  },
};

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadApi = {
  audio: async (blob: Blob, interviewId: string, questionId: string): Promise<string> => {
    const form = new FormData();
    form.append('audio', blob, `${questionId}.webm`);
    form.append('interviewId', interviewId);
    form.append('questionId', questionId);
    const res = await apiClient.post('/upload/audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};

export { extractError };
