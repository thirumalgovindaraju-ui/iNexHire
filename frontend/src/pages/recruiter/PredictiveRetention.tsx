// src/pages/recruiter/PredictiveRetention.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { apiClient, reportsApi } from '../../services/api';

interface CandidateOption {
  interviewId: string;
  candidateName: string;
  openingTitle: string;
  overallScore: number;
}

interface RiskFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface RetentionPrediction {
  retentionScore: number;
  flightRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: RiskFactor[];
  positiveFactors: string[];
  predictedTenure: string;
  summary: string;
}

const RISK_COLORS: Record<string, [string, string]> = {
  LOW: ['#ecfdf5', '#10b981'],
  MEDIUM: ['#fffbeb', '#f59e0b'],
  HIGH: ['#fff1f2', '#f43f5e'],
};

const SEVERITY_COLORS: Record<string, [string, string]> = {
  high: ['#fff1f2', '#f43f5e'],
  medium: ['#fffbeb', '#f59e0b'],
  low: ['#f0fdf4', '#10b981'],
};

export default function PredictiveRetention() {
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<RetentionPrediction | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaryRange, setSalaryRange] = useState('');

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

  const fetchPrediction = useCallback(async (interviewId: string) => {
    try {
      setLoadingPrediction(true);
      setError(null);
      const { data } = await apiClient.get(`/retention/${interviewId}`);
      setPrediction(data.prediction ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load retention prediction');
    } finally {
      setLoadingPrediction(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchPrediction(selectedId);
  }, [selectedId, fetchPrediction]);

  async function runAnalysis() {
    if (!selectedId) return;
    try {
      setRunning(true);
      setError(null);
      const { data } = await apiClient.post(`/retention/${selectedId}`, salaryRange ? { salaryRange } : {});
      setPrediction(data.prediction);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Prediction failed');
    } finally {
      setRunning(false);
    }
  }

  const [riskBg, riskColor] = RISK_COLORS[prediction?.flightRisk ?? 'MEDIUM'];

  if (loadingList) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Predictive Retention AI</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Claude forecasts flight risk and retention from the candidate's interview transcript</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 9, padding: '8px 16px' }}>
          <Brain size={15} style={{ color: '#7c3aed' }} />
          <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 500 }}>Powered by Claude</span>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <TrendingUp size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No evaluated interviews yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Once a candidate completes an interview and is scored, it'll show up here for retention prediction.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Context (optional)</div>
              <div style={{ padding: '14px 16px' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Salary Range Offered</label>
                <input
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. ₹18-24 LPA"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Evaluated Interviews</div>
              {candidates.map((c) => (
                <div key={c.interviewId} onClick={() => setSelectedId(c.interviewId)} style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  background: selectedId === c.interviewId ? '#fafafe' : 'transparent',
                  borderLeft: selectedId === c.interviewId ? '3px solid #4f46e5' : '3px solid transparent',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.candidateName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.openingTitle}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {loadingPrediction ? (
              <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={24} /></div>
            ) : !prediction ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Sparkles size={36} style={{ color: '#c4b5fd', margin: '0 auto 14px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No retention prediction yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>Run Claude over this candidate's transcript to forecast flight risk and retention.</div>
                <Button icon={<TrendingUp size={14} />} onClick={runAnalysis} loading={running}>
                  {running ? 'Predicting…' : 'Run Analysis'}
                </Button>
              </div>
            ) : (
              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Retention Forecast</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Predicted tenure: {prediction.predictedTenure}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 30, fontWeight: 700, color: prediction.retentionScore >= 80 ? '#10b981' : prediction.retentionScore >= 60 ? '#f59e0b' : '#f43f5e' }}>{prediction.retentionScore}%</div>
                    <span style={{ fontSize: 10, background: riskBg, color: riskColor, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{prediction.flightRisk} RISK</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>Risk Factors</span>
                    </div>
                    {prediction.riskFactors.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>No significant risk factors identified.</div>
                    ) : prediction.riskFactors.map((f, i) => {
                      const [bg, color] = SEVERITY_COLORS[f.severity] ?? SEVERITY_COLORS.medium;
                      return (
                        <div key={i} style={{ background: bg, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color }}>{f.factor}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{f.mitigation}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <CheckCircle size={13} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>Positive Factors</span>
                    </div>
                    {prediction.positiveFactors.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>None identified.</div>
                    ) : prediction.positiveFactors.map((f, i) => (
                      <div key={i} style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', marginBottom: 6, fontSize: 12, color: '#065f46' }}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
                  {prediction.summary}
                </div>

                <Button variant="secondary" icon={<TrendingUp size={14} />} onClick={runAnalysis} loading={running}>
                  Re-run Analysis
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
