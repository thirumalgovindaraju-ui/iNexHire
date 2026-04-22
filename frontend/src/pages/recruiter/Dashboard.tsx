// src/pages/recruiter/Dashboard.tsx — Enterprise Edition
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, CheckCircle, TrendingUp, Plus, ArrowRight,
  Clock, Zap, Star, AlertTriangle, Activity, Target, Award,
  ChevronUp, ChevronDown, BarChart3, Brain
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import { Button, StatusBadge, ScoreRing, Spinner } from '../../components/ui';
import type { DashboardMetrics } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface RecentInterview {
  id: string; candidateName: string; candidateEmail: string;
  openingTitle: string; status: string; completedAt?: string;
  score?: number; recommendation?: string; decision?: string;
}

const S = {
  page: { padding: '24px 28px', maxWidth: 1280, margin: '0 auto' } as React.CSSProperties,
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 } as React.CSSProperties,
  metric: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' } as React.CSSProperties,
  metricLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 6 } as React.CSSProperties,
  metricValue: { fontSize: 26, fontWeight: 600, color: '#0f172a', marginBottom: 4 } as React.CSSProperties,
  metricSub: { fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' } as React.CSSProperties,
  cardHeader: { padding: '16px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as React.CSSProperties,
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a' } as React.CSSProperties,
  cardBody: { padding: '0 18px 18px' } as React.CSSProperties,
};

const ICON_COLORS: Record<string, [string, string]> = {
  indigo: ['#eef2ff', '#4f46e5'],
  violet: ['#f5f3ff', '#7c3aed'],
  emerald: ['#ecfdf5', '#10b981'],
  amber: ['#fffbeb', '#f59e0b'],
  cyan: ['#ecfeff', '#06b6d4'],
};

function MetricIcon({ color, children }: { color: string; children: React.ReactNode }) {
  const [bg, fg] = ICON_COLORS[color] ?? ['#f1f5f9', '#475569'];
  return (
    <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <span style={{ color: fg, display: 'flex', alignItems: 'center' }}>{children}</span>
    </div>
  );
}

function TrendBadge({ delta, suffix = '' }: { delta: number; suffix?: string }) {
  const up = delta >= 0;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: up ? '#10b981' : '#f43f5e', fontSize: 11 }}>
      {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      {Math.abs(delta)}{suffix}
    </span>
  );
}

function AIInsightBar() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)',
      border: '1px solid #c7d2fe',
      borderRadius: 12, padding: '14px 18px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ width: 32, height: 32, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Brain size={16} style={{ color: '#fff' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#3730a3', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, background: '#4f46e5', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          AI Hiring Intelligence — Live Summary
        </div>
        <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.6 }}>
          <strong>This week:</strong> 47 interviews completed, avg score 74% (+6 pts vs last week). Top performers in <em>Senior Backend Engineer</em> pipeline — 3 candidates scored 90+.{' '}
          <strong>Action needed:</strong> 12 candidates pending recruiter decision, 2 offer letters awaiting signature.
          <span style={{ color: '#d97706', marginLeft: 6 }}>⚠ Bias risk flagged in 1 job description.</span>
        </div>
      </div>
    </div>
  );
}

function PipelineStage({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{count} · {pct}%</span>
      </div>
      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recent, setRecent] = useState<RecentInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((data) => {
      setMetrics(data.metrics);
      setRecent(data.recentInterviews ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spinner size={32} />
    </div>
  );

  const totalDone = (metrics?.completedInterviews ?? 0) + (metrics?.evaluatedInterviews ?? 0);
  const totalCandidates = metrics?.totalCandidates ?? 1;

  return (
    <div style={S.page}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Executive Overview</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Your hiring pipeline at a glance — updated live</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/analytics')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#334155' }}
          >
            <BarChart3 size={15} /> View Analytics
          </button>
          <Button icon={<Plus size={15} />} onClick={() => navigate('/openings/new')}>
            New Opening
          </Button>
        </div>
      </div>

      <AIInsightBar />

      {/* Metrics */}
      <div style={S.metricGrid}>
        <div style={S.metric}>
          <MetricIcon color="indigo"><Briefcase size={16} /></MetricIcon>
          <div style={S.metricLabel}>Active Openings</div>
          <div style={S.metricValue}>{metrics?.activeOpenings ?? 0}</div>
          <div style={S.metricSub}><TrendBadge delta={3} /> <span style={{ color: '#94a3b8' }}>this month</span></div>
        </div>
        <div style={S.metric}>
          <MetricIcon color="violet"><Users size={16} /></MetricIcon>
          <div style={S.metricLabel}>Total Candidates</div>
          <div style={S.metricValue}>{metrics?.totalCandidates ?? 0}</div>
          <div style={S.metricSub}><TrendBadge delta={47} /> <span style={{ color: '#94a3b8' }}>this week</span></div>
        </div>
        <div style={S.metric}>
          <MetricIcon color="emerald"><CheckCircle size={16} /></MetricIcon>
          <div style={S.metricLabel}>Interviews Done</div>
          <div style={S.metricValue}>{totalDone}</div>
          <div style={S.metricSub}><span style={{ color: '#94a3b8' }}>{metrics?.completionRate ?? 0}% completion</span></div>
        </div>
        <div style={S.metric}>
          <MetricIcon color="amber"><Star size={16} /></MetricIcon>
          <div style={S.metricLabel}>Avg AI Score</div>
          <div style={S.metricValue}>{metrics?.avgScore ?? 0}%</div>
          <div style={S.metricSub}><TrendBadge delta={6} suffix=" pts" /> <span style={{ color: '#94a3b8' }}>vs last week</span></div>
        </div>
        <div style={S.metric}>
          <MetricIcon color="cyan"><Clock size={16} /></MetricIcon>
          <div style={S.metricLabel}>Avg Time to Hire</div>
          <div style={S.metricValue}>8.2d</div>
          <div style={S.metricSub}><TrendBadge delta={-3} suffix="d" /> <span style={{ color: '#94a3b8' }}>vs industry</span></div>
        </div>
      </div>

      {/* New Enterprise Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { icon: <AlertTriangle size={18} />, color: '#f43f5e', bg: '#fff1f2', label: 'Bias Detection', desc: 'AI-powered JD scanner flags gender, age & racial bias', isNew: true, path: '/compliance' },
          { icon: <Award size={18} />, color: '#10b981', bg: '#ecfdf5', label: 'Offer Automation', desc: 'Auto-generate & e-sign offer letters on hire decisions', isNew: true, path: '/offers' },
          { icon: <Target size={18} />, color: '#7c3aed', bg: '#f5f3ff', label: 'Talent Pool', desc: 'Surface past candidates matching new openings instantly', isNew: true, path: '/talent-pool' },
          { icon: <Activity size={18} />, color: '#06b6d4', bg: '#ecfeff', label: 'ATS & HRIS Sync', desc: 'Workday, Greenhouse, BambooHR & 12+ integrations', isNew: true, path: '/integrations' },
        ].map(f => (
          <div
            key={f.label}
            onClick={() => navigate(f.path)}
            style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
              padding: 16, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#818cf8'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
          >
            {f.isNew && <span style={{ display: 'inline-block', fontSize: 9, background: '#4f46e5', color: '#fff', borderRadius: 4, padding: '1px 6px', marginBottom: 8, fontWeight: 500 }}>NEW</span>}
            <div style={{ width: 36, height: 36, borderRadius: 9, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: f.color }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, marginBottom: 14 }}>
        {/* Recent interviews table */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div>
              <div style={S.cardTitle}>Recent Interviews</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>AI-evaluated candidates</div>
            </div>
            <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />} onClick={() => navigate('/candidates')}>
              View all
            </Button>
          </div>
          <div style={S.cardBody}>
            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No interviews yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Candidate', 'Role', 'Score', 'Recommendation', 'Status', 'Completed'].map(h => (
                      <th key={h} style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', paddingBottom: 8, paddingRight: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r.id} onClick={() => navigate(`/reports/${r.id}`)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { td.style.background = '#f8fafc'; }); }}
                      onMouseLeave={e => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { td.style.background = 'transparent'; }); }}
                    >
                      <td style={{ fontSize: 13, color: '#0f172a', padding: '9px 12px 9px 0', borderTop: '1px solid #f1f5f9', fontWeight: 500 }}>{r.candidateName}</td>
                      <td style={{ fontSize: 12, color: '#475569', padding: '9px 12px 9px 0', borderTop: '1px solid #f1f5f9' }}>{r.openingTitle}</td>
                      <td style={{ padding: '9px 12px 9px 0', borderTop: '1px solid #f1f5f9' }}>
                        {r.score != null ? <ScoreRing score={r.score} size={36} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 12px 9px 0', borderTop: '1px solid #f1f5f9' }}>
                        {r.recommendation ? <StatusBadge status={r.recommendation} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 12px 9px 0', borderTop: '1px solid #f1f5f9' }}><StatusBadge status={r.status} /></td>
                      <td style={{ fontSize: 11, color: '#94a3b8', padding: '9px 0 9px 0', borderTop: '1px solid #f1f5f9' }}>
                        {r.completedAt ? formatDistanceToNow(new Date(r.completedAt), { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pipeline sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardTitle}>Hiring Funnel</div>
            </div>
            <div style={S.cardBody}>
              <PipelineStage label="Applied" count={totalCandidates} pct={100} color="#4f46e5" />
              <PipelineStage label="Invited" count={Math.round(totalCandidates * 0.72)} pct={72} color="#7c3aed" />
              <PipelineStage label="Completed" count={totalDone} pct={Math.round((totalDone / Math.max(totalCandidates, 1)) * 100)} color="#818cf8" />
              <PipelineStage label="Evaluated" count={metrics?.evaluatedInterviews ?? 0} pct={Math.round(((metrics?.evaluatedInterviews ?? 0) / Math.max(totalCandidates, 1)) * 100)} color="#10b981" />
              <PipelineStage label="Offer Sent" count={Math.round(totalCandidates * 0.08)} pct={8} color="#f43f5e" />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardTitle}>Quick Actions</div>
            </div>
            <div style={S.cardBody}>
              {[
                { label: 'Review pending decisions', count: 12, color: '#f59e0b', path: '/candidates' },
                { label: 'Sign pending offers', count: 2, color: '#f43f5e', path: '/offers' },
                { label: 'Review bias alerts', count: 1, color: '#f43f5e', path: '/compliance' },
                { label: 'Sync integrations', count: 0, color: '#10b981', path: '/integrations' },
              ].map(a => (
                <div
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', fontSize: 12, color: '#334155',
                  }}
                >
                  <span>{a.label}</span>
                  {a.count > 0 && (
                    <span style={{ background: a.color, color: '#fff', fontSize: 10, borderRadius: 9, padding: '1px 7px', fontWeight: 600 }}>{a.count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Strong Hire rate', value: `${metrics?.recommendationCounts?.STRONG_HIRE ?? 0}`, suffix: ' candidates', icon: <Zap size={14} />, color: '#10b981' },
          { label: 'Avg interview duration', value: '24', suffix: ' min', icon: <Clock size={14} />, color: '#4f46e5' },
          { label: 'Proctoring flags', value: '3.2', suffix: '% flag rate', icon: <AlertTriangle size={14} />, color: '#f59e0b' },
          { label: 'Talent pool size', value: '142', suffix: ' ready candidates', icon: <Target size={14} />, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{s.value}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>{s.suffix}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
