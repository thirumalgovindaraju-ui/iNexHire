// src/components/toastmasters/TalkingAvatar.tsx — illustrated human-portrait avatar whose
// mouth and head animate while the AI agent's SpeechSynthesis playback is active (see
// agentSpeech.tsx). Not photorealistic video — a flat illustrated bust, CSS-animated, so it
// needs no audio analysis, no photo, and no paid video-generation service.
import { useId } from 'react';
import { TM_GOLD } from './theme';

const AVATAR_KEYFRAMES = `
  @keyframes tm-mouth-talk {
    0%, 100% { transform: scaleY(0.15); }
    20% { transform: scaleY(1.6); }
    40% { transform: scaleY(0.5); }
    60% { transform: scaleY(2); }
    80% { transform: scaleY(0.7); }
  }
  @keyframes tm-head-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes tm-avatar-pulse {
    0% { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.55); }
    100% { box-shadow: 0 0 0 10px rgba(201, 162, 39, 0); }
  }
  @keyframes tm-blink {
    0%, 92%, 100% { transform: scaleY(1); }
    96% { transform: scaleY(0.1); }
  }
`;

const SKIN = '#e0ac80';
const SKIN_SHADE = '#c98f63';
const HAIR = '#2e2118';
const LIPS = '#a15c5c';
const SHIRT = '#1B2A4A';
const BACKDROP = '#eef1f5';

export function TalkingAvatar({ speaking, size = 56 }: { speaking: boolean; size?: number }) {
  const clipId = useId();
  return (
    <div
      className="relative rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, animation: speaking ? 'tm-avatar-pulse 1.1s ease-out infinite' : 'none' }}
    >
      <style>{AVATAR_KEYFRAMES}</style>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill={BACKDROP} />
        <g clipPath={`url(#${clipId})`} style={{ animation: speaking ? 'tm-head-bob 0.6s ease-in-out infinite' : 'none' }}>
          {/* shoulders / shirt */}
          <path d="M 14 100 Q 16 74 50 71 Q 84 74 86 100 Z" fill={SHIRT} />
          {/* neck */}
          <rect x="42" y="64" width="16" height="16" rx="5" fill={SKIN_SHADE} />
          {/* hair (behind face) */}
          <ellipse cx="50" cy="34" rx="27" ry="24" fill={HAIR} />
          {/* ears */}
          <ellipse cx="24" cy="48" rx="4" ry="6" fill={SKIN} />
          <ellipse cx="76" cy="48" rx="4" ry="6" fill={SKIN} />
          {/* face */}
          <ellipse cx="50" cy="48" rx="24" ry="26" fill={SKIN} />
          {/* eyebrows */}
          <rect x="33" y="38" width="11" height="2.4" rx="1.2" fill={HAIR} transform="rotate(-4 38.5 39.2)" />
          <rect x="56" y="38" width="11" height="2.4" rx="1.2" fill={HAIR} transform="rotate(4 61.5 39.2)" />
          {/* eyes (blink together) */}
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tm-blink 4.2s ease-in-out infinite' }}>
            <ellipse cx="40" cy="46" rx="4.6" ry="3.6" fill="#ffffff" />
            <circle cx="40" cy="46" r="2" fill="#2a2a2a" />
            <ellipse cx="60" cy="46" rx="4.6" ry="3.6" fill="#ffffff" />
            <circle cx="60" cy="46" r="2" fill="#2a2a2a" />
          </g>
          {/* nose */}
          <path d="M 50 46 Q 47.5 53 50 55" stroke={SKIN_SHADE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {/* mouth */}
          {speaking ? (
            <ellipse
              key="talking"
              cx="50" cy="62" rx="10" ry="3.4" fill={LIPS}
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tm-mouth-talk 0.38s ease-in-out infinite' }}
            />
          ) : (
            <ellipse key="idle" cx="50" cy="63" rx="8" ry="1.6" fill={LIPS} />
          )}
        </g>
        <circle cx="50" cy="50" r="48" fill="none" stroke={TM_GOLD} strokeWidth="2" />
      </svg>
    </div>
  );
}

export function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: `hsl(${hue}, 45%, 40%)`, fontSize: size * 0.34 }}
    >
      {initials || '?'}
    </div>
  );
}
