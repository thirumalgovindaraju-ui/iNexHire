// src/pages/recruiter/CreateOpening.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import { openingsApi, extractError } from '../../services/api';
import { Button, Input, Textarea, Select, Card, PageHeader, useToast } from '../../components/ui';

type Step = 'details' | 'jd' | 'questions';

export default function CreateOpening() {
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();

  const [step, setStep] = useState<Step>('details');
  const [saving, setSaving] = useState(false);
  const [generatingJD, setGeneratingJD] = useState(false);
  const [generatingQs, setGeneratingQs] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const [form, setForm] = useState({
    title: '',
    department: '',
    location: '',
    jobDescription: '',
    difficulty: 'MEDIUM',
    questionCount: '10',
  });

  async function handleGenerateJD() {
    if (!form.title) return show('Enter a job title first', 'error');
    setGeneratingJD(true);
    try {
      const data = await openingsApi.generateJD({
        title: form.title,
        department: form.department || undefined,
        level: 'Mid-Senior',
      });
      setForm((f) => ({ ...f, jobDescription: data.jobDescription }));
      show('Job description generated!');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setGeneratingJD(false);
    }
  }

  async function handleCreateOpening() {
    if (!form.title || !form.jobDescription) {
      return show('Title and job description are required', 'error');
    }
    setSaving(true);
    try {
      const opening = await openingsApi.create({
        title: form.title,
        department: form.department || undefined,
        location: form.location || undefined,
        jobDescription: form.jobDescription,
        difficulty: form.difficulty,
        questionCount: parseInt(form.questionCount),
      });
      setOpeningId(opening.id);
      setStep('questions');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateQuestions() {
    setGeneratingQs(true);
    try {
      const data = await openingsApi.generateQuestions(openingId, {
        difficulty: form.difficulty as any,
        count: parseInt(form.questionCount),
        replace: true,
      });
      setQuestionCount(data.count);
      show(`${data.count} questions generated!`);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setGeneratingQs(false);
    }
  }

  const steps = [
    { id: 'details', label: 'Role Details' },
    { id: 'jd', label: 'Job Description' },
    { id: 'questions', label: 'Questions' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/openings')} className="text-surface-500 hover:text-surface-900">
          <ChevronLeft size={20} />
        </button>
        <PageHeader title="Create Job Opening" />
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s.id ? 'bg-brand-600 text-white' :
                steps.findIndex((x) => x.id === step) > i ? 'bg-green-500 text-white' :
                'bg-surface-200 text-surface-500'
              }`}>
                {steps.findIndex((x) => x.id === step) > i ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === s.id ? 'text-surface-900' : 'text-surface-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-3 ${steps.findIndex((x) => x.id === step) > i ? 'bg-green-400' : 'bg-surface-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 'details' && (
        <Card className="p-6 space-y-4">
          <Input label="Job Title *" placeholder="e.g. Senior React Developer"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" placeholder="Engineering"
              value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Input label="Location" placeholder="Remote / Chennai"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Difficulty"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              options={[
                { value: 'EASY', label: 'Easy (Entry level)' },
                { value: 'MEDIUM', label: 'Medium (Mid level)' },
                { value: 'HARD', label: 'Hard (Senior level)' },
              ]}
            />
            <Select label="Number of Questions"
              value={form.questionCount}
              onChange={(e) => setForm({ ...form, questionCount: e.target.value })}
              options={[5, 8, 10, 12, 15, 20].map((n) => ({ value: String(n), label: `${n} questions` }))}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep('jd')} disabled={!form.title}>
              Next: Job Description →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: JD */}
      {step === 'jd' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-surface-900">Job Description</h3>
              <p className="text-xs text-surface-500 mt-0.5">Paste your JD or let AI generate one</p>
            </div>
            <Button
              variant="secondary"
              icon={generatingJD ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              onClick={handleGenerateJD}
              loading={generatingJD}
            >
              AI Generate
            </Button>
          </div>

          <Textarea
            placeholder="Paste or write the job description here..."
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            rows={14}
            className="font-mono text-xs"
          />

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('details')}>← Back</Button>
            <Button onClick={handleCreateOpening} loading={saving} disabled={!form.jobDescription}>
              {saving ? 'Creating...' : 'Create Opening →'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Questions */}
      {step === 'questions' && (
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-2">Opening Created!</h3>
          <p className="text-sm text-surface-500 mb-6">
            Now generate AI interview questions based on the job description.
          </p>

          {questionCount > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-700 font-medium">
              ✓ {questionCount} questions generated and ready
            </div>
          ) : (
            <Button
              size="lg"
              icon={generatingQs ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              onClick={handleGenerateQuestions}
              loading={generatingQs}
              className="mb-4"
            >
              {generatingQs ? 'Generating questions...' : `Generate ${form.questionCount} Questions with AI`}
            </Button>
          )}

          <div className="flex gap-3 justify-center mt-2">
            <Button variant="secondary" onClick={() => navigate(`/openings/${openingId}`)}>
              View Opening
            </Button>
            <Button onClick={() => navigate('/candidates')}>
              Add Candidates →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
