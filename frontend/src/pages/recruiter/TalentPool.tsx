// src/pages/recruiter/TalentPool.tsx — NEW: Talent Pool & Re-engagement
import { useState } from 'react';
import { Search, Database, Zap, Star, Mail, Filter } from 'lucide-react';
import { Button } from '../../components/ui';

const POOL = [
  { id: '1', name: 'Rajesh Patel', role: 'Sr. Backend Engineer', skills: ['Node.js', 'Go', 'PostgreSQL'], score: 87, lastActive: '3 months ago', status: 'available', match: 94 },
  { id: '2', name: 'Anita Rao', role: 'Product Manager', skills: ['Roadmapping', 'SQL', 'Figma'], score: 82, lastActive: '6 months ago', status: 'open', match: 88 },
  { id: '3', name: 'Tom Bradley', role: 'ML Engineer', skills: ['Python', 'TensorFlow', 'MLOps'], score: 91, lastActive: '1 month ago', status: 'available', match: 96 },
  { id: '4', name: 'Mei Lin', role: 'Frontend Lead', skills: ['React', 'TypeScript', 'Design Systems'], score: 89, lastActive: '2 months ago', status: 'open', match: 91 },
  { id: '5', name: 'Carlos Mendez', role: 'DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'AWS'], score: 78, lastActive: '4 months ago', status: 'available', match: 82 },
];

export default function TalentPool() {
  const [search, setSearch] = useState('');
  const filtered = POOL.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Talent Pool</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Re-engage past candidates who match your new openings</p>
        </div>
        <Button icon={<Zap size={14} />}>Auto-match to openings</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pool Size', value: '142', icon: <Database size={16} />, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'High Match (>85%)', value: '38', icon: <Star size={16} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Available Now', value: '61', icon: <Zap size={16} />, color: '#10b981', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '7px 12px', flex: 1, border: '1px solid #e2e8f0' }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search talent pool..." style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', flex: 1 }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <Filter size={14} /> Filter
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>{c.role}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {c.skills.map(s => (
                    <span key={s} style={{ fontSize: 10.5, background: '#f1f5f9', color: '#475569', borderRadius: 5, padding: '2px 7px', border: '1px solid #e2e8f0' }}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.match >= 90 ? '#10b981' : c.match >= 80 ? '#f59e0b' : '#475569' }}>{c.match}%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>match</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Active {c.lastActive}</div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4f46e5', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: 12 }}>
                  <Mail size={12} /> Re-engage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
