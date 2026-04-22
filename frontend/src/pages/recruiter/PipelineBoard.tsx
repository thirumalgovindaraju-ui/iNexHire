// src/pages/recruiter/PipelineBoard.tsx — NEW: Kanban Pipeline Board
import { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';

const COLUMNS = [
  { id: 'sourced', label: 'Sourced', color: '#94a3b8', count: 12 },
  { id: 'invited', label: 'Interview Invited', color: '#818cf8', count: 8 },
  { id: 'completed', label: 'Interview Done', color: '#7c3aed', count: 6 },
  { id: 'evaluated', label: 'AI Evaluated', color: '#10b981', count: 5 },
  { id: 'offer', label: 'Offer Extended', color: '#f59e0b', count: 2 },
  { id: 'hired', label: 'Hired', color: '#4f46e5', count: 1 },
];

const CARDS: Record<string, { name: string; role: string; score?: number }[]> = {
  sourced: [
    { name: 'Alex Chen', role: 'ML Engineer' },
    { name: 'Nadia Patel', role: 'Product Manager' },
    { name: 'Omar Hassan', role: 'Backend Engineer' },
  ],
  invited: [
    { name: 'Fatima Al-Mansour', role: 'Frontend Lead' },
    { name: 'Ling Wei', role: 'Data Analyst' },
  ],
  completed: [
    { name: 'Marcus Reed', role: 'Sr. Backend', score: 61 },
    { name: 'Sophie Turner', role: 'ML Engineer', score: 79 },
  ],
  evaluated: [
    { name: 'Priya Venkat', role: 'Product Manager', score: 88 },
    { name: 'James Liu', role: 'DevOps', score: 74 },
  ],
  offer: [
    { name: 'Arjun Kapoor', role: 'Sr. Backend', score: 93 },
  ],
  hired: [
    { name: 'Sara Essel', role: 'Frontend Lead', score: 91 },
  ],
};

export default function PipelineBoard() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Pipeline Board</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Drag candidates across hiring stages</p>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{ width: 220, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{col.label}</span>
              </div>
              <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', borderRadius: 9, padding: '1px 7px' }}>{col.count}</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 8, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(CARDS[col.id] ?? []).map(c => (
                <div key={c.name} style={{
                  background: '#fff', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid #e2e8f0', cursor: 'grab',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: c.score != null ? 8 : 0 }}>{c.role}</div>
                  {c.score != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ height: 4, flex: 1, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.score}%`, background: c.score >= 80 ? '#10b981' : c.score >= 60 ? '#f59e0b' : '#f43f5e', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: c.score >= 80 ? '#10b981' : c.score >= 60 ? '#f59e0b' : '#f43f5e', width: 24, textAlign: 'right' }}>{c.score}</span>
                    </div>
                  )}
                </div>
              ))}
              <button style={{ background: 'none', border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
