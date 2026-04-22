// src/pages/recruiter/Compliance.tsx — NEW: Bias Detection & Compliance
import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, FileText, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui';

interface BiasFlag {
  type: string;
  word: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

const SAMPLE_FLAGS: BiasFlag[] = [
  { type: 'Gender-coded', word: 'rockstar developer', suggestion: 'skilled developer', severity: 'medium' },
  { type: 'Age bias', word: 'recent graduate preferred', suggestion: 'entry-level candidates welcome', severity: 'high' },
  { type: 'Gender-coded', word: 'aggressive growth targets', suggestion: 'ambitious growth targets', severity: 'low' },
  { type: 'Exclusionary', word: 'must be a culture fit', suggestion: 'must embrace our company values', severity: 'medium' },
];

const SEV_COLORS: Record<string, [string, string]> = {
  high: ['#fff1f2', '#f43f5e'],
  medium: ['#fffbeb', '#f59e0b'],
  low: ['#f0fdf4', '#10b981'],
};

export default function Compliance() {
  const [activeJD, setActiveJD] = useState<string | null>('ML Engineer');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(true);

  function runScan() {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanned(true); }, 1500);
  }

  const S = {
    page: { padding: '24px 28px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Compliance & Bias Detection</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>AI-powered job description analysis for inclusive hiring</p>
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={runScan} loading={scanning}>
          Run Full Scan
        </Button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'JDs Scanned', value: '24', icon: <FileText size={16} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Bias Flags', value: '4', icon: <AlertTriangle size={16} />, color: '#f43f5e', bg: '#fff1f2' },
          { label: 'Clean JDs', value: '23', icon: <CheckCircle size={16} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Compliance Score', value: '94%', icon: <Shield size={16} />, color: '#7c3aed', bg: '#f5f3ff' },
        ].map(c => (
          <div key={c.label} style={{ ...S.card, padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* JD list */}
        <div style={S.card}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Job Descriptions</div>
          <div>
            {['ML Engineer', 'Sr. Backend Engineer', 'Product Manager', 'Frontend Lead', 'DevOps Engineer'].map(jd => {
              const hasBias = jd === 'ML Engineer';
              const isActive = activeJD === jd;
              return (
                <div
                  key={jd}
                  onClick={() => setActiveJD(jd)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px', cursor: 'pointer', fontSize: 13,
                    background: isActive ? '#f5f3ff' : 'transparent',
                    color: isActive ? '#4f46e5' : '#334155',
                    borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  }}
                >
                  <span style={{ fontWeight: isActive ? 500 : 400 }}>{jd}</span>
                  {hasBias
                    ? <span style={{ background: '#fff1f2', color: '#f43f5e', fontSize: 9, borderRadius: 9, padding: '2px 6px', fontWeight: 600 }}>4 flags</span>
                    : <CheckCircle size={13} style={{ color: '#10b981' }} />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Bias report */}
        <div style={S.card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={15} style={{ color: '#4f46e5' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{activeJD}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{scanned ? `Last scanned ${new Date().toLocaleDateString()}` : 'Not scanned yet'}</div>
            </div>
            {activeJD === 'ML Engineer' && (
              <span style={{ marginLeft: 'auto', background: '#fff1f2', color: '#f43f5e', fontSize: 11, borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>4 issues found</span>
            )}
          </div>
          <div style={{ padding: '18px' }}>
            {activeJD === 'ML Engineer' ? (
              <>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                  The following language in this job description may deter qualified candidates from underrepresented groups. Review and apply the suggestions below to improve inclusivity.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {SAMPLE_FLAGS.map((f, i) => {
                    const [bg, fg] = SEV_COLORS[f.severity];
                    return (
                      <div key={i} style={{ background: bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${fg}30` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: fg, background: fg + '20', borderRadius: 4, padding: '1px 6px' }}>{f.severity.toUpperCase()}</span>
                          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{f.type}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ color: fg, textDecoration: 'line-through', fontWeight: 500 }}>"{f.word}"</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <span style={{ color: '#10b981', fontWeight: 500 }}>"{f.suggestion}"</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <Button>Apply All Suggestions</Button>
                  <Button variant="secondary">Export Report</Button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={40} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No bias detected</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>This job description passed all compliance checks</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
