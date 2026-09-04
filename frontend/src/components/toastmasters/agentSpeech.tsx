// src/components/toastmasters/agentSpeech.tsx — read AI Agent output aloud using the
// browser's built-in SpeechSynthesis API. Free, no backend call, no API key — the
// same "free, browser-native" approach VoiceRecorder.tsx already uses for recording.
import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Extracts the full (untruncated) text worth reading aloud from an agent result payload. */
export function agentResultSpeechText(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, any>;
  if (typeof r.transcript === 'string' && r.transcript.trim()) return r.transcript;
  if (typeof r.commendations === 'string') {
    return [r.commendations, r.recommendations].filter(Boolean).join('. ');
  }
  if (typeof r.overallFeedback === 'string') return r.overallFeedback;
  if (typeof r.goodGrammarExamples === 'string') {
    return [r.goodGrammarExamples, r.errorsNoted].filter(Boolean).join('. ');
  }
  if (Array.isArray(r.topics)) {
    return r.topics.map((t: string, i: number) => `Question ${i + 1}. ${t}`).join(' ');
  }
  if (typeof r.note === 'string') return r.note;
  return null;
}

/**
 * Shared SpeechSynthesis playback state, usable both from a manual "Listen" button
 * click and programmatically (e.g. auto-playing right after an agent run completes,
 * or driving an unattended "run the whole show" sequence). Only one hook instance
 * should be actively speaking at a time — callers share the browser's single
 * speechSynthesis queue, and `play()` always cancels whatever was speaking before.
 */
export function useSpeech(onSpeakingChange?: (speaking: boolean) => void) {
  const [speaking, setSpeaking] = useState(false);

  function setSpeakingState(value: boolean) {
    setSpeaking(value);
    onSpeakingChange?.(value);
  }

  // Stop speaking if this card unmounts (e.g. navigating away mid-speech).
  useEffect(() => () => {
    if (canSpeak) window.speechSynthesis.cancel();
  }, []);

  function play(text: string) {
    if (!canSpeak || !text.trim()) return;
    window.speechSynthesis.cancel(); // only one voice should speak at a time
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingState(false);
    utterance.onerror = () => setSpeakingState(false);
    window.speechSynthesis.speak(utterance);
    setSpeakingState(true);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeakingState(false);
  }

  return { speaking, play, stop };
}

export function SpeakButton({ speaking, onToggle, label = 'Listen', className = '' }: {
  speaking: boolean; onToggle: () => void; label?: string; className?: string;
}) {
  if (!canSpeak) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 ${className}`}
    >
      {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />} {speaking ? 'Stop' : label}
    </button>
  );
}
