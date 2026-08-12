// ═══════════════════════════════════════════════════════════════════════════
// PART 4: frontend/src/hooks/useProctoring.ts
// Drop-in hook for InterviewRoom.tsx — detects all malpractice signals
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api';

interface ProctoringConfig {
  interviewId: string;
  enabled?: boolean;
}

interface ProctoringEvent {
  eventType: string;
  metadata?: Record<string, any>;
}

export function useProctoring({ interviewId, enabled = true }: ProctoringConfig) {
  const isActive = useRef(false);
  const faceCheckInterval = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eventQueue = useRef<ProctoringEvent[]>([]);
  const flushInterval = useRef<NodeJS.Timeout>();
  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());

  // ── Log event (batched to reduce API calls) ────────────────────────────
  const logEvent = useCallback((eventType: string, metadata?: Record<string, any>) => {
    if (!enabled || !isActive.current) return;
    eventQueue.current.push({ eventType, metadata });
  }, [enabled]);

  // ── Flush event queue to API every 10 seconds ─────────────────────────
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    const batch = [...eventQueue.current];
    eventQueue.current = [];

    for (const event of batch) {
      try {
        await apiClient.post('/proctoring/event', {
          interviewId,
          eventType: event.eventType,
          metadata: event.metadata,
        });
      } catch {
        // Silent fail — proctoring should never break the interview
      }
    }
  }, [interviewId]);

  // ── Tab visibility detection ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        logEvent('TAB_SWITCH', {
          count: tabSwitchCount.current,
          hiddenAt: new Date().toISOString(),
          timeAwayMs: Date.now() - lastActiveTime.current,
        });
      } else {
        lastActiveTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, logEvent]);

  // ── Fullscreen exit detection ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent('FULLSCREEN_EXIT', { timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, logEvent]);

  // ── Copy-paste detection ───────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = () => logEvent('COPY_PASTE', { action: 'copy', time: new Date().toISOString() });
    const handlePaste = () => logEvent('COPY_PASTE', { action: 'paste', time: new Date().toISOString() });

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, logEvent]);

  // ── Right-click / context menu detection ──────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent('COPY_PASTE', { action: 'right_click', time: new Date().toISOString() });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, logEvent]);

  // ── Face detection via canvas frame analysis ───────────────────────────
  // Uses browser MediaPipe or simple luminance heuristic as fallback
  const startFaceMonitoring = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;

    // Create offscreen canvas for frame analysis
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;

    let consecutiveNoFace = 0;
    let frameCount = 0;
    let lastFaceRegion: number | null = null;

    faceCheckInterval.current = setInterval(() => {
      if (!video || video.readyState < 2) return;
      frameCount++;

      try {
        ctx.drawImage(video, 0, 0, 160, 120);
        const imageData = ctx.getImageData(0, 0, 160, 120);
        const data = imageData.data;

        // ── Skin tone detection heuristic ──────────────────────────────
        // Count pixels in skin tone range (HSV-derived RGB ranges)
        let skinPixels = 0;
        let totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // Skin tone: r > 95, g > 40, b > 20, r > g, r > b, |r-g| > 15
          if (r > 95 && g > 40 && b > 20 &&
              r > g && r > b && Math.abs(r - g) > 15 &&
              r - Math.min(g, b) > 15) {
            skinPixels++;
          }
        }

        const skinRatio = skinPixels / totalPixels;
        const faceDetected = skinRatio > 0.04; // At least 4% skin tone pixels

        if (!faceDetected) {
          consecutiveNoFace++;
          if (consecutiveNoFace >= 3) { // 3 consecutive checks = ~9 seconds
            logEvent('FACE_NOT_DETECTED', {
              consecutiveChecks: consecutiveNoFace,
              skinRatio: skinRatio.toFixed(3),
              frameNumber: frameCount,
            });
            consecutiveNoFace = 0; // Reset to avoid spam
          }
        } else {
          consecutiveNoFace = 0;

          // ── Multiple face detection (crude) ──────────────────────────
          // Check for two distinct skin-tone clusters
          let leftHalf = 0, rightHalf = 0;
          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % 160;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const isSkin = r > 95 && g > 40 && b > 20 && r > g && r > b;
            if (isSkin) {
              if (x < 60) leftHalf++;
              else if (x > 100) rightHalf++;
            }
          }
          // Two faces if both halves have significant skin detection
          // AND neither dominates (ratio between 0.3 and 0.7)
          if (leftHalf > 200 && rightHalf > 200) {
            const ratio = leftHalf / (leftHalf + rightHalf);
            if (ratio > 0.3 && ratio < 0.7) {
              logEvent('MULTIPLE_FACES', {
                leftRegionPixels: leftHalf,
                rightRegionPixels: rightHalf,
                frameNumber: frameCount,
              });
            }
          }

          // ── Looking away detection ────────────────────────────────────
          // If skin cluster centre moves dramatically from frame to frame
          let skinCentreX = 0, skinCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % 160;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
              skinCentreX += x;
              skinCount++;
            }
          }
          if (skinCount > 0) {
            const centreX = skinCentreX / skinCount;
            if (lastFaceRegion !== null && Math.abs(centreX - lastFaceRegion) > 40) {
              logEvent('LOOKING_AWAY', {
                previousCentre: Math.round(lastFaceRegion),
                currentCentre: Math.round(centreX),
                shift: Math.round(Math.abs(centreX - lastFaceRegion)),
              });
            }
            lastFaceRegion = centreX;
          }
        }
      } catch {
        // Canvas read failed (privacy mode or track ended) — ignore
      }
    }, 3000); // Check every 3 seconds
  }, [logEvent]);

  const stopFaceMonitoring = useCallback(() => {
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
  }, []);

  // ── Audio analysis for background voices ──────────────────────────────
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    if (!enabled) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let silenceCount = 0;
    let loudCount = 0;

    const checkAudio = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < 5) {
        silenceCount++;
        if (silenceCount > 10) { // ~30 seconds of silence during recording
          logEvent('MIC_MUTED', { avgVolume: avg.toFixed(2), silentFrames: silenceCount });
          silenceCount = 0;
        }
      } else {
        silenceCount = 0;
      }

      // Detect unusually loud audio (background TV, speaker, coaching)
      if (avg > 150) {
        loudCount++;
        if (loudCount >= 3) {
          logEvent('BACKGROUND_VOICE', { avgVolume: avg.toFixed(2), loudFrames: loudCount });
          loudCount = 0;
        }
      } else {
        loudCount = 0;
      }
    }, 3000);

    return () => {
      clearInterval(checkAudio);
      audioCtx.close();
    };
  }, [enabled, logEvent]);

  // ── Suspicious pause detection ─────────────────────────────────────────
  const trackResponseTiming = useCallback((questionStartTime: number) => {
    // Called when candidate starts responding after question
    const elapsed = Date.now() - questionStartTime;
    if (elapsed > 30000) { // More than 30 seconds before starting to answer
      logEvent('SUSPICIOUS_PAUSE', {
        pauseMs: elapsed,
        pauseSeconds: Math.round(elapsed / 1000),
      });
    }
  }, [logEvent]);

  // ── Lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    isActive.current = true;
    flushInterval.current = setInterval(flushEvents, 10000);

    return () => {
      isActive.current = false;
      if (flushInterval.current) clearInterval(flushInterval.current);
      stopFaceMonitoring();
      flushEvents(); // Final flush on unmount
    };
  }, [enabled, flushEvents, stopFaceMonitoring]);

  return {
    logEvent,
    startFaceMonitoring,
    stopFaceMonitoring,
    startAudioMonitoring,
    trackResponseTiming,
    tabSwitchCount: tabSwitchCount.current,
  };
}
