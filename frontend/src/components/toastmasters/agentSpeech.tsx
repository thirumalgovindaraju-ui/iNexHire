// src/components/toastmasters/agentSpeech.tsx — read AI Agent output aloud using the
// browser's built-in SpeechSynthesis API. Free, no backend call, no API key — the
// same "free, browser-native" approach VoiceRecorder.tsx already uses for recording.
import { useEffect, useRef, useState } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { rolesApi } from '../../services/toastmasters';
import type { TmAgentAccent, TmAgentGender } from '../../services/toastmasters';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

const SpeechRecognitionCtor: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
export const canListen = !!SpeechRecognitionCtor;

export interface VoicePersona { accent?: TmAgentAccent | null; gender?: TmAgentGender | null }

// Browser voice lists carry no structured gender field, so this is a best-effort
// name match against the common voice names shipped by Chrome/Edge/Safari's
// built-in engines — not exhaustive, just enough to bias the pick when possible.
const FEMALE_NAME_HINTS = [
  'female', 'zira', 'susan', 'hazel', 'samantha', 'victoria', 'karen', 'tessa', 'moira',
  'fiona', 'kate', 'serena', 'joanna', 'salli', 'kimberly', 'amy', 'emma', 'olivia', 'libby',
];
const MALE_NAME_HINTS = [
  'male', 'david', 'mark', 'george', 'daniel', 'james', 'alex', 'fred', 'oliver', 'ryan',
  'guy', 'matthew', 'justin', 'arthur', 'brian', 'eric', 'russell',
];

let cachedVoices: SpeechSynthesisVoice[] = [];
if (canSpeak) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices();
  });
}

/** Best-effort pick of an installed voice matching the requested accent/gender persona. */
function pickVoice(persona?: VoicePersona): SpeechSynthesisVoice | null {
  if (!canSpeak) return null;
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const targetLang = persona?.accent === 'UK' ? 'en-gb' : persona?.accent === 'US' ? 'en-us' : null;
  const candidates = targetLang
    ? voices.filter((v) => v.lang.toLowerCase().replace('_', '-') === targetLang)
    : [];
  const pool = candidates.length ? candidates : voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const searchPool = pool.length ? pool : voices;

  if (!persona?.gender) return searchPool[0] ?? null;
  const hints = persona.gender === 'FEMALE' ? FEMALE_NAME_HINTS : MALE_NAME_HINTS;
  const opposite = persona.gender === 'FEMALE' ? MALE_NAME_HINTS : FEMALE_NAME_HINTS;
  const scored = searchPool.map((v) => {
    const name = v.name.toLowerCase();
    let score = 0;
    if (hints.some((h) => name.includes(h))) score += 1;
    if (opposite.some((h) => name.includes(h))) score -= 1;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.v ?? null;
}

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
  const currentTextRef = useRef('');
  const charIndexRef = useRef(0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set right before a deliberate interrupt()-triggered cancel — lets the utterance's
  // own (async) onerror recognize "this cancellation was expected" and skip notifying
  // onSpeakingChange a second time, so callers watching for "this role's turn is over"
  // (e.g. Auto-Play Show advancing to the next agenda item) don't mistake a brief pause
  // to listen for an interruption for the speech actually having ended.
  const suppressNextErrorNotifyRef = useRef(false);

  function setSpeakingState(value: boolean) {
    setSpeaking(value);
    onSpeakingChange?.(value);
  }

  function stopKeepAlive() {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  }

  // Stop speaking if this card unmounts (e.g. navigating away mid-speech).
  useEffect(() => () => {
    if (canSpeak) window.speechSynthesis.cancel();
    stopKeepAlive();
  }, []);

  function play(text: string, persona?: VoicePersona, onDone?: () => void) {
    if (!canSpeak || !text.trim()) return;
    suppressNextErrorNotifyRef.current = false;
    window.speechSynthesis.cancel(); // only one voice should speak at a time
    stopKeepAlive();
    currentTextRef.current = text;
    charIndexRef.current = 0;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(persona);
    if (voice) utterance.voice = voice;
    utterance.lang = persona?.accent === 'UK' ? 'en-GB' : persona?.accent === 'US' ? 'en-US' : voice?.lang ?? utterance.lang;
    utterance.onboundary = (e) => { charIndexRef.current = e.charIndex; };
    utterance.onend = () => { stopKeepAlive(); setSpeakingState(false); onDone?.(); };
    utterance.onerror = () => {
      stopKeepAlive();
      setSpeaking(false);
      if (!suppressNextErrorNotifyRef.current) onSpeakingChange?.(false);
      suppressNextErrorNotifyRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
    setSpeakingState(true);
    // Chrome silently stops producing audio ~15s into a long utterance (the
    // "speaking" state and this app's UI never learn it happened — no onend/onerror
    // fires) unless the queue is nudged periodically. See Chromium bug 679437.
    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) { stopKeepAlive(); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }

  function stop() {
    stopKeepAlive();
    window.speechSynthesis.cancel();
    setSpeakingState(false);
  }

  /** Cancels whatever's currently playing to listen for an interruption, and reports
   * how much had already been said — so a reply to the interruption can be grounded in
   * what the agent was actually saying, and the rest can be resumed from that point
   * afterward. Deliberately updates local `speaking` state (for this component's own
   * UI) without notifying onSpeakingChange — this is a momentary pause, not the turn
   * genuinely ending. */
  function interrupt(): { spokenSoFar: string; fullText: string } {
    // charIndexRef.current is 0 both genuinely at the very start of the speech and
    // whenever no onboundary event has fired yet (interrupting within the first
    // instant, which is the common case) — treat it as "nothing spoken yet" rather
    // than falling back to the full text length, which would make an early interrupt
    // look like the agent had already finished, leaving nothing to resume afterward.
    const spokenSoFar = currentTextRef.current.slice(0, charIndexRef.current);
    const fullText = currentTextRef.current;
    suppressNextErrorNotifyRef.current = true;
    stopKeepAlive();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    return { spokenSoFar, fullText };
  }

  return { speaking, play, stop, interrupt };
}

/**
 * Keeps the mic continuously listening in the background for as long as the agent
 * is speaking (see useEffect below) — no button to hold. The moment it hears a
 * finished phrase, it cuts the agent off, sends what was said (plus how far the
 * agent had gotten) to the agent's interrupt endpoint, and speaks its reply.
 * The endpoint also classifies intent — if you told it to stop, that's the end of
 * its turn; for anything else (a question, a comment, "repeat that") it picks the
 * original speech back up from exactly where it left off after answering, the way
 * a real person resumes after a genuine aside rather than abandoning their point.
 * Silently gives up if speech recognition isn't supported or nothing was heard —
 * interrupting is a nice-to-have, never worth surfacing an error over.
 *
 * Caveat: the browser's recognizer has no guaranteed echo cancellation against this
 * page's own TTS output, so on speakers (rather than headphones) it can occasionally
 * pick up the agent's own voice as an "interruption" — an accepted trade-off for not
 * requiring a manual push-to-talk button.
 */
export function useAgentInterjection(speech: Pick<ReturnType<typeof useSpeech>, 'speaking' | 'interrupt' | 'play'>, roleId: string, persona?: VoicePersona) {
  const [state, setState] = useState<'idle' | 'listening' | 'thinking'>('idle');
  const ctxRef = useRef<{ spokenSoFar: string; fullText: string } | null>(null);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);

  function stopListening() {
    wantListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setState((s) => (s === 'listening' ? 'idle' : s));
  }

  function startListening() {
    if (!canListen || wantListeningRef.current) return;
    wantListeningRef.current = true;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const text = Array.from(e.results as any).slice(e.resultIndex).map((r: any) => r[0].transcript).join(' ').trim();
      if (text) handleHeard(text);
    };
    recognition.onerror = () => { /* e.g. transient "no-speech" — onend below restarts it */ };
    recognition.onend = () => {
      // Chrome ends a "continuous" session after a stretch of silence regardless —
      // keep it running for as long as we still want to be listening.
      if (wantListeningRef.current && recognitionRef.current === recognition) {
        try { recognition.start(); } catch { /* ignore — will retry on the next onend */ }
      }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); setState('listening'); } catch { wantListeningRef.current = false; recognitionRef.current = null; }
  }

  /** Nothing usable came back (the interrupt call failed, or the agent had no
   * reply) — pick the original speech back up rather than leaving the agent
   * silent forever just because the interruption attempt itself fizzled. */
  function resumeOriginal() {
    const ctx = ctxRef.current;
    const remainder = ctx ? ctx.fullText.slice(ctx.spokenSoFar.length).trim() : '';
    if (remainder) speech.play(remainder, persona);
  }

  async function handleHeard(userSaid: string) {
    stopListening();
    ctxRef.current = speech.interrupt();
    setState('thinking');
    try {
      const { reply, action } = await rolesApi.interrupt(roleId, { spokenSoFar: ctxRef.current.spokenSoFar, userSaid });
      if (!reply) { resumeOriginal(); return; }
      const remainder = action === 'RESUME' ? ctxRef.current.fullText.slice(ctxRef.current.spokenSoFar.length).trim() : '';
      speech.play(reply, persona, remainder ? () => speech.play(remainder, persona) : undefined);
    } catch {
      // API call itself failed — still resume rather than leaving the agent silent
      resumeOriginal();
    } finally {
      setState('idle');
    }
  }

  // Listen for as long as (and only while) the agent is actually speaking.
  useEffect(() => {
    if (speech.speaking) startListening(); else stopListening();
    return stopListening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.speaking]);

  return { state };
}

/** Passive status badge — there's nothing to click; the agent listens on its own
 * whenever it's speaking (see useAgentInterjection above). */
export function AgentListeningStatus({ state, className = '' }: {
  state: 'idle' | 'listening' | 'thinking';
  className?: string;
}) {
  if (!canListen || state === 'idle') return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-1 select-none ${
        state === 'listening' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
      } ${className}`}
    >
      <Mic size={13} /> {state === 'listening' ? 'Listening for interruptions…' : 'Thinking…'}
    </span>
  );
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
