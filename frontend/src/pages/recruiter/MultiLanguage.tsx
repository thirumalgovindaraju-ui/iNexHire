// src/pages/recruiter/MultiLanguage.tsx — NEW: Multilingual Interview Settings
import { useState } from 'react';
import { Globe, Check, Mic } from 'lucide-react';
import { Button } from '../../components/ui';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', status: 'active', interviews: 12840 },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', status: 'active', interviews: 3420 },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', status: 'active', interviews: 1240 },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', status: 'active', interviews: 980 },
  { code: 'ar', name: 'Arabic', flag: '🇦🇪', status: 'active', interviews: 860 },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', status: 'active', interviews: 740 },
  { code: 'fr', name: 'French', flag: '🇫🇷', status: 'active', interviews: 620 },
  { code: 'de', name: 'German', flag: '🇩🇪', status: 'beta', interviews: 280 },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', status: 'beta', interviews: 190 },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳', status: 'beta', interviews: 150 },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', status: 'coming', interviews: 0 },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', status: 'coming', interviews: 0 },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', status: 'coming', interviews: 0 },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', status: 'coming', interviews: 0 },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', status: 'coming', interviews: 0 },
];

const STATUS_STYLES: Record<string, [string, string, string]> = {
  active: ['#ecfdf5', '#10b981', 'Active'],
  beta: ['#fffbeb', '#f59e0b', 'Beta'],
  coming: ['#f8fafc', '#94a3b8', 'Coming Soon'],
};

export default function MultiLanguage() {
  const [defaultLang, setDefaultLang] = useState('en');

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Multilingual Interviews</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Conduct AI interviews in 15+ languages — auto-detected or manually set per candidate</p>
        </div>
        <Button icon={<Mic size={14} />}>Test Language</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🌍</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>15+</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Languages supported</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🤖</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>99.1%</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>STT accuracy (multilingual)</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Auto</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Language detection on entry</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={15} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Language Catalog</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {LANGUAGES.map((l, i) => {
            const [bg, color, label] = STATUS_STYLES[l.status];
            const isDefault = l.code === defaultLang;
            const isLast = i >= LANGUAGES.length - 3;
            return (
              <div key={l.code} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                borderBottom: !isLast ? '1px solid #f1f5f9' : 'none',
                borderRight: (i % 3) < 2 ? '1px solid #f1f5f9' : 'none',
                background: isDefault ? '#fafafe' : 'transparent',
              }}>
                <span style={{ fontSize: 22 }}>{l.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isDefault ? 600 : 400, color: '#0f172a' }}>{l.name}</div>
                  {l.interviews > 0 && <div style={{ fontSize: 10, color: '#94a3b8' }}>{l.interviews.toLocaleString()} interviews</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, background: bg, color, borderRadius: 6, padding: '2px 7px', fontWeight: 500 }}>{label}</span>
                  {l.status !== 'coming' && (
                    <button onClick={() => setDefaultLang(l.code)}
                      style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isDefault ? '#4f46e5' : '#e2e8f0'}`, background: isDefault ? '#4f46e5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDefault && <Check size={11} style={{ color: '#fff' }} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
