// src/services/paAgent/httpClient.ts
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '../api';

// Briefing generation fans out to Gmail + Calendar + Claude in one request — give it a
// little more room than the default 30s.
const PA_TIMEOUT_MS = 45000;

export const pa = {
  get: (url: string, config?: AxiosRequestConfig) => apiClient.get(url, { timeout: PA_TIMEOUT_MS, ...config }),
  post: (url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.post(url, data, { timeout: PA_TIMEOUT_MS, ...config }),
  patch: (url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.patch(url, data, { timeout: PA_TIMEOUT_MS, ...config }),
  delete: (url: string, config?: AxiosRequestConfig) => apiClient.delete(url, { timeout: PA_TIMEOUT_MS, ...config }),
};
