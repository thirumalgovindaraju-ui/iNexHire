// src/pages/recruiter/TalentPool.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { Search, Database, Zap, Mail } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { apiClient } from '../../services/api';

interface TalentPoolEntry {
  id: string;
  candidateId: string;
  status: string;
  addedAt: string;
  lastContact: string | null;
  notes: string | null;
  candidate: { name: string; email: string; phone: string | null };
}

const STATUS_COLORS: Record<string, [string, string]> = {
  AVAILABLE: ['#ecfdf5', '#10b981'],
  OPEN: ['#fffbeb', '#f59e0b'],
  PLACED: ['#eef2ff', '#4f46e5'],
  INACTIVE: ['#f8fafc', '#94a3b8'],
};

export default function TalentPool() {
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get('/talent-pool');
      setEntries(data.entries ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load talent pool');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = entries.filter((e) =>
    e.candidate.name.toLowerCase().includes(search.toLowerCase()) ||
    e.candidate.email.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = entries.filter((e) => e.status === 'AVAILABLE').length;
  const openCount = entries.filter((e) => e.status === 'OPEN').length;

  if (loading) {
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Talent Pool</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Past candidates kept on file for future openings</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pool Size', value: String(entries.length), icon: <Database size={16} />, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Available', value: String(availableCount), icon: <Zap size={16} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Open to Offers', value: String(openCount), icon: <Zap size={16} />, color: '#f59e0b', bg: '#fffbeb' },
        ].map((s) => (
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search talent pool..." style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', flex: 1 }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Database size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
              {entries.length === 0 ? 'Talent pool is empty' : 'No matches'}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {entries.length === 0
                ? 'Candidates you add to the talent pool from their profile will appear here.'
                : 'Try a different search term.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((e) => {
              const [bg, color] = STATUS_COLORS[e.status] ?? STATUS_COLORS.INACTIVE;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                    {e.candidate.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{e.candidate.name}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{e.candidate.email}</div>
                    {e.notes && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>{e.notes}</div>}
                  </div>
                  <span style={{ fontSize: 10, background: bg, color, borderRadius: 6, padding: '3px 9px', fontWeight: 500, flexShrink: 0 }}>{e.status}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                      Added {new Date(e.addedAt).toLocaleDateString()}
                    </div>
                    <a href={`mailto:${e.candidate.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#4f46e5', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: 12, textDecoration: 'none' }}>
                      <Mail size={12} /> Contact
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
