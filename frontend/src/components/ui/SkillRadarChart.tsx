// src/components/ui/SkillRadarChart.tsx
// Radar chart for skill scores — pure SVG, no library needed

import React from 'react';

interface SkillRadarChartProps {
  skills: Record<string, number>; // { "React": 85, "TypeScript": 72, ... }
  size?: number;
}

export default function SkillRadarChart({ skills, size = 280 }: SkillRadarChartProps) {
  const entries = Object.entries(skills).slice(0, 8); // max 8 skills
  if (entries.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const levels = 5;
  const n = entries.length;

  // Angle for each skill (start from top, go clockwise)
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * maxR);

  // Score polygon
  const scorePoints = entries
    .map(([, score], i) => point((score / 100) * maxR, i))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // Grid polygon for each ring
  const ringPolygon = (r: number) =>
    Array.from({ length: n }, (_, i) => point(r, i))
      .map((p) => `${p.x},${p.y}`)
      .join(' ');

  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map((r, i) => (
        <polygon
          key={i}
          points={ringPolygon(r)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {entries.map((_, i) => {
        const outer = point(maxR, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        );
      })}

      {/* Score polygon fill */}
      <polygon
        points={scorePoints}
        fill="#3b82f6"
        fillOpacity={0.15}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {entries.map(([, score], i) => {
        const p = point((score / 100) * maxR, i);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={getColor(score)}
            stroke="white"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Labels */}
      {entries.map(([skill, score], i) => {
        const labelR = maxR + 22;
        const p = point(labelR, i);
        const ang = angle(i) * (180 / Math.PI) + 90;
        const anchor =
          Math.abs(ang % 360) < 10 || Math.abs((ang % 360) - 180) < 10
            ? 'middle'
            : ang % 360 < 180
            ? 'start'
            : 'end';

        return (
          <g key={i}>
            <text
              x={p.x}
              y={p.y - 4}
              textAnchor={anchor}
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.7}
              fontFamily="inherit"
            >
              {skill}
            </text>
            <text
              x={p.x}
              y={p.y + 10}
              textAnchor={anchor}
              fontSize={10}
              fontWeight={600}
              fill={getColor(score)}
              fontFamily="inherit"
            >
              {score}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#3b82f6" fillOpacity={0.5} />
    </svg>
  );
}
