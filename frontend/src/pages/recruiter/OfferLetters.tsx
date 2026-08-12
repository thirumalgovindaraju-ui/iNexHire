// src/pages/recruiter/OfferLetters.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { FileText, Send, CheckCircle, Clock, Plus, X } from 'lucide-react';
import { Button } from '../../components/ui';
import { offersApi } from '../../services/api';

interface Offer {
  id: string;
  candidateId: string;
  interviewId: string;
  baseSalary: number;
  equity: number | null;
  signingBonus: number | null;
  startDate: string | null;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  content: string | null;
  createdAt: string;
  candidate: { name: string; email: string; opening: { title: string } };
}

interface EligibleInterview {
  id: string;
  candidateId: string;
  candidate: { name: string; email: string; opening: { title: string; department: string | null } };
  report: { overallScore: number; recommendation: string; decision: string } | null;
}

const STATUS_MAP: Record<string, [string, string, string]> = {
  DRAFT: ['#f8fafc', '#94a3b8', 'Draft'],
  SENT: ['#fffbeb', '#f59e0b', 'Awaiting Signature'],
  SIGNED: ['#eff6ff', '#3b82f6', 'Signed'],
  ACCEPTED: ['#ecfdf5', '#10b981', 'Accepted'],
  DECLINED: ['#fff1f2', '#f43f5e', 'Declined'],
  EXPIRED: ['#fff1f2', '#f43f5e', 'Expired'],
};

export default function OfferLetters() {
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [eligible, setEligible]       = useState<EligibleInterview[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [creating, setCreating]       = useState(false);
  const [sendingId, setSendingId]     = useState<string | null>(null);
  const [preview, setPreview]         = useState<Offer | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const [form, setForm] = useState({
    interviewId: '', baseSalary: '', equity: '', signingBonus: '', startDate: '', reportingTo: '',
  });

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offersApi.list();
      setOffers(data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  async function openModal() {
    setShowModal(true);
    try {
      const data = await offersApi.eligible();
      setEligible(data ?? []);
    } catch {
      setEligible([]);
    }
  }

  async function handleCreate() {
    const selected = eligible.find((e) => e.id === form.interviewId);
    if (!selected || !form.baseSalary || !form.startDate || !form.reportingTo) return;

    try {
      setCreating(true);
      setError(null);
      await offersApi.create({
        candidateId: selected.candidateId,
        interviewId: selected.id,
        baseSalary: parseInt(form.baseSalary, 10),
        equity: form.equity ? parseFloat(form.equity) : undefined,
        signingBonus: form.signingBonus ? parseInt(form.signingBonus, 10) : undefined,
        startDate: form.startDate,
        reportingTo: form.reportingTo,
        department: selected.candidate.opening.department ?? undefined,
      });
      setShowModal(false);
      setForm({ interviewId: '', baseSalary: '', equity: '', signingBonus: '', startDate: '', reportingTo: '' });
      await fetchOffers();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create offer');
    } finally {
      setCreating(false);
    }
  }

  async function handleSend(id: string) {
    try {
      setSendingId(id);
      await offersApi.send(id);
      await fetchOffers();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to send offer');
    } finally {
      setSendingId(null);
    }
  }

  const total = offers.length;
  const accepted = offers.filter((o) => o.status === 'ACCEPTED' || o.status === 'SIGNED').length;
  const pendingSignature = offers.filter((o) => o.status === 'SENT').length;
  const closedCount = offers.filter((o) => ['ACCEPTED', 'SIGNED', 'DECLINED', 'EXPIRED'].includes(o.status)).length;
  const acceptRate = closedCount > 0 ? Math.round((accepted / closedCount) * 100) : 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px',
    fontSize: 13, color: '#0f172a', outline: 'none',
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Offer Letters</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Generate and track offer letters with Claude AI</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={openModal}>New Offer Letter</Button>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Offers', value: String(total), color: '#4f46e5', bg: '#eef2ff', icon: <FileText size={16} /> },
          { label: 'Accepted', value: String(accepted), color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={16} /> },
          { label: 'Pending Signature', value: String(pendingSignature), color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={16} /> },
          { label: 'Offer Accept Rate', value: `${acceptRate}%`, color: '#7c3aed', bg: '#f5f3ff', icon: <Send size={16} /> },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
          All Offers
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading offers…</div>
        ) : offers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No offers yet. Click "New Offer Letter" to generate one for a candidate with a completed interview.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Candidate', 'Role', 'Salary', 'Equity', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', padding: '0 16px 10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => {
                const [bg, color, label] = STATUS_MAP[o.status] ?? STATUS_MAP.DRAFT;
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setPreview(o)}>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{o.candidate.name}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12.5, color: '#475569' }}>{o.candidate.opening.title}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>${o.baseSalary.toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12.5, color: '#475569' }}>{o.equity ? `${o.equity}%` : '—'}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ background: bg, color, fontSize: 11, borderRadius: 6, padding: '3px 9px', fontWeight: 500 }}>{label}</span>
                    </td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                      {o.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSend(o.id)}
                          disabled={sendingId === o.id}
                          style={{ background: '#4f46e5', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, opacity: sendingId === o.id ? 0.6 : 1 }}
                        >
                          <Send size={11} /> {sendingId === o.id ? 'Sending…' : 'Send'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New offer modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Generate Offer Letter</div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Claude will draft the letter from the candidate's interview record</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4, display: 'block' }}>Candidate</label>
                <select
                  style={inputStyle}
                  value={form.interviewId}
                  onChange={(e) => setForm({ ...form, interviewId: e.target.value })}
                >
                  <option value="">Select a candidate…</option>
                  {eligible.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.candidate.name} — {e.candidate.opening.title}
                    </option>
                  ))}
                </select>
                {eligible.length === 0 && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    No candidates with a completed interview report yet.
                  </div>
                )}
              </div>
              {[
                { key: 'baseSalary', label: 'Base Salary ($)', type: 'number' },
                { key: 'equity', label: 'Equity (%)', type: 'number' },
                { key: 'signingBonus', label: 'Signing Bonus ($)', type: 'number' },
                { key: 'startDate', label: 'Start Date', type: 'date' },
                { key: 'reportingTo', label: 'Reporting To', type: 'text' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input
                    type={f.type}
                    style={inputStyle}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={`Enter ${f.label.toLowerCase()}…`}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} loading={creating}>Generate</Button>
            </div>
          </div>
        </div>
      )}

      {/* Letter preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setPreview(null)}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '80vh', overflow: 'auto', padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Offer Letter — {preview.candidate.name}
              </div>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>
            {preview.content ? (
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: preview.content }} />
            ) : (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>No letter content available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
