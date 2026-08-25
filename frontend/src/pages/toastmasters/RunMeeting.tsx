// src/pages/toastmasters/RunMeeting.tsx — live meeting runner
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SquareCheck } from 'lucide-react';
import { Button, Select, Spinner, useToast } from '../../components/ui';
import { TM_GOLD, TM_NAVY, TM_ZONE_COLOR, agendaZone, formatSecs } from '../../components/toastmasters/theme';
import VoiceRecorder from '../../components/toastmasters/VoiceRecorder';
import {
  TM_FILLER_COUNT_KEY, TM_FILLER_LABELS, TM_FILLER_WORDS, TM_ROLE_SHORT_LABELS,
  ahCounterApi, agendaApi, meetingsApi, membersApi, timerApi,
} from '../../services/toastmasters';
import type { TmAgendaItem, TmAhCounter, TmMeeting, TmMember, TmSpeechAnalysis } from '../../services/toastmasters';

export default function RunMeeting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [aiFillerSuggestion, setAiFillerSuggestion] = useState<{ memberId: string; analysis: TmSpeechAnalysis } | null>(null);
  const [members, setMembers] = useState<TmMember[]>([]);
  const [ahCounters, setAhCounters] = useState<TmAhCounter[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [speakerId, setSpeakerId] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([meetingsApi.get(id), membersApi.list(), ahCounterApi.list(id)])
      .then(([m, mem, counters]) => { setMeeting(m); setMembers(mem); setAhCounters(counters); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const items: TmAgendaItem[] = meeting?.agendaItems ?? [];
  const current = items[currentIndex];

  useEffect(() => {
    setElapsed(0);
    setRunning(false);
    setSpeakerId(current?.roleAssignment?.member?.id ?? '');
    setAiFillerSuggestion(null);
  }, [currentIndex, current?.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!meeting) return <p className="p-6 text-surface-500">Meeting not found.</p>;
  if (items.length === 0) return <p className="p-6 text-surface-500">This meeting has no agenda items yet.</p>;

  const greenMins = current.roleAssignment?.greenMins ?? current.durationMins ?? 5;
  const yellowMins = current.roleAssignment?.yellowMins ?? (current.durationMins ?? 5) + 1;
  const zone = agendaZone(elapsed, greenMins, yellowMins);
  const progressPct = Math.round((currentIndex / items.length) * 100);

  function goTo(index: number) {
    if (index < 0 || index >= items.length) return;
    setCurrentIndex(index);
  }

  async function markDone() {
    setRunning(false);
    if (current.roleAssignment) {
      const result = zone === 'green' ? 'UNDER' : zone === 'yellow' ? 'WITHIN' : 'OVER';
      await timerApi.submit(id!, { roleAssignmentId: current.roleAssignment.id, actualDurationSecs: elapsed, result });
    }
    await agendaApi.update(current.id, { actualEnd: new Date().toISOString() });
    goTo(currentIndex + 1);
  }

  async function tapFiller(word: string) {
    if (!speakerId || !id) return;
    const counter = await ahCounterApi.tap(id, speakerId, word);
    setAhCounters((prev) => {
      const idx = prev.findIndex((c) => c.memberId === speakerId);
      if (idx === -1) return [...prev, counter];
      return prev.map((c, i) => (i === idx ? counter : c));
    });
  }

  function handleAnalysisComplete(memberId: string | undefined, analysis: TmSpeechAnalysis) {
    if (memberId) setAiFillerSuggestion({ memberId, analysis });
  }

  async function applyAiFillerCounts() {
    if (!id || !aiFillerSuggestion) return;
    const f = aiFillerSuggestion.analysis.fillerWordCounts;
    const counters = await ahCounterApi.saveAll(id, [{
      memberId: aiFillerSuggestion.memberId,
      umCount: f.um, uhCount: f.uh, soCount: f.so, likeCount: f.like, erCount: f.er, youKnowCount: f.you_know, otherCount: 0,
    }]);
    setAhCounters((prev) => {
      const idx = prev.findIndex((c) => c.memberId === aiFillerSuggestion.memberId);
      if (idx === -1) return [...prev, counters[0]];
      return prev.map((c, i) => (i === idx ? counters[0] : c));
    });
    setAiFillerSuggestion(null);
    show('AI filler counts applied to Ah Counter');
  }

  const speakerCounter = ahCounters.find((c) => c.memberId === speakerId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: TM_GOLD }} />
        </div>
        <p className="text-xs text-surface-500 mt-1">Item {currentIndex + 1} of {items.length} · {progressPct}% complete</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left panel */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border-4 p-6" style={{ borderColor: TM_GOLD, background: TM_NAVY }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: TM_GOLD }}>
              {current.roleAssignment ? TM_ROLE_SHORT_LABELS[current.roleAssignment.roleName] ?? current.roleAssignment.roleName : 'No role linked'}
            </p>
            <h1 className="text-white text-xl font-bold mt-1">{current.activityName}</h1>
            <p className="text-white/60 text-sm mt-1">
              Planned {current.durationMins ?? '—'} mins · {current.plannedStart ?? '—'} to {current.plannedEnd ?? '—'}
            </p>

            <div className="flex flex-col items-center mt-5">
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center border-8 transition-colors"
                style={{ borderColor: TM_ZONE_COLOR[zone], color: '#fff' }}
              >
                <span className="text-4xl font-mono font-bold">{formatSecs(elapsed)}</span>
              </div>
              {zone === 'red' && (
                <p className="flex items-center gap-1.5 text-sm font-semibold mt-3" style={{ color: '#f87171' }}>
                  <AlertTriangle size={14} /> Overtime — wrap up
                </p>
              )}
              <div className="flex gap-4 text-xs text-white/50 mt-2">
                <span>🟢 0–{greenMins}m</span>
                <span>🟡 {greenMins}–{yellowMins}m</span>
                <span>🔴 {yellowMins}m+</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-5">
              <Button size="sm" variant="secondary" onClick={() => setRunning((r) => !r)}>
                {running ? <Pause size={13} /> : <Play size={13} />} {running ? 'Pause' : 'Start'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setRunning(false); setElapsed(0); }}>
                <RotateCcw size={13} /> Reset
              </Button>
              <Button size="sm" onClick={markDone}>
                <SquareCheck size={13} /> Done
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>
              <ChevronLeft size={14} /> Previous Item
            </Button>
            <Button variant="secondary" disabled={currentIndex === items.length - 1} onClick={() => goTo(currentIndex + 1)}>
              Next Item <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-surface-200 bg-white p-3">
            <h3 className="text-xs font-semibold uppercase text-surface-500 mb-2">Agenda</h3>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => goTo(i)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer ${
                    i === currentIndex ? 'bg-amber-50 font-semibold text-surface-900' : i < currentIndex ? 'text-surface-400' : 'text-surface-500'
                  }`}
                >
                  {i < currentIndex ? <Check size={13} className="text-green-500 flex-shrink-0" /> : <span className="w-[13px] flex-shrink-0" />}
                  <span className="truncate">{item.activityName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-surface-200 bg-white p-3">
            <h3 className="text-xs font-semibold uppercase text-surface-500 mb-2">Quick Ah Counter</h3>
            <Select
              value={speakerId}
              onChange={(e) => setSpeakerId(e.target.value)}
              options={[{ value: '', label: 'Select speaker...' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
            />
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {TM_FILLER_WORDS.filter((w) => w !== 'other').map((word) => (
                <button
                  key={word}
                  disabled={!speakerId}
                  onClick={() => tapFiller(word)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-100 text-xs font-medium text-surface-700 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {TM_FILLER_LABELS[word]}
                  <span className="font-bold text-surface-900">{speakerCounter ? (speakerCounter as any)[TM_FILLER_COUNT_KEY[word]] : 0}</span>
                </button>
              ))}
            </div>
            {aiFillerSuggestion && (
              <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-800">AI detected {aiFillerSuggestion.analysis.fillerWordCounts.total} fillers</span>
                <Button size="sm" onClick={applyAiFillerCounts}>Apply to Ah Counter</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {current.roleAssignment?.roleName?.startsWith('SPEAKER_') && (
        <div className="mt-5">
          <VoiceRecorder
            key={current.roleAssignment.id}
            meetingId={id!}
            roleAssignmentId={current.roleAssignment.id}
            speakerName={current.roleAssignment.member?.name ?? 'Speaker'}
            wordOfDay={meeting.wordOfDay}
            onAnalysisComplete={(analysis) => handleAnalysisComplete(current.roleAssignment?.memberId ?? undefined, analysis)}
          />
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Button variant="ghost" onClick={() => navigate(`/toastmasters/${id}`)}>Exit Runner</Button>
      </div>
      <ToastContainer />
    </div>
  );
}
