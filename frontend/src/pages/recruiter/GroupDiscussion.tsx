// src/pages/recruiter/GroupDiscussion.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, MessageSquare, Play, Square, Trophy, Send } from 'lucide-react';
import { Button, Card, Badge, Select, Input, Spinner, PageHeader, EmptyState, useToast } from '../../components/ui';
import { gdApi, candidatesApi, openingsApi, extractError } from '../../services/api';

interface OpeningOption { id: string; title: string; }
interface CandidateOption { id: string; name: string; }

interface GDParticipant { candidateId: string; name: string; speakingTime: number; score: number | null; }
interface GDTranscriptEntry { speaker: string; text: string; timestamp: string; }
interface GDReport {
  scores: { candidateId: string; name: string; communication: number; content: number; leadership: number; listening: number; overall: number; feedback: string }[];
  ranking: string[];
  topPerformer: string | null;
  summary: string;
}
interface GDSession {
  id: string;
  openingId: string;
  topic: string;
  duration: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  participants: GDParticipant[];
  transcript: GDTranscriptEntry[] | null;
  report: GDReport | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, 'yellow' | 'blue' | 'green'> = {
  PENDING: 'yellow',
  ACTIVE: 'blue',
  COMPLETED: 'green',
};

export default function GroupDiscussion() {
  const { show, ToastContainer } = useToast();

  const [openings, setOpenings] = useState<OpeningOption[]>([]);
  const [openingId, setOpeningId] = useState('');
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [sessions, setSessions] = useState<GDSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [topic, setTopic] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState('15');
  const [creating, setCreating] = useState(false);

  const [activeSession, setActiveSession] = useState<GDSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [simSpeakerId, setSimSpeakerId] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const loadSessions = useCallback(async (oid: string) => {
    try {
      const data = await gdApi.list(oid || undefined);
      setSessions(data ?? []);
    } catch (err) {
      show(extractError(err), 'error');
    }
  }, [show]);

  useEffect(() => {
    setLoading(true);
    openingsApi.list({ limit: 100 })
      .then((data) => {
        const opts = (data.openings ?? []).map((o: any) => ({ id: o.id, title: o.title }));
        setOpenings(opts);
        if (opts.length > 0) setOpeningId(opts[0].id);
      })
      .catch((err) => show(extractError(err), 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => {
    if (!openingId) return;
    candidatesApi.list({ openingId, limit: 100 })
      .then((data) => setCandidates((data.candidates ?? []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
    setSelectedCandidateIds(new Set());
    loadSessions(openingId);
  }, [openingId, loadSessions]);

  // Poll the active session while it's ACTIVE
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'ACTIVE') {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await gdApi.get(activeSession.id);
        setActiveSession(updated);
      } catch {
        // transient — next tick retries
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeSession?.id, activeSession?.status]);

  function toggleCandidate(id: string) {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function createSession() {
    if (!openingId || !topic.trim() || selectedCandidateIds.size < 2) {
      show('Pick a topic and at least 2 participants', 'error');
      return;
    }
    setCreating(true);
    try {
      const gd = await gdApi.create({
        openingId,
        topic: topic.trim(),
        candidateIds: [...selectedCandidateIds],
        duration: Number(duration) || 15,
      });
      show('Group discussion session created!');
      setTopic('');
      setSelectedCandidateIds(new Set());
      await loadSessions(openingId);
      setActiveSession(gd);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setCreating(false);
    }
  }

  async function openSession(session: GDSession) {
    try {
      const fresh = await gdApi.get(session.id);
      setActiveSession(fresh);
      setSimSpeakerId(fresh.participants?.[0]?.candidateId ?? '');
    } catch (err) {
      show(extractError(err), 'error');
    }
  }

  async function startSession() {
    if (!activeSession) return;
    setStarting(true);
    try {
      const updated = await gdApi.start(activeSession.id);
      setActiveSession(updated);
      await loadSessions(openingId);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setStarting(false);
    }
  }

  async function sendSimulatedMessage() {
    if (!activeSession || !simSpeakerId || !simMessage.trim()) return;
    setSendingMessage(true);
    try {
      const data = await gdApi.sendMessage(activeSession.id, simSpeakerId, simMessage.trim());
      setActiveSession(data.groupDiscussion);
      setSimMessage('');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSendingMessage(false);
    }
  }

  async function endSession() {
    if (!activeSession) return;
    setCompleting(true);
    try {
      const updated = await gdApi.complete(activeSession.id);
      setActiveSession(updated);
      await loadSessions(openingId);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setCompleting(false);
    }
  }

  const totalTurns = activeSession?.participants.reduce((sum, p) => sum + p.speakingTime, 0) ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer />
      <PageHeader
        title="Group Discussion Simulation"
        description="Create AI-moderated group discussion rounds and get individual + ranked evaluations"
      />

      <div className="mb-5 max-w-xs">
        <Select
          label="Opening"
          value={openingId}
          onChange={(e) => { setOpeningId(e.target.value); setActiveSession(null); }}
          options={openings.map((o) => ({ value: o.id, label: o.title }))}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create session */}
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-600" /> Create Session
              </h3>
              <Input label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Should companies adopt a 4-day work week?" />
              <Input label="Duration (minutes)" type="number" min={5} max={60} value={duration} onChange={(e) => setDuration(e.target.value)} />
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Participants (min 2)</label>
                {candidates.length === 0 ? (
                  <p className="text-xs text-surface-400">No candidates for this opening yet.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 border border-surface-200 rounded-lg p-2">
                    {candidates.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                        <input type="checkbox" checked={selectedCandidateIds.has(c.id)} onChange={() => toggleCandidate(c.id)} />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full" icon={<Users size={14} />} loading={creating} onClick={createSession}>
                Create Session
              </Button>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">Sessions</h3>
              </div>
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-surface-400">No sessions yet for this opening.</div>
              ) : (
                <div className="divide-y divide-surface-50">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSession(s)}
                      className={`w-full text-left px-5 py-3 hover:bg-surface-50 transition-colors ${activeSession?.id === s.id ? 'bg-brand-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-surface-900 truncate">{s.topic}</span>
                        <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                      </div>
                      <div className="text-xs text-surface-400">{s.participants.length} participants · {s.duration}min</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Session detail */}
          <div className="lg:col-span-2">
            {!activeSession ? (
              <Card>
                <EmptyState
                  icon={<MessageSquare size={22} />}
                  title="Select or create a session"
                  description="Pick a session from the list, or create a new one to get started."
                />
              </Card>
            ) : activeSession.status === 'PENDING' ? (
              <Card className="p-6 text-center">
                <h3 className="font-semibold text-surface-900 mb-1">{activeSession.topic}</h3>
                <p className="text-sm text-surface-500 mb-4">{activeSession.participants.length} participants · {activeSession.duration} minutes</p>
                <Button icon={<Play size={14} />} loading={starting} onClick={startSession}>Start Session</Button>
              </Card>
            ) : activeSession.status === 'ACTIVE' ? (
              <Card className="flex flex-col max-h-[640px]">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="font-semibold text-surface-900">{activeSession.topic}</h3>
                    <p className="text-xs text-surface-400">Live — AI moderator active</p>
                  </div>
                  <Button variant="danger" size="sm" icon={<Square size={12} />} loading={completing} onClick={endSession}>
                    End Session
                  </Button>
                </div>

                {/* Speaking time bars */}
                <div className="px-5 py-3 border-b border-surface-100 flex-shrink-0 space-y-1.5">
                  {activeSession.participants.map((p) => (
                    <div key={p.candidateId} className="flex items-center gap-2 text-xs">
                      <span className="w-28 truncate text-surface-600">{p.name}</span>
                      <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: totalTurns ? `${Math.min(100, (p.speakingTime / totalTurns) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-surface-400 w-14 text-right">{p.speakingTime} turns</span>
                    </div>
                  ))}
                </div>

                {/* Transcript feed */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                  {(activeSession.transcript ?? []).length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-8">No messages yet.</p>
                  ) : (
                    activeSession.transcript!.map((t, i) => (
                      <div key={i} className={t.speaker === 'AI Moderator' ? 'bg-orange-50 border border-orange-200 rounded-lg p-2.5' : ''}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: t.speaker === 'AI Moderator' ? '#c2410c' : '#334155' }}>
                          {t.speaker}
                        </p>
                        <p className="text-sm text-surface-700">{t.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Recruiter simulated message input */}
                <div className="px-5 py-3 border-t border-surface-100 flex-shrink-0">
                  <p className="text-xs text-surface-400 mb-2">Simulate a participant message (for demo purposes)</p>
                  <div className="flex gap-2">
                    <select
                      value={simSpeakerId}
                      onChange={(e) => setSimSpeakerId(e.target.value)}
                      className="border border-surface-200 rounded-lg text-sm px-2 py-1.5"
                    >
                      {activeSession.participants.map((p) => (
                        <option key={p.candidateId} value={p.candidateId}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      value={simMessage}
                      onChange={(e) => setSimMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendSimulatedMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border border-surface-200 rounded-lg text-sm px-3 py-1.5"
                    />
                    <Button size="sm" icon={<Send size={13} />} loading={sendingMessage} onClick={sendSimulatedMessage}>Send</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <h3 className="font-semibold text-surface-900 mb-1">{activeSession.topic}</h3>
                <p className="text-sm text-surface-600 mb-4">{activeSession.report?.summary}</p>

                <div className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                  <Trophy size={15} className="text-yellow-500" /> Rankings
                </div>
                <div className="space-y-2">
                  {(activeSession.report?.ranking ?? []).map((candidateId, i) => {
                    const s = activeSession.report?.scores.find((sc) => sc.candidateId === candidateId);
                    const isTop = activeSession.report?.topPerformer === candidateId;
                    return (
                      <div key={candidateId} className={`rounded-lg border p-3 ${isTop ? 'border-yellow-300 bg-yellow-50' : 'border-surface-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-surface-900">
                            #{i + 1} {s?.name ?? candidateId} {isTop && <Badge variant="yellow" className="ml-1">Top Performer</Badge>}
                          </span>
                          <span className="text-sm font-bold text-brand-600">{s?.overall ?? '—'}/100</span>
                        </div>
                        {s && (
                          <>
                            <div className="flex gap-3 text-xs text-surface-500 mb-1">
                              <span>Communication: {s.communication}</span>
                              <span>Content: {s.content}</span>
                              <span>Leadership: {s.leadership}</span>
                              <span>Listening: {s.listening}</span>
                            </div>
                            <p className="text-xs text-surface-600">{s.feedback}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
