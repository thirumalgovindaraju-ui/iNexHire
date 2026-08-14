// src/pages/recruiter/Compliance.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, FileText, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/api';

interface BiasFlag {
  type: string;
  word: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

interface BiasAudit {
  id: string;
  openingId: string;
  flags: BiasFlag[];
  score: number;
  resolvedAt: string | null;
  createdAt: string;
}

interface OpeningOption {
  id: string;
  title: string;
}

interface OpeningRow {
  openingId: string;
  openingTitle: string;
  audit: BiasAudit | null;
}

const SEV_COLORS: Record<string, [string, string]> = {
  high:   ['#fff1f2', '#f43f5e'],
  medium: ['#fffbeb', '#f59e0b'],
  low:    ['#f0fdf4', '#10b981'],
};

export default function Compliance() {
  const [openings, setOpenings]     = useState<OpeningOption[]>([]);
  const [audits, setAudits]         = useState<BiasAudit[]>([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [scanning, setScanning]     = useState(false);
  const [resolving, setResolving]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Load all org openings + any existing audits ──────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [openingsRes, auditsRes] = await Promise.all([
        apiClient.get('/openings', { params: { limit: 100 } }),
        apiClient.get('/compliance'),
      ]);
      const openingOptions: OpeningOption[] = (openingsRes.data.openings ?? []).map((o: any) => ({
        id: o.id,
        title: o.title,
      }));
      setOpenings(openingOptions);
      setAudits(auditsRes.data.audits ?? []);
      setSelectedOpeningId((prev) => prev ?? openingOptions[0]?.id ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Trigger a new scan for the selected opening ───────────────────────────
  async function runScan() {
    if (!selectedOpeningId) return;
    try {
      setScanning(true);
      setError(null);
      const { data } = await apiClient.post(`/compliance/${selectedOpeningId}`, {
        scanType: 'jd',
      });
      setAudits((prev) => {
        const withoutThis = prev.filter((a) => a.openingId !== selectedOpeningId);
        return [...withoutThis, data.audit];
      });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  // ── Mark selected audit as resolved ───────────────────────────────────────
  async function resolveAudit() {
    if (!selectedOpeningId) return;
    try {
      setResolving(true);
      const { data } = await apiClient.patch(`/compliance/${selectedOpeningId}/resolve`);
      setAudits((prev) =>
        prev.map((a) => (a.openingId === selectedOpeningId ? { ...a, resolvedAt: data.audit.resolvedAt } : a))
      );
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  }

  // ── Merge every opening with its audit, if any ────────────────────────────
  const rows: OpeningRow[] = openings.map((o) => ({
    openingId: o.id,
    openingTitle: o.title,
    audit: audits.find((a) => a.openingId === o.id) ?? null,
  }));
  const selectedRow = rows.find((r) => r.openingId === selectedOpeningId) ?? null;

  // ── Derived summary stats (scanned openings only) ─────────────────────────
  const scanned      = rows.filter((r) => r.audit);
  const totalFlags   = scanned.reduce((s, r) => s + (r.audit!.flags?.length ?? 0), 0);
  const cleanCount   = scanned.filter((r) => (r.audit!.flags?.length ?? 0) === 0).length;
  const avgScore     = scanned.length
    ? Math.round(scanned.reduce((s, r) => s + r.audit!.score, 0) / scanned.length)
    : 100;

  const S = {
    page: { padding: '24px 28px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' } as React.CSSProperties,
  };

  if (loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading compliance data…</div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
            Compliance & Bias Detection
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Claude AI-powered job description analysis for inclusive hiring
          </p>
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={runScan} loading={scanning} disabled={!selectedOpeningId}>
          {scanning ? 'Scanning…' : 'Run Scan'}
        </Button>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'JDs Scanned',      value: String(scanned.length), icon: <FileText size={16} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Bias Flags',       value: String(totalFlags),     icon: <AlertTriangle size={16} />, color: '#f43f5e', bg: '#fff1f2' },
          { label: 'Clean JDs',        value: String(cleanCount),     icon: <CheckCircle size={16} />,  color: '#10b981', bg: '#ecfdf5' },
          { label: 'Avg. Compliance',  value: `${avgScore}%`,         icon: <Shield size={16} />,       color: '#7c3aed', bg: '#f5f3ff' },
        ].map((c) => (
          <div key={c.label} style={{ ...S.card, padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 10 }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {openings.length === 0 ? (
        <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
          <Shield size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No job openings yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Create a job opening first, then come back here to scan its description for bias.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          {/* Opening list — every org opening, scanned or not */}
          <div style={S.card}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              Job Descriptions
            </div>
            <div>
              {rows.map((r) => {
                const flagCount = r.audit?.flags?.length ?? 0;
                const isActive  = selectedOpeningId === r.openingId;
                return (
                  <div
                    key={r.openingId}
                    onClick={() => setSelectedOpeningId(r.openingId)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 16px', cursor: 'pointer', fontSize: 13,
                      background: isActive ? '#f5f3ff' : 'transparent',
                      color: isActive ? '#4f46e5' : '#334155',
                      borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                    }}
                  >
                    <span style={{ fontWeight: isActive ? 500 : 400 }}>{r.openingTitle}</span>
                    {!r.audit ? (
                      <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 9, borderRadius: 9, padding: '2px 6px', fontWeight: 500 }}>NOT SCANNED</span>
                    ) : flagCount > 0 ? (
                      <span style={{ background: '#fff1f2', color: '#f43f5e', fontSize: 9, borderRadius: 9, padding: '2px 6px', fontWeight: 500 }}>{flagCount} flags</span>
                    ) : (
                      <CheckCircle size={13} style={{ color: '#10b981' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit detail */}
          <div style={S.card}>
            {!selectedRow ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Select a job description to view its compliance report.
              </div>
            ) : !selectedRow.audit ? (
              <>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Eye size={15} style={{ color: '#4f46e5' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selectedRow.openingTitle}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <Sparkles size={36} style={{ color: '#c4b5fd', margin: '0 auto 14px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No scan yet</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>
                    Click "Run Scan" to analyse this job description for bias.
                  </div>
                  <Button icon={<RefreshCw size={14} />} onClick={runScan} loading={scanning}>
                    {scanning ? 'Scanning…' : 'Run Scan'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Eye size={15} style={{ color: '#4f46e5' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selectedRow.openingTitle}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Last scanned {new Date(selectedRow.audit.createdAt).toLocaleDateString()}
                      {selectedRow.audit.resolvedAt && ' · Resolved'}
                    </div>
                  </div>
                  {(selectedRow.audit.flags?.length ?? 0) > 0 && !selectedRow.audit.resolvedAt && (
                    <span style={{ marginLeft: 'auto', background: '#fff1f2', color: '#f43f5e', fontSize: 11, borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>
                      {selectedRow.audit.flags.length} {selectedRow.audit.flags.length === 1 ? 'issue' : 'issues'} found
                    </span>
                  )}
                  {selectedRow.audit.resolvedAt && (
                    <span style={{ marginLeft: 'auto', background: '#ecfdf5', color: '#10b981', fontSize: 11, borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>
                      Resolved
                    </span>
                  )}
                </div>

                <div style={{ padding: 18 }}>
                  {(selectedRow.audit.flags?.length ?? 0) > 0 && !selectedRow.audit.resolvedAt ? (
                    <>
                      <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                        The following language may deter qualified candidates from underrepresented groups.
                        Review and apply the suggestions below to improve inclusivity.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {selectedRow.audit.flags.map((f, i) => {
                          const [bg, fg] = SEV_COLORS[f.severity] ?? SEV_COLORS.medium;
                          return (
                            <div key={i} style={{ background: bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${fg}30` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: fg, background: fg + '20', borderRadius: 4, padding: '1px 6px' }}>
                                  {f.severity.toUpperCase()}
                                </span>
                                <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{f.type}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <span style={{ color: fg, textDecoration: 'line-through', fontWeight: 500 }}>"{f.word}"</span>
                                <span style={{ color: '#94a3b8' }}>→</span>
                                <span style={{ color: '#10b981', fontWeight: 500 }}>"{f.suggestion}"</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                        <Button onClick={resolveAudit} loading={resolving}>
                          Mark as Resolved
                        </Button>
                        <Button variant="secondary" onClick={runScan} loading={scanning}>
                          Re-scan
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <CheckCircle size={40} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        {selectedRow.audit.resolvedAt ? 'Issues resolved' : 'No bias detected'}
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        {selectedRow.audit.resolvedAt
                          ? 'This job description has been reviewed and marked compliant.'
                          : 'This job description passed all compliance checks.'}
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Button variant="secondary" onClick={runScan} loading={scanning}>
                          Re-scan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
