// src/components/toastmasters/TimerWidget.tsx — green/yellow/red speech timer
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui';
import { TM_ZONE_COLOR, formatSecs, timerZone } from './theme';
import type { TmRoleAssignment } from '../../services/toastmasters';

export default function TimerWidget({ role, onLog }: {
  role: TmRoleAssignment;
  onLog?: (data: { actualDurationSecs: number; result: 'UNDER' | 'WITHIN' | 'OVER'; roleAssignmentId: string }) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const zone = timerZone(elapsed, role.greenMins, role.yellowMins, role.redMins);
  const color = TM_ZONE_COLOR[zone];
  const hasThresholds = role.greenMins != null && role.yellowMins != null && role.redMins != null;

  function stopAndLog() {
    setRunning(false);
    if (!onLog || !hasThresholds) return;
    const result: 'UNDER' | 'WITHIN' | 'OVER' =
      zone === 'idle' ? 'UNDER' : zone === 'green' || zone === 'yellow' ? 'WITHIN' : 'OVER';
    onLog({ actualDurationSecs: elapsed, result, roleAssignmentId: role.id });
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-surface-900">
        {role.member?.name ?? 'Unassigned'} {role.speechTitle && <span className="text-surface-400 font-normal">— {role.speechTitle}</span>}
      </p>

      <div
        className="w-24 h-24 rounded-full flex items-center justify-center border-8 transition-colors"
        style={{ borderColor: color, color }}
      >
        <span className="text-xl font-mono font-bold">{formatSecs(elapsed)}</span>
      </div>

      {hasThresholds ? (
        <div className="flex gap-3 text-xs text-surface-500">
          <span>🟢 {role.greenMins}m</span>
          <span>🟡 {role.yellowMins}m</span>
          <span>🔴 {role.redMins}m</span>
        </div>
      ) : (
        <p className="text-xs text-surface-400 italic">No timing thresholds set for this role</p>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={13} /> : <Play size={13} />}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setRunning(false); setElapsed(0); }}>
          <RotateCcw size={13} />
        </Button>
        <Button size="sm" onClick={stopAndLog}>
          <Square size={13} /> Log Result
        </Button>
      </div>
    </div>
  );
}
