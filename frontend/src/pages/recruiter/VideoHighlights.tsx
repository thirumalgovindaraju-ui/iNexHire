// src/pages/recruiter/VideoHighlights.tsx — NEW: AI Video Highlights Reel
import { useState } from 'react';
import { Play, Download, Scissors, Star, Clock, Film } from 'lucide-react';
import { Button } from '../../components/ui';

const CANDIDATES = [
  { name: 'Arjun Kapoor', role: 'Sr. Backend', duration: '34:12', highlights: [
    { timestamp: '02:14', label: 'System design explanation', score: 96, type: 'technical' },
    { timestamp: '08:45', label: 'Problem-solving approach', score: 91, type: 'technical' },
    { timestamp: '19:30', label: 'Leadership example — Star method', score: 88, type: 'behavioral' },
    { timestamp: '27:10', label: 'Culture alignment response', score: 94, type: 'culture' },
  ]},
  { name: 'Priya Venkat', role: 'Product Manager', duration: '28:55', highlights: [
    { timestamp: '03:20', label: 'Product metrics framework', score: 89, type: 'technical' },
    { timestamp: '11:40', label: 'Stakeholder management story', score: 85, type: 'behavioral' },
    { timestamp: '22:15', label: 'Vision and roadmap thinking', score: 91, type: 'technical' },
  ]},
];

const TYPE_COLORS: Record<string, [string, string]> = {
  technical: ['#eef2ff', '#4f46e5'],
  behavioral: ['#f0fdf4', '#10b981'],
  culture: ['#f5f3ff', '#7c3aed'],
};

export default function VideoHighlights() {
  const [selected, setSelected] = useState(CANDIDATES[0]);
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>AI Video Highlights</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>AI auto-clips the best moments from each interview — review in 60 seconds</p>
        </div>
        <Button icon={<Download size={14} />} variant="secondary">Export All Reels</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Candidate list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Interview Recordings</div>
          {CANDIDATES.map(c => (
            <div key={c.name} onClick={() => setSelected(c)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              background: selected.name === c.name ? '#fafafe' : 'transparent',
              borderLeft: selected.name === c.name ? '3px solid #4f46e5' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 30, background: '#0f172a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Film size={14} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {c.duration} · {c.highlights.length} clips
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video player + clips */}
        <div>
          {/* Fake video player */}
          <div style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden', marginBottom: 14, aspectRatio: '16/7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' }}>
                <Play size={22} style={{ color: '#fff', marginLeft: 3 }} />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>{selected.name} — Full Interview</div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{selected.duration}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '32%', background: '#818cf8', borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scissors size={14} style={{ color: '#4f46e5' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>AI-Clipped Highlights ({selected.highlights.length})</span>
              </div>
              <Button size="sm" icon={<Download size={12} />}>Export Reel</Button>
            </div>
            <div style={{ padding: '12px 18px' }}>
              {selected.highlights.map((h, i) => {
                const [bg, color] = TYPE_COLORS[h.type];
                const isPlaying = playing === h.timestamp;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 10, marginBottom: 8, background: isPlaying ? '#f5f3ff' : '#f8fafc', border: `1px solid ${isPlaying ? '#c4b5fd' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all .1s' }}
                    onClick={() => setPlaying(isPlaying ? null : h.timestamp)}>
                    <div style={{ width: 48, height: 36, background: '#0f172a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                      <Play size={12} style={{ color: isPlaying ? '#818cf8' : '#fff', marginLeft: 1 }} />
                      <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 8, color: '#94a3b8', fontFamily: 'monospace' }}>{h.timestamp}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 3 }}>{h.label}</div>
                      <span style={{ fontSize: 10, background: bg, color, borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{h.type}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{h.score}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>AI clip score</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
