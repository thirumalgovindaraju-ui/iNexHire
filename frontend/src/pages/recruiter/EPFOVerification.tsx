// src/pages/recruiter/EPFOVerification.tsx — wired to real backend (SIMULATION ONLY)
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, Clock, Download, Building2 } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { candidatesApi, epfoApi } from '../../services/api';

const DISCLAIMER = 'Simulation mode — production requires EPFO API approval from Ministry of Labour, Government of India.';

interface CandidateOption {
  id: string;
  name: string;
  email: string;
  openingTitle: string;
}

interface EmploymentRecord {
  employer: string;
  startDate: string;
  endDate: string | null;
  epfoOffice: string;
}

interface Discrepancy {
  claim: string;
  epfoFinding: string;
  severity: 'high' | 'medium' | 'low';
}

interface Verification {
  id: string;
  candidateId: string;
  uanNumber: string | null;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  employmentHistory: EmploymentRecord[] | null;
  discrepancies: Discrepancy[] | null;
  isSimulated: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDING: { color: '#94a3b8', bg: '#f8fafc', icon: Clock, label: 'Pending' },
  VERIFIED: { color: '#10b981', bg: '#ecfdf5', icon: ShieldCheck, label: 'Verified (simulated)' },
  MANUAL_REVIEW: { color: '#f59e0b', bg: '#fffbeb', icon: ShieldAlert, label: 'Manual Review Needed' },
  FAILED: { color: '#f43f5e', bg: '#fff1f2', icon: ShieldX, label: 'Verification Failed' },
};

function formatMonth(m: string | null): string {
  if (!m) return 'Present';
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function EPFOVerification() {
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uan, setUan] = useState('');
  const [statedYears, setStatedYears] = useState('');
  const [statedEmployers, setStatedEmployers] = useState('');

  useEffect(() => {
    candidatesApi.list({ limit: 100 })
      .then((data: any) => {
        const opts: CandidateOption[] = (data.candidates ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          openingTitle: c.opening?.title ?? 'Unknown role',
        }));
        setCandidates(opts);
        if (opts.length > 0) setSelectedId(opts[0].id);
      })
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Failed to load candidates'))
      .finally(() => setLoadingList(false));
  }, []);

  const fetchVerification = useCallback(async (candidateId: string) => {
    try {
      setLoadingVerification(true);
      setError(null);
      const data = await epfoApi.get(candidateId);
      setVerification(data.verification ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load verification status');
    } finally {
      setLoadingVerification(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchVerification(selectedId);
  }, [selectedId, fetchVerification]);

  async function runVerification() {
    if (!selectedId) return;
    if (!/^\d{12}$/.test(uan)) {
      setError('UAN must be exactly 12 digits');
      return;
    }
    try {
      setVerifying(true);
      setError(null);
      const data = await epfoApi.verify({
        candidateId: selectedId,
        uanNumber: uan,
        statedExperienceYears: statedYears ? Number(statedYears) : undefined,
        statedEmployers: statedEmployers
          ? statedEmployers.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      setVerification(data.verification);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  function exportPdf() {
    if (!verification) return;
    const meta = STATUS_META[verification.status] ?? STATUS_META.PENDING;
    const candidate = candidates.find((c) => c.id === selectedId);
    const history = verification.employmentHistory ?? [];
    const discrepancies = verification.discrepancies ?? [];

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>EPFO Verification Report — ${candidate?.name ?? ''}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            .disclaimer { background: #fff1f2; border: 2px solid #f43f5e; color: #9f1239; padding: 14px 18px; border-radius: 8px; font-weight: bold; margin-bottom: 24px; font-size: 13px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .sub { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; background: ${meta.bg}; color: ${meta.color}; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            th { color: #94a3b8; font-size: 11px; text-transform: uppercase; }
            .discrepancy { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; color: #9f1239; }
            .footer-disclaimer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="disclaimer">⚠ ${DISCLAIMER} This entire report — including the employment history below — is SIMULATED/FICTIONAL data generated for prototyping purposes and does NOT reflect any real government verification.</div>
          <h1>Employment Verification Report</h1>
          <div class="sub">Candidate: ${candidate?.name ?? 'Unknown'} (${candidate?.email ?? ''}) — Role: ${candidate?.openingTitle ?? ''}</div>
          <div><span class="status">${meta.label}</span></div>
          <p style="font-size:13px;">UAN entered: ${verification.uanNumber ?? 'N/A'} &nbsp;|&nbsp; Verified at: ${verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleString() : 'N/A'}</p>
          <h3 style="font-size:14px;">Simulated Employment History</h3>
          <table>
            <thead><tr><th>Employer</th><th>Start</th><th>End</th><th>EPFO Office (simulated)</th></tr></thead>
            <tbody>
              ${history.map((h) => `<tr><td>${h.employer}</td><td>${formatMonth(h.startDate)}</td><td>${formatMonth(h.endDate)}</td><td>${h.epfoOffice}</td></tr>`).join('') || '<tr><td colspan="4">No history generated</td></tr>'}
            </tbody>
          </table>
          ${discrepancies.length > 0 ? `
            <h3 style="font-size:14px;">Discrepancies Flagged</h3>
            ${discrepancies.map((d) => `<div class="discrepancy"><strong>${d.severity.toUpperCase()}:</strong> ${d.claim} — ${d.epfoFinding}</div>`).join('')}
          ` : ''}
          <div class="footer-disclaimer">${DISCLAIMER} No real UAN lookup or EPFO API call was made. Generated on ${new Date().toLocaleString()}.</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  if (loadingList) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  const meta = verification ? STATUS_META[verification.status] ?? STATUS_META.PENDING : null;
  const StatusIcon = meta?.icon;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>EPFO/UAN Employment Verification</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Cross-check candidate-stated experience against employment history</p>
      </div>

      {/* Persistent, non-dismissible simulation disclaimer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '2px solid #fecdd3', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
        <AlertTriangle size={18} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: '#9f1239', fontWeight: 600, lineHeight: 1.5 }}>
          {DISCLAIMER}
          <div style={{ fontWeight: 400, marginTop: 3, color: '#be123c' }}>
            Every employment history and verification result shown below is generated by Claude as fictional, simulated data for prototyping this feature. None of it is a real EPFO/UAN lookup or a real government record.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Building2 size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No candidates yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Add candidates to an opening first, then come back here to verify employment history.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          {/* Candidate list */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Candidates</div>
            {candidates.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selectedId === c.id ? '#fafafe' : 'transparent',
                borderLeft: selectedId === c.id ? '3px solid #4f46e5' : '3px solid transparent',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.openingTitle}</div>
              </div>
            ))}
          </div>

          {/* Verification panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Run Verification</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>UAN Number (12 digits)</label>
                  <input
                    value={uan}
                    onChange={(e) => setUan(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="e.g. 100123456789"
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Candidate-Stated Experience (years, optional)</label>
                  <input
                    type="number"
                    value={statedYears}
                    onChange={(e) => setStatedYears(e.target.value)}
                    placeholder="e.g. 5"
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' }}
                  />
                </div>
              </div>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Candidate-Stated Employers (comma-separated, optional)</label>
              <input
                value={statedEmployers}
                onChange={(e) => setStatedEmployers(e.target.value)}
                placeholder="e.g. TCS, Infosys"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', marginBottom: 12 }}
              />
              <Button icon={<ShieldCheck size={14} />} onClick={runVerification} loading={verifying}>
                {verifying ? 'Verifying (simulated)…' : 'Run Simulated Verification'}
              </Button>
            </div>

            {loadingVerification ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, display: 'flex', justifyContent: 'center' }}>
                <Spinner size={24} />
              </div>
            ) : !verification ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No verification run yet for this candidate.
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {StatusIcon && <StatusIcon size={16} style={{ color: meta!.color }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta!.color }}>{meta!.label}</span>
                  </div>
                  <Button variant="secondary" icon={<Download size={13} />} onClick={exportPdf}>
                    Export PDF
                  </Button>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>
                  UAN: {verification.uanNumber} · {verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleString() : 'Not verified yet'}
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Simulated Employment History</div>
                {(verification.employmentHistory ?? []).length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>No history generated.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(verification.employmentHistory ?? []).map((h, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Building2 size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#334155' }}>{h.employer}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{h.epfoOffice} (simulated)</div>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{formatMonth(h.startDate)} – {formatMonth(h.endDate)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {(verification.discrepancies ?? []).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9f1239', marginBottom: 10 }}>Discrepancies Flagged</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(verification.discrepancies ?? []).map((d, i) => (
                        <div key={i} style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 12.5, color: '#9f1239', fontWeight: 500 }}>{d.claim}</div>
                          <div style={{ fontSize: 11.5, color: '#be123c', marginTop: 2 }}>{d.epfoFinding}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
