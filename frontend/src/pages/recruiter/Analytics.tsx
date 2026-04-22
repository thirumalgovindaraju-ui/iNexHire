// src/pages/recruiter/Analytics.tsx — ENHANCED Enterprise Analytics
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, FunnelChart, Funnel, LabelList } from 'recharts';
import { dashboardApi } from '../../services/api';
import { Spinner, Button } from '../../components/ui';
import { Download, TrendingUp, TrendingDown, BarChart3, Clock, Users, DollarSign } from 'lucide-react';

const COLORS = { STRONG_HIRE: '#10b981', HIRE: '#22c55e', NEUTRAL: '#f59e0b', REJECT: '#ef4444' };
const INDIGO = '#4f46e5';

const TREND_DATA = [
  { week: 'W1', interviews: 28, hired: 3, avgScore: 68 },
  { week: 'W2', interviews: 34, hired: 4, avgScore: 71 },
  { week: 'W3', interviews: 42, hired: 5, avgScore: 70 },
  { week: 'W4', interviews: 38, hired: 6, avgScore: 73 },
  { week: 'W5', interviews: 51, hired: 7, avgScore: 75 },
  { week: 'W6', interviews: 47, hired: 5, avgScore: 74 },
];

const DEPT_DATA = [
  { dept: 'Engineering', candidates: 142, hired: 18, avgScore: 76 },
  { dept: 'Product', candidates: 64, hired: 8, avgScore: 74 },
  { dept: 'Sales', candidates: 89, hired: 14, avgScore: 71 },
  { dept: 'Design', candidates: 41, hired: 5, avgScore: 79 },
  { dept: 'Data', candidates: 45, hired: 6, avgScore: 77 },
];

const TIME_DATA = [
  { month: 'Jan', tth: 14 }, { month: 'Feb', tth: 12 }, { month: 'Mar', tth: 10 },
  { month: 'Apr', tth: 9 }, { month: 'May', tth: 8.5 }, { month: 'Jun', tth: 8.2 },
];

const FUNNEL_DATA = [
  { name: 'Applied', value: 381, fill: '#4f46e5' },
  { name: 'Invited', value: 275, fill: '#7c3aed' },
  { name: 'Completed', value: 247, fill: '#818cf8' },
  { name: 'Evaluated', value: 198, fill: '#10b981' },
  { name: 'Offer Sent', value: 31, fill: '#f59e0b' },
  { name: 'Hired', value: 24, fill: '#f43f5e' },
];

function StatCard({ label, value, sub, trend, icon, color }: any) {
  const up = trend > 0;
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: up ? '#10b981' : '#f43f5e' }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => { dashboardApi.get().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={28} /></div>;

  const recCounts = data?.metrics?.recommendationCounts ?? {};
  const pieData = Object.entries(recCounts).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Analytics & Insights</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Comprehensive hiring intelligence — funnel, trends, cost, and team performance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['7d','30d','90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? '#4f46e5' : '#fff', color: period === p ? '#fff' : '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{p}</button>
          ))}
          <Button variant="secondary" icon={<Download size={13} />}>Export PDF</Button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Openings" value={data?.metrics?.totalOpenings ?? 0} trend={12} color="#4f46e5" icon={<BarChart3 size={15} />} />
        <StatCard label="Total Candidates" value={data?.metrics?.totalCandidates ?? 0} trend={18} color="#7c3aed" icon={<Users size={15} />} />
        <StatCard label="Completion Rate" value={`${data?.metrics?.completionRate ?? 0}%`} trend={4} color="#10b981" icon={<TrendingUp size={15} />} sub="vs 85% last period" />
        <StatCard label="Avg Time to Hire" value="8.2d" trend={-28} color="#f59e0b" icon={<Clock size={15} />} sub="down from 11.4d" />
        <StatCard label="Cost per Hire" value="₹4,200" trend={-35} color="#f43f5e" icon={<DollarSign size={15} />} sub="down from ₹6,500" />
      </div>

      {/* Row 1: Funnel + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Hiring Funnel (Conversion)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FUNNEL_DATA.map((f, i) => {
              const prev = i > 0 ? FUNNEL_DATA[i-1].value : f.value;
              const conv = Math.round((f.value / FUNNEL_DATA[0].value) * 100);
              const drop = i > 0 ? Math.round(((prev - f.value) / prev) * 100) : 0;
              return (
                <div key={f.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#334155' }}>{f.name}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {i > 0 && <span style={{ fontSize: 10, color: '#f43f5e' }}>-{drop}% drop</span>}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{f.value} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>({conv}%)</span></span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${conv}%`, background: f.fill, borderRadius: 5, transition: 'width .6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>AI Recommendations Breakdown</div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map(({ name }) => <Cell key={name} fill={(COLORS as any)[name] ?? '#94a3b8'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, paddingLeft: 10 }}>
                {pieData.map(({ name, value }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: (COLORS as any)[name] ?? '#94a3b8', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 500 }}>{name.replace('_', ' ')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{value as number} candidates</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No evaluation data yet</div>}
        </div>
      </div>

      {/* Row 2: Weekly trend + Time to hire */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Weekly Interview Volume & Score Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND_DATA}>
              <defs>
                <linearGradient id="gIntv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[60, 85]} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="interviews" stroke="#4f46e5" fill="url(#gIntv)" strokeWidth={2} name="Interviews" />
              <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Avg Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Time to Hire Trend (Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TIME_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[6, 16]} />
              <Tooltip formatter={(v: any) => [`${v} days`, 'Avg TTH']} />
              <Line type="monotone" dataKey="tth" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Department breakdown */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Performance by Department</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Department', 'Candidates', 'Hired', 'Conversion', 'Avg Score', 'Performance'].map(h => (
                <th key={h} style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left', paddingBottom: 10, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPT_DATA.map(d => {
              const conv = Math.round((d.hired / d.candidates) * 100);
              return (
                <tr key={d.dept}>
                  <td style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{d.dept}</td>
                  <td style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#475569' }}>{d.candidates}</td>
                  <td style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#475569' }}>{d.hired}</td>
                  <td style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#475569' }}>{conv}%</td>
                  <td style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: d.avgScore >= 75 ? '#10b981' : '#f59e0b' }}>{d.avgScore}</td>
                  <td style={{ padding: '10px 16px 10px 0', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ height: 6, width: 120, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.avgScore}%`, background: d.avgScore >= 75 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cost savings */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius: 12, padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cost Savings</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>₹18.4L</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Saved this quarter vs traditional hiring</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Interviewer Hours Saved</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>1,240h</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Panel time reallocated to strategic work</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Offer Accept Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>77%</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Up from 61% before NexHire</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>90-Day Retention</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>94%</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Hired candidates still employed at 90 days</div>
        </div>
      </div>
    </div>
  );
}
