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
  fromTemplate: async (templateId: string) => {
    const res = await apiClient.post(`/openings/from-template/${templateId}`);
    return res.data;
  },
};

// ─── EPFO/UAN Employment Verification (simulation only) ────────────────────────

export const epfoApi = {
  verify: async (data: {
    candidateId: string;
    uanNumber: string;
    statedExperienceYears?: number;
    statedEmployers?: string[];
  }) => {
    const res = await apiClient.post('/epfo/verify', data);
    return res.data;
  },
  get: async (candidateId: string) => {
    const res = await apiClient.get(`/epfo/${candidateId}`);
    return res.data;
  },
};

// ─── Job Templates ─────────────────────────────────────────────────────────────

export const templatesApi = {
  list: async (params?: { sector?: string; level?: string }) => {
    const res = await apiClient.get('/templates', { params });
    return res.data.templates;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/templates/${id}`);
    return res.data.template;
  },
};

// ─── LinkedIn Integration (simulation only) ────────────────────────────────────

export const linkedinApi = {
  status: async () => {
    const res = await apiClient.get('/integrations/linkedin/status');
    return res.data;
  },
  auth: async () => {
    const res = await apiClient.get('/integrations/linkedin/auth');
    return res.data;
  },
  callback: async () => {
    const res = await apiClient.get('/integrations/linkedin/callback');
    return res.data;
  },
  invite: async (data: { profileUrl: string; email: string; openingId: string; name?: string }) => {
    const res = await apiClient.post('/integrations/linkedin/invite', data);
    return res.data;
  },
  parseProfile: async (data: { profileUrl: string; pastedText: string }) => {
    const res = await apiClient.post('/integrations/linkedin/parse-profile', data);
    return res.data;
  },
  jobPost: async (openingId: string) => {
    const res = await apiClient.post(`/integrations/linkedin/job-post/${openingId}`);
    return res.data;
  },
  applicants: async (openingId: string) => {
    const res = await apiClient.get(`/integrations/linkedin/applicants/${openingId}`);
    return res.data;
  },
  importApplicant: async (data: { openingId: string; applicant: { name: string; profileUrl: string } }) => {
    const res = await apiClient.post('/integrations/linkedin/applicants/import', data);
    return res.data;
  },
};

// ─── Live Video Interviews (Jitsi Meet) ────────────────────────────────────────

export const liveVideoApi = {
  create: async (interviewId: string, scheduledAt: string) => {
    const res = await apiClient.post(`/live-video/create/${interviewId}`, { scheduledAt });
    return res.data;
  },
  get: async (interviewId: string) => {
    const res = await apiClient.get(`/live-video/${interviewId}`);
    return res.data;
  },
  end: async (interviewId: string) => {
    const res = await apiClient.patch(`/live-video/${interviewId}/end`);
    return res.data;
  },
  joinAsHost: async (interviewId: string) => {
    const res = await apiClient.patch(`/live-video/${interviewId}/join`);
    return res.data;
  },
  // Candidate-facing (no auth) — keyed by inviteToken, not interviewId
  getByToken: async (token: string) => {
    const res = await apiClient.get(`/live-video/by-token/${token}`);
    return res.data;
  },
  joinAsGuest: async (token: string) => {
    const res = await apiClient.patch(`/live-video/by-token/${token}/join`);
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

  // Candidate-facing (no auth) — status-agnostic, works even after completion
  orgByToken: async (token: string): Promise<string> => {
    const res = await apiClient.get(`/interviews/org-by-token/${token}`);
    return res.data.organizationId;
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
    // Render's free tier spins the backend down when idle, so the first request after
    // a period of inactivity can take well over the default 30s timeout to wake it up.
    const res = await apiClient.post(`/interviews/${interviewId}/respond`, data, { timeout: 120000 });
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
  list: async () => {
    const res = await apiClient.get('/reports');
    return res.data.reports;
  },
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

// ─── Offer Letters ────────────────────────────────────────────────────────────

export const offersApi = {
  list: async () => {
    const res = await apiClient.get('/offers');
    return res.data.offers;
  },
  eligible: async () => {
    const res = await apiClient.get('/offers/eligible');
    return res.data.interviews;
  },
  create: async (data: {
    candidateId: string;
    interviewId: string;
    baseSalary: number;
    equity?: number;
    signingBonus?: number;
    startDate: string;
    reportingTo: string;
    department?: string;
    benefits?: string[];
  }) => {
    const res = await apiClient.post('/offers', data);
    return res.data.offer;
  },
  send: async (id: string) => {
    const res = await apiClient.patch(`/offers/${id}/send`);
    return res.data.offer;
  },
};

// ─── Coding Assessment Round ────────────────────────────────────────────────────

export const codingApi = {
  submit: async (data: {
    interviewId: string; questionId: string;
    language: 'javascript' | 'python' | 'java' | 'sql';
    code: string; timeSpentSec?: number;
  }) => {
    const res = await apiClient.post('/coding/submit', data);
    return res.data;
  },
  list: async (interviewId: string) => {
    const res = await apiClient.get(`/coding/${interviewId}`);
    return res.data.assessments;
  },
};

// ─── White-label Branding ───────────────────────────────────────────────────────

export const brandingApi = {
  get: async () => {
    const res = await apiClient.get('/branding');
    return res.data.branding;
  },
  save: async (data: {
    companyName?: string; domain?: string; logoUrl?: string;
    primaryColor?: string; accentColor?: string; fontFamily?: string; welcomeMsg?: string;
  }) => {
    const res = await apiClient.put('/branding', data);
    return res.data.branding;
  },
  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('logo', file);
    const res = await apiClient.post('/upload/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
  // Candidate-facing (no auth)
  getPublic: async (organizationId: string) => {
    const res = await apiClient.get(`/branding/public/${organizationId}`);
    return res.data.branding;
  },
};

// ─── Compensation Benchmarking (AI estimate) ───────────────────────────────────

export const compensationApi = {
  generate: async (data: { jobTitle: string; location: string; minExp: number; maxExp: number }) => {
    const res = await apiClient.post('/compensation/benchmark', data);
    return res.data.benchmark;
  },
  list: async () => {
    const res = await apiClient.get('/compensation/benchmark');
    return res.data.benchmarks;
  },
  compare: async (benchmarkId: string, expectedSalaryLakhs: number) => {
    const res = await apiClient.post('/compensation/compare', { benchmarkId, expectedSalaryLakhs });
    return res.data.comparison;
  },
};

// ─── Video Highlight Extraction (transcript-based, no video processing) ───────

export const highlightsApi = {
  extract: async (interviewId: string) => {
    const res = await apiClient.post(`/highlights/${interviewId}`);
    return res.data.highlights;
  },
  get: async (interviewId: string) => {
    const res = await apiClient.get(`/highlights/${interviewId}`);
    return res.data.highlights;
  },
};

// ─── Group Discussion Simulation ───────────────────────────────────────────────

export const gdApi = {
  list: async (openingId?: string) => {
    const res = await apiClient.get('/gd', { params: openingId ? { openingId } : undefined });
    return res.data.sessions;
  },
  create: async (data: { openingId: string; topic: string; candidateIds: string[]; duration?: number }) => {
    const res = await apiClient.post('/gd/create', data);
    return res.data.groupDiscussion;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/gd/${id}`);
    return res.data.groupDiscussion;
  },
  start: async (id: string) => {
    const res = await apiClient.post(`/gd/${id}/start`);
    return res.data.groupDiscussion;
  },
  sendMessage: async (id: string, speakerId: string, message: string) => {
    const res = await apiClient.post(`/gd/${id}/message`, { speakerId, message });
    return res.data;
  },
  complete: async (id: string) => {
    const res = await apiClient.post(`/gd/${id}/complete`);
    return res.data.groupDiscussion;
  },
};

// ─── Naukri.com Integration (simulation only) ──────────────────────────────────

export const naukriApi = {
  status: async () => {
    const res = await apiClient.get('/integrations/naukri/status');
    return res.data;
  },
  connect: async (apiKey: string) => {
    const res = await apiClient.post('/integrations/naukri/connect', { apiKey });
    return res.data;
  },
  search: async (params: {
    skills?: string; location?: string; minExp?: number; maxExp?: number;
    minSalary?: number; maxSalary?: number; openingId?: string;
  }) => {
    const res = await apiClient.get('/integrations/naukri/search', { params });
    return res.data;
  },
  import: async (candidate: Record<string, any>) => {
    const res = await apiClient.post('/integrations/naukri/import', candidate);
    return res.data;
  },
  invite: async (naukriCandidateId: string, openingId: string) => {
    const res = await apiClient.post(`/integrations/naukri/invite/${naukriCandidateId}`, { openingId });
    return res.data;
  },
  imported: async () => {
    const res = await apiClient.get('/integrations/naukri/imported');
    return res.data.imported;
  },
};

// ─── WhatsApp Notifications ────────────────────────────────────────────────────

export const whatsappApi = {
  send: async (data: { candidateId: string; messageType: 'INVITE' | 'REMINDER' | 'RESULT' | 'OFFER' | 'CUSTOM'; customMessage?: string }) => {
    const res = await apiClient.post('/whatsapp/send', data);
    return res.data;
  },
  invite: async (candidateId: string) => {
    const res = await apiClient.post(`/whatsapp/invite/${candidateId}`);
    return res.data;
  },
  remind: async (interviewId: string) => {
    const res = await apiClient.post(`/whatsapp/remind/${interviewId}`);
    return res.data;
  },
  logsForCandidate: async (candidateId: string) => {
    const res = await apiClient.get(`/whatsapp/logs/${candidateId}`);
    return res.data.logs;
  },
  logs: async () => {
    const res = await apiClient.get('/whatsapp/logs');
    return res.data.logs;
  },
};

export { extractError };
