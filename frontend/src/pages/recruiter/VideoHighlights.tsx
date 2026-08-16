// src/pages/recruiter/VideoHighlights.tsx — wired to real backend (transcript-based extraction, no video processing)
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Share2, Star, Film, AlertTriangle } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { interviewsApi, highlightsApi, extractError } from '../../services/api';

interface InterviewOption {
  id: string;
  status: string;
  candidate?: { name: string };
}

interface Highlight {
  id: string;
  type: 'STRONG_ANSWER' | 'CULTURE_FIT_MOMENT' | 'LEADERSHIP_SIGNAL' | 'RED_FLAG' | 'BEST_MOMENT';
  questionIndex: number;
  transcript: string;
  score: number;
  summary: string;
}

const TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  STRONG_ANSWER: { label: 'Strong Answer', bg: '#eef2ff', color: '#4f46e5' },
  CULTURE_FIT_MOMENT: { label: 'Culture Fit', bg: '#f0fdf4', color: '#10b981' },
  LEADERSHIP_SIGNAL: { label: 'Leadership', bg: '#f5f3ff', color: '#7c3aed' },
  RED_FLAG: { label: 'Red Flag', bg: '#fff1f2', color: '#f43f5e' },
  BEST_MOMENT: { label: 'Best Moment', bg: '#fffbeb', color: '#d97706' },
};

const FILTERS = ['ALL', 'STRONG_ANSWER', 'CULTURE_FIT_MOMENT', 'LEADERSHIP_SIGNAL', 'RED_FLAG', 'BEST_MOMENT'];

export default function VideoHighlights() {
  const [interviews, setInterviews] = useState<InterviewOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    interviewsApi.list({ limit: 100 })
      .then((data) => {
        const opts: InterviewOption[] = data.interviews ?? [];
        setInterviews(opts);
        if (opts.length > 0) setSelectedId(opts[0].id);
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoadingList(false));
  }, []);

  const loadHighlights = useCallback(async (interviewId: string) => {
    try {
      setLoadingHighlights(true);
      setError(null);
      const data = await highlightsApi.get(interviewId);
      setHighlights(data ?? []);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoadingHighlights(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) { setFilter('ALL'); loadHighlights(selectedId); }
  }, [selectedId, loadHighlights]);

  async function extract() {
    if (!selectedId) return;
    try {
      setExtracting(true);
      setError(null);
      const data = await highlightsApi.extract(selectedId);
      setHighlights(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setExtracting(false);
    }
  }

  // Generates a printable/saveable summary document — there's no hosting layer here,
  // so "share" means "produce a document you can save/print/attach", same pattern
  // used by the EPFO verification report export elsewhere in this app.
  function shareReel() {
    if (!highlights || highlights.length === 0) return;
    const candidate = interviews.find((i) => i.id === selectedId)?.candidate?.name ?? 'Candidate';
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Highlight Reel — ${candidate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            .clip { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
            .meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .type { font-size: 11px; font-weight: bold; border-radius: 4px; padding: 2px 8px; }
            .score { font-size: 13px; font-weight: bold; }
            .quote { font-size: 13px; color: #334155; font-style: italic; margin: 6px 0; }
            .summary { font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>AI Highlight Reel</h1>
          <div class="sub">${candidate} — generated from interview transcript, ${new Date().toLocaleString()}</div>
          ${highlights.map((h) => {
            const meta = TYPE_META[h.type];
            return `<div class="clip">
              <div class="meta">
                <span class="type" style="background:${meta.bg};color:${meta.color}">${meta.label} · Q${h.questionIndex + 1}</span>
                <span class="score">★ ${h.score}/100</span>
              </div>
              <div class="quote">"${h.transcript}"</div>
              <div class="summary">${h.summary}</div>
            </div>`;
          }).join('')}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  const filtered = (highlights ?? []).filter((h) => filter === 'ALL' || h.type === filter);

  if (loadingList) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>;
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>AI Video Highlights</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>AI identifies the best moments from each interview transcript — review in 60 seconds</p>
        </div>
        <Button icon={<Share2 size={14} />} variant="secondary" onClick={shareReel} disabled={!highlights || highlights.length === 0}>
          Share Highlight Reel
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
        <AlertTriangle size={14} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: '#4338ca' }}>
          NexHire records audio + transcripts, not video files — highlights are extracted from the interview transcript, not a video recording.
        </span>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {interviews.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Film size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No interviews yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Interview list */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Interviews</div>
            {interviews.map((i) => (
              <div key={i.id} onClick={() => setSelectedId(i.id)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selectedId === i.id ? '#fafafe' : 'transparent',
                borderLeft: selectedId === i.id ? '3px solid #4f46e5' : '3px solid transparent',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{i.candidate?.name ?? 'Unknown'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{i.status}</div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} style={{ color: '#4f46e5' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  Highlights {highlights ? `(${filtered.length})` : ''}
                </span>
              </div>
              <Button size="sm" icon={<Sparkles size={12} />} loading={extracting} onClick={extract}>
                {highlights && highlights.length > 0 ? 'Re-extract Highlights' : 'Extract Highlights'}
              </Button>
            </div>

            {highlights && highlights.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 18px', borderBottom: '1px solid #f1f5f9' }}>
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '4px 10px', border: '1px solid',
                      cursor: 'pointer',
                      borderColor: filter === f ? '#4f46e5' : '#e2e8f0',
                      background: filter === f ? '#4f46e5' : '#fff',
                      color: filter === f ? '#fff' : '#64748b',
                    }}
                  >
                    {f === 'ALL' ? 'All' : TYPE_META[f].label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: '12px 18px' }}>
              {loadingHighlights ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={22} /></div>
              ) : !highlights || highlights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 13 }}>
                  No highlights extracted yet for this interview. Click "Extract Highlights" to analyze the transcript.
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: 13 }}>No highlights match this filter.</div>
              ) : (
                filtered.map((h) => {
                  const meta = TYPE_META[h.type];
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px', borderRadius: 10, marginBottom: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, background: meta.bg, color: meta.color, borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{meta.label}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Question {h.questionIndex + 1}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', margin: '0 0 6px' }}>&ldquo;{h.transcript}&rdquo;</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{h.summary}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                          <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{h.score}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>significance</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
