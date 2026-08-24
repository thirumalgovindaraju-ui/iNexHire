// src/components/toastmasters/MemberSearchSelect.tsx — type-to-filter member picker
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { TmMember } from '../../services/toastmasters';

export default function MemberSearchSelect({ members, value, onChange, placeholder = 'Search members...' }: {
  members: TmMember[];
  value: string | null | undefined;
  onChange: (memberId: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = members.find((m) => m.id === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-surface-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-surface-300"
      >
        <span className={selected ? 'text-surface-900' : 'text-surface-400'}>{selected?.name ?? 'Unassigned'}</span>
        <ChevronDown size={14} className="text-surface-400" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-b border-surface-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); setQuery(''); }}
            className="w-full text-left px-3 py-2 text-sm text-surface-400 italic hover:bg-surface-50"
          >
            Unassigned
          </button>
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); setQuery(''); }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-50"
            >
              {m.name}
              {m.id === value && <Check size={13} className="text-green-500" />}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-surface-400">No members match</p>}
        </div>
      )}
    </div>
  );
}
