// src/components/toastmasters/EvaluationForm.tsx — full speech evaluation form
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Badge, Button, Textarea } from '../ui';
import type { SubmitEvaluationInput } from '../../services/toastmasters';
import type { TmEvaluation, TmRoleAssignment } from '../../services/toastmasters';

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-surface-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="text-amber-400 hover:scale-110 transition-transform">
            <Star size={18} fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EvaluationForm({ speaker, evaluator, existing, onSubmit, saving }: {
  speaker: TmRoleAssignment;
  evaluator: TmRoleAssignment;
  existing?: TmEvaluation;
  onSubmit: (data: SubmitEvaluationInput) => void;
  saving?: boolean;
}) {
  const [commendations, setCommendations] = useState(existing?.commendations ?? '');
  const [recommendations, setRecommendations] = useState(existing?.recommendations ?? '');
  const [ratingContent, setRatingContent] = useState(existing?.ratingContent ?? 0);
  const [ratingDelivery, setRatingDelivery] = useState(existing?.ratingDelivery ?? 0);
  const [ratingLanguage, setRatingLanguage] = useState(existing?.ratingLanguage ?? 0);
  const [overallRating, setOverallRating] = useState(existing?.overallRating ?? 0);
  const [openingFeedback, setOpeningFeedback] = useState(existing?.openingFeedback ?? '');
  const [bodyFeedback, setBodyFeedback] = useState(existing?.bodyFeedback ?? '');
  const [conclusionFeedback, setConclusionFeedback] = useState(existing?.conclusionFeedback ?? '');

  function buildPayload(status: 'DRAFT' | 'SUBMITTED'): SubmitEvaluationInput {
    return {
      speakerRoleId: speaker.id, evaluatorRoleId: evaluator.id,
      commendations, recommendations, openingFeedback, bodyFeedback, conclusionFeedback,
      ratingContent: ratingContent || undefined,
      ratingDelivery: ratingDelivery || undefined,
      ratingLanguage: ratingLanguage || undefined,
      overallRating: overallRating || undefined,
      status,
    };
  }

  const duration = speaker.greenMins != null && speaker.redMins != null ? `${speaker.greenMins}-${speaker.redMins} mins` : '—';

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-surface-900">{speaker.speechTitle ?? 'Untitled speech'}</h3>
          <p className="text-xs text-surface-500 mt-0.5">
            Speaker: {speaker.member?.name ?? 'Unassigned'} · Project: {speaker.pathwaysProject ?? '—'} · Duration: {duration}
          </p>
          <p className="text-xs text-surface-500">Evaluator: {evaluator.member?.name ?? 'Unassigned'}</p>
        </div>
        <Badge variant={existing?.status === 'SUBMITTED' ? 'green' : 'gray'}>{existing?.status ?? 'DRAFT'}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <StarRating label="Content & Structure" value={ratingContent} onChange={setRatingContent} />
        <StarRating label="Delivery & Body Language" value={ratingDelivery} onChange={setRatingDelivery} />
        <StarRating label="Language & Vocabulary" value={ratingLanguage} onChange={setRatingLanguage} />
        <StarRating label="Overall Rating" value={overallRating} onChange={setOverallRating} />
      </div>

      <Textarea label="What went well? (commendations)" rows={3} value={commendations} onChange={(e) => setCommendations(e.target.value)} />
      <Textarea label="What to improve? (recommendations)" rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />

      <div className="grid grid-cols-3 gap-3">
        <Textarea label="Opening — attention-grabbing?" rows={2} value={openingFeedback} onChange={(e) => setOpeningFeedback(e.target.value)} />
        <Textarea label="Body — clear structure?" rows={2} value={bodyFeedback} onChange={(e) => setBodyFeedback(e.target.value)} />
        <Textarea label="Conclusion — memorable?" rows={2} value={conclusionFeedback} onChange={(e) => setConclusionFeedback(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" loading={saving} onClick={() => onSubmit(buildPayload('DRAFT'))}>Save Draft</Button>
        <Button loading={saving} onClick={() => onSubmit(buildPayload('SUBMITTED'))}>Submit Evaluation</Button>
      </div>
    </div>
  );
}
