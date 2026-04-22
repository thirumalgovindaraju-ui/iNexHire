// src/pages/recruiter/Notifications.tsx — NEW: Smart Notifications
import { useState } from 'react';
import { Bell, Slack, Mail, Smartphone, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../../components/ui';

interface Rule { id: string; event: string; channel: 'email' | 'slack' | 'sms'; enabled: boolean; threshold?: number }

const DEFAULT_RULES: Rule[] = [
  { id: '1', event: 'Interview completed', channel: 'slack', enabled: true },
  { id: '2', event: 'AI score above threshold', channel: 'email', enabled: true, threshold: 80 },
  { id: '3', event: 'Proctoring flag detected', channel: 'slack', enabled: true },
  { id: '4', event: 'Offer letter signed', channel: 'slack', enabled: true },
  { id: '5', event: 'Invite link expiring soon', channel: 'email', enabled: true },
  { id: '6', event: 'Pending decision >48h', channel: 'email', enabled: false },
  { id: '7', event: 'New candidate added', channel: 'email', enabled: false },
  { id: '8', event: 'Integration sync failed', channel: 'slack', enabled: true },
  { id: '9', event: 'Bias alert triggered', channel: 'email', enabled: true },
  { id: '10', event: 'Daily hiring digest', channel: 'email', enabled: true },
];

const CHANNEL_ICONS: Record<string, [React.ReactNode, string]> = {
  slack: [<Slack size={13} />, '#4f46e5'],
  email: [<Mail size={13} />, '#10b981'],
  sms: [<Smartphone size={13} />, '#f59e0b'],
};

const RECENT = [
  { msg: 'Arjun Kapoor completed interview — Score: 93/100', time: '2 min ago', type: 'score', unread: true },
  { msg: 'Offer letter signed by Sara Essel', time: '38 min ago', type: 'offer', unread: true },
  { msg: 'Proctoring: 2 tab-switch events logged for Marcus Reed', time: '5h ago', type: 'proctor', unread: false },
  { msg: 'Invite link for Nadia Patel expires in 24 hours', time: 'Yesterday', type: 'expire', unread: false },
  { msg: 'Bias alert: "rockstar" detected in ML Engineer JD', time: 'Yesterday', type: 'bias', unread: false },
];

export default function Notifications() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const toggle = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Smart Notifications</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Configure real-time alerts for Slack, email, and SMS across all hiring events</p>
        </div>
        <Button icon={<Save size={14} />}>Save Preferences</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Rules */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Notification Rules</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Event', 'Channel', 'Enabled'].map(h => (
                  <th key={h} style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left', padding: '8px 18px 10px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(r => {
                const [icon, color] = CHANNEL_ICONS[r.channel];
                return (
                  <tr key={r.id}>
                    <td style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#334155' }}>
                      {r.event}
                      {r.threshold && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>(≥{r.threshold})</span>}
                    </td>
                    <td style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: color + '18', color, fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '3px 9px' }}>
                        {icon} {r.channel.charAt(0).toUpperCase() + r.channel.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => toggle(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.enabled ? '#4f46e5' : '#cbd5e1' }}>
                        {r.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recent notifications */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Alerts</div>
            <span style={{ fontSize: 10, background: '#eef2ff', color: '#4f46e5', borderRadius: 9, padding: '2px 8px', fontWeight: 600 }}>2 unread</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {RECENT.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: i < RECENT.length - 1 ? '1px solid #f1f5f9' : 'none', background: n.unread ? '#fafafe' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: n.unread ? '#eef2ff' : '#f8fafc' }}>
                  <Bell size={13} style={{ color: n.unread ? '#4f46e5' : '#94a3b8' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, marginBottom: 2 }}>{n.msg}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{n.time}</div>
                </div>
                {n.unread && <div style={{ width: 7, height: 7, background: '#4f46e5', borderRadius: '50%', flexShrink: 0, marginTop: 8 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
