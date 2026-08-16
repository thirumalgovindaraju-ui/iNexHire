// src/pages/recruiter/WhatsAppCenter.tsx — wired to real backend (SIMULATION unless Twilio configured)
import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Send, Bell, AlertTriangle, Phone } from 'lucide-react';
import { Button, Card, Badge, Select, Textarea, Spinner, PageHeader, EmptyState, useToast } from '../../components/ui';
import { whatsappApi, candidatesApi, interviewsApi, extractError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DISCLAIMER = 'WhatsApp messages are simulated. Add TWILIO credentials to go live.';

const MESSAGE_TYPES = [
  { value: 'INVITE', label: 'Interview Invite' },
  { value: 'REMINDER', label: '24hr Reminder' },
  { value: 'RESULT', label: 'Result Notification' },
  { value: 'OFFER', label: 'Offer Notification' },
  { value: 'CUSTOM', label: 'Custom Message' },
];

const STATUS_VARIANT: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
  DELIVERED: 'green',
  SENT: 'blue',
  FAILED: 'red',
  SIMULATED: 'gray',
};

interface CandidateOption {
  id: string;
  name: string;
  phone: string | null;
  opening?: { title: string };
}

interface WhatsAppLogRow {
  id: string;
  candidateId: string;
  phone: string;
  messageType: string;
  status: string;
  message: string;
  sentAt: string;
  isSimulated: boolean;
  candidate?: { id: string; name: string; phone: string | null };
}

export default function WhatsAppCenter() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const { show, ToastContainer } = useToast();

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [logs, setLogs] = useState<WhatsAppLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reminding, setReminding] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [messageType, setMessageType] = useState('INVITE');
  const [customMessage, setCustomMessage] = useState('');

  const loadLogs = useCallback(async (candidateList: CandidateOption[]) => {
    if (isAdmin) {
      return whatsappApi.logs();
    }
    // No org-wide list endpoint for recruiters — merge per-candidate history instead.
    const perCandidate = await Promise.all(
      candidateList.map((c) => whatsappApi.logsForCandidate(c.id).catch(() => []))
    );
    return perCandidate.flat().sort((a: WhatsAppLogRow, b: WhatsAppLogRow) =>
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }, [isAdmin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await candidatesApi.list({ limit: 100 });
      const opts: CandidateOption[] = data.candidates ?? [];
      setCandidates(opts);
      if (!selectedCandidateId && opts.length > 0) setSelectedCandidateId(opts[0].id);
      const fetchedLogs = await loadLogs(opts);
      setLogs(fetchedLogs);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLogs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSend() {
    if (!selectedCandidateId) return;
    if (messageType === 'CUSTOM' && !customMessage.trim()) {
      show('Enter a message to send', 'error');
      return;
    }
    setSending(true);
    try {
      await whatsappApi.send({
        candidateId: selectedCandidateId,
        messageType: messageType as any,
        customMessage: messageType === 'CUSTOM' ? customMessage : undefined,
      });
      show('Message sent!');
      setCustomMessage('');
      await refresh();
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleRemindAll() {
    setReminding(true);
    try {
      const data = await interviewsApi.list({ status: 'PENDING', limit: 100 });
      const interviews = data.interviews ?? [];
      let sent = 0;
      let failed = 0;
      for (const interview of interviews) {
        try {
          await whatsappApi.remind(interview.id);
          sent++;
        } catch {
          failed++;
        }
      }
      show(`Reminders sent: ${sent}${failed ? `, skipped: ${failed} (no phone or not pending)` : ''}`);
      await refresh();
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setReminding(false);
    }
  }

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer />
      <PageHeader
        title="WhatsApp Center"
        description="Send interview invites, reminders, and updates to candidates via WhatsApp"
      />

      <div className="flex items-start gap-2.5 bg-surface-100 border border-surface-200 rounded-xl px-4 py-3 mb-6">
        <AlertTriangle size={16} className="text-surface-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-surface-600 font-medium">{DISCLAIMER}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send message form */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2">
            <MessageCircle size={16} className="text-brand-600" /> Send Message
          </h3>

          <Select
            label="Candidate"
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            options={candidates.map((c) => ({
              value: c.id,
              label: `${c.name}${c.phone ? '' : ' (no phone)'}`,
            }))}
          />
          {selectedCandidate && (
            <p className="text-xs text-surface-400 flex items-center gap-1 -mt-1">
              <Phone size={11} /> {selectedCandidate.phone ?? 'No phone number on file'}
            </p>
          )}

          <Select
            label="Message Type"
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            options={MESSAGE_TYPES}
          />

          {messageType === 'CUSTOM' && (
            <Textarea
              label="Message"
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message..."
            />
          )}

          <Button
            className="w-full"
            icon={<Send size={14} />}
            loading={sending}
            disabled={!selectedCandidateId || !selectedCandidate?.phone}
            onClick={handleSend}
          >
            Send Message
          </Button>

          <div className="pt-3 border-t border-surface-100">
            <Button
              className="w-full"
              variant="secondary"
              icon={<Bell size={14} />}
              loading={reminding}
              onClick={handleRemindAll}
            >
              Send Reminder to All Pending Interviews
            </Button>
          </div>
        </Card>

        {/* Message log */}
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Message History</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={26} /></div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={22} />}
              title="No messages sent yet"
              description="Messages sent from this page or automatically on candidate invite will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-surface-400 border-b border-surface-100">
                    <th className="px-5 py-2.5 font-medium">Candidate</th>
                    <th className="px-5 py-2.5 font-medium">Phone</th>
                    <th className="px-5 py-2.5 font-medium">Type</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {logs.map((log) => {
                    const candidateName =
                      log.candidate?.name ??
                      candidates.find((c) => c.id === log.candidateId)?.name ??
                      'Unknown';
                    return (
                      <tr key={log.id}>
                        <td className="px-5 py-3 font-medium text-surface-900">{candidateName}</td>
                        <td className="px-5 py-3 text-surface-500">{log.phone}</td>
                        <td className="px-5 py-3 text-surface-600">{log.messageType}</td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[log.status] ?? 'gray'}>{log.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-surface-400 text-xs">
                          {new Date(log.sentAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
