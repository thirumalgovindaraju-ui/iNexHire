// src/pages/paAgent/PaAgentDashboard.tsx — AI PA Agent: daily briefing (action items,
// mail needing a reply, today's schedule) and a draft-only email assistant. Drafts are
// always saved as real Gmail drafts for a human to review and send — this app never
// sends mail on anyone's behalf (see backend/src/services/google.service.ts).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Mail, Calendar, Sparkles, RotateCcw, CheckCircle2, XCircle, Circle, Send } from 'lucide-react';
import { Button, Badge, Spinner, EmptyState, PageHeader, useToast } from '../../components/ui';
import { googleAuthApi, briefingApi, draftApi } from '../../services/paAgent';
import type { PaActionItem, PaBriefing, PaEmailDraft } from '../../services/paAgent';
import { extractError } from '../../services/api';

const PRIORITY_VARIANT: Record<string, 'red' | 'orange' | 'gray'> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'gray' };

export default function PaAgentDashboard() {
  const { show, ToastContainer } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [briefing, setBriefing] = useState<PaBriefing | null>(null);
  const [actionItems, setActionItems] = useState<PaActionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const [instruction, setInstruction] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [lastDraft, setLastDraft] = useState<PaEmailDraft | null>(null);

  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    if (connectedParam === '1') show('Google account connected');
    else if (connectedParam === '0') show('Could not connect your Google account — please try again', 'error');
    if (connectedParam !== null) {
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const status = await googleAuthApi.status();
      setConnected(status.connected);
      setGoogleEmail(status.googleEmail);
      if (status.connected) {
        const { briefing: b, actionItems: items } = await briefingApi.today();
        setBriefing(b);
        setActionItems(items);
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStatus(); }, []);

  async function connectGoogle() {
    setConnecting(true);
    try {
      const { url } = await googleAuthApi.connect();
      window.location.href = url;
    } catch (err) {
      show(extractError(err), 'error');
      setConnecting(false);
    }
  }

  async function refreshBriefing() {
    setRefreshing(true);
    setError(null);
    try {
      const { briefing: b, actionItems: items } = await briefingApi.refresh();
      setBriefing(b);
      setActionItems(items);
      show('Briefing refreshed');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setRefreshing(false);
    }
  }

  async function markItem(id: string, status: 'DONE' | 'DISMISSED') {
    setUpdatingItemId(id);
    try {
      const updated = await briefingApi.markActionItem(id, status);
      setActionItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function submitDraftInstruction() {
    if (!instruction.trim()) return;
    setDrafting(true);
    try {
      const draft = await draftApi.create(instruction.trim());
      setLastDraft(draft);
      setInstruction('');
      show('Draft saved to your Gmail Drafts folder — review and send from there');
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setDrafting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer />
      <PageHeader
        title="AI PA Agent"
        description="Your daily briefing from Gmail and Calendar — drafts, never sends."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!connected ? (
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
              <Bot size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-900">Connect your Google account</h3>
              <p className="text-sm text-surface-500 mt-1 mb-4">
                Reads recent Gmail and Calendar to build your daily briefing, and can draft emails
                on request. It only requests read + compose access — it can never send mail on
                your behalf; drafts always land in your own Gmail Drafts folder for you to review.
              </p>
              <Button icon={<Mail size={14} />} loading={connecting} onClick={connectGoogle}>
                Connect Google Account
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <CheckCircle2 size={14} className="text-green-500" /> Connected as {googleEmail}
            </div>
            <Button variant="secondary" size="sm" icon={<RotateCcw size={13} />} loading={refreshing} onClick={refreshBriefing}>
              Refresh briefing
            </Button>
          </div>

          {/* Action items */}
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <h3 className="font-semibold text-surface-900 text-sm mb-3">Today's action items</h3>
            {actionItems.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={20} />} title="Nothing pending" description="No action items surfaced from your inbox or calendar today." />
            ) : (
              <div className="flex flex-col gap-2">
                {actionItems.map((item) => (
                  <div key={item.id} className={`flex items-start gap-3 rounded-lg border border-surface-100 p-3 ${item.status !== 'PENDING' ? 'opacity-50' : ''}`}>
                    <button onClick={() => markItem(item.id, item.status === 'DONE' ? 'DISMISSED' : 'DONE')} disabled={updatingItemId === item.id} className="mt-0.5 text-surface-400 hover:text-brand-600">
                      {item.status === 'DONE' ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{item.title}</p>
                      {item.description && <p className="text-xs text-surface-500 mt-0.5">{item.description}</p>}
                    </div>
                    <Badge variant={item.sourceType === 'EMAIL' ? 'blue' : item.sourceType === 'CALENDAR' ? 'purple' : 'gray'}>{item.sourceType}</Badge>
                    {item.status === 'PENDING' && (
                      <button onClick={() => markItem(item.id, 'DISMISSED')} disabled={updatingItemId === item.id} className="text-surface-300 hover:text-red-500">
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Needs reply */}
            <div className="rounded-xl border border-surface-200 bg-white p-5">
              <h3 className="font-semibold text-surface-900 text-sm mb-3 flex items-center gap-1.5"><Mail size={14} /> Needs a reply</h3>
              {briefing?.summary.needsReply.length ? (
                <div className="flex flex-col gap-2">
                  {briefing.summary.needsReply.map((e, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium text-surface-900 truncate">{e.subject}</p>
                      <p className="text-xs text-surface-500 truncate">{e.from}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic">Nothing waiting on a reply</p>
              )}
            </div>

            {/* Schedule */}
            <div className="rounded-xl border border-surface-200 bg-white p-5">
              <h3 className="font-semibold text-surface-900 text-sm mb-3 flex items-center gap-1.5"><Calendar size={14} /> Today's schedule</h3>
              {briefing?.summary.scheduleHighlights.length ? (
                <div className="flex flex-col gap-2">
                  {briefing.summary.scheduleHighlights.map((h, i) => (
                    <div key={i} className="text-sm flex items-center justify-between">
                      <span className="text-surface-900">{h.title}</span>
                      <span className="text-xs text-surface-500">{h.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic">Nothing scheduled today</p>
              )}
            </div>
          </div>

          {/* Draft assistant */}
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <h3 className="font-semibold text-surface-900 text-sm mb-1 flex items-center gap-1.5"><Sparkles size={14} /> Ask your PA to draft an email</h3>
            <p className="text-xs text-surface-500 mb-3">e.g. "reply to Priya approving the Q3 budget" — saved to Gmail Drafts, never sent automatically.</p>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitDraftInstruction()}
                placeholder="What should the email say?"
                className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button icon={<Send size={14} />} loading={drafting} onClick={submitDraftInstruction} disabled={!instruction.trim()}>
                Draft
              </Button>
            </div>
            {lastDraft && (
              <div className="mt-4 rounded-lg bg-surface-50 border border-surface-100 p-3 text-sm">
                <p className="text-xs font-semibold uppercase text-surface-500 mb-1">Saved to Gmail Drafts</p>
                <p className="font-medium text-surface-900">{lastDraft.subject}</p>
                {lastDraft.toEmail && <p className="text-xs text-surface-500">To: {lastDraft.toEmail}</p>}
                <p className="text-surface-700 mt-1 whitespace-pre-wrap">{lastDraft.body}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
