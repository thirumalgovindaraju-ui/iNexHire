// src/components/CommunicationScorecard.tsx
// Speech/communication-quality scorecard — generated from the interview transcript by
// generateCommunicationAssessment (see backend/src/services/ai.service.ts). Deliberately
// styled as a standalone "executive scorecard" rather than a dense report table, reusing
// the app's existing Card/Badge/ScoreRing components so it doesn't look bolted on.
import { useEffect, useState } from 'react';
import { Sparkles, RotateCcw, Printer, Clock, Calendar } from 'lucide-react';
import { Button, Card, Badge, ScoreRing, Spinner } from './ui';
import { communicationAssessmentApi, extractError } from '../services/api';

interface SubMetric {
  score: number;
  comments: string;
  errorTypes: string[];
}

interface CommunicationAssessment {
  overallScore: number;
  communicationScore: number;
  communicationLevel: string;
  summary: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  linguisticAccuracy: SubMetric;
  phoneticClarity: SubMetric;
  vocalProsody: SubMetric;
  operationalFluency: SubMetric;
  lexicalInteractiveIntelligence: SubMetric;
}

const NAVY = '#0B1F3A';
const GOLD = '#B8934A';

const DIMENSIONS: Array<{ key: keyof CommunicationAssessment; label: string }> = [
  { key: 'linguisticAccuracy', label: 'Linguistic Accuracy' },
  { key: 'phoneticClarity', label: 'Phonetic Clarity & Articulation' },
  { key: 'vocalProsody', label: 'Vocal Prosody' },
  { key: 'operationalFluency', label: 'Operational Fluency' },
  { key: 'lexicalInteractiveIntelligence', label: 'Lexical & Interactive Intelligence' },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? GOLD : '#dc2626';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function CommunicationScorecard({
  interviewId,
  candidateName,
  candidateEmail,
}: {
  interviewId: string;
  candidateName?: string;
  candidateEmail?: string;
}) {
  const [assessment, setAssessment] = useState<CommunicationAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    communicationAssessmentApi.get(interviewId)
      .then((a) => setAssessment(a))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, [interviewId]);

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      const a = await communicationAssessmentApi.generate(interviewId);
      setAssessment(a);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8 flex justify-center">
        <Spinner size={22} />
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #comm-scorecard-print, #comm-scorecard-print * { visibility: visible; }
          #comm-scorecard-print { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <Card className="p-0 overflow-hidden" >
        <div id="comm-scorecard-print">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <Sparkles size={15} style={{ color: GOLD }} />
              Communication Assessment Scorecard
            </h3>
            {assessment && (
              <div className="flex gap-2 print:hidden">
                <Button size="sm" variant="secondary" icon={<RotateCcw size={13} />} loading={generating} onClick={handleGenerate}>
                  Re-run
                </Button>
                <Button size="sm" variant="secondary" icon={<Printer size={13} />} onClick={() => window.print()}>
                  Export PDF
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!assessment ? (
            <div className="p-8 text-center">
              <Sparkles size={32} className="mx-auto mb-3" style={{ color: GOLD, opacity: 0.6 }} />
              <p className="text-sm font-semibold text-surface-900 mb-1">No scorecard yet</p>
              <p className="text-xs text-surface-500 mb-4">
                Score this candidate's communication quality (grammar, clarity, fluency, vocabulary) — never interview content.
              </p>
              <Button size="sm" icon={<Sparkles size={13} />} loading={generating} onClick={handleGenerate}>
                {generating ? 'Generating…' : 'Generate Scorecard'}
              </Button>
            </div>
          ) : (
            <div className="p-6">
              {/* Hero row */}
              <div className="flex items-start justify-between gap-6 pb-5 mb-5 border-b border-surface-100">
                <div>
                  {candidateName && <p className="text-base font-semibold text-surface-900">{candidateName}</p>}
                  {candidateEmail && <p className="text-xs text-surface-400 mb-2">{candidateEmail}</p>}
                  <blockquote
                    className="text-sm text-surface-700 italic pl-3 mt-2"
                    style={{ borderLeft: `3px solid ${NAVY}` }}
                  >
                    {assessment.summary}
                  </blockquote>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <ScoreRing score={assessment.communicationScore} size={72} />
                  <div
                    className="flex flex-col items-center justify-center rounded-xl px-4 py-2"
                    style={{ background: NAVY }}
                  >
                    <span className="text-2xl font-bold text-white leading-none">{assessment.communicationLevel}</span>
                    <span className="text-[10px] uppercase tracking-wide text-white/60 mt-1">CEFR Band</span>
                  </div>
                </div>
              </div>

              {/* Sub-metric grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {DIMENSIONS.map(({ key, label }) => {
                  const m = assessment[key] as SubMetric;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-surface-200 p-3"
                      style={{ borderLeft: `3px solid ${GOLD}` }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-500 mb-2">{label}</p>
                      <ScoreBar score={m.score} />
                      {m.comments && <p className="text-xs text-surface-600 mt-2 leading-relaxed">{m.comments}</p>}
                      {m.errorTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.errorTypes.map((tag) => (
                            <Badge key={tag} variant="gray">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400 pt-4 border-t border-surface-100">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDateTime(assessment.startedAt).date} · {formatDateTime(assessment.startedAt).time}
                  {' → '}
                  {formatDateTime(assessment.endedAt).date} · {formatDateTime(assessment.endedAt).time}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Duration: {formatDuration(assessment.durationSeconds)}
                </span>
              </div>

              <p className="text-[11px] text-surface-400 italic mt-3">
                Communication scoring is a supplementary signal — review alongside the fairness/compliance
                guidance used for other AI signals before acting on it.
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
