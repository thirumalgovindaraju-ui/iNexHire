// src/pages/settings/SSOSettings.tsx — NEW: SSO & Security Settings
import { useState } from 'react';
import { Shield, Key, Globe, CheckCircle, AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui';

const SSO_PROVIDERS = [
  { name: 'Okta', logo: '🔐', connected: true, users: 12, domain: 'acme.okta.com' },
  { name: 'Azure AD', logo: '☁️', connected: false, users: 0, domain: '' },
  { name: 'Google Workspace', logo: '📧', connected: false, users: 0, domain: '' },
  { name: 'OneLogin', logo: '🔑', connected: false, users: 0, domain: '' },
];

const SECURITY_SETTINGS = [
  { label: 'Enforce SSO for all users', desc: 'Users cannot log in with email/password if SSO is active', enabled: true },
  { label: 'Require MFA', desc: 'All non-SSO logins require TOTP or SMS verification', enabled: true },
  { label: 'Session timeout (30 min)', desc: 'Auto-logout inactive sessions', enabled: false },
  { label: 'IP allowlist', desc: 'Restrict access to specific IP ranges', enabled: false },
  { label: 'Candidate data masking', desc: 'Hide PII from Read-Only viewers', enabled: true },
];

export default function SSOSettings() {
  const [settings, setSettings] = useState(SECURITY_SETTINGS);
  const toggle = (i: number) => setSettings(settings.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>SSO & Security</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Single Sign-On configuration, MFA, session management, and data security</p>
      </div>

      {/* SSO Providers */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={15} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Identity Providers</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0 }}>
          {SSO_PROVIDERS.map((p, i) => (
            <div key={p.name} style={{ padding: '16px 18px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none', borderRight: i % 2 === 0 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{p.logo}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                  {p.connected && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.domain} · {p.users} users synced</div>}
                </div>
                {p.connected
                  ? <span style={{ fontSize: 11, background: '#ecfdf5', color: '#10b981', borderRadius: 6, padding: '2px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> Connected</span>
                  : <button style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Connect</button>
                }
              </div>
              {p.connected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11.5, color: '#475569' }}>
                    <RefreshCw size={11} /> Sync Now
                  </button>
                  <button style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11.5, color: '#f43f5e' }}>Disconnect</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SAML config */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, padding: '18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={14} style={{ color: '#4f46e5' }} /> SAML 2.0 / OIDC Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Entity ID', val: 'https://nexhire.ai/saml/acme' },
            { label: 'ACS URL', val: 'https://nexhire.ai/saml/acs/acme' },
            { label: 'Metadata URL', val: 'https://nexhire.ai/saml/meta/acme' },
            { label: 'Certificate Expiry', val: 'Dec 31, 2026' },
          ].map(f => (
            <div key={f.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4, fontWeight: 500 }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: '#334155', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.val}</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security toggles */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={15} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Security Policies</span>
        </div>
        {settings.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < settings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{s.desc}</div>
            </div>
            <button onClick={() => toggle(i)} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: s.enabled ? '#4f46e5' : '#e2e8f0',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2, left: s.enabled ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)',
              }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
