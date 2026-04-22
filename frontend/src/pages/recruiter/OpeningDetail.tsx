// src/pages/recruiter/OpeningDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Wand2, Plus, Trash2, Users, RefreshCw } from 'lucide-react';
import { openingsApi, extractError } from '../../services/api';
import {
  Button, Card, Badge, StatusBadge, Spinner, PageHeader, Modal, useToast
} from '../../components/ui';
import type { Opening, Question } from '../../types';
import AddCandidateModal from './components/AddCandidateModal';

export default function OpeningDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [opening, setOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQs, setGeneratingQs] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await openingsApi.get(id);
      setOpening(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleRegenQuestions() {
    if (!opening) return;
    setGeneratingQs(true);
    try {
      const data = await openingsApi.generateQuestions(opening.id, {
        difficulty: opening.difficulty,
        count: opening.questionCount,
        replace: true,
      });
      show(`${data.count} new questions generated`);
      load();
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setGeneratingQs(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!opening) return <div className="p-6 text-surface-500">Opening not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer />
      <AddCandidateModal
        open={showAddCandidate}
        openingId={opening.id}
        onClose={() => setShowAddCandidate(false)}
        onAdded={() => { show('Candidate added!'); setShowAddCandidate(false); }}
      />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/openings')} className="text-surface-500 hover:text-surface-900">
          <ChevronLeft size={20} />
        </button>
        <PageHeader
          title={opening.title}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Users size={16} />} onClick={() => navigate(`/candidates?openingId=${opening.id}`)}>
                View Candidates ({opening._count?.candidates ?? 0})
              </Button>
              <Button icon={<Plus size={16} />} onClick={() => setShowAddCandidate(true)}>
                Add Candidate
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-surface-900 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              {opening.department && (
                <div><dt className="text-surface-400 text-xs">Department</dt><dd className="font-medium">{opening.department}</dd></div>
              )}
              {opening.location && (
                <div><dt className="text-surface-400 text-xs">Location</dt><dd className="font-medium">{opening.location}</dd></div>
              )}
              <div><dt className="text-surface-400 text-xs">Difficulty</dt><dd><StatusBadge status={opening.difficulty} /></dd></div>
              <div><dt className="text-surface-400 text-xs">Target Questions</dt><dd className="font-medium">{opening.questionCount}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-surface-900 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {opening.skills.map((s) => <Badge key={s} variant="blue">{s}</Badge>)}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-surface-900 mb-3 text-sm">Job Description</h3>
            <p className="text-xs text-surface-500 leading-relaxed whitespace-pre-line line-clamp-10">
              {opening.jobDescription}
            </p>
          </Card>
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">
                Interview Questions ({opening.questions?.length ?? 0})
              </h3>
              <Button
                variant="secondary"
                size="sm"
                icon={generatingQs ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                onClick={handleRegenQuestions}
                loading={generatingQs}
              >
                Regenerate
              </Button>
            </div>

            {!opening.questions?.length ? (
              <div className="py-10 text-center">
                <p className="text-surface-400 text-sm mb-4">No questions yet</p>
                <Button
                  icon={<Wand2 size={16} />}
                  onClick={handleRegenQuestions}
                  loading={generatingQs}
                >
                  Generate with AI
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-surface-50">
                {opening.questions.map((q: Question, i: number) => (
                  <div key={q.id} className="flex items-start gap-4 px-5 py-4">
                    <span className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-500 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-900">{q.text}</p>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant={q.type === 'technical' ? 'blue' : q.type === 'behavioral' ? 'green' : 'purple'}>
                          {q.type}
                        </Badge>
                        <span className="text-xs text-surface-400">{q.timeLimit}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
