// src/pages/settings/TeamRoles.tsx — NEW: Team & RBAC
import { useState } from 'react';
import { UserPlus, Shield, Edit, Trash2, Crown, Eye, Users } from 'lucide-react';
import { Button } from '../../components/ui';

const ROLES = [
  { id: 'admin', label: 'Admin', color: '#f43f5e', perms: ['All permissions', 'Billing & plans', 'SSO configuration', 'Delete organization'] },
  { id: 'head_recruiter', label: 'Head of Talent', color: '#4f46e5', perms: ['Manage openings', 'All candidates', 'Analytics', 'Team management', 'Offer letters'] },
  { id: 'recruiter', label: 'Recruiter', color: '#10b981', perms: ['Manage assigned openings', 'View candidates', 'Send invites', 'Make decisions'] },
  { id: 'hiring_manager', label: 'Hiring Manager', color: '#f59e0b', perms: ['View own openings', 'View reports', 'Add panel feedback'] },
  { id: 'viewer', label: 'Read-Only Viewer', color: '#94a3b8', perms: ['View analytics', 'View reports (no PII)'] },
];

const MEMBERS = [
  { name: 'Sarah Reynolds', email: 'sarah@acme.com', role: 'head_recruiter', status: 'active', joined: 'Jan 2024', sso: true },
  { name: 'Raj Kumar', email: 'raj@acme.com', role: 'recruiter', status: 'active', joined: 'Mar 2024', sso: false },
  { name: 'Maya Patel', email: 'maya@acme.com', role: 'hiring_manager', status: 'active', joined: 'Jun 2024', sso: false },
  { name: 'James Liu', email: 'james@acme.com', role: 'recruiter', status: 'invited', joined: '—', sso: false },
  { name: 'Priya Singh', email: 'priya.s@acme.com', role: 'viewer', status: 'active', joined: 'Sep 2024', sso: true },
];

export default function TeamRoles() {
  const [showInvite, setShowInvite] = useState(false);
  const getRoleColor = (id: string) => ROLES.find(r => r.id === id)?.color ?? '#94a3b8';
  const getRoleLabel = (id: string) => ROLES.find(r => r.id === id)?.label ?? id;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Team & Roles</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Manage team members, permissions, and SSO access</p>
        </div>
        <Button icon={<UserPlus size={14} />} onClick={() => setShowInvite(true)}>Invite Member</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Members table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} style={{ color: '#4f46e5' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Team Members ({MEMBERS.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Member', 'Role', 'Status', 'Joined', 'SSO', ''].map(h => (
                  <th key={h} style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left', padding: '8px 16px 10px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map(m => {
                const roleColor = getRoleColor(m.role);
                return (
                  <tr key={m.email}>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: roleColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleColor, fontSize: 12, fontWeight: 700 }}>
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 11, background: roleColor + '18', color: roleColor, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{getRoleLabel(m.role)}</span>
                    </td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 11, background: m.status === 'active' ? '#ecfdf5' : '#fffbeb', color: m.status === 'active' ? '#10b981' : '#f59e0b', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                        {m.status === 'active' ? '● Active' : '○ Invited'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>{m.joined}</td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      {m.sso && <span style={{ fontSize: 10, background: '#f5f3ff', color: '#7c3aed', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>SSO</span>}
                    </td>
                    <td style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#475569' }}><Edit size={12} /></button>
                        <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#f43f5e' }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Roles */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} style={{ color: '#4f46e5' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Role Permissions</span>
          </div>
          <div style={{ padding: '10px 0' }}>
            {ROLES.map(r => (
              <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{r.label}</span>
                </div>
                {r.perms.map(p => (
                  <div key={p} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ color: '#10b981', fontSize: 11 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Invite Team Member</div>
            {['Full Name', 'Work Email'].map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4, display: 'block' }}>{f}</label>
                <input style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4, display: 'block' }}>Role</label>
              <select style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none', cursor: 'pointer' }}>
                {ROLES.filter(r => r.id !== 'admin').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button onClick={() => setShowInvite(false)}>Send Invite</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
