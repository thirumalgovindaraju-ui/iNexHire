// src/pages/toastmasters/MeetingsList.tsx — meeting list dashboard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, FileBarChart, MapPin, Mic2, Plus, Play, Quote, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';
import { TM_GOLD, TM_NAVY, TM_STATUS_STYLE } from '../../components/toastmasters/theme';
import { meetingsApi, membersApi, withColdStartRetry } from '../../services/toastmasters';
import type { TmMeeting } from '../../services/toastmasters';

export default function MeetingsList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<TmMeeting[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [warmingUp, setWarmingUp] = useState(false);

  useEffect(() => {
    // This fetch also doubles as the "wake up Render" ping — the Toastmasters
    // API is on a free-tier instance that spins down when idle, so the first
    // hit of the day can take 20-30s. If it's not back fast, say so.
    const warmupTimer = setTimeout(() => setWarmingUp(true), 2500);
    withColdStartRetry(() => Promise.all([meetingsApi.list(), membersApi.list()]))
      .then(([m, members]) => { setMeetings(m); setMemberCount(members.length); })
      .finally(() => { clearTimeout(warmupTimer); setWarmingUp(false); setLoading(false); });
    return () => clearTimeout(warmupTimer);
  }, []);

  const thisYear = meetings.filter((m) => new Date(m.date).getFullYear() === new Date().getFullYear()).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Spinner size={28} />
        {warmingUp && (
          <p className="text-sm text-surface-400">Connecting... server may be waking up from idle (up to 30s)</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Toastmasters Meeting Manager"
        description="iOpex Toastmasters Club — plan, run and report on club meetings"
        action={<Button onClick={() => navigate('/toastmasters/new')}><Plus size={14} /> New Meeting</Button>}
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center"><CalendarDays size={16} className="text-brand-600" /></div>
          <div><p className="text-xs text-surface-500">Meetings this year</p><p className="text-lg font-bold text-surface-900">{thisYear}</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center"><Users size={16} className="text-brand-600" /></div>
          <div><p className="text-xs text-surface-500">Club members</p><p className="text-lg font-bold text-surface-900">{memberCount}</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center"><Mic2 size={16} className="text-brand-600" /></div>
          <div><p className="text-xs text-surface-500">Total meetings</p><p className="text-lg font-bold text-surface-900">{meetings.length}</p></div>
        </Card>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<Mic2 size={22} />}
          title="No meetings yet"
          description="Create your first club meeting to build an agenda and assign roles."
          action={<Button onClick={() => navigate('/toastmasters/new')}><Plus size={14} /> New Meeting</Button>}
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {meetings.map((m) => (
            <Card key={m.id} className="overflow-hidden flex flex-col">
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: TM_NAVY }}>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {m.title}
                    {m.meetingNumber != null && <span className="opacity-70 font-normal"> · No. {m.meetingNumber}</span>}
                  </p>
                  {m.theme && <p className="text-xs mt-0.5" style={{ color: TM_GOLD }}>{m.theme}</p>}
                </div>
                <Badge className={TM_STATUS_STYLE[m.status]}>{m.status.replace('_', ' ')}</Badge>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-surface-600">
                  <CalendarDays size={12} className="text-surface-400" />
                  {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {m.venue && (
                  <div className="flex items-center gap-1.5 text-xs text-surface-600">
                    <MapPin size={12} className="text-surface-400" /> {m.venue}
                  </div>
                )}
                {m.wordOfDay && (
                  <div className="flex items-center gap-1.5 text-xs text-surface-600">
                    <Quote size={12} className="text-surface-400" /> Word of the Day: <span className="font-medium text-surface-900">{m.wordOfDay}</span>
                  </div>
                )}
                {m.roleCount && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users size={12} className="text-surface-400" />
                    <span className={m.roleCount.filled === m.roleCount.total ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                      {m.roleCount.filled} / {m.roleCount.total} roles filled
                    </span>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-3">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/toastmasters/${m.id}`)}>View</Button>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/toastmasters/${m.id}/run`)}><Play size={12} /> Run</Button>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/toastmasters/${m.id}/report`)}><FileBarChart size={12} /> Report</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
