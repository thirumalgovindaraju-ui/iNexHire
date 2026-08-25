// src/components/toastmasters/highlightFillers.tsx — safe, deterministic filler-word
// highlighting. Deliberately does NOT trust any AI-generated HTML/markup for this —
// it tokenizes the plain transcript itself and wraps matches as React elements.
import type { ReactNode } from 'react';

const FILLER_PATTERNS: [RegExp, string][] = [
  [/\bum\b/gi, 'um'], [/\buh\b/gi, 'uh'], [/\bso\b/gi, 'so'],
  [/\blike\b/gi, 'like'], [/\ber\b/gi, 'er'], [/\byou know\b/gi, 'you_know'],
];

export function highlightFillerWords(transcript: string): ReactNode[] {
  if (!transcript) return [];
  const matches: { index: number; length: number; word: string }[] = [];

  for (const [pattern, label] of FILLER_PATTERNS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern);
    while ((m = re.exec(transcript)) !== null) {
      matches.push({ index: m.index, length: m[0].length, word: label });
    }
  }
  matches.sort((a, b) => a.index - b.index);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index < cursor) return; // overlapping match (e.g. inside "you know")
    if (m.index > cursor) nodes.push(transcript.slice(cursor, m.index));
    nodes.push(
      <mark key={`${i}-${m.index}`} className="bg-yellow-200 rounded px-0.5">
        {transcript.slice(m.index, m.index + m.length)}
      </mark>
    );
    cursor = m.index + m.length;
  });
  if (cursor < transcript.length) nodes.push(transcript.slice(cursor));
  return nodes;
}
