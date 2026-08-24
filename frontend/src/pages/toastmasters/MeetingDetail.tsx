// src/pages/toastmasters/MeetingDetail.tsx — literal iOpex Toastmasters agenda card
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Pencil, Play, Printer, Trash2, Users, FileBarChart } from 'lucide-react';
import { Button, Input, Modal, Select, Spinner, Textarea, useToast } from '../../components/ui';
import MeetingHeaderCard from '../../components/toastmasters/MeetingHeaderCard';
import { TM_GOLD, TM_GOLD_DARK, TM_NAVY, TM_NAVY_LIGHT, formatTime12h } from '../../components/toastmasters/theme';
import { extractError } from '../../services/api';
import {
  TM_ROLE_PLAYERS_LEFT, TM_ROLE_PLAYERS_RIGHT, TM_ROLE_SHORT_LABELS, meetingsApi,
} from '../../services/toastmasters';
import type { TmMeeting, TmRoleAssignment } from '../../services/toastmasters';

interface EditForm {
  title: string; theme: string; venue: string; date: string; startTime: string; endTime: string;
  wordOfDay: string; wordMeaning: string; wordType: string; status: string;
}

function RolePlayerRow({ role }: { role?: TmRoleAssignment }) {
  if (!role) return null;
  return (
    <p className="text-sm text-surface-800">
      <span className="font-semibold">{TM_ROLE_SHORT_LABELS[role.roleName] ?? role.roleName}</span>
      {' - '}
      {role.member ? `TM ${role.member.name}` : <span className="text-surface-400 italic">Unassigned</span>}
    </p>
  );
}

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    meetingsApi.get(id)
      .then(setMeeting)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  function openEdit() {
    if (!meeting) return;
    setEditForm({
      title: meeting.title, theme: meeting.theme ?? '', venue: meeting.venue ?? '',
      date: meeting.date.slice(0, 10), startTime: meeting.startTime ?? '', endTime: meeting.endTime ?? '',
      wordOfDay: meeting.wordOfDay ?? '', wordMeaning: meeting.wordMeaning ?? '', wordType: meeting.wordType ?? '',
      status: meeting.status,
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!id || !editForm) return;
    setSaving(true);
    try {
      const updated = await meetingsApi.update(id, editForm);
      setMeeting(updated);
      setEditOpen(false);
      show('Meeting updated');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this meeting? This cannot be undone.')) return;
    try {
      await meetingsApi.remove(id);
      navigate('/toastmasters');
    } catch (err) {
      show(extractError(err), 'error');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
        <p className="text-surface-700 mb-3">{error}</p>
        <Button variant="secondary" onClick={load}>Retry</Button>
      </div>
    );
  }

  if (!meeting) return <p className="p-6 text-surface-500">Meeting not found.</p>;

  const roleByName = new Map((meeting.roleAssignments ?? []).map((r) => [r.roleName, r]));
  const coreLeft = TM_ROLE_PLAYERS_LEFT.map((n) => roleByName.get(n));
  const coreRight = TM_ROLE_PLAYERS_RIGHT.map((n) => roleByName.get(n));
  const remaining = (meeting.roleAssignments ?? []).filter(
    (r) => !TM_ROLE_PLAYERS_LEFT.includes(r.roleName) && !TM_ROLE_PLAYERS_RIGHT.includes(r.roleName)
  );
  const remainingLeft = remaining.slice(0, Math.ceil(remaining.length / 2));
  const remainingRight = remaining.slice(Math.ceil(remaining.length / 2));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer />
      <div className="flex justify-end mb-2 print:hidden">
        <button onClick={handleDelete} className="text-surface-400 hover:text-red-500 p-1" title="Delete meeting">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm border-x border-b" style={{ borderColor: TM_GOLD }}>
        <MeetingHeaderCard meeting={meeting} />

        {/* Agenda — boxed 4-column table on navy background */}
        <div style={{ background: TM_NAVY }} className="px-6 py-5">
          <h2 className="text-center font-extrabold uppercase tracking-widest mb-3" style={{ color: TM_GOLD }}>Agenda</h2>
          <div className="border rounded-md overflow-hidden" style={{ borderColor: 'rgba(201,162,39,0.35)' }}>
            {(meeting.agendaItems ?? []).map((item, i) => (
              <div
                key={item.id}
                className="grid"
                style={{ gridTemplateColumns: '90px 90px 90px 1fr', background: i % 2 === 0 ? TM_NAVY : TM_NAVY_LIGHT }}
              >
                <div className="px-2 py-2.5 text-center text-xs font-semibold text-white border-r" style={{ borderColor: 'rgba(201,162,39,0.25)' }}>
                  {item.durationMins != null ? `${item.durationMins} MINS` : '—'}
                </div>
                <div className="px-2 py-2.5 text-center text-xs font-semibold text-white border-r" style={{ borderColor: 'rgba(201,162,39,0.25)' }}>
                  {formatTime12h(item.plannedStart) ?? '—'}
                </div>
                <div className="px-2 py-2.5 text-center text-xs font-semibold text-white border-r" style={{ borderColor: 'rgba(201,162,39,0.25)' }}>
                  {formatTime12h(item.plannedEnd) ?? '—'}
                </div>
                <div className="px-3 py-2.5 text-sm text-white font-medium">{item.activityName}</div>
              </div>
            ))}
            {(meeting.agendaItems?.length ?? 0) === 0 && (
              <div className="px-3 py-4 text-center text-white/50 text-sm">No agenda items yet</div>
            )}
          </div>
        </div>

        {/* Role Players */}
        <div className="px-6 py-6 bg-surface-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: TM_GOLD }} />
            <h2 className="font-extrabold uppercase tracking-widest text-surface-900 flex-shrink-0">Role Players</h2>
            <div className="flex-1 h-px" style={{ background: TM_GOLD }} />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex flex-col gap-2">
              {coreLeft.map((r, i) => <RolePlayerRow key={i} role={r} />)}
              {remainingLeft.map((r) => <RolePlayerRow key={r.id} role={r} />)}
            </div>
            <div className="flex flex-col gap-2">
              {coreRight.map((r, i) => <RolePlayerRow key={i} role={r} />)}
              {remainingRight.map((r) => <RolePlayerRow key={r.id} role={r} />)}
            </div>
          </div>
        </div>

        {/* Educational Session */}
        {(meeting.educationSessions?.length ?? 0) > 0 && (
          <div className="px-6 py-6 bg-white border-t border-surface-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: TM_GOLD }} />
              <h2 className="font-extrabold uppercase tracking-widest text-surface-900 flex-shrink-0">Educational Session</h2>
              <div className="flex-1 h-px" style={{ background: TM_GOLD }} />
            </div>
            <table className="w-full text-sm border border-surface-200 rounded-md overflow-hidden">
              <thead>
                <tr style={{ background: TM_NAVY }}>
                  <th className="text-left px-3 py-2 text-white font-semibold">Topic</th>
                  <th className="text-left px-3 py-2 text-white font-semibold">Presenter</th>
                </tr>
              </thead>
              <tbody>
                {meeting.educationSessions!.map((s) => (
                  <tr key={s.id} className="border-t border-surface-100">
                    <td className="px-3 py-2 text-surface-900">{s.topic}</td>
                    <td className="px-3 py-2 text-surface-700">{s.presenter?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2 mt-5 print:hidden">
        <button onClick={openEdit} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold border-2" style={{ borderColor: TM_NAVY, color: TM_NAVY }}>
          <Pencil size={14} /> Edit Meeting
        </button>
        <button onClick={() => navigate(`/toastmasters/${id}/run`)} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: TM_NAVY }}>
          <Play size={14} /> Run Meeting
        </button>
        <button onClick={() => navigate(`/toastmasters/${id}/roles`)} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold" style={{ background: TM_GOLD, color: TM_NAVY }}>
          <Users size={14} /> Assign Roles
        </button>
        <button onClick={() => navigate(`/toastmasters/${id}/report`)} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold border-2" style={{ borderColor: TM_GOLD, color: TM_GOLD_DARK }}>
          <FileBarChart size={14} /> View Report
        </button>
      </div>
      <div className="flex justify-end mt-3 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}><Printer size={13} /> Export to PDF</Button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Meeting" footer={
        <>
          <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={saveEdit}>Save</Button>
        </>
      }>
        {editForm && (
          <div className="flex flex-col gap-3">
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <Input label="Theme" value={editForm.theme} onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              <Input label="Venue" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
              <Input label="Start time" type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} />
              <Input label="End time" type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} />
            </div>
            <Input label="Word of the day" value={editForm.wordOfDay} onChange={(e) => setEditForm({ ...editForm, wordOfDay: e.target.value })} />
            <Textarea label="Word meaning" rows={2} value={editForm.wordMeaning} onChange={(e) => setEditForm({ ...editForm, wordMeaning: e.target.value })} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'PLANNED', label: 'Planned' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
