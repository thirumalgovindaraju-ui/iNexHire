// src/pages/toastmasters/RoleAssignment.tsx — role assignment grid with auto-pair suggestion
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button, PageHeader, Spinner, useToast } from '../../components/ui';
import RoleCard from '../../components/toastmasters/RoleCard';
import { TM_GOLD } from '../../components/toastmasters/theme';
import { extractError } from '../../services/api';
import {
  TM_ROLE_ASSIGNMENT_ORDER, TM_ROLE_LABELS, membersApi, meetingsApi, rolesApi,
} from '../../services/toastmasters';
import type { TmMeeting, TmMember, TmRoleAssignment, UpdateRoleInput } from '../../services/toastmasters';

interface Suggestion { forRoleId: string; evaluatorMember: TmMember }

export default function RoleAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [members, setMembers] = useState<TmMember[]>([]);
  const [roles, setRoles] = useState<TmRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([meetingsApi.get(id), membersApi.list()])
      .then(([m, mem]) => {
        // TEMPORARY debug logging — remove once the empty-dropdown issue is confirmed fixed.
        console.log('[RoleAssignment] GET /toastmasters/members raw response:', mem);
        console.log('[RoleAssignment] members count:', mem.length);
        setMeeting(m);
        setMembers(mem);
        setRoles(m.roleAssignments ?? []);
      })
      .catch((err) => {
        console.error('[RoleAssignment] failed to load meeting/members:', err);
        show(extractError(err), 'error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    console.log('[RoleAssignment] members state after setMembers:', members, 'length:', members.length);
  }, [members]);

  const ordered = TM_ROLE_ASSIGNMENT_ORDER
    .map((name) => roles.find((r) => r.roleName === name))
    .filter((r): r is TmRoleAssignment => !!r);

  const filledCount = roles.filter((r) => r.memberId).length;

  async function handleSaveRole(role: TmRoleAssignment, patch: UpdateRoleInput) {
    try {
      const updated = await rolesApi.update(role.id, patch);
      setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)));
      show(`${TM_ROLE_LABELS[role.roleName] ?? role.roleName} saved`);

      // Auto-pair: speaker assigned → suggest that member's most recent evaluator
      const speakerMatch = role.roleName.match(/^SPEAKER_(\d)$/);
      if (speakerMatch && patch.memberId) {
        const evaluatorRoleName = `EVALUATOR_${speakerMatch[1]}`;
        const evaluatorRole = roles.find((r) => r.roleName === evaluatorRoleName);
        const lastEvaluator = await membersApi.lastEvaluator(patch.memberId).catch(() => null);
        if (evaluatorRole && !evaluatorRole.memberId && lastEvaluator) {
          setSuggestion({ forRoleId: evaluatorRole.id, evaluatorMember: lastEvaluator });
        }
      }
    } catch (err) {
      show(extractError(err), 'error');
      throw err;
    }
  }

  async function applySuggestion() {
    if (!suggestion) return;
    const role = roles.find((r) => r.id === suggestion.forRoleId);
    if (!role) return;
    const updated = await rolesApi.update(role.id, { memberId: suggestion.evaluatorMember.id });
    setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)));
    show(`${suggestion.evaluatorMember.name} assigned as ${TM_ROLE_LABELS[role.roleName]}`);
    setSuggestion(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!meeting) return <p className="p-6 text-surface-500">Meeting not found.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer />
      <PageHeader
        title={`Assign Roles — ${meeting.title}`}
        description={new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        action={<Button variant="secondary" onClick={() => navigate(`/toastmasters/${id}`)}>Back to Meeting</Button>}
      />

      <div className="mb-4">
        <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${(filledCount / (roles.length || 1)) * 100}%`, background: TM_GOLD }} />
        </div>
        <p className="text-xs text-surface-500 mt-1">{filledCount} of {roles.length} roles assigned</p>
      </div>

      {suggestion && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center justify-between">
          <p className="text-sm text-amber-900 flex items-center gap-2">
            <Sparkles size={14} /> Suggest <strong>{suggestion.evaluatorMember.name}</strong> as evaluator — they evaluated this speaker last time.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={applySuggestion}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ordered.map((role) => (
          <RoleCard key={role.id} role={role} members={members} onSave={(patch) => handleSaveRole(role, patch)} />
        ))}
      </div>
    </div>
  );
}
