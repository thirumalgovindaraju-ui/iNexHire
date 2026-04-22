// src/pages/recruiter/SentimentAnalysis.tsx — NEW: Emotion & Sentiment AI
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, MessageSquare, Eye, Mic, ChevronLeft, BarChart3 } from 'lucide-react';

const CANDIDATES = [
  { id: '1', name: 'Arjun Kapoor', role: 'Sr. Backend Eng.', score: 93, confidence: 88, engagement: 92, clarity: 91, stress: 12, deception: 4, emotions: { happy: 42, neutral: 38, focused: 15, anxious: 5 }, sentiment_timeline: [65,70,72,80,85,88,90,93,91,95,88,92] },
  { id: '2', name: 'Priya Venkat', role: 'Product Manager', score: 88, confidence: 79, engagement: 85, clarity: 82, stress: 28, deception: 6, emotions: { happy: 35, neutral: 45, focused: 14, anxious: 6 }, sentiment_timeline: [55,60,65,70,72,75,80,82,79,85,83,88] },
  { id: '3', name: 'Marcus Reed', role: 'Sr. Backend Eng.', score: 61, confidence: 52, engagement: 58, clarity: 60, stress: 48, deception: 18, emotions: { happy: 20, neutral: 42, focused: 10, anxious: 28 }, sentiment_timeline: [40,38,45,50,48,55,52,58,50,62,58,61] },
];

const EMOTION_COLORS: Record<string, string> = { happy: '#10b981', neutral: '#94a3b8', focused: '#4f46e5', anxious: '#f59e0b' };

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

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const w = 100, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min + 1)) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

export default function SentimentAnalysis() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(CANDIDATES[0]);
  const [tab, setTab] = useState<'overview' | 'timeline' | 'signals'>('overview');

  const riskColor = selected.deception >= 15 ? '#f43f5e' : selected.deception >= 8 ? '#f59e0b' : '#10b981';
  const riskLabel = selected.deception >= 15 ? 'High Risk' : selected.deception >= 8 ? 'Review' : 'Low Risk';

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

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Candidate list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Analyzed Interviews</div>
          {CANDIDATES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              background: selected.id === c.id ? '#fafafe' : 'transparent',
              borderLeft: selected.id === c.id ? '3px solid #4f46e5' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.score >= 80 ? '#10b981' : c.score >= 60 ? '#f59e0b' : '#f43f5e' }}>{c.score}</div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{c.role}</div>
              <SparkLine data={c.sentiment_timeline} color={c.score >= 80 ? '#10b981' : c.score >= 60 ? '#f59e0b' : '#f43f5e'} />
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Confidence', value: selected.confidence, color: '#4f46e5', icon: <TrendingUp size={14} /> },
              { label: 'Engagement', value: selected.engagement, color: '#10b981', icon: <Eye size={14} /> },
              { label: 'Clarity', value: selected.clarity, color: '#06b6d4', icon: <MessageSquare size={14} /> },
              { label: 'Stress Index', value: selected.stress, color: '#f59e0b', icon: <Mic size={14} /> },
            ].map(m => (
              <div key={m.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: m.color }}>{m.icon}<span style={{ fontSize: 11, color: '#94a3b8' }}>{m.label}</span></div>
                <div style={{ fontSize: 24, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.value}%</div>
                <MiniBar value={m.value} color={m.color} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Emotion breakdown */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Emotion Breakdown</div>
              {Object.entries(selected.emotions).map(([emotion, pct]) => (
                <div key={emotion} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#334155', textTransform: 'capitalize' }}>{emotion}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</span>
                  </div>
                  <MiniBar value={pct} color={EMOTION_COLORS[emotion] ?? '#94a3b8'} />
                </div>
              ))}
            </div>

            {/* Integrity signals */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Integrity Signals</div>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: riskColor + '18', border: `3px solid ${riskColor}`, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: riskColor }}>{selected.deception}%</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: riskColor }}>{riskLabel}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Deception probability index</div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                <strong>AI Note:</strong> {selected.deception >= 15
                  ? 'Elevated inconsistency in responses detected. Manual review of answers 3, 7, and 11 recommended.'
                  : selected.deception >= 8
                  ? 'Minor inconsistencies noted. Standard review recommended before decision.'
                  : 'No significant integrity concerns detected. Candidate shows consistent and confident responses.'}
              </div>
            </div>
          </div>

          {/* Sentiment timeline */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Sentiment Timeline (per question)</div>
              <BarChart3 size={15} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {selected.sentiment_timeline.map((v, i) => {
                const max = Math.max(...selected.sentiment_timeline);
                const h = (v / max) * 72;
                const c = v >= 80 ? '#10b981' : v >= 60 ? '#4f46e5' : '#f59e0b';
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: h, background: c, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>Q{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
