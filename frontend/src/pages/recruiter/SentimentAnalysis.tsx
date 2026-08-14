// src/pages/recruiter/SentimentAnalysis.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, MessageSquare, Eye, Mic, ChevronLeft, BarChart3, Sparkles } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { apiClient, reportsApi } from '../../services/api';

interface CandidateOption {
  interviewId: string;
  candidateName: string;
  openingTitle: string;
  overallScore: number;
}

interface EmotionPoint {
  questionIndex: number;
  confidence: number;
  engagement: number;
  clarity: number;
  stress: number;
}

interface SentimentReport {
  confidence: number;
  engagement: number;
  clarity: number;
  stress: number;
  deceptionScore: number;
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  emotionTimeline: EmotionPoint[];
  summary: string;
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: 'width .8s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, width: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function SentimentAnalysis() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsApi.list()
      .then((reports: any[]) => {
        const opts: CandidateOption[] = reports.map((r) => ({
          interviewId: r.interview.id,
          candidateName: r.interview.candidate.name,
          openingTitle: r.interview.candidate.opening.title,
          overallScore: r.overallScore,
        }));
        setCandidates(opts);
        if (opts.length > 0) setSelectedId(opts[0].interviewId);
      })
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Failed to load evaluated interviews'))
      .finally(() => setLoadingList(false));
  }, []);

  const fetchReport = useCallback(async (interviewId: string) => {
    try {
      setLoadingReport(true);
      setError(null);
      const { data } = await apiClient.get(`/sentiment/${interviewId}`);
      setReport(data.report ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load sentiment report');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchReport(selectedId);
  }, [selectedId, fetchReport]);

  async function runAnalysis() {
    if (!selectedId) return;
    try {
      setRunning(true);
      setError(null);
      const { data } = await apiClient.post(`/sentiment/${selectedId}`);
      setReport(data.report);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Analysis failed');
    } finally {
      setRunning(false);
    }
  }

  const riskColor = (report?.deceptionScore ?? 0) >= 15 ? '#f43f5e' : (report?.deceptionScore ?? 0) >= 8 ? '#f59e0b' : '#10b981';
  const riskLabel = (report?.deceptionScore ?? 0) >= 15 ? 'High Risk' : (report?.deceptionScore ?? 0) >= 8 ? 'Review' : 'Low Risk';

  if (loadingList) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><ChevronLeft size={20} /></button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Sentiment & Emotion AI</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Speech pattern analysis — confidence, engagement, and integrity signals</p>
        </div>
        <div style={{ marginLeft: 'auto', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#5b21b6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain size={13} /> AI-Powered Analysis
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Brain size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No evaluated interviews yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Once a candidate completes an interview and is scored, it'll show up here for sentiment analysis.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Candidate list */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Evaluated Interviews</div>
            {candidates.map((c) => (
              <div key={c.interviewId} onClick={() => setSelectedId(c.interviewId)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selectedId === c.interviewId ? '#fafafe' : 'transparent',
                borderLeft: selectedId === c.interviewId ? '3px solid #4f46e5' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.candidateName}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.overallScore >= 80 ? '#10b981' : c.overallScore >= 60 ? '#f59e0b' : '#f43f5e' }}>{c.overallScore}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.openingTitle}</div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div>
            {loadingReport ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, display: 'flex', justifyContent: 'center' }}>
                <Spinner size={24} />
              </div>
            ) : !report ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 48, textAlign: 'center' }}>
                <Sparkles size={36} style={{ color: '#c4b5fd', margin: '0 auto 14px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No sentiment analysis yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>Run Claude over this candidate's interview transcript to get confidence, engagement, and integrity signals.</div>
                <Button icon={<Brain size={14} />} onClick={runAnalysis} loading={running}>
                  {running ? 'Analyzing…' : 'Run Analysis'}
                </Button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Confidence', value: report.confidence, color: '#4f46e5', icon: <TrendingUp size={14} /> },
                    { label: 'Engagement', value: report.engagement, color: '#10b981', icon: <Eye size={14} /> },
                    { label: 'Clarity', value: report.clarity, color: '#06b6d4', icon: <MessageSquare size={14} /> },
                    { label: 'Stress Index', value: report.stress, color: '#f59e0b', icon: <Mic size={14} /> },
                  ].map((m) => (
                    <div key={m.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: m.color }}>{m.icon}<span style={{ fontSize: 11, color: '#94a3b8' }}>{m.label}</span></div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.value}%</div>
                      <MiniBar value={m.value} color={m.color} />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Overall Sentiment</div>
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <div style={{
                        display: 'inline-block', fontSize: 14, fontWeight: 700, borderRadius: 20, padding: '6px 18px',
                        background: report.overallSentiment === 'POSITIVE' ? '#ecfdf5' : report.overallSentiment === 'NEGATIVE' ? '#fff1f2' : '#f8fafc',
                        color: report.overallSentiment === 'POSITIVE' ? '#10b981' : report.overallSentiment === 'NEGATIVE' ? '#f43f5e' : '#64748b',
                      }}>{report.overallSentiment}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, color: '#475569', lineHeight: 1.6, marginTop: 8 }}>
                      {report.summary}
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Integrity Signals</div>
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: riskColor + '18', border: `3px solid ${riskColor}`, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: riskColor }}>{report.deceptionScore}%</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: riskColor }}>{riskLabel}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Deception probability index</div>
                    </div>
                  </div>
                </div>

                {report.emotionTimeline.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Confidence Timeline (per question)</div>
                      <BarChart3 size={15} style={{ color: '#94a3b8' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                      {report.emotionTimeline.map((p, i) => {
                        const max = Math.max(...report!.emotionTimeline.map((x) => x.confidence), 1);
                        const h = (p.confidence / max) * 72;
                        const c = p.confidence >= 80 ? '#10b981' : p.confidence >= 60 ? '#4f46e5' : '#f59e0b';
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: '100%', height: h, background: c, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
                            <span style={{ fontSize: 9, color: '#94a3b8' }}>Q{p.questionIndex + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <Button variant="secondary" icon={<Brain size={14} />} onClick={runAnalysis} loading={running}>
                    Re-run Analysis
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
