// src/pages/interview/WaitingRoom.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Camera, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { interviewsApi, extractError } from '../../services/api';
import { useInterviewStore } from '../../store/interviewStore';
import { Button, Spinner } from '../../components/ui';

type CheckStatus = 'idle' | 'checking' | 'ok' | 'error';

export default function WaitingRoom() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setSession = useInterviewStore((s) => s.setSession);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [micStatus, setMicStatus] = useState<CheckStatus>('idle');
  const [camStatus, setCamStatus] = useState<CheckStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!token) return;
    interviewsApi.startSession(token).then((data) => {
      setSessionData(data);
      setSession(data);
    }).catch((err) => {
      setError(extractError(err));
    }).finally(() => setLoading(false));
  }, [token]);

  async function checkDevices() {
    setMicStatus('checking');
    setCamStatus('checking');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setStream(s);
      setMicStatus('ok');
      setCamStatus('ok');
    } catch {
      setMicStatus('error');
      setCamStatus('error');
    }
  }

  function handleStart() {
    setStarting(true);
    navigate(`/interview/${token}/room`);
  }

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size={40} className="text-white mx-auto mb-4" />
          <p className="text-surface-200">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-surface-800 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Unable to load interview</h2>
          <p className="text-surface-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const allOk = micStatus === 'ok' && camStatus === 'ok';

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Hi, {sessionData?.candidate?.name?.split(' ')[0]}!
          </h1>
          <p className="text-surface-300">
            {sessionData?.opening?.title} · {sessionData?.opening?.organization}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Interview info */}
          <div className="bg-surface-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">About this interview</h2>
            <ul className="space-y-3 text-sm text-surface-300">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {sessionData?.totalQuestions}
                </span>
                Questions to answer
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-400 text-lg leading-none mt-0.5">⏱</span>
                Each question has a time limit (1–3 min)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-400 text-lg leading-none mt-0.5">🎙</span>
                Speak your answers clearly — AI transcribes
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-400 text-lg leading-none mt-0.5">📷</span>
                Webcam monitoring is active throughout
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-400 text-lg leading-none mt-0.5">✅</span>
                You can skip a question if stuck
              </li>
            </ul>
          </div>

          {/* Device check */}
          <div className="bg-surface-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Device Check</h2>

            <div className="space-y-3 mb-5">
              <CheckRow icon={<Mic size={16} />} label="Microphone" status={micStatus} />
              <CheckRow icon={<Camera size={16} />} label="Webcam" status={camStatus} />
            </div>

            {/* Webcam preview */}
            {camStatus === 'ok' && stream && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
                <video
                  autoPlay muted playsInline
                  ref={(el) => { if (el) el.srcObject = stream; }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={checkDevices}
              disabled={micStatus === 'checking'}
            >
              {micStatus === 'idle' ? 'Check Devices' : micStatus === 'checking' ? 'Checking...' : 'Re-check Devices'}
            </Button>
          </div>
        </div>

        {/* Agreement */}
        <div className="bg-surface-800 rounded-2xl p-5 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded" />
            <p className="text-sm text-surface-300">
              I confirm I am in a quiet, well-lit environment, I am alone, and I understand this interview is recorded and monitored. I will not use external help during the interview.
            </p>
          </label>
        </div>

        {/* Start button */}
        <Button
          size="lg"
          className="w-full"
          disabled={!agreed || !allOk || starting}
          onClick={handleStart}
          loading={starting}
        >
          {!allOk ? 'Complete device check to start' : 'Start Interview →'}
        </Button>

        {allOk && (
          <p className="text-center text-xs text-surface-400 mt-3">
            Make sure you won't be interrupted. Once started, keep this tab open.
          </p>
        )}
      </div>
    </div>
  );
}

function CheckRow({ icon, label, status }: { icon: React.ReactNode; label: string; status: CheckStatus }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-surface-300 text-sm">
        {icon} {label}
      </div>
      <div>
        {status === 'idle' && <span className="text-surface-500 text-xs">Not checked</span>}
        {status === 'checking' && <Loader2 size={16} className="animate-spin text-brand-400" />}
        {status === 'ok' && <CheckCircle size={18} className="text-green-400" />}
        {status === 'error' && <XCircle size={18} className="text-red-400" />}
      </div>
    </div>
  );
}
