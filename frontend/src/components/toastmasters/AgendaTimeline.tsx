// src/components/toastmasters/AgendaTimeline.tsx — Duration | Start | End | Activity table.
// Rows can be dragged (via the grip handle) to reorder when onReorder is provided.
import { useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { TmAgendaItem } from '../../services/toastmasters';

export default function AgendaTimeline({ items, currentItemId, onReorder, onRemoveItem }: {
  items: TmAgendaItem[];
  currentItemId?: string;
  onReorder?: (orderedIds: string[]) => void;
  onRemoveItem?: (itemId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId || !onReorder) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder(ids);
    setDragId(null);
  }

  return (
    <div className="rounded-lg border border-surface-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 text-surface-500 text-xs uppercase tracking-wide">
            {onReorder && <th className="w-6" />}
            <th className="text-left px-3 py-2 font-semibold">Duration</th>
            <th className="text-left px-3 py-2 font-semibold">Start</th>
            <th className="text-left px-3 py-2 font-semibold">End</th>
            <th className="text-left px-3 py-2 font-semibold">Activity</th>
            {onRemoveItem && <th className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              draggable={!!onReorder}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => onReorder && e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              className={`border-t border-surface-100 ${item.id === currentItemId ? 'bg-amber-50' : 'bg-white'}`}
            >
              {onReorder && (
                <td className="px-1 text-surface-300 cursor-grab"><GripVertical size={14} /></td>
              )}
              <td className="px-3 py-2 text-surface-700">{item.durationMins != null ? `${item.durationMins} mins` : '—'}</td>
              <td className="px-3 py-2 text-surface-700 font-mono text-xs">{item.plannedStart ?? '—'}</td>
              <td className="px-3 py-2 text-surface-700 font-mono text-xs">{item.plannedEnd ?? '—'}</td>
              <td className="px-3 py-2 text-surface-900 font-medium">
                {item.activityName}
                {item.roleAssignment?.member?.name && (
                  <span className="text-surface-400 font-normal"> — {item.roleAssignment.member.name}</span>
                )}
              </td>
              {onRemoveItem && (
                <td className="px-2">
                  <button onClick={() => onRemoveItem(item.id)} className="text-surface-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-surface-400 text-sm">No agenda items yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
