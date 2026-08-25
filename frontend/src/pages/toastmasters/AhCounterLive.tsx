// src/pages/toastmasters/AhCounterLive.tsx — live tap-to-count filler word tracker
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Quote, RotateCcw, Save, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button, PageHeader, Spinner, useToast } from '../../components/ui';
import { extractError } from '../../services/api';
import {
  TM_FILLER_COUNT_KEY, TM_FILLER_LABELS, TM_FILLER_WORDS, TM_ROLE_LABELS,
  ahCounterApi, meetingsApi, speechAnalysisApi,
} from '../../services/toastmasters';
import type { TmMeeting, TmSpeechAnalysis } from '../../services/toastmasters';

type Counts = Record<(typeof TM_FILLER_WORDS)[number], number>;
interface Tally { memberId: string; name: string; roles: string[]; counts: Counts }

const ZERO_COUNTS: Counts = { um: 0, uh: 0, so: 0, like: 0, er: 0, you_know: 0, other: 0 };

function zoneColor(total: number) {
  if (total >= 6) return { border: '#ef4444', text: '#dc2626' };
  if (total >= 3) return { border: '#f59e0b', text: '#b45309' };
  return { border: '#10b981', text: '#059669' };
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 80);
  } catch {
    // Web Audio unavailable — silently skip
  }
}

function TapButton({ label, count, onTap, onUndo }: { label: string; count: number; onTap: () => void; onUndo: () => void }) {
  const [pulsing, setPulsing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  function start() {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      onUndo();
      setPulsing(true);
      setTimeout(() => setPulsing(false), 150);
    }, 550);
  }
  function end() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!longPressed.current) {
      onTap();
      setPulsing(true);
      setTimeout(() => setPulsing(false), 150);
    }
  }

  return (
    <button
      onMouseDown={start} onMouseUp={end} onMouseLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
      onTouchStart={start} onTouchEnd={end}
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-100 text-xs font-medium text-surface-700 transition-transform ${pulsing ? 'scale-90' : 'scale-100'}`}
    >
      {label}
      <span className="font-bold text-surface-900 bg-white rounded-full px-1.5 border border-surface-200">{count}</span>
    </button>
  );
}

export default function AhCounterLive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [tallies, setTallies] = useState<Tally[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [speechAnalyses, setSpeechAnalyses] = useState<TmSpeechAnalysis[]>([]);
  const talliesRef = useRef<Tally[]>([]);
  talliesRef.current = tallies;

  useEffect(() => {
    if (!id) return;
    Promise.all([meetingsApi.get(id), ahCounterApi.list(id), speechAnalysisApi.listForMeeting(id)]).then(([m, existing, analyses]) => {
      setSpeechAnalyses(analyses);
      setMeeting(m);
      const byMember = new Map(existing.map((c) => [c.memberId, c]));
      const participants = new Map<string, Tally>();
      (m.roleAssignments ?? []).forEach((r) => {
        if (!r.member) return;
        const entry = participants.get(r.member.id) ?? {
          memberId: r.member.id, name: r.member.name, roles: [],
          counts: { ...ZERO_COUNTS },
        };
        entry.roles.push(TM_ROLE_LABELS[r.roleName] ?? r.roleName);
        const saved = byMember.get(r.member.id);
        if (saved) {
          TM_FILLER_WORDS.forEach((w) => { entry.counts[w] = (saved as any)[TM_FILLER_COUNT_KEY[w]] ?? 0; });
        }
        participants.set(r.member.id, entry);
      });
      setTallies([...participants.values()]);
    }).finally(() => setLoading(false));
  }, [id]);

  async function persist(silent = false) {
    if (!id || talliesRef.current.length === 0) return;
    try {
      await ahCounterApi.saveAll(id, talliesRef.current.map((t) => ({
        memberId: t.memberId,
        umCount: t.counts.um, uhCount: t.counts.uh, soCount: t.counts.so,
        likeCount: t.counts.like, erCount: t.counts.er, youKnowCount: t.counts.you_know, otherCount: t.counts.other,
      })));
      if (!silent) show('Ah Counter saved');
    } catch (err) {
      if (!silent) show(extractError(err), 'error');
    }
  }

  useEffect(() => {
    const interval = setInterval(() => persist(true), 30000);
    return () => clearInterval(interval);
  }, [id]);

  function useAiCounts(memberId: string, analysis: TmSpeechAnalysis) {
    const f = analysis.fillerWordCounts;
    setTallies((prev) => prev.map((t) => (
      t.memberId === memberId
        ? { ...t, counts: { um: f.um, uh: f.uh, so: f.so, like: f.like, er: f.er, you_know: f.you_know, other: t.counts.other } }
        : t
    )));
    show('AI filler counts applied — review and Save All when ready');
  }

  function adjust(memberId: string, word: string, delta: number) {
    if (delta > 0 && soundOn) beep();
    setTallies((prev) => prev.map((t) => (
      t.memberId === memberId
        ? { ...t, counts: { ...t.counts, [word]: Math.max(0, t.counts[word as keyof Counts] + delta) } }
        : t
    )));
  }

  async function resetAll() {
    if (!confirm('Reset all Ah Counter tallies for this meeting? This cannot be undone.')) return;
    setTallies((prev) => prev.map((t) => ({ ...t, counts: { ...ZERO_COUNTS } })));
    await persist(true);
    show('All tallies reset');
  }

  const grandTotal = useMemo(
    () => tallies.reduce((sum, t) => sum + TM_FILLER_WORDS.reduce((s, w) => s + t.counts[w], 0), 0),
    [tallies]
  );
  const mostCommon = useMemo(() => {
    const totals = TM_FILLER_WORDS.map((w) => ({ w, total: tallies.reduce((s, t) => s + t.counts[w], 0) }));
    const top = totals.sort((a, b) => b.total - a.total)[0];
    return top && top.total > 0 ? top : null;
  }, [tallies]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!meeting) return <p className="p-6 text-surface-500">Meeting not found.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <ToastContainer />
      <PageHeader
        title={`${meeting.title} — Ah Counter Live Tracker`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSoundOn((s) => !s)}>
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/toastmasters/${id}`)}>Back to Meeting</Button>
          </div>
        }
      />

      {meeting.wordOfDay && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-5 flex items-center gap-2">
          <Quote size={15} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Word of the Day: {meeting.wordOfDay}</span>
            {meeting.wordMeaning && ` — ${meeting.wordMeaning}`}
          </p>
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {tallies.map((t) => {
          const total = TM_FILLER_WORDS.reduce((s, w) => s + t.counts[w], 0);
          const zone = zoneColor(total);
          const analysis = speechAnalyses.find((a) => a.roleAssignment?.memberId === t.memberId);
          return (
            <div key={t.memberId} className="rounded-lg border-2 bg-white p-3" style={{ borderColor: zone.border }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-semibold text-sm text-surface-900">{t.name}</p>
                  <p className="text-xs text-surface-400">{t.roles.join(', ')}</p>
                </div>
                <span className="text-lg font-extrabold" style={{ color: zone.text }}>{total}</span>
              </div>
              {analysis && (
                <button
                  onClick={() => useAiCounts(t.memberId, analysis)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium py-1 mb-2"
                >
                  <Sparkles size={11} /> Use AI ({analysis.fillerWordCounts.total} detected)
                </button>
              )}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {TM_FILLER_WORDS.map((w) => (
                  <TapButton
                    key={w}
                    label={TM_FILLER_LABELS[w]}
                    count={t.counts[w]}
                    onTap={() => adjust(t.memberId, w, 1)}
                    onUndo={() => adjust(t.memberId, w, -1)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {tallies.length === 0 && (
          <p className="text-sm text-surface-400 italic">No members assigned to roles yet — assign roles first.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 px-6 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-5 text-sm">
          <span className="text-surface-700"><strong>{grandTotal}</strong> total fillers</span>
          {mostCommon && (
            <span className="text-surface-500">
              Most common: <strong className="text-surface-900">{TM_FILLER_LABELS[mostCommon.w]}</strong> ({mostCommon.total})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={resetAll}><RotateCcw size={13} /> Reset All</Button>
          <Button onClick={() => persist(false)}><Save size={13} /> Save All</Button>
        </div>
      </div>
    </div>
  );
}
