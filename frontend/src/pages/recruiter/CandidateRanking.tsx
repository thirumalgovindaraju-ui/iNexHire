// src/pages/recruiter/CandidateRanking.tsx — wired to real backend
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { StatusBadge, Spinner } from '../../components/ui';
import { reportsApi } from '../../services/api';

interface RankedReport {
  id: string;
  overallScore: number;
  recommendation: string;
  decision: string;
  skillScores: Record<string, number>;
  interview: {
    id: string;
    status: string;
    candidate: { id: string; name: string; opening: { title: string } };
  };
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7c4a'];

export default function CandidateRanking() {
  const [reports, setReports] = useState<RankedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsApi.list()
      .then((data: RankedReport[]) => setReports(data))
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Failed to load rankings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Candidate Ranking</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>All evaluated candidates across openings, ranked by AI overall score</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Trophy size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No evaluated candidates yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Once interviews are completed and scored, candidates will be ranked here.</div>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(reports.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {reports.slice(0, 3).map((r, i) => {
              const bg = i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : '#fff7ed';
              const border = i === 0 ? '#fde68a' : i === 1 ? '#e2e8f0' : '#fed7aa';
              return (
                <div key={r.id} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.06, lineHeight: 1 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: RANK_COLORS[i] + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.interview.candidate.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.interview.candidate.opening.title}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 700, color: RANK_COLORS[i] }}>{r.overallScore}</div>
                  </div>
                  <StatusBadge status={r.recommendation} />
                </div>
              );
            })}
          </div>

          {/* Full ranking table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={15} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Full Rankings — {reports.length} candidates</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Candidate', 'Opening', 'Score', 'Recommendation', 'Decision'].map((h) => (
                    <th key={h} style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', padding: '0 14px 10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? RANK_COLORS[i] : '#94a3b8' }}>#{i + 1}</span>
                    </td>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.interview.candidate.name}</div>
                    </td>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>{r.interview.candidate.opening.title}</td>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', fontSize: 15, fontWeight: 700, color: r.overallScore >= 80 ? '#10b981' : r.overallScore >= 60 ? '#f59e0b' : '#f43f5e' }}>{r.overallScore}</td>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}><StatusBadge status={r.recommendation} /></td>
                    <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}><StatusBadge status={r.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
