// src/pages/toastmasters/RoleAssignment.tsx — role assignment grid with auto-pair suggestion
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import { Button, PageHeader, Spinner, useToast } from '../../components/ui';
import RoleCard from '../../components/toastmasters/RoleCard';
import { TM_GOLD, TM_NAVY } from '../../components/toastmasters/theme';
import { extractError } from '../../services/api';
import {
  TM_ROLE_ASSIGNMENT_ORDER, TM_ROLE_LABELS, membersApi, meetingsApi, rolesApi,
} from '../../services/toastmasters';
import type { TmMeeting, TmMember, TmRoleAssignment, UpdateRoleInput } from '../../services/toastmasters';

interface Suggestion { forRoleId: string; evaluatorMember: TmMember }

// Dependency order for running agents: speakers must produce a transcript before
// their evaluator can run; evaluators must exist before Grammarian/General Evaluator
// summarize across them. Procedural roles (no generated content) run last.
const AGENT_RUN_ORDER = [
  'SPEAKER_1', 'SPEAKER_2', 'SPEAKER_3',
  'EVALUATOR_1', 'EVALUATOR_2', 'EVALUATOR_3',
  'GRAMMARIAN', 'GENERAL_EVALUATOR', 'AH_COUNTER', 'TABLE_TOPICS_MASTER',
  'TIMER', 'SAA', 'PO', 'TMOD', 'MENTOR',
];

export default function RoleAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [members, setMembers] = useState<TmMember[]>([]);
  const [roles, setRoles] = useState<TmRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; roleName: string } | null>(null);

  function load() {
    if (!id) return Promise.resolve();
    return Promise.all([meetingsApi.get(id), membersApi.list()])
      .then(([m, mem]) => {
        setMeeting(m);
        setMembers(mem);
        setRoles(m.roleAssignments ?? []);
      })
      .catch((err) => show(extractError(err), 'error'));
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

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

  const pendingAgentRoles = AGENT_RUN_ORDER
    .map((name) => roles.find((r) => r.roleName === name))
    .filter((r): r is TmRoleAssignment => !!r && r.assigneeType === 'AI_AGENT' && r.agentStatus !== 'DONE');

  async function runAllAgents() {
    setBulkRunning(true);
    let succeeded = 0;
    let failed = 0;
    try {
      for (let i = 0; i < pendingAgentRoles.length; i++) {
        const role = pendingAgentRoles[i];
        const label = TM_ROLE_LABELS[role.roleName] ?? role.roleName;
        setBulkProgress({ done: i, total: pendingAgentRoles.length, roleName: label });
        try {
          const { role: updated } = await rolesApi.runAgent(role.id);
          setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)));
          succeeded++;
        } catch (err) {
          failed++;
          show(`${label} agent failed — ${extractError(err)}`, 'error');
        }
      }
    } finally {
      setBulkProgress(null);
      setBulkRunning(false);
    }
    show(`Run All Agents finished — ${succeeded} completed${failed ? `, ${failed} failed` : ''}`, failed ? 'error' : 'success');
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
        action={
          <div className="flex gap-2">
            {pendingAgentRoles.length > 0 && (
              <Button style={{ background: TM_NAVY }} loading={bulkRunning} onClick={runAllAgents}>
                <Bot size={14} /> Run All Agents ({pendingAgentRoles.length})
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(`/toastmasters/${id}`)}>Back to Meeting</Button>
          </div>
        }
      />

      {bulkProgress && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-3 flex items-center gap-3">
          <Spinner size={16} />
          <p className="text-sm text-brand-900">
            Running agents ({bulkProgress.done}/{bulkProgress.total}) — <strong>{bulkProgress.roleName}</strong> now…
          </p>
        </div>
      )}

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
          <RoleCard
            key={role.id}
            role={role}
            members={members}
            excludeMemberIds={roles.filter((r) => r.id !== role.id && r.memberId).map((r) => r.memberId!)}
            onSave={(patch) => handleSaveRole(role, patch)}
            onAgentRun={load}
          />
        ))}
      </div>
    </div>
  );
}
