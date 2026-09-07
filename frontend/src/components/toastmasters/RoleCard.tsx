// src/components/toastmasters/RoleCard.tsx — role assignment card with per-card Save
import { useEffect, useState } from 'react';
import { Bot, Check, Loader2, Sparkles } from 'lucide-react';
import { Badge, Button, Input, Select, useToast } from '../ui';
import MemberSearchSelect from './MemberSearchSelect';
import { extractError } from '../../services/api';
import { TM_NAVY } from './theme';
import { TM_ROLE_LABELS, TM_SPEAKER_EVALUATOR_PAIRS, rolesApi } from '../../services/toastmasters';
import type { TmAgentAccent, TmAgentGender, TmAssigneeType, TmMember, TmRoleAssignment, UpdateRoleInput } from '../../services/toastmasters';
import { agentResultSpeechText, InterruptButton, SpeakButton, useAgentInterjection, useSpeech } from './agentSpeech';
import { TalkingAvatar } from './TalkingAvatar';

const SPEAKER_ROLES = new Set(TM_SPEAKER_EVALUATOR_PAIRS.map(([s]) => s));

const AGENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', RUNNING: 'Running…', DONE: 'Done', FAILED: 'Failed',
};

function agentResultPreview(role: TmRoleAssignment, result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, any>;
  if (typeof r.transcript === 'string') return r.transcript.slice(0, 220) + (r.transcript.length > 220 ? '…' : '');
  if (typeof r.commendations === 'string') return r.commendations;
  if (typeof r.overallFeedback === 'string') return r.overallFeedback;
  if (typeof r.goodGrammarExamples === 'string') return r.goodGrammarExamples;
  if (Array.isArray(r.topics)) return r.topics.join(' · ');
  if (typeof r.note === 'string') return r.note;
  return null;
}

export default function RoleCard({ role, members, excludeMemberIds, onSave, onAgentRun }: {
  role: TmRoleAssignment;
  members: TmMember[];
  excludeMemberIds?: string[];
  onSave: (patch: UpdateRoleInput) => Promise<void>;
  onAgentRun?: () => void;
}) {
  const { show, ToastContainer } = useToast();
  const isSpeaker = SPEAKER_ROLES.has(role.roleName);
  const isTimer = role.roleName === 'TIMER';

  const [memberId, setMemberId] = useState(role.memberId ?? null);
  const [assigneeType, setAssigneeType] = useState<TmAssigneeType>(role.assigneeType ?? 'HUMAN');
  const [agentGender, setAgentGender] = useState<TmAgentGender>(role.agentGender ?? 'MALE');
  const [agentAccent, setAgentAccent] = useState<TmAgentAccent>(role.agentAccent ?? 'US');
  const [speechTitle, setSpeechTitle] = useState(role.speechTitle ?? '');
  const [pathwaysProject, setPathwaysProject] = useState(role.pathwaysProject ?? '');
  const [manualNumber, setManualNumber] = useState(role.manualNumber ?? '');
  const [greenMins, setGreenMins] = useState(role.greenMins?.toString() ?? '');
  const [yellowMins, setYellowMins] = useState(role.yellowMins?.toString() ?? '');
  const [redMins, setRedMins] = useState(role.redMins?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const speech = useSpeech();
  const { speaking, play, stop } = speech;
  const interjection = useAgentInterjection(speech, role.id, { accent: agentAccent, gender: agentGender });

  useEffect(() => setMemberId(role.memberId ?? null), [role.memberId]);
  useEffect(() => setAssigneeType(role.assigneeType ?? 'HUMAN'), [role.assigneeType]);
  useEffect(() => setAgentGender(role.agentGender ?? 'MALE'), [role.agentGender]);
  useEffect(() => setAgentAccent(role.agentAccent ?? 'US'), [role.agentAccent]);

  const isAgent = assigneeType === 'AI_AGENT';

  function handlePick(id: string | null, type: TmAssigneeType) {
    setMemberId(id);
    setAssigneeType(type);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        memberId,
        assigneeType,
        ...(isAgent ? { agentGender, agentAccent } : {}),
        ...(isSpeaker ? { speechTitle, pathwaysProject, manualNumber } : {}),
        ...(isSpeaker || isTimer ? {
          greenMins: greenMins ? Number(greenMins) : undefined,
          yellowMins: yellowMins ? Number(yellowMins) : undefined,
          redMins: redMins ? Number(redMins) : undefined,
        } : {}),
      });
    } finally {
      setSaving(false);
    }
  }

  const hasUnsavedChanges = assigneeType !== (role.assigneeType ?? 'HUMAN') || memberId !== (role.memberId ?? null)
    || (isAgent && (agentGender !== (role.agentGender ?? 'MALE') || agentAccent !== (role.agentAccent ?? 'US')));

  async function handleRunAgent() {
    setRunning(true);
    try {
      if (hasUnsavedChanges) await handleSave();
      const { result, usage } = await rolesApi.runAgent(role.id);
      setLastResult(result);
      const tokens = usage.inputTokens + usage.outputTokens;
      show(`${TM_ROLE_LABELS[role.roleName] ?? role.roleName} agent finished — ${tokens.toLocaleString()} tokens · $${usage.costUsd.toFixed(4)}`);
      onAgentRun?.();
      const text = agentResultSpeechText(result);
      if (text) play(text, { accent: agentAccent, gender: agentGender });
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setRunning(false);
    }
  }

  const rawResult = lastResult ?? role.agentOutput;
  const preview = agentResultPreview(role, rawResult);
  const speechText = agentResultSpeechText(rawResult);

  return (
    <div className="rounded-lg border border-surface-200 bg-white overflow-hidden">
      <ToastContainer />
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: TM_NAVY }}>
        <span className="text-white text-sm font-bold">{TM_ROLE_LABELS[role.roleName] ?? role.roleName}</span>
        {isAgent ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-300">
            <Bot size={13} /> AI Agent · {AGENT_STATUS_LABEL[role.agentStatus ?? 'PENDING']}
          </span>
        ) : memberId ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
            <Check size={13} /> Assigned
          </span>
        ) : null}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <MemberSearchSelect
          members={members}
          value={memberId}
          assigneeType={assigneeType}
          onChange={handlePick}
          excludeMemberIds={excludeMemberIds}
        />

        {isAgent && (
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={agentGender}
              onChange={(e) => setAgentGender(e.target.value as TmAgentGender)}
              options={[{ value: 'MALE', label: '♂ Male voice/avatar' }, { value: 'FEMALE', label: '♀ Female voice/avatar' }]}
            />
            <Select
              value={agentAccent}
              onChange={(e) => setAgentAccent(e.target.value as TmAgentAccent)}
              options={[{ value: 'US', label: '🇺🇸 US accent' }, { value: 'UK', label: '🇬🇧 UK accent' }]}
            />
          </div>
        )}

        {isSpeaker && (
          <>
            <Input placeholder="Speech title" value={speechTitle} onChange={(e) => setSpeechTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Pathways project" value={pathwaysProject} onChange={(e) => setPathwaysProject(e.target.value)} />
              <Input placeholder="Manual number" value={manualNumber} onChange={(e) => setManualNumber(e.target.value)} />
            </div>
          </>
        )}

        {(isSpeaker || isTimer) && (
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="Green (min)" value={greenMins} onChange={(e) => setGreenMins(e.target.value)} />
            <Input type="number" placeholder="Yellow (min)" value={yellowMins} onChange={(e) => setYellowMins(e.target.value)} />
            <Input type="number" placeholder="Red (min)" value={redMins} onChange={(e) => setRedMins(e.target.value)} />
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
          {isAgent && (
            <Button size="sm" variant="secondary" loading={running} onClick={handleRunAgent}>
              {running ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Run Agent
            </Button>
          )}
        </div>

        {isAgent && preview && (
          <div className="mt-1 rounded-md bg-brand-50 border border-brand-100 p-2">
            <div className="flex items-start gap-2">
              {speechText && <TalkingAvatar speaking={speaking} size={48} gender={agentGender} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="purple">{role.agentStatus === 'DONE' ? 'Generated' : 'Result'}</Badge>
                  <div className="flex items-center gap-2">
                    {(speaking || interjection.state !== 'idle') && (
                      <InterruptButton state={interjection.state} onPressStart={interjection.pressStart} onPressEnd={interjection.pressEnd} />
                    )}
                    {speechText && (
                      <SpeakButton speaking={speaking} onToggle={() => (speaking ? stop() : play(speechText, { accent: agentAccent, gender: agentGender }))} />
                    )}
                  </div>
                </div>
                <p className="text-xs text-surface-700 whitespace-pre-wrap">{preview}</p>
              </div>
            </div>
          </div>
        )}
        {isAgent && role.agentStatus === 'FAILED' && (
          <p className="text-xs text-red-600">Agent run failed — try again.</p>
        )}
      </div>
    </div>
  );
}
