// src/hooks/useProctoringAlerts.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export interface ProctoringAlert {
  type: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// EventSource can't send a custom Authorization header, so the access token
// goes in the URL as a query param instead — the backend's stream endpoint
// accepts either. See backend/src/routes/proctoring.routes.ts.
export function useProctoringAlerts(interviewId: string | undefined) {
  const [alerts, setAlerts] = useState<ProctoringAlert[]>([]);
  const accessToken = useAuthStore((s) => s.accessToken);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!interviewId || !accessToken) return;

    const url = `${BASE_URL}/proctoring/stream/${interviewId}?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const alert: ProctoringAlert = JSON.parse(e.data);
        setAlerts((prev) => [...prev, alert]);
      } catch {
        // Ignore malformed events rather than crash the live interview view
      }
    };

    // EventSource reconnects automatically on transient network errors —
    // nothing to do here besides letting it retry.
    es.onerror = () => {};

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [interviewId, accessToken]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { alerts, clearAlerts };
}
