// src/pages/toastmasters/Members.tsx — club member directory management
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Spinner, useToast } from '../../components/ui';
import { extractError } from '../../services/api';
import { membersApi } from '../../services/toastmasters';
import type { TmMember } from '../../services/toastmasters';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-green-500' : 'bg-surface-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function MemberRow({ member, onSaved, onDeleted }: {
  member: TmMember;
  onSaved: (m: TmMember) => void;
  onDeleted: (id: string) => void;
}) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email ?? '');
  const [memberNumber, setMemberNumber] = useState(member.memberNumber ?? '');
  const [pathwaysPath, setPathwaysPath] = useState(member.pathwaysPath ?? '');
  const [active, setActive] = useState(member.active);

  function cancel() {
    setName(member.name);
    setEmail(member.email ?? '');
    setMemberNumber(member.memberNumber ?? '');
    setPathwaysPath(member.pathwaysPath ?? '');
    setActive(member.active);
    setEditing(false);
  }

  async function save() {
    if (!name.trim()) { show('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const updated = await membersApi.update(member.id, { name, email, memberNumber, pathwaysPath, active });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleActiveToggle(value: boolean) {
    setActive(value);
    if (editing) return; // will be saved with the rest on "Save"
    try {
      const updated = await membersApi.update(member.id, { active: value });
      onSaved(updated);
    } catch (err) {
      setActive(!value);
      show(extractError(err), 'error');
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${member.name} from the member directory? This cannot be undone.`)) return;
    try {
      await membersApi.remove(member.id);
      onDeleted(member.id);
    } catch (err) {
      show(extractError(err), 'error');
    }
  }

  if (editing) {
    return (
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Member number" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} />
          <Input placeholder="Pathways path" value={pathwaysPath} onChange={(e) => setPathwaysPath(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-surface-600">
            <Toggle checked={active} onChange={setActive} /> Active
          </label>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={save}>Save</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserCircle2 size={28} className="text-surface-300 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-surface-900 truncate">{member.name}</p>
          <p className="text-xs text-surface-500 truncate">
            {[member.email, member.memberNumber && `#${member.memberNumber}`, member.pathwaysPath].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant={active ? 'green' : 'gray'}>{active ? 'Active' : 'Inactive'}</Badge>
        <Toggle checked={active} onChange={handleActiveToggle} />
        <button onClick={() => setEditing(true)} className="text-surface-400 hover:text-brand-600 p-1"><Pencil size={15} /></button>
        <button onClick={handleDelete} className="text-surface-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
      </div>
    </Card>
  );
}

export default function Members() {
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [members, setMembers] = useState<TmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [pathwaysPath, setPathwaysPath] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    membersApi.list().then(setMembers).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!name.trim()) { show('Name is required', 'error'); return; }
    setCreating(true);
    try {
      const member = await membersApi.create({
        name, email: email || undefined, memberNumber: memberNumber || undefined,
        pathwaysPath: pathwaysPath || undefined, active,
      });
      setMembers((prev) => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)));
      setName(''); setEmail(''); setMemberNumber(''); setPathwaysPath(''); setActive(true);
      show(`${member.name} added`);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer />
      <PageHeader
        title="Club Members"
        description="Add and manage the members available for role assignment"
        action={<Button variant="secondary" onClick={() => navigate('/toastmasters')}>Back to Meetings</Button>}
      />

      <Card className="p-4 mb-5">
        <h3 className="font-semibold text-surface-900 text-sm mb-3 flex items-center gap-2"><Plus size={14} /> Add Member</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Member number" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} />
          <Input placeholder="Pathways path" value={pathwaysPath} onChange={(e) => setPathwaysPath(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-surface-600">
            <Toggle checked={active} onChange={setActive} /> Active
          </label>
          <Button loading={creating} onClick={handleCreate}><Plus size={13} /> Add Member</Button>
        </div>
      </Card>

      {members.length === 0 ? (
        <EmptyState
          icon={<UserCircle2 size={22} />}
          title="No members yet"
          description="Add your club's members above so they can be assigned to meeting roles."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              onSaved={(updated) => setMembers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
              onDeleted={(id) => setMembers((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
