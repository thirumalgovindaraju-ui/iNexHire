// src/services/toastmasters/httpClient.ts — Render free-tier cold-start handling
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '../api';

// Render's free tier spins the backend down after inactivity; waking it back up
// can take 20-30s. The rest of the app keeps apiClient's 30s default — only the
// Toastmasters module (the one most likely to be hit right after a cold link)
// gets the longer timeout.
const TM_TIMEOUT_MS = 60000;

export const tm = {
  get: (url: string, config?: AxiosRequestConfig) => apiClient.get(url, { timeout: TM_TIMEOUT_MS, ...config }),
  post: (url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.post(url, data, { timeout: TM_TIMEOUT_MS, ...config }),
  patch: (url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.patch(url, data, { timeout: TM_TIMEOUT_MS, ...config }),
  put: (url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.put(url, data, { timeout: TM_TIMEOUT_MS, ...config }),
  delete: (url: string, config?: AxiosRequestConfig) => apiClient.delete(url, { timeout: TM_TIMEOUT_MS, ...config }),
};

export function isColdStartTimeout(err: any): boolean {
  return err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '');
}

// Retries a request exactly once, 5s later, if — and only if — it failed with a
// timeout (the cold-start signature). Any other error (4xx/5xx, network down)
// passes straight through; retrying those would just mask a real bug.
export async function withColdStartRetry<T>(fn: () => Promise<T>, onRetrying?: () => void): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isColdStartTimeout(err)) throw err;
    onRetrying?.();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return await fn();
  }
}
