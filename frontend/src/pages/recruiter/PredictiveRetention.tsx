// src/pages/recruiter/PredictiveRetention.tsx — NEW: Predictive Retention AI
import { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Brain, Target, BookOpen, ChevronRight } from 'lucide-react';

const CANDIDATES = [
  {
    name: 'Arjun Kapoor', role: 'Sr. Backend Eng.', retentionScore: 91,
    riskLevel: 'low', prediction: '18+ months',
    factors: [
      { label: 'Career growth alignment', score: 94, positive: true },
      { label: 'Salary satisfaction', score: 88, positive: true },
      { label: 'Culture fit', score: 91, positive: true },
      { label: 'Commute/remote preference', score: 82, positive: true },
      { label: 'Team dynamics match', score: 90, positive: true },
    ],
    skillGaps: ['Kubernetes', 'Go lang'],
    learningPath: ['AWS Certified Solutions Architect', 'System Design Masterclass'],
  },
  {
    name: 'Priya Venkat', role: 'Product Manager', retentionScore: 72,
    riskLevel: 'medium', prediction: '10–14 months',
    factors: [
      { label: 'Career growth alignment', score: 78, positive: true },
      { label: 'Salary satisfaction', score: 65, positive: false },
      { label: 'Culture fit', score: 84, positive: true },
      { label: 'Commute/remote preference', score: 58, positive: false },
      { label: 'Team dynamics match', score: 75, positive: true },
    ],
    skillGaps: ['SQL Advanced', 'Data Analytics'],
    learningPath: ['Product Analytics with Amplitude', 'SQL for PMs'],
  },
  {
    name: 'Marcus Reed', role: 'Sr. Backend Eng.', retentionScore: 44,
    riskLevel: 'high', prediction: '4–7 months',
    factors: [
      { label: 'Career growth alignment', score: 42, positive: false },
      { label: 'Salary satisfaction', score: 38, positive: false },
      { label: 'Culture fit', score: 65, positive: true },
      { label: 'Commute/remote preference', score: 55, positive: false },
      { label: 'Team dynamics match', score: 48, positive: false },
    ],
    skillGaps: ['React', 'TypeScript', 'GraphQL'],
    learningPath: ['React Advanced Patterns', 'TypeScript Deep Dive'],
  },
];

const RISK_COLORS: Record<string, [string, string, string]> = {
  low: ['#ecfdf5', '#10b981', 'Low Risk'],
  medium: ['#fffbeb', '#f59e0b', 'Medium Risk'],
  high: ['#fff1f2', '#f43f5e', 'High Risk'],
};

export default function PredictiveRetention() {
  const [selected, setSelected] = useState(CANDIDATES[0]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Predictive Retention AI</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Forecasts 90-day+ post-hire retention, skill gaps, and personalized learning paths</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 9, padding: '8px 16px' }}>
          <Brain size={15} style={{ color: '#7c3aed' }} />
          <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 500 }}>Powered by NexHire PredictIQ™</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Avg Retention Score', value: '69%', sub: 'across evaluated candidates', color: '#4f46e5', bg: '#eef2ff', icon: <TrendingUp size={16} /> },
          { label: 'High Retention (>80%)', value: '3', sub: 'candidates predicted to stay 12+ months', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={16} /> },
          { label: 'At-Risk Hires', value: '1', sub: 'below 50% — compensation review needed', color: '#f43f5e', bg: '#fff1f2', icon: <AlertTriangle size={16} /> },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color, marginBottom: 3 }}>{c.value}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Candidate list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Evaluated Candidates</div>
          {CANDIDATES.map(c => {
            const [bg, color, label] = RISK_COLORS[c.riskLevel];
            const isActive = selected.name === c.name;
            return (
              <div key={c.name} onClick={() => setSelected(c)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: isActive ? '#fafafe' : 'transparent',
                borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c.retentionScore >= 80 ? '#10b981' : c.retentionScore >= 60 ? '#f59e0b' : '#f43f5e' }}>{c.retentionScore}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, background: bg, color, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>~{c.prediction}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Retention breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selected.name} — Retention Factors</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Predicted tenure: {selected.prediction}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: selected.retentionScore >= 80 ? '#10b981' : selected.retentionScore >= 60 ? '#f59e0b' : '#f43f5e' }}>{selected.retentionScore}%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Retention Score</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.factors.map(f => (
                <div key={f.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 12, color: f.positive ? '#10b981' : '#f43f5e' }}>{f.positive ? '▲' : '▼'}</span>
                      <span style={{ fontSize: 12.5, color: '#334155' }}>{f.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: f.score >= 70 ? '#10b981' : f.score >= 50 ? '#f59e0b' : '#f43f5e' }}>{f.score}%</span>
                  </div>
                  <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.score}%`, background: f.score >= 70 ? '#10b981' : f.score >= 50 ? '#f59e0b' : '#f43f5e', borderRadius: 3, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Skill gaps */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Target size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Skill Gaps Detected</span>
              </div>
              {selected.skillGaps.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 6 }}>
                  <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
              {selected.riskLevel === 'high' && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#f43f5e', background: '#fff1f2', borderRadius: 8, padding: '8px 10px', border: '1px solid #fecaca' }}>
                  ⚠ Compensation below market rate — renegotiation may reduce churn risk
                </div>
              )}
            </div>

            {/* Learning path */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BookOpen size={14} style={{ color: '#4f46e5' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>AI Learning Path</span>
              </div>
              {selected.learningPath.map((l, i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#3730a3', fontWeight: 500, flex: 1 }}>{l}</span>
                  <ChevronRight size={12} style={{ color: '#818cf8' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
