// src/pages/interview/LiveInterviewRoom.tsx
// Dual-mode: recruiter (route has :interviewId, under DashboardLayout) or
// candidate (route has :token, under CandidateLayout) — both land here and
// join the same Jitsi Meet room via its roomName.
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Clock, StickyNote, LogOut, AlertTriangle } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { liveVideoApi } from '../../services/api';

interface Question { id: string; text: string; type: string; }
interface LiveInterview {
  id: string;
  roomName: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  hostJoined: boolean;
  guestJoined: boolean;
}

export default function LiveInterviewRoom() {
  const { token, interviewId } = useParams<{ token?: string; interviewId?: string }>();
  const isRecruiter = Boolean(interviewId);
  const navigate = useNavigate();

  const [liveInterview, setLiveInterview] = useState<LiveInterview | null>(null);
  const [candidate, setCandidate] = useState<{ name: string; openingTitle: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = isRecruiter ? await liveVideoApi.get(interviewId!) : await liveVideoApi.getByToken(token!);
        if (!data.liveInterview) {
          setError('No live interview has been scheduled for this session yet.');
          return;
        }
        setLiveInterview(data.liveInterview);
        setCandidate(data.candidate);
        if (data.questions) setQuestions(data.questions);

        if (isRecruiter) await liveVideoApi.joinAsHost(interviewId!);
        else await liveVideoApi.joinAsGuest(token!);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? 'Failed to load the live interview room');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, interviewId, isRecruiter]);

  // Candidate side: poll for the recruiter ending the call, since there's no
  // Jitsi event hook wired to a bare iframe embed.
  useEffect(() => {
    if (isRecruiter || !liveInterview || liveInterview.endedAt) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await liveVideoApi.getByToken(token!);
        if (data.liveInterview?.endedAt) {
          setLiveInterview(data.liveInterview);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Ignore transient polling failures
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRecruiter, liveInterview, token]);

  async function handleEndInterview() {
    if (!interviewId) return;
    try {
      setEnding(true);
      await liveVideoApi.end(interviewId);
      navigate(`/reports/${interviewId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to end the interview');
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: isRecruiter ? '#f8fafc' : '#0f172a' }}>
        <Spinner size={32} className={isRecruiter ? undefined : 'text-white'} />
      </div>
    );
  }

  if (error || !liveInterview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: isRecruiter ? '#f8fafc' : '#0f172a', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <AlertTriangle size={36} style={{ color: '#f43f5e', margin: '0 auto 14px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: isRecruiter ? '#0f172a' : '#fff', marginBottom: 6 }}>
            {error ?? 'Live interview not found'}
          </div>
        </div>
      </div>
    );
  }

  const jitsiUrl = `https://meet.jit.si/${liveInterview.roomName}`;

  // ─── Candidate view: fullscreen video call ───────────────────────────────
  if (!isRecruiter) {
    if (liveInterview.endedAt) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <Video size={36} style={{ margin: '0 auto 14px', color: '#818cf8' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Interview complete — thank you!</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>You may now close this window.</div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0f172a' }}>
        <iframe
          src={jitsiUrl}
          title="Live Interview"
          allow="camera; microphone; fullscreen; display-capture"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </div>
    );
  }

  // ─── Recruiter view: video + questions panel + notes ─────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 18px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Video size={16} style={{ color: '#4f46e5' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{candidate?.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{candidate?.openingTitle}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94a3b8' }}>
            <Clock size={12} />
            Scheduled {new Date(liveInterview.scheduledAt).toLocaleString()}
          </div>
          <Button variant="danger" size="sm" icon={<LogOut size={13} />} onClick={handleEndInterview} loading={ending}>
            End Interview & View Report
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <iframe
            src={jitsiUrl}
            title="Live Interview"
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </div>

      {/* Side panel: questions + notes */}
      <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
          Interview Questions
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {questions.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>No questions on this opening yet.</div>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < questions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', flexShrink: 0 }}>Q{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>{q.text}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <StickyNote size={13} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Notes (this session only)</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot notes while you talk — not saved after this session..."
            rows={6}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      </div>
    </div>
  );
}
