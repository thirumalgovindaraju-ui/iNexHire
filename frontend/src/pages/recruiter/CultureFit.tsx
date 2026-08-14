// src/pages/recruiter/CultureFit.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { apiClient, reportsApi } from '../../services/api';

interface CandidateOption {
  interviewId: string;
  candidateName: string;
  openingTitle: string;
  overallScore: number;
}

interface CultureFitScore {
  overall: number;
  dimensions: Record<string, { score: number; evidence: string }>;
  summary: string;
  recommendation: 'STRONG_FIT' | 'FIT' | 'NEUTRAL' | 'POOR_FIT';
}

const REC_COLORS: Record<string, [string, string]> = {
  STRONG_FIT: ['#ecfdf5', '#10b981'],
  FIT: ['#eef2ff', '#4f46e5'],
  NEUTRAL: ['#fffbeb', '#f59e0b'],
  POOR_FIT: ['#fff1f2', '#f43f5e'],
};

export default function CultureFit() {
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState<CultureFitScore | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensionsInput, setDimensionsInput] = useState('');
  const [companyValues, setCompanyValues] = useState('');

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

  const fetchScore = useCallback(async (interviewId: string) => {
    try {
      setLoadingScore(true);
      setError(null);
      const { data } = await apiClient.get(`/culture-fit/${interviewId}`);
      setScore(data.score ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load culture fit score');
    } finally {
      setLoadingScore(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchScore(selectedId);
  }, [selectedId, fetchScore]);

  async function runAnalysis() {
    if (!selectedId) return;
    try {
      setRunning(true);
      setError(null);
      const cultureDimensions = dimensionsInput.split(',').map((d) => d.trim()).filter(Boolean);
      const { data } = await apiClient.post(`/culture-fit/${selectedId}`, { cultureDimensions, companyValues });
      setScore(data.score);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Analysis failed');
    } finally {
      setRunning(false);
    }
  }

  const [recBg, recColor] = REC_COLORS[score?.recommendation ?? ''] ?? REC_COLORS.NEUTRAL;

  if (loadingList) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Culture Fit Scoring</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Claude evaluates values alignment from the candidate's interview transcript</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Heart size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No evaluated interviews yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Once a candidate completes an interview and is scored, it'll show up here for culture fit scoring.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          {/* Config + candidate list */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Culture Config</div>
              <div style={{ padding: '14px 16px' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Dimensions (comma-separated)</label>
                <input
                  value={dimensionsInput}
                  onChange={(e) => setDimensionsInput(e.target.value)}
                  placeholder="Innovation, Collaboration, Ownership..."
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', marginBottom: 10 }}
                />
                <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Company Values</label>
                <input
                  value={companyValues}
                  onChange={(e) => setCompanyValues(e.target.value)}
                  placeholder="e.g. Customer obsession, ownership..."
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' }}
                />
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 8 }}>Leave blank to use Claude's default hiring dimensions.</div>
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

          {/* Result panel */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {loadingScore ? (
              <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={24} /></div>
            ) : !score ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Sparkles size={36} style={{ color: '#c4b5fd', margin: '0 auto 14px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No culture fit score yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>Run Claude over this candidate's transcript to score alignment with your culture dimensions.</div>
                <Button icon={<Heart size={14} />} onClick={runAnalysis} loading={running}>
                  {running ? 'Analyzing…' : 'Run Analysis'}
                </Button>
              </div>
            ) : (
              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Culture Fit Result</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, background: recBg, color: recColor, borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>{score.recommendation.replace('_', ' ')}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: score.overall >= 85 ? '#10b981' : score.overall >= 70 ? '#f59e0b' : '#f43f5e' }}>{score.overall}%</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Object.keys(score.dimensions).length, 5) || 1}, 1fr)`, gap: 10, marginBottom: 16 }}>
                  {Object.entries(score.dimensions).map(([name, d]) => {
                    const color = d.score >= 85 ? '#10b981' : d.score >= 70 ? '#4f46e5' : '#f59e0b';
                    return (
                      <div key={name} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '10px 6px' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 3 }}>{d.score}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>{name}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {Object.entries(score.dimensions).map(([name, d]) => (
                    <div key={name} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                      <strong style={{ color: '#334155' }}>{name}:</strong> {d.evidence}
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#065f46', lineHeight: 1.6, marginBottom: 16 }}>
                  {score.summary}
                </div>

                <Button variant="secondary" icon={<Heart size={14} />} onClick={runAnalysis} loading={running}>
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
