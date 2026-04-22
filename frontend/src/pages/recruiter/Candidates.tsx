// src/pages/recruiter/Candidates.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Users, Mail, Plus, ChevronRight } from 'lucide-react';
import { candidatesApi, extractError } from '../../services/api';
import { Button, Card, StatusBadge, EmptyState, Spinner, PageHeader, Input, ScoreRing, useToast } from '../../components/ui';
import type { Candidate } from '../../types';
import { formatDistanceToNow } from 'date-fns';

export default function Candidates() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const openingId = params.get('openingId') ?? undefined;
  const { show, ToastContainer } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);

  async function load(s = '') {
    setLoading(true);
    try {
      const data = await candidatesApi.list({ openingId, search: s || undefined });
      setCandidates(data.candidates);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [openingId]);
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSendInvite(candidateId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setInviting(candidateId);
    try {
      await candidatesApi.sendInvite(candidateId);
      show('Interview invite sent!');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setInviting(null);
    }
  }

  function getLatestInterview(c: Candidate) {
    return c.interviews?.[0];
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer />
      <PageHeader
        title={`Candidates (${total})`}
        description="All candidates across your job openings"
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name or email..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : candidates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No candidates found"
            description="Add candidates to a job opening and send them interview links."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden md:table-cell">Opening</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden lg:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {candidates.map((c) => {
                  const interview = getLatestInterview(c);
                  const score = (interview as any)?.report?.overallScore;
                  return (
                    <tr key={c.id}
                      className="hover:bg-surface-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/candidates/${c.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-700 text-xs font-bold">{c.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-surface-900">{c.name}</p>
                            <p className="text-xs text-surface-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-surface-600">{c.opening?.title}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {interview ? <StatusBadge status={interview.status} /> : (
                          <span className="text-xs text-surface-400">Not invited</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {score != null ? <ScoreRing score={score} size={36} /> : '—'}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-surface-400">
                          {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          {(!interview || interview.status === 'EXPIRED') && (
                            <Button
                              size="sm" variant="secondary"
                              icon={<Mail size={13} />}
                              loading={inviting === c.id}
                              onClick={(e) => handleSendInvite(c.id, e)}
                            >
                              Invite
                            </Button>
                          )}
                          <ChevronRight size={16} className="text-surface-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
