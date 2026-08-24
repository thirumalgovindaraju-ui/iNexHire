// src/components/toastmasters/MeetingHeaderCard.tsx — literal iOpex Toastmasters agenda card header
import { Globe } from 'lucide-react';
import { TM_GOLD, TM_NAVY, formatOrdinalDate, formatTime12h } from './theme';
import type { TmMeeting } from '../../services/toastmasters';

export default function MeetingHeaderCard({ meeting }: { meeting: TmMeeting }) {
  const startTime = formatTime12h(meeting.startTime);
  const endTime = formatTime12h(meeting.endTime);

  const bannerParts = [
    formatOrdinalDate(meeting.date),
    startTime && endTime ? `${startTime} TO ${endTime}` : startTime,
    meeting.venue?.toUpperCase(),
  ].filter(Boolean);

  return (
    <div className="rounded-t-xl overflow-hidden border" style={{ borderColor: TM_GOLD }}>
      {/* Header: logo + club lockup + meeting no / theme / word of day */}
      <div className="px-6 py-6 flex items-start gap-4" style={{ background: TM_NAVY }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{ borderColor: TM_GOLD }}
          title="Toastmasters logo"
        >
          <Globe size={28} style={{ color: TM_GOLD }} />
        </div>

        <div className="flex-1 text-center">
          <p className="text-lg font-bold tracking-wide" style={{ color: TM_GOLD }}>iOpex</p>
          <h1 className="text-white text-2xl font-extrabold tracking-wide leading-tight -mt-1">TOASTMASTERS CLUB</h1>
          <p className="text-white font-semibold uppercase mt-2 tracking-wide">
            Demo Meeting No. {meeting.meetingNumber ?? '—'}
          </p>
          {meeting.theme && (
            <p className="text-white/90 uppercase text-sm mt-1 tracking-wide">Theme: {meeting.theme}</p>
          )}
          {meeting.wordOfDay && (
            <p className="text-sm mt-1 uppercase tracking-wide">
              <span style={{ color: TM_GOLD }}>Word of the Day: </span>
              <span className="text-white">
                {meeting.wordOfDay}{meeting.wordType && ` (${meeting.wordType})`}
                {meeting.wordMeaning && ` Meaning: ${meeting.wordMeaning}`}
              </span>
            </p>
          )}
        </div>

        <div className="w-16 flex-shrink-0" aria-hidden />
      </div>

      {/* Gold date/time/venue banner */}
      {bannerParts.length > 0 && (
        <div className="px-6 py-2.5 text-center font-bold uppercase tracking-wide text-sm" style={{ background: TM_GOLD, color: TM_NAVY }}>
          {bannerParts.join(', ')}
        </div>
      )}
    </div>
  );
}
