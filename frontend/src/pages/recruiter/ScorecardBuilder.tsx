// src/pages/recruiter/ScorecardBuilder.tsx — NEW: Custom Scorecard Builder
import { useState } from 'react';
import { Plus, Trash2, GripVertical, CheckSquare, Copy } from 'lucide-react';
import { Button } from '../../components/ui';

interface Criterion { id: string; name: string; weight: number; type: 'score' | 'pass_fail'; threshold?: number; description: string }

const DEFAULT_CRITERIA: Criterion[] = [
  { id: '1', name: 'Technical Depth', weight: 30, type: 'score', threshold: 70, description: 'Ability to explain technical concepts clearly' },
  { id: '2', name: 'Problem Solving', weight: 25, type: 'score', threshold: 65, description: 'Approach to breaking down complex problems' },
  { id: '3', name: 'Communication', weight: 20, type: 'score', threshold: 60, description: 'Clarity, structure and articulation of responses' },
  { id: '4', name: 'Culture Alignment', weight: 15, type: 'score', threshold: 55, description: 'Values alignment with company culture' },
  { id: '5', name: 'Notice Period ≤30d', weight: 0, type: 'pass_fail', description: 'Candidate must be available within 30 days' },
  { id: '6', name: 'Salary Expectation', weight: 10, type: 'score', threshold: 50, description: 'Within approved compensation band' },
];

const TEMPLATES = ['Software Engineer L4', 'Product Manager', 'Data Scientist', 'Sales Executive', 'Customer Success'];

export default function ScorecardBuilder() {
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [activeTemplate, setActiveTemplate] = useState('Software Engineer L4');
  const [saved, setSaved] = useState(false);

  function addCriterion() {
    setCriteria([...criteria, { id: Date.now().toString(), name: 'New Criterion', weight: 0, type: 'score', threshold: 60, description: '' }]);
  }

  function remove(id: string) { setCriteria(criteria.filter(c => c.id !== id)); }
  function update(id: string, field: string, value: any) { setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c)); }

  const totalWeight = criteria.filter(c => c.type === 'score').reduce((s, c) => s + c.weight, 0);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Scorecard Builder</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Define role-specific evaluation criteria, weights and pass/fail thresholds</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Copy size={13} />}>Use Template</Button>
          <Button icon={<CheckSquare size={14} />} onClick={() => setSaved(true)}>{saved ? '✓ Saved!' : 'Save Scorecard'}</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Templates sidebar */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Templates</div>
            {TEMPLATES.map(t => (
              <div key={t} onClick={() => setActiveTemplate(t)} style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 12,
                color: activeTemplate === t ? '#4f46e5' : '#334155',
                background: activeTemplate === t ? '#eef2ff' : 'transparent',
                borderLeft: activeTemplate === t ? '3px solid #4f46e5' : '3px solid transparent',
                fontWeight: activeTemplate === t ? 500 : 400,
              }}>{t}</div>
            ))}
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>Weight Summary</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: totalWeight === 100 ? '#10b981' : '#f43f5e' }}>{totalWeight}%</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{totalWeight === 100 ? '✓ Balanced' : 'Must equal 100%'}</div>
          </div>
        </div>

        {/* Criteria editor */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{activeTemplate}</div>
            <Button size="sm" variant="secondary" icon={<Plus size={12} />} onClick={addCriterion}>Add Criterion</Button>
          </div>
          <div style={{ padding: '14px 18px' }}>
            {criteria.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < criteria.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <GripVertical size={16} style={{ color: '#94a3b8', marginTop: 10, flexShrink: 0, cursor: 'grab' }} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <input
                      value={c.name}
                      onChange={e => update(c.id, 'name', e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 4, outline: 'none' }}
                    />
                    <input
                      value={c.description}
                      onChange={e => update(c.id, 'description', e.target.value)}
                      placeholder="Description..."
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', fontSize: 11.5, color: '#64748b', outline: 'none' }}
                    />
                  </div>
                  <select value={c.type} onChange={e => update(c.id, 'type', e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                    <option value="score">Scored</option>
                    <option value="pass_fail">Pass/Fail</option>
                  </select>
                  {c.type === 'score' ? (
                    <div style={{ textAlign: 'center' }}>
                      <input type="number" value={c.weight} onChange={e => update(c.id, 'weight', parseInt(e.target.value) || 0)} style={{ width: 56, border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>weight %</div>
                    </div>
                  ) : <div style={{ width: 56 }} />}
                  <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; }}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
