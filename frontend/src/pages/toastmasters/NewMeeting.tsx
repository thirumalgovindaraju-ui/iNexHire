// src/pages/toastmasters/NewMeeting.tsx — meeting setup form with auto-calculated agenda times
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input, PageHeader, useToast } from '../../components/ui';
import { addMinutes } from '../../components/toastmasters/theme';
import { findRoleForActivity } from '../../components/toastmasters/matchAgendaRole';
import { extractError } from '../../services/api';
import { agendaApi, isColdStartTimeout, meetingsApi, withColdStartRetry } from '../../services/toastmasters';

const DEFAULT_AGENDA = [
  { activityName: "SAA's Opening", durationMins: 2 },
  { activityName: "PO's Opening Address", durationMins: 5 },
  { activityName: 'Timer Introduction', durationMins: 2 },
  { activityName: 'Educational Session', durationMins: 20 },
  { activityName: 'Table Topics Session', durationMins: 17 },
  { activityName: 'Prepared Speeches', durationMins: 20 },
  { activityName: 'Timer Report', durationMins: 4 },
  { activityName: "PO's Closing Address + Guest Feedback", durationMins: 5 },
  { activityName: 'Next Meeting Planning', durationMins: 5 },
];

export default function NewMeeting() {
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [meetingNumber, setMeetingNumber] = useState('');
  const [theme, setTheme] = useState('');
  const [wordOfDay, setWordOfDay] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordType, setWordType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [venue, setVenue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [agenda, setAgenda] = useState(DEFAULT_AGENDA);

  const withTimes = agenda.reduce<{ rows: (typeof agenda[number] & { start: string; end: string })[]; cursor: string }>(
    (acc, item) => {
      const start = acc.cursor;
      const end = addMinutes(start, item.durationMins || 0);
      acc.rows.push({ ...item, start, end });
      acc.cursor = end;
      return acc;
    },
    { rows: [], cursor: startTime || '08:00' }
  ).rows;

  function updateRow(i: number, patch: Partial<typeof agenda[number]>) {
    setAgenda((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setAgenda((rows) => rows.filter((_, idx) => idx !== i));
  }
  function reorder(to: number) {
    if (dragIndex == null || dragIndex === to) return;
    setAgenda((rows) => {
      const next = [...rows];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  async function handleCreate() {
    if (!title || !date) { show('Title and date are required', 'error'); return; }
    setSaving(true);
    try {
      const meeting = await withColdStartRetry(
        () => meetingsApi.create({
          title, date, theme: theme || undefined,
          meetingNumber: meetingNumber ? Number(meetingNumber) : undefined,
          wordOfDay: wordOfDay || undefined, wordMeaning: wordMeaning || undefined, wordType: wordType || undefined,
          startTime: startTime || undefined, endTime: withTimes[withTimes.length - 1]?.end, venue: venue || undefined,
        }),
        () => show('Server is waking up, retrying...', 'error')
      );
      const roles = meeting.roleAssignments ?? [];
      await agendaApi.replaceAll(meeting.id, withTimes.map((row, i) => ({
        sequence: i, activityName: row.activityName, durationMins: row.durationMins,
        plannedStart: row.start, plannedEnd: row.end,
        roleAssignmentId: findRoleForActivity(row.activityName, roles)?.id,
      })));
      show('Meeting created!');
      navigate(`/toastmasters/${meeting.id}`);
    } catch (err) {
      if (isColdStartTimeout(err)) {
        show('Server is starting up (free tier). Please click Create again.', 'error', { label: 'Retry', onClick: handleCreate });
      } else {
        show(extractError(err), 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="New Meeting" description="Set up the meeting header and agenda" />
      <ToastContainer />

      <Card className="p-5 mb-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Demo Meeting No. 2" />
          <Input label="Meeting number" type="number" value={meetingNumber} onChange={(e) => setMeetingNumber(e.target.value)} />
          <Input label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="New Horizons" />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <Input label="Word of the day" value={wordOfDay} onChange={(e) => setWordOfDay(e.target.value)} />
          <Input label="Word type" value={wordType} onChange={(e) => setWordType(e.target.value)} placeholder="noun / verb / adjective" />
          <div className="col-span-2">
            <Input label="Word meaning" value={wordMeaning} onChange={(e) => setWordMeaning(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-surface-900">Agenda</h3>
          <Button size="sm" variant="secondary" onClick={() => setAgenda((r) => [...r, { activityName: '', durationMins: 5 }])}>
            <Plus size={13} /> Add slot
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {withTimes.map((row, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder(i)}
              className="flex items-center gap-2 bg-surface-50 rounded-lg p-2"
            >
              <GripVertical size={14} className="text-surface-300 cursor-grab flex-shrink-0" />
              <span className="font-mono text-xs text-surface-500 w-24 flex-shrink-0">{row.start}–{row.end}</span>
              <input
                type="number" value={row.durationMins}
                onChange={(e) => updateRow(i, { durationMins: Number(e.target.value) })}
                className="w-16 text-sm border border-surface-200 rounded px-2 py-1"
              />
              <input
                value={row.activityName}
                onChange={(e) => updateRow(i, { activityName: e.target.value })}
                placeholder="Activity"
                className="flex-1 text-sm border border-surface-200 rounded px-2 py-1"
              />
              <button onClick={() => removeRow(i)} className="text-surface-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end mt-5">
        <Button loading={saving} onClick={handleCreate}>{saving ? 'Creating meeting...' : 'Create Meeting'}</Button>
      </div>
    </div>
  );
}
