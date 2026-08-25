// src/components/toastmasters/VoiceRecorder.tsx — free, browser-native voice recording +
// Claude speech analysis. Uses the Web Speech API for live transcription; no audio is
// ever recorded, uploaded, or stored — only the resulting text is sent to the backend.
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Mic, Pencil, Sparkles, Square } from 'lucide-react';
import { Button, Textarea, useToast } from '../ui';
import { TM_GOLD, TM_NAVY, formatSecs } from './theme';
import { extractError } from '../../services/api';
import { speechAnalysisApi } from '../../services/toastmasters';
import SpeechAnalysisResult from './SpeechAnalysisResult';
import type { TmSpeechAnalysis } from '../../services/toastmasters';

type Phase = 'idle' | 'recording' | 'recorded' | 'analyzing' | 'complete' | 'error';

// SpeechRecognition isn't in TypeScript's default DOM lib — minimal shape for what we use.
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function WaveformBars() {
  return (
    <div className="flex items-end gap-1 h-8">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-red-500"
          style={{ height: '100%', animation: `tm-wave 0.9s ease-in-out ${i * 0.12}s infinite` }}
        />
      ))}
      <style>{`@keyframes tm-wave { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }`}</style>
    </div>
  );
}

export default function VoiceRecorder({ meetingId, roleAssignmentId, speakerName, wordOfDay, onAnalysisComplete }: {
  meetingId: string;
  roleAssignmentId: string;
  speakerName: string;
  wordOfDay?: string | null;
  onAnalysisComplete?: (analysis: TmSpeechAnalysis) => void;
}) {
  const { show, ToastContainer } = useToast();
  const [supported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<TmSpeechAnalysis | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => () => {
    recordingRef.current = false;
    recognitionRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  function startRecording() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterim('');
    setErrorMessage('');

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += text + ' ';
        else interimChunk += text;
      }
      if (finalChunk) {
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + finalChunk).trim();
        setTranscript(finalTranscriptRef.current);
      }
      setInterim(interimChunk);
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setPhase('error');
        setErrorMessage('Microphone access denied — allow it in your browser settings and try again.');
      }
    };
    recognition.onend = () => {
      if (recordingRef.current) recognition.start(); // some browsers auto-stop after a pause
    };

    recognition.start();
    recognitionRef.current = recognition;
    recordingRef.current = true;
    setElapsed(0);
    setPhase('recording');
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function stopRecording() {
    recordingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterim('');
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('recorded');
  }

  async function analyze() {
    if (!transcript.trim()) {
      show('Nothing to analyze yet — record or type a transcript first.', 'error');
      return;
    }
    setPhase('analyzing');
    try {
      const result = await speechAnalysisApi.analyze(meetingId, {
        roleAssignmentId, transcript, durationSeconds: elapsed || undefined,
      });
      setAnalysis(result);
      setPhase('complete');
      onAnalysisComplete?.(result);
    } catch (err) {
      setErrorMessage(extractError(err));
      setPhase('error');
    }
  }

  function recordAgain() {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterim('');
    setElapsed(0);
    setAnalysis(null);
    setErrorMessage('');
    setPhase('idle');
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4">
      <ToastContainer />
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-surface-900 text-sm">Voice Recording — {speakerName}</h3>
        {wordOfDay && <span className="text-xs text-surface-400">Word of the Day: {wordOfDay}</span>}
      </div>

      {!supported && phase === 'idle' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">Live speech recognition isn't supported in this browser (try Chrome or Edge on desktop or Android). You can type the transcript instead.</p>
        </div>
      )}

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-2 py-6">
          <button
            onClick={supported ? startRecording : undefined}
            disabled={!supported}
            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 flex-shrink-0"
            style={{ background: TM_NAVY }}
          >
            <Mic size={28} />
          </button>
          <p className="text-sm text-surface-500">Tap to start recording</p>
          {!supported && (
            <Textarea className="w-full mt-2" rows={5} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste or type the speech transcript here..." />
          )}
          {!supported && transcript.trim() && (
            <Button className="mt-1" onClick={analyze}><Sparkles size={13} /> Analyze with AI</Button>
          )}
        </div>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <button onClick={stopRecording} className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md bg-red-600 flex-shrink-0 animate-pulse">
            <Square size={26} />
          </button>
          <p className="text-red-600 font-mono text-sm font-semibold">Recording... {formatSecs(elapsed)}</p>
          <WaveformBars />
          <div className="w-full rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm max-h-32 overflow-y-auto">
            <span className="text-surface-900">{transcript}</span>{' '}
            <span className="text-surface-400 italic">{interim}</span>
            {!transcript && !interim && <span className="text-surface-400 italic">Listening...</span>}
          </div>
          <Button variant="secondary" onClick={stopRecording}><Square size={13} /> Stop Recording</Button>
        </div>
      )}

      {phase === 'recorded' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-green-700 font-medium flex items-center gap-2">
            ✅ Recording complete — {formatSecs(elapsed)} | {wordCount} words
          </p>
          <Textarea label="Transcript (editable — fix any misrecognitions before analyzing)" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={analyze} style={{ background: TM_NAVY }}><Sparkles size={13} /> Analyze with AI</Button>
            <Button variant="ghost" onClick={recordAgain}><Pencil size={13} /> Record Again</Button>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex flex-col items-center gap-2 py-8">
          <Loader2 size={28} className="animate-spin" style={{ color: TM_GOLD }} />
          <p className="text-sm font-medium text-surface-900">Claude AI is analyzing your speech...</p>
          <p className="text-xs text-surface-400">Checking grammar, counting fillers, generating evaluation...</p>
        </div>
      )}

      {phase === 'complete' && analysis && (
        <SpeechAnalysisResult analysis={analysis} onRecordAgain={recordAgain} />
      )}

      {phase === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-2">
          <p className="text-sm text-red-700">{errorMessage || 'Something went wrong.'}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setPhase('recorded')}>Retry</Button>
            <Button size="sm" variant="ghost" onClick={recordAgain}>Start Over</Button>
          </div>
        </div>
      )}
    </div>
  );
}
