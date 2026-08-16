// src/pages/interview/GDRoom.tsx — candidate-facing Group Discussion room
// No login: the session id + candidateId in the URL are the access boundary,
// the same trust model as the individual interview's invite-token flow.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Clock, Users } from 'lucide-react';
import { gdApi } from '../../services/api';

interface GDParticipant { candidateId: string; name: string; speakingTime: number; score: number | null; }
interface GDTranscriptEntry { speaker: string; text: string; timestamp: string; }
interface GDSession {
  id: string;
  topic: string;
  duration: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  participants: GDParticipant[];
  transcript: GDTranscriptEntry[] | null;
  startedAt: string | null;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function GDRoom() {
  const { sessionId, candidateId } = useParams<{ sessionId: string; candidateId: string }>();
  const [session, setSession] = useState<GDSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const completedTriggered = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await gdApi.get(sessionId);
      setSession(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(refresh, 3000);
    return () => clearInterval(pollRef.current);
  }, [session?.status, refresh]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.transcript?.length]);

  // Timer — counts down from startedAt + duration; only the first participant's
  // client auto-triggers /complete to minimize (not fully eliminate) the race
  // between multiple candidates' clients hitting the timer at the same moment.
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE' || !session.startedAt) return;
    const endTime = new Date(session.startedAt).getTime() + session.duration * 60 * 1000;

    function tick() {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !completedTriggered.current) {
        completedTriggered.current = true;
        clearInterval(timerRef.current);
        if (session!.participants[0]?.candidateId === candidateId) {
          gdApi.complete(session!.id).then(setSession).catch(() => {});
        } else {
          setTimeout(refresh, 2000);
        }
      }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.status, session?.startedAt, candidateId, refresh]);

  async function sendMessage() {
    if (!sessionId || !candidateId || !message.trim()) return;
    setSending(true);
    try {
      const data = await gdApi.sendMessage(sessionId, candidateId, message.trim());
      setSession(data.groupDiscussion);
      setMessage('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !session) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <p className="text-red-400 text-sm">{error || 'Session not found'}</p>
    </div>
  );

  // Anonymize every OTHER participant as "Candidate A/B/C..." based on their
  // order in the participant list; the candidate always sees their own real name.
  const anonMap = new Map<string, string>();
  let letterIdx = 0;
  for (const p of session.participants) {
    if (p.candidateId === candidateId) continue;
    anonMap.set(p.name, `Candidate ${String.fromCharCode(65 + letterIdx)}`);
    letterIdx++;
  }
  const me = session.participants.find((p) => p.candidateId === candidateId);

  function displayName(speaker: string) {
    if (speaker === 'AI Moderator') return speaker;
    if (speaker === me?.name) return 'You';
    return anonMap.get(speaker) ?? speaker;
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col">
      <div className="h-14 bg-surface-800 border-b border-surface-700 flex items-center justify-between px-5 flex-shrink-0">
        <div>
          <p className="text-sm font-bold text-brand-400">Group Discussion</p>
          <p className="text-xs text-surface-400 truncate max-w-md">{session.topic}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-surface-400">
            <Users size={13} /> {session.participants.length} participants
          </span>
          {timeLeft != null && session.status === 'ACTIVE' && (
            <span className={`flex items-center gap-1.5 font-mono text-sm font-bold px-2.5 py-1 rounded ${timeLeft < 60 ? 'text-red-400 bg-red-900/30' : 'text-surface-200 bg-surface-700'}`}>
              <Clock size={13} /> {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {session.status === 'PENDING' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-surface-400 text-sm">Waiting for the recruiter to start the discussion...</p>
        </div>
      ) : session.status === 'COMPLETED' ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <p className="text-xl font-bold mb-2">Discussion Complete</p>
            <p className="text-surface-400 text-sm">Thanks for participating. The recruiter will review the results.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-5 max-w-2xl mx-auto w-full space-y-3">
            {(session.transcript ?? []).length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-8">No messages yet — say hello!</p>
            ) : (
              session.transcript!.map((t, i) => {
                const isModerator = t.speaker === 'AI Moderator';
                const isMe = t.speaker === me?.name;
                return (
                  <div
                    key={i}
                    className={
                      isModerator
                        ? 'bg-orange-900/30 border border-orange-700/50 rounded-xl p-3'
                        : isMe
                        ? 'bg-brand-900/30 border border-brand-700/40 rounded-xl p-3 ml-6'
                        : 'bg-surface-800 rounded-xl p-3 mr-6'
                    }
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${isModerator ? 'text-orange-300' : isMe ? 'text-brand-300' : 'text-surface-400'}`}>
                      {displayName(t.speaker)}
                    </p>
                    <p className="text-sm text-surface-200">{t.text}</p>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="border-t border-surface-700 p-4 max-w-2xl mx-auto w-full flex gap-2 flex-shrink-0">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
              placeholder="Share your thoughts..."
              className="flex-1 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="w-11 h-11 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
