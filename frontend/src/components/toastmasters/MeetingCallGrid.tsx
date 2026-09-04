// src/components/toastmasters/MeetingCallGrid.tsx — video-call-style grid of every
// assigned role for the live meeting runner. Highlights the role whose agenda item is
// currently active, and animates the AI Agent's avatar mouth while it's speaking
// (via TalkingAvatar — driven by SpeakButton's onSpeakingChange, see agentSpeech.tsx).
import { TalkingAvatar, InitialsAvatar } from './TalkingAvatar';
import { TM_GOLD, TM_NAVY } from './theme';
import { TM_ROLE_ASSIGNMENT_ORDER, TM_ROLE_SHORT_LABELS } from '../../services/toastmasters';
import type { TmRoleAssignment } from '../../services/toastmasters';

export default function MeetingCallGrid({ roles, activeRoleId, speakingRoleId }: {
  roles: TmRoleAssignment[];
  activeRoleId?: string | null;
  speakingRoleId?: string | null;
}) {
  const tiles = TM_ROLE_ASSIGNMENT_ORDER
    .map((name) => roles.find((r) => r.roleName === name))
    .filter((r): r is TmRoleAssignment => !!r && (r.assigneeType === 'AI_AGENT' || !!r.member));

  if (tiles.length === 0) return null;

  return (
    <div className="rounded-xl p-3 mb-5" style={{ background: TM_NAVY }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
        {tiles.map((role) => {
          const isAgent = role.assigneeType === 'AI_AGENT';
          const isSpeaking = isAgent && speakingRoleId === role.id;
          const isActive = activeRoleId === role.id;
          return (
            <div
              key={role.id}
              className="flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition-shadow"
              style={{
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: isSpeaking
                  ? `0 0 0 3px ${TM_GOLD}`
                  : isActive
                  ? '0 0 0 1.5px rgba(255,255,255,0.25)'
                  : 'none',
              }}
            >
              {isAgent ? <TalkingAvatar speaking={isSpeaking} size={64} /> : <InitialsAvatar name={role.member!.name} size={64} />}
              {isSpeaking && (
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: TM_GOLD }}>● Speaking</p>
              )}
              <p className="text-[11px] font-semibold text-white/90 text-center leading-tight truncate w-full">
                {role.member?.name ?? 'AI Agent'}
              </p>
              <p className="text-[10px] text-white/50 text-center leading-tight truncate w-full">
                {TM_ROLE_SHORT_LABELS[role.roleName] ?? role.roleName}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
