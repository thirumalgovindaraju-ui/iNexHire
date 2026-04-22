// src/pages/recruiter/CandidateDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, ExternalLink } from 'lucide-react';
import { candidatesApi, candidatesApi as api, extractError } from '../../services/api';
import { Button, Card, StatusBadge, ScoreRing, Spinner, PageHeader, Badge, useToast } from '../../components/ui';
import type { Candidate } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!id) return;
    candidatesApi.get(id).then(setCandidate).finally(() => setLoading(false));
  }, [id]);

  async function handleSendInvite() {
    if (!id) return;
    setInviting(true);
    try {
      await api.sendInvite(id);
      show('Invite sent!');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setInviting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!candidate) return <div className="p-6 text-surface-500">Candidate not found</div>;

  const latestInterview = candidate.interviews?.[0];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-surface-500 hover:text-surface-900">
          <ChevronLeft size={20} />
        </button>
        <PageHeader title={candidate.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-3">
                <span className="text-brand-700 text-2xl font-bold">{candidate.name.charAt(0)}</span>
              </div>
              <h2 className="font-semibold text-surface-900">{candidate.name}</h2>
              <p className="text-sm text-surface-500">{candidate.opening?.title}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-surface-600">
                <Mail size={14} className="text-surface-400" />
                {candidate.email}
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-surface-600">
                  <Phone size={14} className="text-surface-400" />
                  {candidate.phone}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-100">
              <Button className="w-full" size="sm" variant="secondary"
                icon={<Mail size={14} />} loading={inviting} onClick={handleSendInvite}>
                Send/Resend Invite
              </Button>
            </div>
          </Card>
        </div>

        {/* Interviews */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-surface-900">Interview History ({candidate.interviews?.length ?? 0})</h3>

          {!candidate.interviews?.length ? (
            <Card className="p-8 text-center">
              <p className="text-surface-400 text-sm">No interviews yet</p>
            </Card>
          ) : (
            candidate.interviews?.map((interview: any) => (
              <Card key={interview.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={interview.status} />
                      {interview.report?.recommendation && (
                        <StatusBadge status={interview.report.recommendation} />
                      )}
                    </div>
                    <p className="text-xs text-surface-400 mt-1">
                      {interview.completedAt
                        ? `Completed ${format(new Date(interview.completedAt), 'MMM d, yyyy')}`
                        : `Invited ${formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}`}
                    </p>
                  </div>
                  {interview.report?.overallScore != null && (
                    <div className="text-center">
                      <ScoreRing score={interview.report.overallScore} size={56} />
                      <p className="text-xs text-surface-400 mt-1">Overall</p>
                    </div>
                  )}
                </div>

                {interview.report && (
                  <>
                    <p className="text-sm text-surface-600 mb-3 line-clamp-3">{interview.report.summary || 'Report available'}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {interview.report.strengths?.slice(0, 2).map((s: string) => (
                        <Badge key={s} variant="green">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <StatusBadge status={interview.report.decision} />
                    </div>
                  </>
                )}

                {(interview.status === 'EVALUATED' || interview.status === 'COMPLETED') && (
                  <Button size="sm" variant="secondary" icon={<ExternalLink size={13} />}
                    onClick={() => navigate(`/reports/${interview.id}`)}>
                    View Full Report
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
