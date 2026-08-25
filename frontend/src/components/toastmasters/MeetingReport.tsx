// src/components/toastmasters/MeetingReport.tsx — full 9-section printable meeting report
import { Award, ArrowRight, Sparkles } from 'lucide-react';
import { Badge, Select } from '../ui';
import MeetingHeaderCard from './MeetingHeaderCard';
import { formatSecs } from './theme';
import { TM_FILLER_LABELS, TM_FILLER_WORDS, TM_ROLE_LABELS } from '../../services/toastmasters';
import { TM_TIMER_RESULT_STYLE } from './theme';
import type { TmMeeting, TmMeetingFullReport } from '../../services/toastmasters';

interface Awards { bestSpeakerRoleId: string; bestTableTopicId: string; bestEvaluatorRoleId: string }

function agendaStatus(actualStart?: string | null, actualEnd?: string | null, durationMins?: number | null) {
  if (!actualStart || !actualEnd) return { label: 'Not run', style: 'bg-surface-100 text-surface-500 border-surface-200' };
  if (durationMins == null) return { label: '—', style: 'bg-surface-100 text-surface-500 border-surface-200' };
  const actualMins = (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 60000;
  const diff = actualMins - durationMins;
  if (Math.abs(diff) <= 1) return { label: 'On Time', style: 'bg-green-50 text-green-700 border-green-200' };
  if (diff > 1) return { label: 'Over', style: 'bg-red-50 text-red-700 border-red-200' };
  return { label: 'Under', style: 'bg-amber-50 text-amber-700 border-amber-200' };
}

export default function MeetingReport({ report, nextMeeting, awards, onAwardsChange, finalized }: {
  report: TmMeetingFullReport;
  nextMeeting: (TmMeeting & { roleCount?: { filled: number; total: number } }) | null;
  awards: Awards;
  onAwardsChange: (patch: Partial<Awards>) => void;
  finalized: boolean;
}) {
  const memberIds = new Set<string>();
  report.roleAssignments?.forEach((r) => { if (r.memberId) memberIds.add(r.memberId); });
  report.ahCounters?.forEach((c) => memberIds.add(c.memberId));
  report.tableTopicResponses?.forEach((t) => { if (t.memberId) memberIds.add(t.memberId); });
  const memberCount = memberIds.size;
  const guestCount = new Set(report.tableTopicResponses?.filter((t) => !t.isMember).map((t) => t.speakerName)).size;

  return (
    <div id="tm-report-printable" className="flex flex-col gap-6">
      <MeetingHeaderCard meeting={report} />

      {/* 1. Meeting Summary */}
      <section>
        <h2 className="font-semibold text-surface-900 mb-2">Meeting Summary</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="rounded-lg border border-surface-200 bg-white p-2.5"><p className="text-xs text-surface-500">Meeting No.</p><p className="font-semibold">{report.meetingNumber ?? '—'}</p></div>
          <div className="rounded-lg border border-surface-200 bg-white p-2.5"><p className="text-xs text-surface-500">Attendance</p><p className="font-semibold">{memberCount + guestCount}</p></div>
          <div className="rounded-lg border border-surface-200 bg-white p-2.5"><p className="text-xs text-surface-500">Members : Guests</p><p className="font-semibold">{memberCount} : {guestCount}</p></div>
          <div className="rounded-lg border border-surface-200 bg-white p-2.5"><p className="text-xs text-surface-500">Venue</p><p className="font-semibold">{report.venue ?? '—'}</p></div>
        </div>
      </section>

      {/* 2. Role Players */}
      <section>
        <h2 className="font-semibold text-surface-900 mb-2">Role Players</h2>
        <div className="grid grid-cols-3 gap-2">
          {report.roleAssignments?.map((r) => (
            <div key={r.id} className="rounded-lg border border-surface-200 bg-white p-2.5 text-sm">
              <p className="text-xs text-surface-500">{TM_ROLE_LABELS[r.roleName] ?? r.roleName}</p>
              <p className="font-medium text-surface-900">{r.member?.name ?? '—'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Agenda Completion */}
      {(report.agendaItems?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-surface-900 mb-2">Agenda Completion</h2>
          <table className="w-full text-sm border border-surface-200 rounded-lg overflow-hidden">
            <thead><tr className="bg-surface-50 text-xs text-surface-500">
              <th className="text-left px-3 py-2">Activity</th>
              <th className="px-2 py-2">Planned</th>
              <th className="px-2 py-2">Actual</th>
              <th className="px-2 py-2">Status</th>
            </tr></thead>
            <tbody>
              {report.agendaItems!.map((item) => {
                const status = agendaStatus(item.actualStart, item.actualEnd, item.durationMins);
                return (
                  <tr key={item.id} className="border-t border-surface-100">
                    <td className="px-3 py-2 font-medium">{item.activityName}</td>
                    <td className="text-center px-2 py-2">{item.durationMins != null ? `${item.durationMins}m` : '—'}</td>
                    <td className="text-center px-2 py-2">
                      {item.actualStart && item.actualEnd
                        ? `${Math.round((new Date(item.actualEnd).getTime() - new Date(item.actualStart).getTime()) / 60000)}m`
                        : '—'}
                    </td>
                    <td className="text-center px-2 py-2"><Badge className={status.style}>{status.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* 4. Speech Evaluations */}
      {(report.evaluations?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-surface-900 mb-2">Speech Evaluations</h2>
          <div className="flex flex-col gap-2">
            {report.evaluations!.map((e) => {
              const analysis = report.speechAnalyses?.find((a) => a.roleAssignmentId === e.speakerRoleId);
              return (
                <div key={e.id} className="rounded-lg border border-surface-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{e.speaker?.speechTitle ?? 'Untitled'} <span className="text-surface-400">— {e.speaker?.member?.name ?? 'Unassigned'}</span></p>
                    {analysis && <Badge variant="purple" className="flex items-center gap-1"><Sparkles size={10} /> AI Analyzed</Badge>}
                  </div>
                  <p className="text-surface-500 text-xs">Project: {e.speaker?.pathwaysProject ?? '—'} · Evaluator: {e.evaluator?.member?.name ?? 'Unassigned'}</p>
                  <p className="text-surface-500 text-xs mt-1">Content {e.ratingContent ?? '—'} · Delivery {e.ratingDelivery ?? '—'} · Language {e.ratingLanguage ?? '—'} · Overall {e.overallRating ?? '—'}</p>
                  {e.commendations && <p className="mt-1"><span className="text-green-600 font-medium">Well: </span>{e.commendations}</p>}
                  {e.recommendations && <p><span className="text-amber-600 font-medium">Improve: </span>{e.recommendations}</p>}
                  {analysis && (
                    <div className="mt-2 pt-2 border-t border-surface-100 flex items-center gap-3 text-xs text-surface-500">
                      <span>Grammar: <strong className="text-surface-900">{analysis.grammarScore ?? '—'}/10</strong></span>
                      <span>Fillers: <strong className="text-surface-900">{analysis.fillerWordCounts.total}</strong> ({analysis.fillerWordCounts.ratePerMinute}/min)</span>
                      <span>{analysis.wordCount} words</span>
                    </div>
                  )}
                  {analysis && (
                    <details className="mt-1">
                      <summary className="text-xs text-brand-600 cursor-pointer">View transcript</summary>
                      <p className="text-xs text-surface-600 mt-1 whitespace-pre-wrap">{analysis.transcript}</p>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Timer Report */}
      {(report.timerLogs?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-surface-900 mb-2">Timer Report</h2>
          <table className="w-full text-sm border border-surface-200 rounded-lg overflow-hidden">
            <thead><tr className="bg-surface-50 text-xs text-surface-500">
              <th className="text-left px-3 py-2">Speaker</th><th className="px-2 py-2">Planned</th><th className="px-2 py-2">Actual</th><th className="px-2 py-2">Result</th>
            </tr></thead>
            <tbody>
              {report.timerLogs!.map((t) => (
                <tr key={t.id} className="border-t border-surface-100">
                  <td className="px-3 py-2 font-medium">{t.roleAssignment?.member?.name ?? 'Unassigned'}</td>
                  <td className="text-center px-2 py-2">
                    {t.roleAssignment?.greenMins != null && t.roleAssignment?.redMins != null ? `${t.roleAssignment.greenMins}-${t.roleAssignment.redMins}m` : '—'}
                  </td>
                  <td className="text-center px-2 py-2">{formatSecs(t.actualDurationSecs)}</td>
                  <td className="text-center px-2 py-2"><Badge className={TM_TIMER_RESULT_STYLE[t.result]}>{t.result}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 6. Ah Counter Report */}
      {(report.ahCounters?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-surface-900 mb-2">Ah Counter Report</h2>
          <table className="w-full text-sm border border-surface-200 rounded-lg overflow-hidden">
            <thead><tr className="bg-surface-50 text-xs text-surface-500">
              <th className="text-left px-3 py-2">Member</th>
              {TM_FILLER_WORDS.filter((w) => w !== 'other').map((w) => <th key={w} className="px-2 py-2">{TM_FILLER_LABELS[w]}</th>)}
              <th className="px-2 py-2">Total</th>
            </tr></thead>
            <tbody>
              {report.ahCounters!.map((c) => {
                const total = c.umCount + c.uhCount + c.soCount + c.likeCount + c.erCount + c.youKnowCount + c.otherCount;
                return (
                  <tr key={c.id} className="border-t border-surface-100">
                    <td className="px-3 py-2 font-medium">{c.member?.name}</td>
                    <td className="text-center px-2 py-2">{c.umCount}</td>
                    <td className="text-center px-2 py-2">{c.uhCount}</td>
                    <td className="text-center px-2 py-2">{c.soCount}</td>
                    <td className="text-center px-2 py-2">{c.likeCount}</td>
                    <td className="text-center px-2 py-2">{c.erCount}</td>
                    <td className="text-center px-2 py-2">{c.youKnowCount}</td>
                    <td className="text-center px-2 py-2 font-semibold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* 7. Grammarian Report */}
      {report.grammarianLog && (
        <section>
          <h2 className="font-semibold text-surface-900 mb-2">Grammarian Report</h2>
          <div className="rounded-lg border border-surface-200 bg-white p-3 text-sm">
            <p><span className="text-surface-500">Word of the day:</span> {report.grammarianLog.wordOfDay ?? '—'}</p>
            <p><span className="text-surface-500">Correct / Incorrect uses:</span> {report.grammarianLog.correctUses} / {report.grammarianLog.incorrectUses}</p>
            {report.grammarianLog.goodGrammarExamples && <p className="mt-1"><span className="text-green-600">Good examples: </span>{report.grammarianLog.goodGrammarExamples}</p>}
            {report.grammarianLog.errorsNoted && <p><span className="text-red-600">Errors: </span>{report.grammarianLog.errorsNoted}</p>}
          </div>
        </section>
      )}

      {/* 8. Awards */}
      <section className="print:break-inside-avoid">
        <h2 className="font-semibold text-surface-900 mb-2 flex items-center gap-2"><Award size={16} /> Awards {finalized && <Badge variant="green">Finalized</Badge>}</h2>
        <div className="grid grid-cols-3 gap-3 print:hidden">
          <Select
            label="Best Speaker" value={awards.bestSpeakerRoleId} onChange={(e) => onAwardsChange({ bestSpeakerRoleId: e.target.value })}
            options={[{ value: '', label: '—' }, ...(report.evaluations ?? []).map((e) => ({ value: e.speakerRoleId, label: e.speaker?.member?.name ?? 'Unassigned' }))]}
          />
          <Select
            label="Best Table Topic" value={awards.bestTableTopicId} onChange={(e) => onAwardsChange({ bestTableTopicId: e.target.value })}
            options={[{ value: '', label: '—' }, ...(report.tableTopicResponses ?? []).map((t) => ({ value: t.id, label: t.speakerName }))]}
          />
          <Select
            label="Best Evaluator" value={awards.bestEvaluatorRoleId} onChange={(e) => onAwardsChange({ bestEvaluatorRoleId: e.target.value })}
            options={[{ value: '', label: '—' }, ...(report.evaluations ?? []).map((e) => ({ value: e.evaluatorRoleId, label: e.evaluator?.member?.name ?? 'Unassigned' }))]}
          />
        </div>
        <div className="hidden print:grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-surface-500 text-xs">Best Speaker</p><p className="font-semibold">{report.evaluations?.find((e) => e.speakerRoleId === awards.bestSpeakerRoleId)?.speaker?.member?.name ?? '—'}</p></div>
          <div><p className="text-surface-500 text-xs">Best Table Topic</p><p className="font-semibold">{report.tableTopicResponses?.find((t) => t.id === awards.bestTableTopicId)?.speakerName ?? '—'}</p></div>
          <div><p className="text-surface-500 text-xs">Best Evaluator</p><p className="font-semibold">{report.evaluations?.find((e) => e.evaluatorRoleId === awards.bestEvaluatorRoleId)?.evaluator?.member?.name ?? '—'}</p></div>
        </div>
      </section>

      {/* 9. Next Meeting Preview */}
      <section>
        <h2 className="font-semibold text-surface-900 mb-2 flex items-center gap-2"><ArrowRight size={15} /> Next Meeting Preview</h2>
        {nextMeeting ? (
          <div className="rounded-lg border border-surface-200 bg-white p-3 text-sm flex items-center justify-between">
            <div>
              <p className="font-medium text-surface-900">{nextMeeting.title}</p>
              <p className="text-surface-500 text-xs mt-0.5">
                {new Date(nextMeeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {nextMeeting.theme && ` · Theme: ${nextMeeting.theme}`}
              </p>
            </div>
            {nextMeeting.roleCount && nextMeeting.roleCount.filled < nextMeeting.roleCount.total && (
              <Badge variant="yellow">{nextMeeting.roleCount.total - nextMeeting.roleCount.filled} volunteers needed</Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-surface-400 italic">No upcoming meeting scheduled yet.</p>
        )}
      </section>
    </div>
  );
}
