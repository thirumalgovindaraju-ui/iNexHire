// src/pages/recruiter/CultureFit.tsx — NEW: Culture Fit Scoring
import { useState } from 'react';
import { Heart, Settings, Plus, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui';

const DIMENSIONS = [
  { id: 'innovation', label: 'Innovation Mindset', desc: 'Embraces change and new ideas', weight: 20 },
  { id: 'collab', label: 'Collaboration', desc: 'Works well with cross-functional teams', weight: 25 },
  { id: 'ownership', label: 'Ownership', desc: 'Takes responsibility for outcomes', weight: 20 },
  { id: 'customer', label: 'Customer Focus', desc: 'Puts customer needs first', weight: 15 },
  { id: 'growth', label: 'Growth Mindset', desc: 'Seeks continuous learning', weight: 20 },
];

const CANDIDATES = [
  { name: 'Arjun Kapoor', role: 'Sr. Backend', overall: 91, scores: { innovation: 88, collab: 94, ownership: 92, customer: 87, growth: 95 } },
  { name: 'Priya Venkat', role: 'Product Manager', overall: 84, scores: { innovation: 90, collab: 86, ownership: 80, customer: 88, growth: 78 } },
  { name: 'Sara Essel', role: 'Frontend Lead', overall: 88, scores: { innovation: 85, collab: 92, ownership: 88, customer: 91, growth: 86 } },
];

export default function CultureFit() {
  const [editMode, setEditMode] = useState(false);
  const [dims, setDims] = useState(DIMENSIONS);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Culture Fit Scoring</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>AI evaluates values alignment against your company culture dimensions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Settings size={14} />} onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Save Dimensions' : 'Edit Dimensions'}
          </Button>
          <Button icon={<Plus size={14} />}>Add Dimension</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Dimensions config */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Culture Dimensions</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Weights must total 100%</div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {dims.map((d, i) => (
                <div key={d.id} style={{ padding: '10px 0', borderBottom: i < dims.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{d.label}</span>
                    {editMode ? (
                      <input
                        type="number"
                        value={d.weight}
                        onChange={e => setDims(dims.map((dim, j) => j === i ? { ...dim, weight: parseInt(e.target.value) || 0 } : dim))}
                        style={{ width: 48, border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 6px', fontSize: 12, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, background: '#eef2ff', borderRadius: 9, padding: '1px 8px' }}>{d.weight}%</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#065f46', lineHeight: 1.6 }}>
            <strong>How it works:</strong> AI analyzes candidate responses for evidence of each dimension using behavioral indicators and keyword patterns tied to your company values.
          </div>
        </div>

        {/* Candidate results */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Candidate Culture Scores</div>
          <div style={{ padding: '16px 18px' }}>
            {CANDIDATES.map((c, ci) => (
              <div key={ci} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: ci < CANDIDATES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: 14, fontWeight: 600 }}>{c.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.role}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: c.overall >= 85 ? '#10b981' : c.overall >= 70 ? '#f59e0b' : '#f43f5e' }}>{c.overall}%</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>culture fit</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {dims.map(d => {
                    const score = c.scores[d.id as keyof typeof c.scores];
                    const color = score >= 85 ? '#10b981' : score >= 70 ? '#4f46e5' : '#f59e0b';
                    return (
                      <div key={d.id} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 4px' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 2 }}>{score}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.3 }}>{d.label.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
