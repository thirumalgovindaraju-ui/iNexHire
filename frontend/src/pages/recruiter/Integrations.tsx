// src/pages/recruiter/Integrations.tsx — NEW: ATS & HRIS Integrations
import { Zap, CheckCircle, Plus, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../../components/ui';

const INTEGRATIONS = [
  { name: 'Greenhouse', category: 'ATS', status: 'connected', lastSync: '2 hours ago', logo: '🌿', color: '#22c55e' },
  { name: 'Workday', category: 'HRIS', status: 'connected', lastSync: '1 day ago', logo: '⚙️', color: '#3b82f6' },
  { name: 'BambooHR', category: 'HRIS', status: 'disconnected', lastSync: 'Never', logo: '🎋', color: '#f59e0b' },
  { name: 'Lever', category: 'ATS', status: 'disconnected', lastSync: 'Never', logo: '⚡', color: '#8b5cf6' },
  { name: 'Slack', category: 'Communication', status: 'connected', lastSync: 'Live', logo: '💬', color: '#4f46e5' },
  { name: 'LinkedIn Jobs', category: 'Job Boards', status: 'connected', lastSync: '1 hour ago', logo: '🔗', color: '#0077b5' },
  { name: 'Indeed', category: 'Job Boards', status: 'disconnected', lastSync: 'Never', logo: '🔍', color: '#2557a7' },
  { name: 'Calendly', category: 'Scheduling', status: 'connected', lastSync: 'Live', logo: '📅', color: '#00a2ff' },
];

export default function Integrations() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Integrations</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Connect your HR tech stack for seamless data flow</p>
        </div>
        <Button icon={<Plus size={14} />}>Browse Marketplace</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Connected', value: '5', color: '#10b981' },
          { label: 'Available', value: '47+', color: '#4f46e5' },
          { label: 'Syncing', value: '4', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {INTEGRATIONS.map(i => (
          <div key={i.name} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: '1px solid #e2e8f0' }}>
              {i.logo}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{i.name}</span>
                <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '1px 6px' }}>{i.category}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {i.status === 'connected' ? `Last synced: ${i.lastSync}` : 'Not connected'}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              {i.status === 'connected' ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', fontWeight: 500 }}>
                    <CheckCircle size={12} /> Active
                  </span>
                  <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#475569' }}>
                    <Settings size={12} />
                  </button>
                  <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#4f46e5' }}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              ) : (
                <button style={{ background: '#4f46e5', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Zap size={12} /> Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
