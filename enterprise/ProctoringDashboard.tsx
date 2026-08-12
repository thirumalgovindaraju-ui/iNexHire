// frontend/src/pages/recruiter/ProctoringDashboard.tsx
// REPLACE the existing VideoHighlights.tsx or add as new route

import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Eye, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui';

interface ProctoringFlag {
  type: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence?: string;
}

interface ProctoringReport {
  id: string;
  interviewId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: ProctoringFlag[];
  aiAnalysis: string;
  recommendation: 'CLEAN' | 'REVIEW' | 'ESCALATE' | 'VOID';
  snapshots: number;
  createdAt: string;
  interview: {
    id: string;
    candidate: { name: string; email: string };
    opening: { title: string };
  };
}

interface EventSummary { [key: string]: number }

const RISK_COLORS: Record<string, [string, string, string]> = {
  LOW:      ['#f0fdf4', '#15803d', '#bbf7d0'],
  MEDIUM:   ['#fffbeb', '#b45309', '#fde68a'],
  HIGH:     ['#fff7ed', '#c2410c', '#fed7aa'],
  CRITICAL: ['#fef2f2', '#b91c1c', '#fecaca'],
};

const SEV_COLORS: Record<string, string> = {
  critical: '#b91c1c', high: '#c2410c', medium: '#b45309', low: '#15803d',
};

const EVENT_LABELS: Record<string, string> = {
  TAB_SWITCH: 'Tab Switch', FACE_NOT_DETECTED: 'Face Not Detected',
  MULTIPLE_FACES: 'Multiple Faces', COPY_PASTE: 'Copy/Paste',
  FULLSCREEN_EXIT: 'Fullscreen Exit', MIC_MUTED: 'Mic Muted',
  AUDIO_ANOMALY: 'Audio Anomaly', LOOKING_AWAY: 'Looking Away',
  PHONE_DETECTED: 'Phone Detected', BACKGROUND_VOICE: 'Background Voice',
  SUSPICIOUS_PAUSE: 'Suspicious Pause',
};

export default function ProctoringDashboard() {
  const [flagged, setFlagged]           = useState<ProctoringReport[]>([]);
  const [selected, setSelected]         = useState<ProctoringReport | null>(null);
  const [eventSummary, setEventSummary] = useState<EventSummary>({});
  const [loading, setLoading]           = useState(true);
  const [analysing, setAnalysing]       = useState(false);
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [filter, setFilter]             = useState<string>('ALL');

  const fetchFlagged = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get('/proctoring');
      setFlagged(data.flagged ?? []);
      if (data.flagged?.length > 0 && !selected) setSelected(data.flagged[0]);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load proctoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlagged(); }, [fetchFlagged]);

  useEffect(() => {
    if (!selected) return;
    apiClient.get(`/proctoring/${selected.interviewId}`)
      .then(({ data }) => setEventSummary(data.eventSummary ?? {}))
      .catch(() => {});
  }, [selected]);

  async function runAnalysis(interviewId: string) {
    try {
      setAnalysing(true);
      setError(null);
      const { data } = await apiClient.post(`/proctoring/analyse/${interviewId}`);
      setFlagged(prev => {
        const exists = prev.find(f => f.interviewId === interviewId);
        if (exists) {
          return prev.map(f => f.interviewId === interviewId ? { ...f, ...data.report } : f);
        }
        return prev;
      });
      if (selected?.interviewId === interviewId) {
        setSelected(prev => prev ? { ...prev, ...data.report } : prev);
      }
      await fetchFlagged();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Analysis failed');
    } finally {
      setAnalysing(false);
    }
  }

  const filteredList = filter === 'ALL'
    ? flagged
    : flagged.filter(f => f.riskLevel === filter);

  const stats = {
    total: flagged.length,
    critical: flagged.filter(f => f.riskLevel === 'CRITICAL').length,
    high: flagged.filter(f => f.riskLevel === 'HIGH').length,
    medium: flagged.filter(f => f.riskLevel === 'MEDIUM').length,
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
      Loading proctoring data...
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            AI Proctoring Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Claude AI-powered malpractice detection across all interviews
          </p>
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={fetchFlagged}>Refresh</Button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '10px 14px', color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Flagged Interviews', value: stats.total, color: '#4f46e5', bg: '#eef2ff', icon: <Shield size={16}/> },
          { label: 'Critical Risk', value: stats.critical, color: '#b91c1c', bg: '#fef2f2', icon: <XCircle size={16}/> },
          { label: 'High Risk', value: stats.high, color: '#c2410c', bg: '#fff7ed', icon: <AlertTriangle size={16}/> },
          { label: 'Medium Risk', value: stats.medium, color: '#b45309', bg: '#fffbeb', icon: <Eye size={16}/> },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {flagged.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
          padding: 48, textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            No integrity issues detected
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            All completed interviews have passed proctoring checks.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Left: flagged list */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ALL','CRITICAL','HIGH','MEDIUM'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px',
                    border: 'none', cursor: 'pointer',
                    background: filter === f ? '#0f172a' : '#f1f5f9',
                    color: filter === f ? '#fff' : '#475569' }}>
                  {f}
                </button>
              ))}
            </div>
            {filteredList.map(f => {
              const [bg, fg] = RISK_COLORS[f.riskLevel] ?? RISK_COLORS.MEDIUM;
              const isActive = selected?.interviewId === f.interviewId;
              return (
                <div key={f.interviewId} onClick={() => setSelected(f)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                    background: isActive ? '#f8fafc' : '#fff',
                    borderLeft: `3px solid ${isActive ? '#4f46e5' : 'transparent'}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
                    {f.interview?.candidate?.name ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                    {f.interview?.opening?.title ?? 'Unknown Role'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6,
                      padding: '2px 8px', background: bg, color: fg }}>
                      {f.riskLevel}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      Score: {f.riskScore}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: detail view */}
          {selected && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    {selected.interview?.candidate?.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {selected.interview?.opening?.title} · {selected.interview?.candidate?.email}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(() => {
                    const [bg, fg] = RISK_COLORS[selected.riskLevel] ?? RISK_COLORS.MEDIUM;
                    return (
                      <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 8,
                        padding: '4px 12px', background: bg, color: fg }}>
                        {selected.riskLevel} RISK — {selected.riskScore}/100
                      </span>
                    );
                  })()}
                  <Button onClick={() => runAnalysis(selected.interviewId)} loading={analysing}>
                    Re-analyse
                  </Button>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                {/* Recommendation banner */}
                <div style={{ borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  background: selected.recommendation === 'CLEAN' ? '#f0fdf4'
                    : selected.recommendation === 'VOID' ? '#fef2f2'
                    : selected.recommendation === 'ESCALATE' ? '#fff7ed' : '#fffbeb',
                  border: `1px solid ${selected.recommendation === 'CLEAN' ? '#bbf7d0'
                    : selected.recommendation === 'VOID' ? '#fecaca'
                    : selected.recommendation === 'ESCALATE' ? '#fed7aa' : '#fde68a'}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
                    Recommendation: {selected.recommendation}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    {selected.recommendation === 'CLEAN' && 'No integrity issues detected. Interview results are reliable.'}
                    {selected.recommendation === 'REVIEW' && 'Some anomalies detected. A human reviewer should assess before making a hiring decision.'}
                    {selected.recommendation === 'ESCALATE' && 'Significant integrity concerns. Escalate to HR leadership before proceeding.'}
                    {selected.recommendation === 'VOID' && 'Strong evidence of malpractice. Consider voiding this interview and re-inviting the candidate under stricter conditions.'}
                  </div>
                </div>

                {/* Event summary */}
                {Object.keys(eventSummary).length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                      Event Summary
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(eventSummary).map(([type, count]) => (
                        <div key={type} style={{ background: '#f8fafc', borderRadius: 8,
                          padding: '6px 12px', fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{count}×</span>{' '}
                          {EVENT_LABELS[type] ?? type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Flags */}
                {selected.flags?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                      Detected Issues ({selected.flags.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selected.flags.map((flag, i) => (
                        <div key={i} style={{ borderRadius: 10, border: '1px solid #e2e8f0',
                          overflow: 'hidden' }}>
                          <div onClick={() => setExpanded(expanded === `${i}` ? null : `${i}`)}
                            style={{ padding: '10px 14px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 10,
                              background: '#f8fafc' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 4,
                              padding: '2px 6px', color: '#fff',
                              background: SEV_COLORS[flag.severity] ?? '#475569' }}>
                              {flag.severity.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', flex: 1 }}>
                              {EVENT_LABELS[flag.type] ?? flag.type}
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {new Date(flag.timestamp).toLocaleTimeString()}
                            </span>
                            {expanded === `${i}` ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </div>
                          {expanded === `${i}` && (
                            <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
                                {flag.description}
                              </div>
                              {flag.evidence && (
                                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                  Evidence: {flag.evidence}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {selected.aiAnalysis && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                      Claude AI Assessment
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px',
                      fontSize: 13, color: '#475569', lineHeight: 1.7,
                      border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>
                      {selected.aiAnalysis}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
