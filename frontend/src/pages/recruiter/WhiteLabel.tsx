// src/pages/recruiter/WhiteLabel.tsx — NEW: White-label & Branding
import { useState } from 'react';
import { Palette, Globe, Upload, CheckCircle, Eye } from 'lucide-react';
import { Button } from '../../components/ui';

export default function WhiteLabel() {
  const [form, setForm] = useState({ companyName: 'Acme Corp', domain: 'hiring.acme.com', primaryColor: '#4f46e5', accentColor: '#10b981', logoUrl: '', welcomeMsg: 'Welcome to our AI Interview Platform. Good luck!', fontFamily: 'Inter' });
  const [saved, setSaved] = useState(false);

  const FONTS = ['Inter', 'Poppins', 'Outfit', 'DM Sans', 'Plus Jakarta Sans'];
  const PRESETS = [{ name: 'Indigo', primary: '#4f46e5', accent: '#10b981' }, { name: 'Slate', primary: '#0f172a', accent: '#3b82f6' }, { name: 'Rose', primary: '#e11d48', accent: '#f59e0b' }, { name: 'Teal', primary: '#0d9488', accent: '#8b5cf6' }];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>White-label & Branding</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Customize the candidate experience with your company's brand identity</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Eye size={14} />}>Preview Portal</Button>
          <Button icon={<CheckCircle size={14} />} onClick={() => setSaved(true)}>{saved ? '✓ Published!' : 'Publish Changes'}</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Company Identity */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Company Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ label: 'Company Name', field: 'companyName' }, { label: 'Custom Domain', field: 'domain' }].map(f => (
                <div key={f.field}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input value={form[f.field as keyof typeof form]} onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5, display: 'block' }}>Company Logo</label>
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                <Upload size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                Drop logo here or click to upload (SVG, PNG — max 2MB)
              </div>
            </div>
          </div>

          {/* Colors */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Brand Colors</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {PRESETS.map(p => (
                <button key={p.name} onClick={() => setForm({ ...form, primaryColor: p.primary, accentColor: p.accent })}
                  style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#fff' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.primary, display: 'inline-block' }} />
                  {p.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ label: 'Primary Color', field: 'primaryColor' }, { label: 'Accent Color', field: 'accentColor' }].map(f => (
                <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <input type="color" value={form[f.field as keyof typeof form]} onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }}
                  />
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', fontFamily: 'monospace' }}>{form[f.field as keyof typeof form]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate experience */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Candidate Experience</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5, display: 'block' }}>Font Family</label>
              <select value={form.fontFamily} onChange={e => setForm({ ...form, fontFamily: e.target.value })}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', background: '#fff', width: '100%', cursor: 'pointer', outline: 'none' }}>
                {FONTS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5, display: 'block' }}>Welcome Message</label>
              <textarea value={form.welcomeMsg} onChange={e => setForm({ ...form, welcomeMsg: e.target.value })} rows={3}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', resize: 'none', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 24 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={13} style={{ color: '#4f46e5' }} /> Live Preview
          </div>
          {/* Candidate portal preview */}
          <div style={{ background: '#f8fafc' }}>
            <div style={{ background: form.primaryColor, padding: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{form.companyName.charAt(0)}</span>
              </div>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{form.companyName}</span>
            </div>
            <div style={{ padding: '20px 16px' }}>
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Welcome to your interview</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{form.welcomeMsg}</div>
                <button style={{ background: form.primaryColor, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' }}>
                  Start Interview →
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Globe size={11} /> {form.domain}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
