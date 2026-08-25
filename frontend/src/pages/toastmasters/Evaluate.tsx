// src/pages/toastmasters/Evaluate.tsx — per-speaker evaluation tabs + General Evaluator section
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award } from 'lucide-react';
import { Badge, Button, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import EvaluationForm from '../../components/toastmasters/EvaluationForm';
import VoiceRecorder from '../../components/toastmasters/VoiceRecorder';
import { extractError } from '../../services/api';
import {
  TM_SPEAKER_EVALUATOR_PAIRS, evaluationsApi, generalEvaluationApi, meetingsApi, speechAnalysisApi,
} from '../../services/toastmasters';
import type {
  SubmitEvaluationInput, TmEvaluation, TmGeneralEvaluation, TmMeeting, TmSpeechAnalysis,
} from '../../services/toastmasters';

export default function Evaluate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [meeting, setMeeting] = useState<TmMeeting | null>(null);
  const [evaluations, setEvaluations] = useState<TmEvaluation[]>([]);
  const [generalEval, setGeneralEval] = useState<TmGeneralEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [speechAnalyses, setSpeechAnalyses] = useState<Record<string, TmSpeechAnalysis | null>>({});

  const [overallFeedback, setOverallFeedback] = useState('');
  const [evaluatorFeedback, setEvaluatorFeedback] = useState<Record<string, string>>({});
  const [bestSpeakerRoleId, setBestSpeakerRoleId] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([meetingsApi.get(id), evaluationsApi.list(id), generalEvaluationApi.get(id)])
      .then(([m, evals, gen]) => {
        setMeeting(m);
        setEvaluations(evals);
        setGeneralEval(gen);
        setOverallFeedback(gen?.overallFeedback ?? '');
        setBestSpeakerRoleId(gen?.bestSpeakerRoleId ?? '');
        setEvaluatorFeedback(Object.fromEntries((gen?.evaluatorFeedback ?? []).map((f) => [f.evaluatorRoleId, f.feedback])));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const roles = meeting?.roleAssignments ?? [];
  const pairs = TM_SPEAKER_EVALUATOR_PAIRS
    .map(([sName, eName]) => ({ speaker: roles.find((r) => r.roleName === sName), evaluator: roles.find((r) => r.roleName === eName) }))
    .filter((p) => p.speaker && p.evaluator) as { speaker: NonNullable<typeof roles[number]>; evaluator: NonNullable<typeof roles[number]> }[];

  const activePair = pairs[activeTab];
  const activeEvaluation = activePair ? evaluations.find((e) => e.speakerRoleId === activePair.speaker.id) : undefined;

  useEffect(() => {
    if (!activePair || activePair.speaker.id in speechAnalyses) return;
    speechAnalysisApi.getForRole(activePair.speaker.id).then((analysis) => {
      setSpeechAnalyses((prev) => ({ ...prev, [activePair.speaker.id]: analysis }));
    });
  }, [activePair?.speaker.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!meeting) return <p className="p-6 text-surface-500">Meeting not found.</p>;

  async function handleSubmit(data: SubmitEvaluationInput) {
    if (!id) return;
    setSaving(true);
    try {
      const evaluation = await evaluationsApi.submit(id, data);
      setEvaluations((prev) => {
        const idx = prev.findIndex((e) => e.speakerRoleId === data.speakerRoleId);
        if (idx === -1) return [...prev, evaluation];
        return prev.map((e, i) => (i === idx ? evaluation : e));
      });
      show(data.status === 'SUBMITTED' ? 'Evaluation submitted' : 'Draft saved');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGeneral(status: 'DRAFT' | 'SUBMITTED') {
    if (!id) return;
    setSaving(true);
    try {
      const gen = await generalEvaluationApi.upsert(id, {
        overallFeedback,
        evaluatorFeedback: Object.entries(evaluatorFeedback).map(([evaluatorRoleId, feedback]) => ({ evaluatorRoleId, feedback })),
        bestSpeakerRoleId: bestSpeakerRoleId || undefined,
        status,
      });
      setGeneralEval(gen);
      show(status === 'SUBMITTED' ? 'General evaluation submitted' : 'General evaluation draft saved');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const evaluatorRoles = roles.filter((r) => r.roleName.startsWith('EVALUATOR_'));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer />
      <PageHeader
        title={`Evaluate — ${meeting.title}`}
        action={<Button variant="secondary" onClick={() => navigate(`/toastmasters/${id}`)}>Back to Meeting</Button>}
      />

      <div className="flex gap-1 mb-4 border-b border-surface-200">
        {pairs.map((p, i) => {
          const evalForTab = evaluations.find((e) => e.speakerRoleId === p.speaker.id);
          return (
            <button
              key={p.speaker.id}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                i === activeTab ? 'border-brand-600 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              Speaker {i + 1}
              {evalForTab?.status === 'SUBMITTED' && <Badge variant="green" className="ml-2">✓</Badge>}
            </button>
          );
        })}
      </div>

      {activePair ? (
        <div className="flex flex-col gap-4">
          <VoiceRecorder
            key={activePair.speaker.id}
            meetingId={id!}
            roleAssignmentId={activePair.speaker.id}
            speakerName={activePair.speaker.member?.name ?? 'Speaker'}
            wordOfDay={meeting.wordOfDay}
            onAnalysisComplete={(analysis) => setSpeechAnalyses((prev) => ({ ...prev, [activePair.speaker.id]: analysis }))}
          />
          <EvaluationForm
            key={activePair.speaker.id}
            speaker={activePair.speaker}
            evaluator={activePair.evaluator}
            existing={activeEvaluation}
            aiSuggestion={speechAnalyses[activePair.speaker.id]}
            onSubmit={handleSubmit}
            saving={saving}
          />
        </div>
      ) : (
        <p className="text-sm text-surface-400 italic">No speaker/evaluator pairs assigned yet.</p>
      )}

      <div className="mt-8 pt-6 border-t border-surface-200">
        <h2 className="font-semibold text-surface-900 mb-3 flex items-center gap-2"><Award size={16} /> General Evaluator</h2>
        <div className="rounded-lg border border-surface-200 bg-white p-4 flex flex-col gap-4">
          <Textarea label="Overall meeting evaluation" rows={4} value={overallFeedback} onChange={(e) => setOverallFeedback(e.target.value)} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-surface-700">Individual evaluator feedback</span>
            {evaluatorRoles.map((r) => (
              <Textarea
                key={r.id}
                label={`Feedback for ${r.member?.name ?? r.roleName}`}
                rows={2}
                value={evaluatorFeedback[r.id] ?? ''}
                onChange={(e) => setEvaluatorFeedback((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
            ))}
          </div>

          <Select
            label="Best Speaker recommendation"
            value={bestSpeakerRoleId}
            onChange={(e) => setBestSpeakerRoleId(e.target.value)}
            options={[{ value: '', label: 'No recommendation yet' }, ...pairs.map((p) => ({ value: p.speaker.id, label: `${p.speaker.member?.name ?? 'Unassigned'} — ${p.speaker.speechTitle ?? 'Untitled'}` }))]}
          />

          <div className="flex items-center gap-2">
            {generalEval?.status && <Badge variant={generalEval.status === 'SUBMITTED' ? 'green' : 'gray'}>{generalEval.status}</Badge>}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" loading={saving} onClick={() => handleSaveGeneral('DRAFT')}>Save Draft</Button>
              <Button loading={saving} onClick={() => handleSaveGeneral('SUBMITTED')}>Submit</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
