// src/pages/recruiter/ReportDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, User, ShieldAlert } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { reportsApi, extractError } from '../../services/api';
import {
  Button, Card, StatusBadge, ScoreRing, Spinner, Badge, Select, useToast, PageHeader
} from '../../components/ui';
import type { Report } from '../../types';

const DECISIONS = [
  { value: 'MOVE_FORWARD', label: '✓ Move Forward' },
  { value: 'ON_HOLD', label: '⏸ On Hold' },
  { value: 'REJECT', label: '✗ Reject' },
];

export default function ReportDetail() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [decision, setDecision] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  useEffect(() => {
    if (!interviewId) return;
    setLoading(true);
    reportsApi.get(interviewId).then((data) => {
      if (data.report) {
        setReport(data.report);
        setDecision(data.report.decision ?? 'PENDING');
      } else {
        setStatus(data.status ?? 'PROCESSING');
      }
    }).finally(() => setLoading(false));
  }, [interviewId]);

  async function handleDecision() {
    if (!interviewId || !decision) return;
    setSavingDecision(true);
    try {
      await reportsApi.setDecision(interviewId, decision);
      show('Decision saved!');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSavingDecision(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  if (!report) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-16">
        <AlertCircle size={40} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-lg font-bold text-surface-900 mb-2">Report not ready yet</h2>
        <p className="text-surface-500 text-sm mb-6">
          {status === 'COMPLETED' ? 'The AI is generating the evaluation. Check back in a minute.' : 'The interview has not been completed yet.'}
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Go back</Button>
      </div>
    );
  }

  const radarData = Object.entries(report.skillScores ?? {}).map(([skill, score]) => ({
    subject: skill, score,
  }));

  const scoreColor = report.overallScore >= 80 ? 'text-green-600' : report.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-surface-500 hover:text-surface-900">
          <ChevronLeft size={20} />
        </button>
        <PageHeader title="Evaluation Report" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-4">
          {/* Score card */}
          <Card className="p-5 text-center">
            <ScoreRing score={report.overallScore} size={96} />
            <p className={`text-2xl font-bold mt-3 ${scoreColor}`}>{report.overallScore}/100</p>
            <p className="text-sm text-surface-500 mb-3">Overall Score</p>
            <StatusBadge status={report.recommendation} />
          </Card>

          {/* Candidate info */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <User size={16} className="text-surface-400" />
              <h3 className="font-semibold text-surface-900 text-sm">Candidate</h3>
            </div>
            <p className="font-medium text-surface-900">{report.candidate?.name}</p>
            <p className="text-xs text-surface-400">{report.candidate?.email}</p>
            <p className="text-xs text-surface-500 mt-2">{report.opening?.title}</p>
          </Card>

          {/* Decision */}
          <Card className="p-5">
            <h3 className="font-semibold text-surface-900 mb-3 text-sm">Your Decision</h3>
            <Select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              options={[{ value: 'PENDING', label: '— Select decision —' }, ...DECISIONS]}
            />
            <Button className="w-full mt-3" size="sm" loading={savingDecision} onClick={handleDecision}>
              Save Decision
            </Button>
          </Card>

          {/* Proctoring */}
          {report.proctorSummary && report.proctorSummary.totalEvents > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={15} className="text-orange-500" />
                <h3 className="font-semibold text-surface-900 text-sm">Proctoring</h3>
              </div>
              <p className="text-sm text-orange-600 font-medium">{report.proctorSummary.totalEvents} events detected</p>
              <div className="mt-2 space-y-1">
                {report.proctorSummary.events.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-surface-500">{e.type.replace(/_/g, ' ')}</p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary */}
          <Card className="p-5">
            <h3 className="font-semibold text-surface-900 mb-3">AI Summary</h3>
            <p className="text-sm text-surface-700 leading-relaxed">{report.summary}</p>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" /> Strengths
              </h3>
              <ul className="space-y-1.5">
                {report.strengths?.map((s) => (
                  <li key={s} className="text-sm text-surface-700 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                <XCircle size={16} className="text-red-400" /> Gaps
              </h3>
              <ul className="space-y-1.5">
                {report.weaknesses?.map((w) => (
                  <li key={w} className="text-sm text-surface-700 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>{w}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Skill Radar */}
          {radarData.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-surface-900 mb-4">Skill Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {radarData.map(({ subject, score }) => (
                  <div key={subject} className="text-center">
                    <p className="text-xs text-surface-400 truncate">{subject}</p>
                    <p className="text-sm font-bold text-surface-900">{score}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Q&A Transcript */}
          {report.responses?.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">Question-by-Question</h3>
              </div>
              <div className="divide-y divide-surface-50">
                {report.responses.map((r, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-surface-100 text-xs font-bold text-surface-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium text-surface-900">{r.question}</p>
                      </div>
                      {r.score != null && <ScoreRing score={r.score} size={36} />}
                    </div>
                    {r.transcript ? (
                      <p className="text-xs text-surface-600 bg-surface-50 rounded-lg p-3 ml-8 leading-relaxed">
                        {r.transcript}
                      </p>
                    ) : (
                      <p className="text-xs text-surface-400 ml-8 italic">No response given</p>
                    )}
                    {r.feedback && (
                      <p className="text-xs text-brand-700 bg-brand-50 rounded-lg p-3 ml-8 mt-2">
                        💬 {r.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
