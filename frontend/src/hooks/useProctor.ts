// src/hooks/useProctor.ts
import { useEffect, useRef, useCallback } from 'react';
import { interviewsApi } from '../services/api';

interface UseProctorOptions {
  interviewId: string;
  enabled?: boolean;
}

export function useProctor({ interviewId, enabled = true }: UseProctorOptions) {
  const loggedEventsRef = useRef<Set<string>>(new Set());

  const logEvent = useCallback(
    async (eventType: string, metadata?: any) => {
      if (!enabled || !interviewId) return;
      try {
        await interviewsApi.logProctorEvent(interviewId, eventType, metadata);
      } catch {
        // Silently fail — don't interrupt the candidate
      }
    },
    [interviewId, enabled]
  );

  // Tab visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, logEvent]);

  // Copy-paste detection
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = () => logEvent('COPY_PASTE', { action: 'copy' });
    const handlePaste = () => logEvent('COPY_PASTE', { action: 'paste' });

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, logEvent]);

  // Fullscreen exit
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, logEvent]);

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  return { logEvent, requestFullscreen };
}
