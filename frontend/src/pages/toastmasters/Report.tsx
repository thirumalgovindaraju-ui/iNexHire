// src/pages/toastmasters/Report.tsx — report page: fetch, finalize, print/export/share
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Link2, Printer } from 'lucide-react';
import { Button, PageHeader, Spinner, useToast } from '../../components/ui';
import MeetingReportView from '../../components/toastmasters/MeetingReport';
import { extractError } from '../../services/api';
import { meetingsApi, reportApi } from '../../services/toastmasters';
import type { TmMeeting, TmMeetingFullReport } from '../../services/toastmasters';

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, ToastContainer } = useToast();
  const [report, setReport] = useState<TmMeetingFullReport | null>(null);
  const [nextMeeting, setNextMeeting] = useState<TmMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [awards, setAwards] = useState({ bestSpeakerRoleId: '', bestTableTopicId: '', bestEvaluatorRoleId: '' });

  useEffect(() => {
    if (!id) return;
    Promise.all([reportApi.get(id), meetingsApi.list()]).then(([r, all]) => {
      setReport(r);
      setAwards({
        bestSpeakerRoleId: r.report?.bestSpeakerRoleId ?? '',
        bestTableTopicId: r.report?.bestTableTopicId ?? '',
        bestEvaluatorRoleId: r.report?.bestEvaluatorRoleId ?? '',
      });
      const upcoming = all
        .filter((m) => m.id !== id && new Date(m.date).getTime() > new Date(r.date).getTime())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setNextMeeting(upcoming[0] ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleFinalize() {
    if (!id) return;
    setFinalizing(true);
    try {
      const persisted = await reportApi.generate(id, awards);
      await meetingsApi.update(id, { status: 'COMPLETED' });
      setReport((prev) => (prev ? { ...prev, status: 'COMPLETED', report: persisted } : prev));
      show('Report finalized');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setFinalizing(false);
    }
  }

  function shareLink() {
    navigator.clipboard.writeText(window.location.href);
    show('Link copied (recipients need a NexHire login)');
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!report) return <p className="p-6 text-surface-500">Meeting not found.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer />
      <PageHeader
        title=""
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" onClick={() => navigate(`/toastmasters/${id}`)}>Back to Meeting</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer size={13} /> Print</Button>
            <Button variant="secondary" onClick={() => window.print()} title="Uses your browser's Print to PDF">Export PDF</Button>
            <Button variant="secondary" onClick={shareLink}><Link2 size={13} /> Share Link</Button>
            <Button loading={finalizing} onClick={handleFinalize}><CheckCircle2 size={13} /> Finalize Report</Button>
          </div>
        }
      />

      <MeetingReportView
        report={report}
        nextMeeting={nextMeeting}
        awards={awards}
        onAwardsChange={(patch) => setAwards((prev) => ({ ...prev, ...patch }))}
        finalized={!!report.report}
      />
    </div>
  );
}
