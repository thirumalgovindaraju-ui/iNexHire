// src/components/toastmasters/AgentRoleRunner.tsx — agent-mode counterpart to
// VoiceRecorder.tsx, shown during Run Meeting for any role assigned to an AI agent.
import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { Badge, Button, useToast } from '../ui';
import SpeechAnalysisResult from './SpeechAnalysisResult';
import { TM_NAVY } from './theme';
import { extractError } from '../../services/api';
import { speechAnalysisApi, evaluationsApi, rolesApi, TM_SPEAKER_EVALUATOR_PAIRS } from '../../services/toastmasters';
import type { TmRoleAssignment, TmSpeechAnalysis } from '../../services/toastmasters';
import { agentResultSpeechText, InterruptButton, SpeakButton, useAgentInterjection, useSpeech } from './agentSpeech';

const STATUS_LABEL: Record<string, string> = { PENDING: 'Not run yet', RUNNING: 'Running…', DONE: 'Done', FAILED: 'Failed — try again' };
const SPEAKER_ROLES = new Set(TM_SPEAKER_EVALUATOR_PAIRS.map(([s]) => s));
const EVALUATOR_ROLES = new Set(TM_SPEAKER_EVALUATOR_PAIRS.map(([, e]) => e));

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

export default function AgentRoleRunner({ role, roleLabel, onRoleUpdate, onSpeakingChange, autoRun, onAutoAdvance }: {
  role: TmRoleAssignment;
  roleLabel: string;
  onRoleUpdate?: (role: TmRoleAssignment) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  /** Self-trigger (generate if needed, then speak) as soon as this mounts — the
   * "run the whole show unattended" mode driven by RunMeeting. */
  autoRun?: boolean;
  /** Called once this role's turn is over (speech finished, nothing to say, or the
   * run failed) — only meaningful together with autoRun. */
  onAutoAdvance?: () => void;
}) {
  const { show, ToastContainer } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(role.agentOutput ?? null);
  const [speechAnalysis, setSpeechAnalysis] = useState<TmSpeechAnalysis | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const wasSpeakingRef = useRef(false);
  function handleSpeakingChange(nowSpeaking: boolean) {
    onSpeakingChange?.(nowSpeaking);
    if (wasSpeakingRef.current && !nowSpeaking) onAutoAdvance?.();
    wasSpeakingRef.current = nowSpeaking;
  }
  const speech = useSpeech(handleSpeakingChange);
  const { speaking, play, stop } = speech;
  const interjection = useAgentInterjection(speech, role.id, { accent: role.agentAccent, gender: role.agentGender });
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
        setShouldAutoPlay(true);
        setSpeechAnalysis(analysis);
        if (!analysis) onAutoAdvance?.();
      } else {
        const text = agentResultSpeechText(r);
        if (text) play(text, { accent: role.agentAccent, gender: role.agentGender }); else onAutoAdvance?.();
      }
    } catch (err) {
      show(extractError(err), 'error');
      onAutoAdvance?.();
    } finally {
      setRunning(false);
    }
  }

  // Hydrate speaker/evaluator content generated in an earlier visit or page load —
  // that content lives in TmSpeechAnalysis / TmEvaluation, not role.agentOutput, so
  // it wouldn't otherwise show up again without re-running the agent. Read-only and
  // idempotent, so it's safe regardless of autoRun or React StrictMode's dev-mode
  // double-invoke of mount effects.
  useEffect(() => {
    if (role.agentStatus !== 'DONE') return;
    if (SPEAKER_ROLES.has(role.roleName)) {
      speechAnalysisApi.getForRole(role.id).then((analysis) => { if (analysis) setSpeechAnalysis(analysis); }).catch(() => {});
    } else if (EVALUATOR_ROLES.has(role.roleName)) {
      evaluationsApi.list(role.meetingId).then((evals) => {
        const mine = evals.find((e) => e.evaluatorRoleId === role.id);
        if (mine) setResult(mine);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The unattended-show trigger: generate if needed, or replay+speak if already
  // done. Guarded to act at most once per "autoRun turned on" activation — this
  // component can mount with autoRun already true (landing here mid-show), which
  // is exactly the case React StrictMode double-invokes in dev; without the guard
  // that means run-agent (a real, billable call) firing twice.
  const autoActedRef = useRef(false);
  useEffect(() => {
    if (!autoRun) { autoActedRef.current = false; return; }
    if (autoActedRef.current) return;
    autoActedRef.current = true;

    if (role.agentStatus !== 'DONE') { run(); return; }

    if (SPEAKER_ROLES.has(role.roleName)) {
      speechAnalysisApi.getForRole(role.id).then((analysis) => {
        if (analysis) { setSpeechAnalysis(analysis); setShouldAutoPlay(true); }
        else onAutoAdvance?.();
      }).catch(() => onAutoAdvance?.());
      return;
    }
    if (EVALUATOR_ROLES.has(role.roleName)) {
      evaluationsApi.list(role.meetingId).then((evals) => {
        const mine = evals.find((e) => e.evaluatorRoleId === role.id) ?? null;
        setResult(mine);
        const text = agentResultSpeechText(mine);
        if (text) play(text, { accent: role.agentAccent, gender: role.agentGender }); else onAutoAdvance?.();
      }).catch(() => onAutoAdvance?.());
      return;
    }
    const text = agentResultSpeechText(role.agentOutput);
    if (text) play(text, { accent: role.agentAccent, gender: role.agentGender }); else onAutoAdvance?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

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
        <SpeechAnalysisResult
          analysis={speechAnalysis} onRecordAgain={run} onSpeakingChange={handleSpeakingChange} autoPlay={shouldAutoPlay}
          agentGender={role.agentGender} agentAccent={role.agentAccent} roleId={role.id}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {speechText && (
            <div className="flex justify-end items-center gap-2">
              {speaking && (
                <InterruptButton state={interjection.state} onPressStart={interjection.pressStart} onPressEnd={interjection.pressEnd} />
              )}
              <SpeakButton speaking={speaking} onToggle={() => (speaking ? stop() : play(speechText, { accent: role.agentAccent, gender: role.agentGender }))} />
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
