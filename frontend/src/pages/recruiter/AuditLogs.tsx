// src/pages/recruiter/AuditLogs.tsx — NEW: Audit Trail
import { Clock, Download, Filter, Shield } from 'lucide-react';
import { Button } from '../../components/ui';

const LOGS = [
  { id: '1', action: 'Decision changed', user: 'Sarah Reynolds', resource: 'Arjun Kapoor — Interview', detail: 'Status: Pending → Move Forward', time: '2 min ago', ip: '192.168.1.1', type: 'decision' },
  { id: '2', action: 'Offer letter sent', user: 'Sarah Reynolds', resource: 'Arjun Kapoor', detail: 'Sr. Backend Engineer offer @ $160k', time: '5 min ago', ip: '192.168.1.1', type: 'offer' },
  { id: '3', action: 'AI evaluation complete', user: 'System', resource: 'Priya Venkat — Interview #PLM47', detail: 'Score: 88/100, Recommendation: HIRE', time: '1 hour ago', ip: 'system', type: 'ai' },
  { id: '4', action: 'Candidate added', user: 'Raj Kumar', resource: 'Marcus Reed', detail: 'Added to Sr. Backend Engineer opening', time: '3 hours ago', ip: '10.0.0.5', type: 'candidate' },
  { id: '5', action: 'Job description updated', user: 'Sarah Reynolds', resource: 'ML Engineer JD', detail: 'Bias suggestion applied — "rockstar" → "skilled"', time: 'Yesterday 4:45 PM', ip: '192.168.1.1', type: 'compliance' },
  { id: '6', action: 'Integration synced', user: 'System', resource: 'Greenhouse ATS', detail: '14 candidates imported', time: 'Yesterday 9:00 AM', ip: 'system', type: 'integration' },
];

const TYPE_COLORS: Record<string, [string, string]> = {
  decision: ['#eef2ff', '#4f46e5'],
  offer: ['#ecfdf5', '#10b981'],
  ai: ['#f5f3ff', '#7c3aed'],
  candidate: ['#fffbeb', '#f59e0b'],
  compliance: ['#fff1f2', '#f43f5e'],
  integration: ['#ecfeff', '#06b6d4'],
};

export default function AuditLogs() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Immutable record of all hiring actions and system events</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Filter size={13} />}>Filter</Button>
          <Button variant="secondary" icon={<Download size={13} />}>Export</Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
        <Shield size={15} style={{ color: '#10b981', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: '#065f46' }}>All events are cryptographically signed and tamper-proof. Compliant with SOC2, GDPR, and EEOC record-keeping requirements.</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Event Timeline</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {LOGS.map(log => {
            const [bg, color] = TYPE_COLORS[log.type] ?? ['#f8fafc', '#475569'];
            return (
              <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 12, color }}>●</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{log.action}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>by {log.user}</span>
                    {log.user === 'System' && <span style={{ fontSize: 9, background: '#f5f3ff', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontWeight: 500 }}>AUTO</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{log.resource}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '4px 10px', display: 'inline-block', border: '1px solid #e2e8f0' }}>{log.detail}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{log.time}</div>
                  {log.ip !== 'system' && <div style={{ fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace' }}>{log.ip}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
