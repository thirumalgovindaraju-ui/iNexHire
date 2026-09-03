// src/components/toastmasters/AgentRoleRunner.tsx — agent-mode counterpart to
// VoiceRecorder.tsx, shown during Run Meeting for any role assigned to an AI agent.
import { useState } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { Badge, Button, useToast } from '../ui';
import SpeechAnalysisResult from './SpeechAnalysisResult';
import { TM_NAVY } from './theme';
import { extractError } from '../../services/api';
import { speechAnalysisApi, rolesApi } from '../../services/toastmasters';
import type { TmRoleAssignment, TmSpeechAnalysis } from '../../services/toastmasters';
import { agentResultSpeechText, SpeakButton } from './agentSpeech';

const STATUS_LABEL: Record<string, string> = { PENDING: 'Not run yet', RUNNING: 'Running…', DONE: 'Done', FAILED: 'Failed — try again' };

function agentResultBody(result: unknown) {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, any>;
  if (typeof r.commendations === 'string') {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p><span className="text-green-600 font-medium">Well: </span>{r.commendations}</p>
        <p><span className="text-amber-600 font-medium">Improve: </span>{r.recommendations}</p>
        <p className="text-surface-500 text-xs">Content {r.ratingContent} · Delivery {r.ratingDelivery} · Language {r.ratingLanguage} · Overall {r.overallRating}</p>
      </div>
    );
  }
  if (typeof r.overallFeedback === 'string') return <p className="text-sm text-surface-700">{r.overallFeedback}</p>;
  if (typeof r.goodGrammarExamples === 'string') {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <p>Correct / Incorrect uses: {r.correctUses} / {r.incorrectUses}</p>
        {r.goodGrammarExamples && <p className="text-green-600">{r.goodGrammarExamples}</p>}
        {r.errorsNoted && <p className="text-red-600">{r.errorsNoted}</p>}
      </div>
    );
  }
  if (Array.isArray(r.topics)) {
    return <ul className="list-disc list-inside text-sm text-surface-700">{r.topics.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>;
  }
  if (typeof r.note === 'string') return <p className="text-sm text-surface-500 italic">{r.note}</p>;
  if (Array.isArray(r)) return <p className="text-sm text-surface-700">Ah Counter totals updated for {r.length} member(s).</p>;
  return null;
}

export default function AgentRoleRunner({ role, roleLabel, onRoleUpdate }: {
  role: TmRoleAssignment;
  roleLabel: string;
  onRoleUpdate?: (role: TmRoleAssignment) => void;
}) {
  const { show, ToastContainer } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(role.agentOutput ?? null);
  const [speechAnalysis, setSpeechAnalysis] = useState<TmSpeechAnalysis | null>(null);
  const speechText = agentResultSpeechText(result);

  async function run() {
    setRunning(true);
    try {
      const { role: updated, result: r, usage } = await rolesApi.runAgent(role.id);
      setResult(r);
      onRoleUpdate?.(updated);
      const tokens = usage.inputTokens + usage.outputTokens;
      show(`${roleLabel} agent finished — ${tokens.toLocaleString()} tokens · $${usage.costUsd.toFixed(4)}`);
      if (r && typeof r === 'object' && 'transcript' in (r as any)) {
        const analysis = await speechAnalysisApi.getForRole(role.id).catch(() => null);
        setSpeechAnalysis(analysis);
      }
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4">
      <ToastContainer />
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-surface-900 text-sm flex items-center gap-1.5"><Bot size={15} className="text-brand-600" /> AI Agent — {roleLabel}</h3>
        <Badge variant={role.agentStatus === 'DONE' ? 'green' : role.agentStatus === 'FAILED' ? 'red' : 'gray'}>
          {STATUS_LABEL[role.agentStatus ?? 'PENDING']}
        </Badge>
      </div>

      {speechAnalysis ? (
        <SpeechAnalysisResult analysis={speechAnalysis} onRecordAgain={run} />
      ) : (
        <div className="flex flex-col gap-3">
          {speechText && (
            <div className="flex justify-end">
              <SpeakButton text={speechText} />
            </div>
          )}
          {agentResultBody(result)}
          <Button style={{ background: TM_NAVY }} loading={running} onClick={run}>
            {running ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Run Agent
          </Button>
        </div>
      )}
    </div>
  );
}
