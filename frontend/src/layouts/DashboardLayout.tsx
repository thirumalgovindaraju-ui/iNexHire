// src/layouts/DashboardLayout.tsx — NexHire v3 Final
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, BarChart2, LogOut, Bell, Search, Shield, FileText, Zap, Clock, Settings, Database, GitBranch, Brain, Heart, Trophy, ClipboardList, Palette, MessageSquare, Play, Globe, AlertTriangle, UserCog, MessageCircle, TrendingUp, Key } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { useState } from 'react';

const NAV = [
  { section: 'Workspace', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/openings', icon: Briefcase, label: 'Job Openings' },
    { to: '/candidates', icon: Users, label: 'Candidates' },
    { to: '/pipeline', icon: GitBranch, label: 'Pipeline Board' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/rankings', icon: Trophy, label: 'Candidate Ranking' },
  ]},
  { section: 'AI Intelligence', items: [
    { to: '/sentiment', icon: Brain, label: 'Sentiment & Emotion', badge: 'NEW' },
    { to: '/culture-fit', icon: Heart, label: 'Culture Fit', badge: 'NEW' },
    { to: '/retention', icon: TrendingUp, label: 'Predictive Retention', badge: 'NEW' },
    { to: '/video-highlights', icon: Play, label: 'Video Highlights', badge: 'NEW' },
    { to: '/panel-review', icon: MessageSquare, label: 'Panel Review' },
    { to: '/scorecards', icon: ClipboardList, label: 'Scorecards' },
    { to: '/mockmate', icon: Zap, label: 'MockMate Prep' },
    { to: '/chatbot', icon: MessageCircle, label: 'AI Chatbot', badge: 'NEW' },
  ]},
  { section: 'Enterprise', items: [
    { to: '/compliance', icon: Shield, label: 'Compliance & Bias', badge: '1' },
    { to: '/offers', icon: FileText, label: 'Offer Letters' },
    { to: '/talent-pool', icon: Database, label: 'Talent Pool' },
    { to: '/languages', icon: Globe, label: 'Multilingual' },
    { to: '/integrations', icon: Zap, label: 'Integrations' },
    { to: '/branding', icon: Palette, label: 'White-label' },
  ]},
  { section: 'Settings', items: [
    { to: '/settings/team', icon: UserCog, label: 'Team & Roles' },
    { to: '/settings/sso', icon: Key, label: 'SSO & Security' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/audit', icon: Clock, label: 'Audit Logs' },
  ]},
];

export default function DashboardLayout() {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [_n, setN] = useState(false);

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside style={{ width: 236, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: '#4f46e5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>N</span>
          </div>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>NexHire</span>
          <span style={{ fontSize: 8, color: '#818cf8', border: '1px solid #818cf8', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>v3 ENT</span>
        </div>
        <div style={{ padding: '10px 10px 4px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#94a3b8', fontSize: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={12} /><span>Quick search...</span>
            <kbd style={{ marginLeft: 'auto', fontSize: 9, color: '#475569', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '4px 8px 8px', overflowY: 'auto' }}>
          {NAV.map(section => (
            <div key={section.section}>
              <p style={{ fontSize: 9.5, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '12px 10px 5px', fontWeight: 600, margin: 0 }}>{section.section}</p>
              {section.items.map(({ to, icon: Icon, label, badge }: any) => (
                <NavLink key={to} to={to} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7,
                  fontSize: 12.5, fontWeight: 500, marginBottom: 1, textDecoration: 'none',
                  background: isActive ? '#4f46e5' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'all .1s',
                })}>
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  {badge && <span style={{ fontSize: 8, borderRadius: 4, padding: '1px 5px', fontWeight: 600, flexShrink: 0, background: badge === 'NEW' ? '#4f46e5' : '#f59e0b', color: badge === 'NEW' ? '#c7d2fe' : '#fff', border: badge === 'NEW' ? '1px solid #6366f1' : 'none' }}>{badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 11.5, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ color: '#475569', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.organization?.name}</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, flexShrink: 0 }}><LogOut size={13} /></button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 52, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', padding: '3px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
              Bias alert on ML Engineer JD — review recommended
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setN(v => !v)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Bell size={14} />
              </button>
              <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#f43f5e', borderRadius: '50%', border: '1.5px solid #fff' }} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}><Outlet /></main>
      </div>
    </div>
  );
}
