// src/pages/recruiter/OfferLetters.tsx — NEW: Offer Letter Automation
import { useState } from 'react';
import { FileText, Send, CheckCircle, Clock, Plus, Download, Edit } from 'lucide-react';
import { Button } from '../../components/ui';

const OFFERS = [
  { id: '1', candidate: 'Sara Essel', role: 'Frontend Lead', salary: '$145,000', status: 'accepted', date: '2 days ago', equity: '0.15%' },
  { id: '2', candidate: 'Arjun Kapoor', role: 'Sr. Backend Engineer', salary: '$160,000', status: 'pending_signature', date: '5 hours ago', equity: '0.20%' },
  { id: '3', candidate: 'Priya Venkat', role: 'Product Manager', salary: '$135,000', status: 'draft', date: 'just now', equity: '0.10%' },
  { id: '4', candidate: 'James Liu', role: 'DevOps Engineer', salary: '$125,000', status: 'expired', date: '10 days ago', equity: '0.08%' },
];

const STATUS_MAP: Record<string, [string, string, string]> = {
  accepted: ['#ecfdf5', '#10b981', 'Accepted'],
  pending_signature: ['#fffbeb', '#f59e0b', 'Awaiting Signature'],
  draft: ['#f8fafc', '#94a3b8', 'Draft'],
  expired: ['#fff1f2', '#f43f5e', 'Expired'],
};

export default function OfferLetters() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Offer Letters</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Generate, send and track offer letters with e-signatures</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New Offer Letter</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Offers', value: '31', color: '#4f46e5', bg: '#eef2ff', icon: <FileText size={16} /> },
          { label: 'Accepted', value: '24', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={16} /> },
          { label: 'Pending Signature', value: '2', color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={16} /> },
          { label: 'Offer Accept Rate', value: '77%', color: '#7c3aed', bg: '#f5f3ff', icon: <Send size={16} /> },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Offers table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>All Offers</div>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>Export CSV</Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Candidate', 'Role', 'Salary', 'Equity', 'Status', 'Sent', 'Actions'].map(h => (
                <th key={h} style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', padding: '0 16px 10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OFFERS.map(o => {
              const [bg, color, label] = STATUS_MAP[o.status];
              return (
                <tr key={o.id} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{o.candidate}</td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12.5, color: '#475569' }}>{o.role}</td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{o.salary}</td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12.5, color: '#475569' }}>{o.equity}</td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ background: bg, color, fontSize: 11, borderRadius: 6, padding: '3px 9px', fontWeight: 500 }}>{label}</span>
                  </td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8' }}>{o.date}</td>
                  <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#475569', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit size={11} /> Edit
                      </button>
                      {o.status === 'draft' && (
                        <button style={{ background: '#4f46e5', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Send size={11} /> Send
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New offer modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Generate Offer Letter</div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>AI will auto-fill from candidate profile & approved comp bands</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Candidate', 'Role', 'Start Date', 'Base Salary', 'Equity %', 'Signing Bonus'].map(f => (
                <div key={f}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4, display: 'block' }}>{f}</label>
                  <input style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', outline: 'none' }} placeholder={`Enter ${f.toLowerCase()}...`} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => setShowModal(false)}>Generate & Preview</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
