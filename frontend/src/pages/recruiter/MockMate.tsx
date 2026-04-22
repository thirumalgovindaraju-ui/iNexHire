// src/pages/recruiter/MockMate.tsx — NEW: MockMate Candidate Prep Portal
import { Play, BookOpen, Star, Clock, CheckCircle, Users, Mic } from 'lucide-react';

const MOCK_SESSIONS = [
  { id: '1', title: 'Software Engineer Behavioral', questions: 10, avgScore: 78, completions: 2847, duration: '18 min', icon: '💼' },
  { id: '2', title: 'Product Manager Case Study', questions: 8, avgScore: 81, completions: 1620, duration: '22 min', icon: '📊' },
  { id: '3', title: 'Data Structures & Algorithms', questions: 5, avgScore: 72, completions: 3210, duration: '30 min', icon: '💻' },
  { id: '4', title: 'Leadership & Management', questions: 12, avgScore: 84, completions: 940, duration: '20 min', icon: '🎯' },
  { id: '5', title: 'Sales & Negotiation', questions: 9, avgScore: 79, completions: 770, duration: '17 min', icon: '🤝' },
  { id: '6', title: 'Customer Success', questions: 8, avgScore: 83, completions: 650, duration: '16 min', icon: '⭐' },
];

export default function MockMate() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>MockMate — Candidate Prep Portal</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Let candidates practice AI interviews before the real thing — reduces drop-off by 41%</p>
        </div>
        <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#065f46', fontWeight: 500 }}>
          ✓ Reduces candidate anxiety & drop-offs
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Practice Sessions', value: '10.2k', icon: <Mic size={16} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Avg Prep Score', value: '79%', icon: <Star size={16} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Drop-off Reduction', value: '41%', icon: <CheckCircle size={16} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Active Candidates', value: '1.8k', icon: <Users size={16} />, color: '#7c3aed', bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Session grid */}
      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Available Practice Tracks</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {MOCK_SESSIONS.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#818cf8'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{s.title}</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><BookOpen size={11} /> {s.questions} questions</span>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {s.duration}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} /> {s.completions.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{s.avgScore}% avg</span>
              </div>
              <button style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Play size={11} /> Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>Candidate Portal Link</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Share this link with candidates before their scheduled interview</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <code style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: '#4f46e5' }}>mi.nexhire.ai/mockmate</code>
          <button style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Copy Link</button>
        </div>
      </div>
    </div>
  );
}
