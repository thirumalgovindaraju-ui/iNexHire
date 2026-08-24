// src/components/toastmasters/RoleCard.tsx — role assignment card with per-card Save
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Input } from '../ui';
import MemberSearchSelect from './MemberSearchSelect';
import { TM_NAVY } from './theme';
import { TM_ROLE_LABELS, TM_SPEAKER_EVALUATOR_PAIRS } from '../../services/toastmasters';
import type { TmMember, TmRoleAssignment, UpdateRoleInput } from '../../services/toastmasters';

const SPEAKER_ROLES = new Set(TM_SPEAKER_EVALUATOR_PAIRS.map(([s]) => s));

export default function RoleCard({ role, members, onSave }: {
  role: TmRoleAssignment;
  members: TmMember[];
  onSave: (patch: UpdateRoleInput) => Promise<void>;
}) {
  const isSpeaker = SPEAKER_ROLES.has(role.roleName);
  const isTimer = role.roleName === 'TIMER';

  const [memberId, setMemberId] = useState(role.memberId ?? null);
  const [speechTitle, setSpeechTitle] = useState(role.speechTitle ?? '');
  const [pathwaysProject, setPathwaysProject] = useState(role.pathwaysProject ?? '');
  const [manualNumber, setManualNumber] = useState(role.manualNumber ?? '');
  const [greenMins, setGreenMins] = useState(role.greenMins?.toString() ?? '');
  const [yellowMins, setYellowMins] = useState(role.yellowMins?.toString() ?? '');
  const [redMins, setRedMins] = useState(role.redMins?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setMemberId(role.memberId ?? null), [role.memberId]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        memberId,
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

  return (
    <div className="rounded-lg border border-surface-200 bg-white overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: TM_NAVY }}>
        <span className="text-white text-sm font-bold">{TM_ROLE_LABELS[role.roleName] ?? role.roleName}</span>
        {memberId && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
            <Check size={13} /> Assigned
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <MemberSearchSelect members={members} value={memberId} onChange={setMemberId} />

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

        <Button size="sm" loading={saving} onClick={handleSave} className="mt-1">Save</Button>
      </div>
    </div>
  );
}
