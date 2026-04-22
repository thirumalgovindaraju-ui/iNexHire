// src/pages/interview/InterviewRoom.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, SkipForward, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { interviewsApi, extractError } from '../../services/api';
import { useInterviewStore } from '../../store/interviewStore';
import { Button, Spinner } from '../../components/ui';
import clsx from 'clsx';

// ─── Timer ────────────────────────────────────────────────────────────────────

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const pct = remaining / seconds;
  const color = pct > 0.5 ? 'text-green-400' : pct > 0.25 ? 'text-yellow-400' : 'text-red-400';
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className={clsx('flex items-center gap-1.5 font-mono text-lg font-bold', color)}>
      <Clock size={16} />
      {m}:{String(s).padStart(2, '0')}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewRoom() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const {
    session, currentQuestionIndex, submittedQuestions,
    setCurrentQuestion, markSubmitted, currentQuestion, progress, reset
  } = useInterviewStore();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recognition = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load session if not in store
  useEffect(() => {
    if (!session && token) {
      interviewsApi.startSession(token).then((data) => {
        useInterviewStore.getState().setSession(data);
      });
    }
  }, []);

  // Get camera stream
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => {
      navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
    });
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // Proctoring — tab visibility
  useEffect(() => {
    if (!session) return;
    const handler = () => {
      if (document.hidden) {
        interviewsApi.logProctorEvent(session.interviewId, 'TAB_SWITCH');
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [session]);

  // Speech recognition (STT)
  function startRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';

    let finalText = '';
    recognition.current.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };
    recognition.current.start();
  }

  function stopRecognition() {
    recognition.current?.stop();
  }

  async function startRecording() {
    if (!stream) return;
    audioChunks.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    mediaRecorder.current = new MediaRecorder(stream, { mimeType });
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.current.start(1000);
    startRecognition();
    setIsRecording(true);
    setTranscript('');
  }

  async function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) return resolve(new Blob());
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.current!.mimeType });
        resolve(blob);
      };
      mediaRecorder.current.stop();
      stopRecognition();
      setIsRecording(false);
    });
  }

  const handleSubmitAnswer = useCallback(async (skip = false) => {
    const q = currentQuestion();
    if (!q || !session) return;

    setSubmitting(true);
    setError('');
    try {
      if (isRecording) await stopRecording();

      await interviewsApi.submitResponse(session.interviewId, {
        questionId: q.id,
        transcript: skip ? undefined : transcript || undefined,
      });

      markSubmitted(q.id);
      setTranscript('');

      // Move to next or complete
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < session.questions.length) {
        setCurrentQuestion(nextIndex);
      } else {
        await handleComplete();
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestion, session, isRecording, transcript, currentQuestionIndex]);

  async function handleComplete() {
    if (!session) return;
    setCompleting(true);
    try {
      await interviewsApi.complete(session.interviewId);
      stream?.getTracks().forEach((t) => t.stop());
      reset();
      navigate(`/interview/${token}/done`);
    } catch (err) {
      setError(extractError(err));
      setCompleting(false);
    }
  }

  function handleTimerExpire() {
    if (!submitting) handleSubmitAnswer(false);
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={36} className="text-white" />
      </div>
    );
  }

  const q = currentQuestion();
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
  const allAnswered = submittedQuestions.size >= session.questions.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar */}
      <div className="fixed top-14 left-0 right-0 h-1 bg-surface-700 z-40">
        <div
          className="h-full bg-brand-500 transition-all duration-500"
          style={{ width: `${progress()}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row pt-1">
        {/* Left: Camera + Progress */}
        <div className="lg:w-72 bg-surface-800 p-4 flex flex-col gap-4">
          {/* Video preview */}
          <div className="rounded-xl overflow-hidden bg-black aspect-video lg:aspect-auto lg:h-44">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-surface-500 text-xs">No camera</span>
              </div>
            )}
          </div>

          {/* Question nav */}
          <div>
            <p className="text-surface-400 text-xs mb-2 font-medium">QUESTIONS</p>
            <div className="grid grid-cols-5 gap-1.5">
              {session.questions.map((sq, i) => (
                <button
                  key={sq.id}
                  onClick={() => !submitting && setCurrentQuestion(i)}
                  className={clsx(
                    'h-8 rounded-md text-xs font-medium transition-all',
                    i === currentQuestionIndex ? 'bg-brand-600 text-white' :
                    submittedQuestions.has(sq.id) ? 'bg-green-600/30 text-green-400' :
                    'bg-surface-700 text-surface-400 hover:bg-surface-600'
                  )}
                >
                  {submittedQuestions.has(sq.id) ? '✓' : i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-surface-400">
            {submittedQuestions.size} / {session.questions.length} answered
          </div>
        </div>

        {/* Main: Question + Answer */}
        <div className="flex-1 flex flex-col p-6 lg:p-10 max-w-3xl mx-auto w-full">
          {q ? (
            <>
              {/* Question header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-surface-400 text-sm">Q{currentQuestionIndex + 1}</span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full',
                    q.type === 'technical' ? 'bg-blue-900/50 text-blue-300' :
                    q.type === 'behavioral' ? 'bg-green-900/50 text-green-300' :
                    'bg-purple-900/50 text-purple-300'
                  )}>
                    {q.type}
                  </span>
                </div>
                {isRecording && (
                  <Timer seconds={q.timeLimit} onExpire={handleTimerExpire} />
                )}
              </div>

              {/* Question text */}
              <div className="bg-surface-800 rounded-2xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">{q.text}</p>
              </div>

              {/* Transcript */}
              <div className="flex-1 bg-surface-800/50 rounded-2xl p-5 mb-6 min-h-28">
                {transcript ? (
                  <p className="text-surface-200 text-sm leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-surface-500 text-sm italic">
                    {isRecording ? 'Listening... speak your answer' : 'Press the microphone button to start recording your answer'}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={submitting || submittedQuestions.has(q.id)}
                  className={clsx(
                    'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-brand-600 hover:bg-brand-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isRecording ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                </button>

                <Button
                  className="flex-1"
                  size="lg"
                  loading={submitting}
                  disabled={submittedQuestions.has(q.id)}
                  onClick={() => handleSubmitAnswer(false)}
                  icon={submittedQuestions.has(q.id) ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
                >
                  {submittedQuestions.has(q.id) ? 'Answered' :
                   isLastQuestion ? 'Submit & Finish' : 'Submit Answer'}
                </Button>

                {!submittedQuestions.has(q.id) && (
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-surface-400 hover:text-white"
                    onClick={() => handleSubmitAnswer(true)}
                    disabled={submitting}
                    icon={<SkipForward size={18} />}
                  >
                    Skip
                  </Button>
                )}
              </div>

              {/* Finish early */}
              {allAnswered && (
                <div className="mt-4 text-center">
                  <Button size="lg" onClick={handleComplete} loading={completing}>
                    🎉 All done! Submit Interview
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CheckCircle size={56} className="text-green-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">All questions answered!</h2>
              <Button size="lg" onClick={handleComplete} loading={completing}>
                Submit Interview
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
