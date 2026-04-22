// src/pages/recruiter/CandidateRanking.tsx — NEW: AI Candidate Ranking Engine
import { useState } from 'react';
import { Trophy, Sliders, Download, ChevronUp, ChevronDown, Star, Zap } from 'lucide-react';
import { Button, StatusBadge } from '../../components/ui';

const CANDIDATES = [
  { rank: 1, name: 'Arjun Kapoor', role: 'Sr. Backend', ai_score: 93, culture: 91, technical: 95, communication: 88, resume_fit: 94, composite: 92, rec: 'STRONG_HIRE', trend: 'up' },
  { rank: 2, name: 'Sara Essel', role: 'Frontend Lead', ai_score: 91, culture: 88, technical: 90, communication: 94, resume_fit: 92, composite: 91, rec: 'STRONG_HIRE', trend: 'up' },
  { rank: 3, name: 'Priya Venkat', role: 'Product Manager', ai_score: 88, culture: 84, technical: 78, communication: 92, resume_fit: 88, composite: 86, rec: 'HIRE', trend: 'stable' },
  { rank: 4, name: 'Tom Bradley', role: 'ML Engineer', ai_score: 84, culture: 80, technical: 92, communication: 75, resume_fit: 86, composite: 83, rec: 'HIRE', trend: 'up' },
  { rank: 5, name: 'Marcus Reed', role: 'Sr. Backend', ai_score: 61, culture: 65, technical: 70, communication: 58, resume_fit: 60, composite: 63, rec: 'NEUTRAL', trend: 'down' },
  { rank: 6, name: 'David Johnson', role: 'ML Engineer', ai_score: 44, culture: 52, technical: 48, communication: 40, resume_fit: 42, composite: 45, rec: 'REJECT', trend: 'down' },
];

const DEFAULT_WEIGHTS = { ai_score: 30, culture: 20, technical: 25, communication: 15, resume_fit: 10 };

export default function CandidateRanking() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);

  const ranked = [...CANDIDATES].sort((a, b) => {
    const scoreA = Object.entries(weights).reduce((sum, [k, w]) => sum + (a[k as keyof typeof a] as number) * w / 100, 0);
    const scoreB = Object.entries(weights).reduce((sum, [k, w]) => sum + (b[k as keyof typeof b] as number) * w / 100, 0);
    return scoreB - scoreA;
  });

  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c4a'];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Candidate Ranking Engine</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>AI-ranked leaderboard with adjustable scoring weights per competency</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Sliders size={14} />} onClick={() => setShowWeights(!showWeights)}>Adjust Weights</Button>
          <Button variant="secondary" icon={<Download size={14} />}>Export Rankings</Button>
        </div>
      </div>

      {showWeights && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Scoring Weights — drag to adjust (total = 100%)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {Object.entries(weights).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: '#334155', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{val}%</span>
                </div>
                <input type="range" min={0} max={100} value={val}
                  onChange={e => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#4f46e5' }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Total: {Object.values(weights).reduce((a, b) => a + b, 0)}% {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && <span style={{ color: '#f43f5e' }}>(must equal 100%)</span>}</div>
        </div>
      )}

      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {ranked.slice(0, 3).map((c, i) => {
          const bg = i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : '#fff7ed';
          const border = i === 0 ? '#fde68a' : i === 1 ? '#e2e8f0' : '#fed7aa';
          return (
            <div key={c.name} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.06, lineHeight: 1 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: rankColors[i] + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 700, color: rankColors[i] }}>{c.composite}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <StatusBadge status={c.rec} />
                <span style={{ fontSize: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 7px', color: '#475569' }}>AI Score: {c.ai_score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full ranking table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={15} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Full Rankings — {ranked.length} candidates</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Candidate', 'AI Score', 'Culture', 'Technical', 'Communication', 'Resume Fit', 'Composite', 'Trend', 'Decision'].map(h => (
                <th key={h} style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', padding: '0 14px 10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((c, i) => (
              <tr key={c.name}>
                <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? rankColors[i] : '#94a3b8' }}>#{i + 1}</span>
                </td>
                <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.role}</div>
                </td>
                {(['ai_score', 'culture', 'technical', 'communication', 'resume_fit'] as const).map(k => {
                  const v = c[k] as number;
                  return <td key={k} style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f43f5e' }}>{v}</td>;
                })}
                <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', fontSize: 15, fontWeight: 700, color: c.composite >= 80 ? '#10b981' : c.composite >= 60 ? '#f59e0b' : '#f43f5e' }}>{c.composite}</td>
                <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}>
                  {c.trend === 'up' ? <ChevronUp size={16} style={{ color: '#10b981' }} /> : c.trend === 'down' ? <ChevronDown size={16} style={{ color: '#f43f5e' }} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9' }}><StatusBadge status={c.rec} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
