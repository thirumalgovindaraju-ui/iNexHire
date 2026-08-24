// src/components/toastmasters/AhCounterWidget.tsx — tap-to-increment filler word grid
import { TM_FILLER_COUNT_KEY, TM_FILLER_LABELS, TM_FILLER_WORDS } from '../../services/toastmasters';
import type { TmAhCounter, TmMember } from '../../services/toastmasters';

export default function AhCounterWidget({ members, counters, onTap }: {
  members: TmMember[];
  counters: TmAhCounter[];
  onTap: (memberId: string, fillerWord: string) => void;
}) {
  const byMember = new Map(counters.map((c) => [c.memberId, c]));

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {members.map((member) => {
        const counter = byMember.get(member.id);
        const total = counter
          ? TM_FILLER_WORDS.reduce((sum, w) => sum + ((counter as any)[TM_FILLER_COUNT_KEY[w]] ?? 0), 0)
          : 0;

        return (
          <div key={member.id} className="rounded-lg border border-surface-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-surface-900">{member.name}</span>
              <span className="text-xs font-bold text-surface-500">{total} total</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TM_FILLER_WORDS.map((word) => {
                const count = counter ? ((counter as any)[TM_FILLER_COUNT_KEY[word]] ?? 0) : 0;
                return (
                  <button
                    key={word}
                    onClick={() => onTap(member.id, word)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-100 text-xs font-medium text-surface-700 active:scale-95 transition-transform"
                  >
                    {TM_FILLER_LABELS[word]}
                    <span className="font-bold text-surface-900">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {members.length === 0 && (
        <p className="text-sm text-surface-400 italic">No members to track — assign roles first.</p>
      )}
    </div>
  );
}
