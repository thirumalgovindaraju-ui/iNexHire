// src/pages/recruiter/AuditLogs.tsx — wired to real backend
import { useState, useEffect, useCallback } from 'react';
import { Clock, Download, RefreshCw, Shield } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { apiClient } from '../../services/api';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const TYPE_COLORS: Record<string, [string, string]> = {
  DECISION: ['#eef2ff', '#4f46e5'],
  OFFER: ['#ecfdf5', '#10b981'],
  AI: ['#f5f3ff', '#7c3aed'],
  CANDIDATE: ['#fffbeb', '#f59e0b'],
  COMPLIANCE: ['#fff1f2', '#f43f5e'],
  INTEGRATION: ['#ecfeff', '#06b6d4'],
};

function colorFor(action: string, resourceType: string): [string, string] {
  const key = [action, resourceType].join(' ').toUpperCase();
  const match = Object.keys(TYPE_COLORS).find((k) => key.includes(k));
  return TYPE_COLORS[match ?? ''] ?? ['#f8fafc', '#475569'];
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get('/audit-logs');
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Record of hiring actions and system events for this organization</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<RefreshCw size={13} />} onClick={fetchLogs}>Refresh</Button>
          <Button variant="secondary" icon={<Download size={13} />} disabled>Export</Button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
        <Shield size={15} style={{ color: '#10b981', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: '#065f46' }}>Showing {logs.length} of {total} recorded events for this organization.</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Event Timeline</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Clock size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No events yet</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Actions like decisions, offers, and evaluations will show up here as they happen.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log) => {
              const [bg, color] = colorFor(log.action, log.resourceType);
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color }}>●</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>by {log.user?.name ?? 'System'}</span>
                      {!log.user && <span style={{ fontSize: 9, background: '#f5f3ff', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontWeight: 500 }}>AUTO</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{log.resourceType} · {log.resourceId}</div>
                    {log.metadata && (
                      <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '4px 10px', display: 'inline-block', border: '1px solid #e2e8f0', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{new Date(log.createdAt).toLocaleString()}</div>
                    {log.ipAddress && <div style={{ fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace' }}>{log.ipAddress}</div>}
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
