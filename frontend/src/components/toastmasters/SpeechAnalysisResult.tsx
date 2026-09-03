// src/components/toastmasters/SpeechAnalysisResult.tsx — 4-panel AI speech analysis results
import { Star, Copy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button, useToast } from '../ui';
import { highlightFillerWords } from './highlightFillers';
import { TM_FILLER_LABELS, TM_FILLER_WORDS } from '../../services/toastmasters';
import type { TmSpeechAnalysis } from '../../services/toastmasters';
import { SpeakButton } from './agentSpeech';

function scoreColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.7) return '#10b981';
  if (pct >= 0.4) return '#f59e0b';
  return '#ef4444';
}

function StarRow({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-surface-700">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={14} className="text-amber-400" fill={value != null && n <= value ? 'currentColor' : 'none'} />
        ))}
      </div>
    </div>
  );
}

export default function SpeechAnalysisResult({ analysis, onRecordAgain }: {
  analysis: TmSpeechAnalysis;
  onRecordAgain: () => void;
}) {
  const { show, ToastContainer } = useToast();
  const filler = analysis.fillerWordCounts;
  const maxFillerCount = Math.max(1, ...TM_FILLER_WORDS.filter((w) => w !== 'other').map((w) => (filler as any)[w] ?? 0));

  function copyReport() {
    const lines = [
      `Grammar score: ${analysis.grammarScore ?? '—'}/10`,
      `Filler words: ${filler.total} total (${filler.ratePerMinute}/min) — worst: ${filler.worstOffender}`,
      `Evaluation: Content ${analysis.contentScore}/5, Delivery ${analysis.deliveryScore}/5, Language ${analysis.languageScore}/5, Overall ${analysis.overallScore}/5`,
      '', 'Commendations:', ...analysis.commendations.map((c) => `- ${c}`),
      '', 'Recommendations:', ...analysis.recommendations.map((r) => `- ${r}`),
      '', `Word of the day used: ${analysis.wordOfDayUsed ? 'Yes' : 'No'}`,
      '', 'Summary:', analysis.summary ?? '',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    show('Report copied to clipboard');
  }

  return (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <div className="grid grid-cols-2 gap-3">
        {/* Panel 1: Grammar */}
        <div className="rounded-lg border border-surface-200 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase text-surface-500 mb-2">Grammar</h4>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 flex-1 rounded-full bg-surface-100 overflow-hidden">
              <div className="h-full" style={{ width: `${((analysis.grammarScore ?? 0) / 10) * 100}%`, background: scoreColor(analysis.grammarScore ?? 0, 10) }} />
            </div>
            <span className="text-sm font-bold" style={{ color: scoreColor(analysis.grammarScore ?? 0, 10) }}>{analysis.grammarScore ?? '—'}/10</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
            {analysis.grammarErrors.map((e, i) => (
              <p key={i} className="text-xs text-surface-600">
                <span className="line-through text-red-500">{e.text}</span> → <span className="text-green-600">{e.correction}</span>
                <span className="text-surface-400"> ({e.rule})</span>
              </p>
            ))}
            {analysis.grammarErrors.length === 0 && <p className="text-xs text-surface-400 italic">No grammar issues found</p>}
          </div>
          {analysis.grammarSuggestions.length > 0 && (
            <ul className="list-disc list-inside text-xs text-surface-500 mt-2">
              {analysis.grammarSuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>

        {/* Panel 2: Filler Words */}
        <div className="rounded-lg border border-surface-200 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase text-surface-500 mb-2">Filler Words</h4>
          <div className="flex flex-col gap-1">
            {TM_FILLER_WORDS.filter((w) => w !== 'other').map((w) => (
              <div key={w} className="flex items-center gap-2">
                <span className="text-xs w-16 text-surface-600">{TM_FILLER_LABELS[w]}</span>
                <div className="h-2 flex-1 rounded-full bg-surface-100 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(((filler as any)[w] ?? 0) / maxFillerCount) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-5 text-right">{(filler as any)[w] ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-surface-600">Total: <strong>{filler.total}</strong> · {filler.ratePerMinute}/min</span>
            <Badge variant="orange">Worst: {filler.worstOffender}</Badge>
          </div>
        </div>

        {/* Panel 3: Evaluation Scores */}
        <div className="rounded-lg border border-surface-200 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase text-surface-500 mb-2">Evaluation Scores</h4>
          <div className="flex flex-col gap-1.5">
            <StarRow label="Content" value={analysis.contentScore} />
            <StarRow label="Delivery" value={analysis.deliveryScore} />
            <StarRow label="Language" value={analysis.languageScore} />
            <StarRow label="Overall" value={analysis.overallScore} />
          </div>
        </div>

        {/* Panel 4: Feedback */}
        <div className="rounded-lg border border-surface-200 bg-white p-3 flex flex-col gap-2 max-h-56 overflow-y-auto">
          <h4 className="text-xs font-semibold uppercase text-surface-500">Feedback</h4>
          <div className="rounded-md bg-green-50 border border-green-200 p-2">
            <p className="text-xs font-semibold text-green-700 mb-1">What went well</p>
            <ul className="list-disc list-inside text-xs text-green-800">
              {analysis.commendations.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
            <p className="text-xs font-semibold text-amber-700 mb-1">To improve</p>
            <ul className="list-disc list-inside text-xs text-amber-800">
              {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <p className="text-xs text-surface-600"><strong>Opening:</strong> {analysis.openingFeedback}</p>
          <p className="text-xs text-surface-600"><strong>Body:</strong> {analysis.bodyFeedback}</p>
          <p className="text-xs text-surface-600"><strong>Conclusion:</strong> {analysis.conclusionFeedback}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {analysis.wordOfDayUsed ? (
          <Badge variant="green" className="flex items-center gap-1"><CheckCircle2 size={12} /> Word of the day used</Badge>
        ) : (
          <Badge variant="gray" className="flex items-center gap-1"><XCircle size={12} /> Word of the day not used</Badge>
        )}
      </div>

      {analysis.summary && (
        <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
          <p className="text-xs font-semibold uppercase text-surface-500 mb-1">Summary</p>
          <p className="text-sm text-surface-700">{analysis.summary}</p>
        </div>
      )}

      <div className="rounded-lg border border-surface-200 bg-white p-3 max-h-40 overflow-y-auto text-sm leading-relaxed">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase text-surface-500">Transcript</p>
          <SpeakButton text={analysis.transcript} label="Listen to speech" />
        </div>
        {highlightFillerWords(analysis.transcript)}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => show('Saved to this meeting')}>💾 Save to Meeting Report</Button>
        <Button variant="secondary" onClick={copyReport}><Copy size={13} /> Copy Report</Button>
        <Button variant="ghost" onClick={onRecordAgain}><RotateCcw size={13} /> Record Again</Button>
      </div>
    </div>
  );
}
