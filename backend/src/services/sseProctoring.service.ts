// src/services/sseProctoring.service.ts
// In-memory registry of open SSE connections, keyed by interviewId. A recruiter
// viewing a live interview subscribes; POST /api/interviews/:id/proctor-event
// broadcasts to whoever is currently connected for that interview.
//
// In-memory only — this does NOT survive a server restart or work across
// multiple backend instances behind a load balancer. Fine for this app's
// single-process deployment; would need Redis pub/sub (or similar) to scale
// beyond one instance.
import { Response } from 'express';

const clients = new Map<string, Response[]>();

export function registerClient(interviewId: string, res: Response) {
  const list = clients.get(interviewId) ?? [];
  list.push(res);
  clients.set(interviewId, list);
}

export function unregisterClient(interviewId: string, res: Response) {
  const list = clients.get(interviewId);
  if (!list) return;
  const filtered = list.filter((r) => r !== res);
  if (filtered.length > 0) clients.set(interviewId, filtered);
  else clients.delete(interviewId);
}

export type ProctoringSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProctoringAlertEvent {
  type: string;
  timestamp: string;
  severity: ProctoringSeverity;
  description: string;
}

const EVENT_META: Record<string, { severity: ProctoringSeverity; description: string }> = {
  MULTIPLE_FACES: { severity: 'CRITICAL', description: 'Multiple faces detected' },
  TAB_SWITCH: { severity: 'HIGH', description: 'Tab switch detected' },
  COPY_PASTE: { severity: 'HIGH', description: 'Copy/paste detected' },
  BACKGROUND_VOICE: { severity: 'HIGH', description: 'Background voice detected' },
  LOOKING_AWAY: { severity: 'MEDIUM', description: 'Looking away from camera' },
  FACE_NOT_DETECTED: { severity: 'MEDIUM', description: 'Face not detected in frame' },
  FULLSCREEN_EXIT: { severity: 'MEDIUM', description: 'Exited fullscreen' },
  SUSPICIOUS_PAUSE: { severity: 'MEDIUM', description: 'Suspicious pause before answering' },
  MIC_MUTED: { severity: 'LOW', description: 'Microphone muted or silent for an extended period' },
};

export function describeProctorEvent(eventType: string): { severity: ProctoringSeverity; description: string } {
  return EVENT_META[eventType] ?? { severity: 'LOW', description: eventType.replace(/_/g, ' ').toLowerCase() };
}

export function broadcastProctoringEvent(interviewId: string, eventType: string) {
  const list = clients.get(interviewId);
  if (!list || list.length === 0) return;

  const { severity, description } = describeProctorEvent(eventType);
  const event: ProctoringAlertEvent = {
    type: eventType,
    timestamp: new Date().toISOString(),
    severity,
    description,
  };

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of list) {
    try {
      res.write(payload);
    } catch {
      // Connection likely already gone — it'll be cleaned up by its own 'close' handler
    }
  }
}
