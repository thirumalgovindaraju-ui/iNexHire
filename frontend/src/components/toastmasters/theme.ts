// src/components/toastmasters/theme.ts — iOpex Toastmasters Club branding + small helpers

export const TM_NAVY = '#1B2A4A';
export const TM_NAVY_LIGHT = '#2a3d68';
export const TM_GOLD = '#C9A227';
export const TM_GOLD_DARK = '#a3821c';

export const TM_STATUS_STYLE: Record<string, string> = {
  PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

// Green / Yellow / Red, per the standard Toastmasters timing-light convention
export const TM_TIMER_RESULT_STYLE: Record<string, string> = {
  WITHIN: 'bg-green-50 text-green-700 border-green-200',
  UNDER: 'bg-amber-50 text-amber-700 border-amber-200',
  OVER: 'bg-red-50 text-red-700 border-red-200',
};

export function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(wrapped / 60).toString().padStart(2, '0');
  const mm = (wrapped % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function timerZone(elapsedSecs: number, greenMins?: number | null, yellowMins?: number | null, redMins?: number | null): 'idle' | 'green' | 'yellow' | 'red' | 'over' {
  if (greenMins == null || yellowMins == null || redMins == null) return 'idle';
  if (elapsedSecs < greenMins * 60) return 'idle';
  if (elapsedSecs < yellowMins * 60) return 'green';
  if (elapsedSecs < redMins * 60) return 'yellow';
  if (elapsedSecs < redMins * 60 + 30) return 'red';
  return 'over';
}

export const TM_ZONE_COLOR: Record<string, string> = {
  idle: '#94a3b8',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  over: '#991b1b',
};

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'TH';
  switch (day % 10) {
    case 1: return 'ST';
    case 2: return 'ND';
    case 3: return 'RD';
    default: return 'TH';
  }
}

export function formatOrdinalDate(dateIso: string): string {
  const d = new Date(dateIso);
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return `${month} ${day}${ordinalSuffix(day)} ${d.getFullYear()}, ${weekday}`;
}

// Agenda-item countdown zones: green from 0, unlike the speaker timerZone above
// (which treats "under the minimum" as idle) — here there's no minimum to wait out.
export function agendaZone(elapsedSecs: number, greenMins: number, yellowMins: number): 'green' | 'yellow' | 'red' {
  if (elapsedSecs < greenMins * 60) return 'green';
  if (elapsedSecs < yellowMins * 60) return 'yellow';
  return 'red';
}

export function formatTime12h(hhmm?: string | null): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}
