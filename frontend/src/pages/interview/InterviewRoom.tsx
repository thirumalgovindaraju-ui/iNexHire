// src/pages/interview/InterviewRoom.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, SkipForward, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { interviewsApi, uploadApi, extractError } from '../../services/api';
import { useInterviewStore } from '../../store/interviewStore';
import { useProctoring } from '../../hooks/useProctoring';
import { Button, Spinner } from '../../components/ui';
import clsx from 'clsx';

// ─── Pending response fallback ─────────────────────────────────────────────────
// If submitResponse times out (e.g. Render's free tier waking a sleeping backend),
// the candidate's answer is stashed here instead of being lost, and synced later.

interface PendingResponse {
  questionId: string;
  transcript?: string;
  savedAt: string;
}

function pendingResponsesKey(interviewId: string) {
  return `nexhire-pending-response-${interviewId}`;
}

function loadPendingResponses(interviewId: string): PendingResponse[] {
  try {
    const raw = localStorage.getItem(pendingResponsesKey(interviewId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addPendingResponse(interviewId: string, questionId: string, transcript?: string) {
  const items = loadPendingResponses(interviewId).filter((i) => i.questionId !== questionId);
  items.push({ questionId, transcript, savedAt: new Date().toISOString() });
  try {
    localStorage.setItem(pendingResponsesKey(interviewId), JSON.stringify(items));
  } catch (err) {
    console.error('[InterviewRoom] failed to save pending response locally:', err);
  }
}

function removePendingResponse(interviewId: string, questionId: string) {
  const items = loadPendingResponses(interviewId).filter((i) => i.questionId !== questionId);
  try {
    localStorage.setItem(pendingResponsesKey(interviewId), JSON.stringify(items));
  } catch {
    // Non-fatal — worst case we retry an already-synced response next flush.
  }
}

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
  const [sttAvailable, setSttAvailable] = useState(true);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStream = useRef<MediaStream | null>(null);
  const recognition = useRef<any>(null);
  const recognitionShouldRun = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioMonitorCleanup = useRef<(() => void) | null>(null);
  const questionStartTime = useRef(Date.now());

  const proctoring = useProctoring({
    interviewId: session?.interviewId ?? '',
    enabled: Boolean(session),
  });

  // Trace every state change for debugging the recording flow on the live site
  useEffect(() => { console.log('[InterviewRoom] state:isRecording =', isRecording); }, [isRecording]);
  useEffect(() => { console.log('[InterviewRoom] state:transcript =', transcript); }, [transcript]);
  useEffect(() => { console.log('[InterviewRoom] state:submitting =', submitting); }, [submitting]);
  useEffect(() => { console.log('[InterviewRoom] state:completing =', completing); }, [completing]);
  useEffect(() => { console.log('[InterviewRoom] state:stream =', stream); }, [stream]);
  useEffect(() => { console.log('[InterviewRoom] state:error =', error); }, [error]);
  useEffect(() => { console.log('[InterviewRoom] state:sttAvailable =', sttAvailable); }, [sttAvailable]);

  // Detect SpeechRecognition support up front so the manual-typing fallback shows
  // immediately in non-Chrome browsers, instead of only after a failed recording attempt.
  useEffect(() => {
    const supported = Boolean((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);
    console.log('[InterviewRoom] SpeechRecognition supported in this browser =', supported);
    setSttAvailable(supported);
  }, []);

  // Load session if not in store
  useEffect(() => {
    if (!session && token) {
      interviewsApi.startSession(token).then((data) => {
        useInterviewStore.getState().setSession(data);
      });
    }
  }, []);

  // Best-effort sync of any answers that were saved locally after a previous
  // submitResponse timeout (e.g. a Render cold start, or the tab being reloaded
  // before the retry could happen).
  useEffect(() => {
    if (!session) return;
    const pending = loadPendingResponses(session.interviewId);
    if (pending.length === 0) return;
    console.log('[InterviewRoom] found', pending.length, 'locally-saved response(s), attempting to sync');
    (async () => {
      for (const item of pending) {
        try {
          await interviewsApi.submitResponse(session.interviewId, {
            questionId: item.questionId,
            transcript: item.transcript,
          });
          removePendingResponse(session.interviewId, item.questionId);
          console.log('[InterviewRoom] synced locally-saved response for question', item.questionId);
        } catch (err) {
          console.warn('[InterviewRoom] still unable to sync locally-saved response for question', item.questionId, err);
        }
      }
    })();
  }, [session?.interviewId]);

  // Get camera stream — video only. Audio is requested separately and on-demand by
  // startRecording(), so this stream never needs (and never gets) a microphone track.
  useEffect(() => {
    console.log('[InterviewRoom] requesting camera access (video only)');
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((s) => {
      console.log('[InterviewRoom] camera stream acquired:', s.getTracks().map((t) => `${t.kind}:${t.readyState}`));
      setStream(s);
    }).catch((err) => {
      console.error('[InterviewRoom] camera access failed — proceeding without video preview:', err);
    });
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // Assign the stream to the <video> element once it's mounted. Doing this inside the
  // getUserMedia .then() above races the element's mount: the <video> only renders once
  // `stream` state is set, so `videoRef.current` is still null at that point in time.
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    console.log('[InterviewRoom] assigning camera stream to video element');
    videoRef.current.srcObject = stream;
    proctoring.startFaceMonitoring(videoRef.current);
    return () => proctoring.stopFaceMonitoring();
  }, [stream]);

  // Reset the "time to start answering" clock whenever a new question is shown
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestionIndex]);

  // Speech recognition (STT) — the browser's Web Speech API is the only transcription
  // path (recorded audio is never uploaded), so a failure here means the candidate has
  // no way to submit an answer unless we fall back to manual typing.
  function startRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[InterviewRoom] SpeechRecognition not supported in this browser — falling back to manual transcript entry');
      setSttAvailable(false);
      return;
    }

    recognitionShouldRun.current = true;
    let finalText = '';

    const launch = () => {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        setTranscript(finalText + interim);
      };

      rec.onerror = (e: any) => {
        console.error('[InterviewRoom] SpeechRecognition error:', e.error);
        // 'no-speech' fires constantly during normal pauses — not fatal, onend will restart it.
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          console.warn('[InterviewRoom] SpeechRecognition unavailable, falling back to manual transcript entry');
          recognitionShouldRun.current = false;
          setSttAvailable(false);
        }
      };

      // Chrome/Edge stop continuous recognition after a few seconds of silence even
      // with continuous:true — restart it transparently while the answer is still being recorded.
      rec.onend = () => {
        if (recognitionShouldRun.current) {
          console.log('[InterviewRoom] SpeechRecognition ended unexpectedly, restarting');
          launch();
        }
      };

      recognition.current = rec;
      rec.start();
    };

    launch();
  }

  function stopRecognition() {
    recognitionShouldRun.current = false;
    recognition.current?.stop();
  }

  async function startRecording() {
    console.log('[InterviewRoom] mic button clicked');

    // Step 1: get a fresh, dedicated audio stream for this recording. Reusing the
    // mount-time preview stream (or probing permission with a second throwaway
    // getUserMedia call and stopping it) risks ending the shared track on some
    // browsers/drivers, which makes MediaRecorder.start() throw InvalidStateError
    // later — surfacing as a generic "Could not start recording".
    console.log('[InterviewRoom] step 1: requesting microphone permission for this recording');
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log(
        '[InterviewRoom] step 1 complete: permission granted, tracks =',
        micStream.getTracks().map((t) => `${t.kind}:${t.readyState}`)
      );
    } catch (err: any) {
      const detail = `${err?.name ?? 'Error'}: ${err?.message ?? 'Unknown error'}`;
      console.error('[InterviewRoom] step 1 failed: microphone permission denied:', detail, err);
      setError(`Microphone access denied — ${detail}`);
      return;
    }

    // Step 2: initialize and start MediaRecorder on that dedicated stream.
    console.log('[InterviewRoom] step 2: initializing MediaRecorder');
    recordingStream.current = micStream;
    audioChunks.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      console.log('[InterviewRoom] using mimeType =', mimeType);
      mediaRecorder.current = new MediaRecorder(micStream, { mimeType });
      mediaRecorder.current.ondataavailable = (e) => {
        console.log('[InterviewRoom] ondataavailable, chunk size =', e.data.size);
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onerror = (e) => console.error('[InterviewRoom] MediaRecorder error:', e);
      mediaRecorder.current.start(1000);
      console.log('[InterviewRoom] step 2 complete: MediaRecorder started, state =', mediaRecorder.current.state);
    } catch (err: any) {
      const detail = `${err?.name ?? 'Error'}: ${err?.message ?? 'Unknown error'}`;
      console.error('[InterviewRoom] step 2 failed: could not start MediaRecorder:', detail, err);
      setError(`Could not start recording — ${detail}`);
      micStream.getTracks().forEach((t) => t.stop());
      recordingStream.current = null;
      return;
    }

    // Step 3: only start SpeechRecognition once the mic stream + recorder are confirmed live.
    console.log('[InterviewRoom] step 3: starting SpeechRecognition');
    setIsRecording(true);
    setTranscript('');
    setError('');
    startRecognition();

    console.log('[InterviewRoom] starting proctoring audio monitoring + response-timing check');
    audioMonitorCleanup.current = proctoring.startAudioMonitoring(micStream);
    proctoring.trackResponseTiming(questionStartTime.current);
  }

  async function stopRecording(): Promise<Blob> {
    console.log('[InterviewRoom] stopRecording called');
    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        console.warn('[InterviewRoom] stopRecording called with no active MediaRecorder');
        return resolve(new Blob());
      }
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.current!.mimeType });
        console.log('[InterviewRoom] MediaRecorder stopped, blob size =', blob.size);
        recordingStream.current?.getTracks().forEach((t) => t.stop());
        recordingStream.current = null;
        audioMonitorCleanup.current?.();
        audioMonitorCleanup.current = null;
        resolve(blob);
      };
      mediaRecorder.current.stop();
      stopRecognition();
      setIsRecording(false);
    });
  }

  // Uploads the recorded audio and attaches it to the already-submitted response.
  // Deliberately not awaited by callers — the transcript is what gets scored, the
  // recording is supplementary evidence, so the candidate should never be blocked
  // waiting for this (audio uploads are much larger and slower than the transcript).
  async function uploadAudioInBackground(interviewId: string, questionId: string, blob: Blob) {
    try {
      console.log('[InterviewRoom] background audio upload starting for question', questionId, 'size =', blob.size);
      const url = await uploadApi.audio(blob, interviewId, questionId);
      console.log('[InterviewRoom] background audio upload complete, attaching audioUrl for question', questionId);
      await interviewsApi.submitResponse(interviewId, { questionId, audioUrl: url });
      console.log('[InterviewRoom] audioUrl attached for question', questionId);
    } catch (err) {
      console.warn('[InterviewRoom] background audio upload failed for question', questionId, '— transcript was already submitted, so this is non-fatal:', err);
    }
  }

  async function advanceAfterSubmit(questionId: string) {
    markSubmitted(questionId);
    setTranscript('');
    const nextIndex = currentQuestionIndex + 1;
    if (session && nextIndex < session.questions.length) {
      setCurrentQuestion(nextIndex);
    } else {
      await handleComplete();
    }
  }

  const handleSubmitAnswer = useCallback(async (skip = false) => {
    const q = currentQuestion();
    if (!q || !session) return;

    setSubmitting(true);
    setError('');
    try {
      let audioBlob: Blob | null = null;
      if (isRecording) audioBlob = await stopRecording();

      const answerTranscript = skip ? undefined : transcript || undefined;

      // Kick off the audio upload now but never await it here — it runs in the
      // background while the transcript submission (below) proceeds immediately.
      if (!skip && audioBlob && audioBlob.size > 0) {
        uploadAudioInBackground(session.interviewId, q.id, audioBlob);
      }

      try {
        console.log('[InterviewRoom] submitting response for question', q.id);
        await interviewsApi.submitResponse(session.interviewId, {
          questionId: q.id,
          transcript: answerTranscript,
        });
        console.log('[InterviewRoom] response submitted successfully');
        await advanceAfterSubmit(q.id);
      } catch (err: any) {
        const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '');
        if (!isTimeout) throw err;

        console.warn('[InterviewRoom] submitResponse timed out — saving answer locally instead of losing it:', err);
        addPendingResponse(session.interviewId, q.id, answerTranscript);
        setError("Your answer couldn't reach the server in time, so it was saved on this device and will sync automatically. Continuing...");
        await advanceAfterSubmit(q.id);
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
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
                {sttAvailable ? (
                  transcript ? (
                    <p className="text-surface-200 text-sm leading-relaxed">{transcript}</p>
                  ) : (
                    <p className="text-surface-500 text-sm italic">
                      {isRecording ? 'Listening... speak your answer' : 'Press the microphone button to start recording your answer'}
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-yellow-400 text-xs mb-2">
                      Live transcription isn't available in this browser — type your answer instead.
                    </p>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-transparent text-surface-200 text-sm leading-relaxed resize-none outline-none min-h-20"
                    />
                  </div>
                )}
              </div>

              {submitting && (
                <div className="mb-4 p-3 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-300 flex items-center gap-2">
                  <Spinner size={14} />
                  Processing your answer... this can take a little longer if the server just woke up.
                </div>
              )}

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
                    // 64px min tap target on mobile (accessibility guidance for touch targets); 56px on desktop.
                    'w-16 h-16 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all shadow-lg flex-shrink-0',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-brand-600 hover:bg-brand-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isRecording ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
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
