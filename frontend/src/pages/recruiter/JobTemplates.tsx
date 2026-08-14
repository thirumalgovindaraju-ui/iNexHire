// src/pages/recruiter/JobTemplates.tsx — wired to real backend
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutTemplate, IndianRupee, Sparkles } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { templatesApi, openingsApi } from '../../services/api';

interface JobTemplate {
  id: string;
  title: string;
  sector: string;
  level: string;
  skills: string[];
  jobDescription: string;
  sampleQuestions: string[];
  salaryMinLakhs: number;
  salaryMaxLakhs: number;
}

const SECTOR_LABELS: Record<string, string> = {
  IT_SERVICES: 'IT Services',
  BPO: 'BPO',
  BANKING: 'Banking',
  MANUFACTURING: 'Manufacturing',
  HEALTHCARE: 'Healthcare',
  RETAIL: 'Retail',
  TELECOM: 'Telecom',
};

const SECTOR_ORDER = ['IT_SERVICES', 'BPO', 'BANKING', 'MANUFACTURING', 'HEALTHCARE', 'RETAIL', 'TELECOM'];

const SECTOR_COLORS: Record<string, [string, string]> = {
  IT_SERVICES: ['#eef2ff', '#4f46e5'],
  BPO: ['#fffbeb', '#f59e0b'],
  BANKING: ['#ecfdf5', '#10b981'],
  MANUFACTURING: ['#fff7ed', '#ea580c'],
  HEALTHCARE: ['#fff1f2', '#f43f5e'],
  RETAIL: ['#f5f3ff', '#7c3aed'],
  TELECOM: ['#ecfeff', '#06b6d4'],
};

const LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];

export default function JobTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    templatesApi.list()
      .then((data: JobTemplate[]) => setTemplates(data))
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Failed to load job templates'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) =>
      (!q || t.title.toLowerCase().includes(q) || t.skills.some((s) => s.toLowerCase().includes(q))) &&
      (!sectorFilter || t.sector === sectorFilter) &&
      (!levelFilter || t.level === levelFilter)
    );
  }, [templates, search, sectorFilter, levelFilter]);

  const bySector = useMemo(() => {
    const map: Record<string, JobTemplate[]> = {};
    for (const t of filtered) {
      (map[t.sector] ??= []).push(t);
    }
    return map;
  }, [filtered]);

  async function useTemplate(templateId: string) {
    try {
      setCreatingId(templateId);
      setError(null);
      const data = await openingsApi.fromTemplate(templateId);
      navigate(`/openings/${data.opening.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create opening from template');
    } finally {
      setCreatingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Job Role Templates</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          Ready-made India-market job templates — pick one to instantly create a pre-filled opening with questions
        </p>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '7px 12px', flex: 1, border: '1px solid #e2e8f0' }}>
          <Search size={14} style={{ color: '#94a3b8' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or skill..."
            style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', flex: 1 }}
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Sectors</option>
          {SECTOR_ORDER.filter((s) => templates.some((t) => t.sector === s)).map((s) => (
            <option key={s} value={s}>{SECTOR_LABELS[s] ?? s}</option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <LayoutTemplate size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No templates match your filters</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Try clearing the search or filters above.</div>
        </div>
      ) : (
        SECTOR_ORDER.filter((sector) => bySector[sector]?.length).map((sector) => {
          const [bg, color] = SECTOR_COLORS[sector] ?? ['#f1f5f9', '#475569'];
          return (
            <div key={sector} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, background: bg, color, borderRadius: 6, padding: '3px 10px' }}>
                  {SECTOR_LABELS[sector] ?? sector}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{bySector[sector].length} templates</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {bySector[sector].map((t) => (
                  <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{t.title}</div>
                      <span style={{ fontSize: 9, fontWeight: 600, background: '#f1f5f9', color: '#475569', borderRadius: 5, padding: '2px 7px', flexShrink: 0, marginLeft: 8 }}>
                        {t.level}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12, flex: 1 }}>
                      {t.skills.slice(0, 4).map((s) => (
                        <span key={s} style={{ fontSize: 10.5, background: '#f8fafc', color: '#475569', borderRadius: 5, padding: '2px 7px', border: '1px solid #e2e8f0' }}>{s}</span>
                      ))}
                      {t.skills.length > 4 && (
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>+{t.skills.length - 4} more</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#334155', fontWeight: 500, marginBottom: 14 }}>
                      <IndianRupee size={12} style={{ color: '#94a3b8' }} />
                      {t.salaryMinLakhs}–{t.salaryMaxLakhs} LPA
                    </div>
                    <Button
                      icon={<Sparkles size={13} />}
                      onClick={() => useTemplate(t.id)}
                      loading={creatingId === t.id}
                      disabled={creatingId !== null}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
