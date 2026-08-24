// src/components/toastmasters/GrammarianWidget.tsx — word-of-the-day usage + grammar notes
import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button, Input, Textarea } from '../ui';
import type { TmGrammarianLog } from '../../services/toastmasters';

export default function GrammarianWidget({ meetingWordOfDay, log, onSave, saving }: {
  meetingWordOfDay?: string | null;
  log: TmGrammarianLog | null;
  onSave: (data: Partial<{ wordOfDay: string; correctUses: number; incorrectUses: number; goodGrammarExamples: string; errorsNoted: string }>) => void;
  saving?: boolean;
}) {
  const [wordOfDay, setWordOfDay] = useState(log?.wordOfDay ?? meetingWordOfDay ?? '');
  const [correctUses, setCorrectUses] = useState(log?.correctUses ?? 0);
  const [incorrectUses, setIncorrectUses] = useState(log?.incorrectUses ?? 0);
  const [goodGrammarExamples, setGoodGrammarExamples] = useState(log?.goodGrammarExamples ?? '');
  const [errorsNoted, setErrorsNoted] = useState(log?.errorsNoted ?? '');

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 flex flex-col gap-4">
      <Input label="Word of the day" value={wordOfDay} onChange={(e) => setWordOfDay(e.target.value)} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-surface-700">Correct uses</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCorrectUses((n) => Math.max(0, n - 1))}><Minus size={13} /></Button>
            <span className="w-8 text-center font-bold text-green-600">{correctUses}</span>
            <Button size="sm" variant="secondary" onClick={() => setCorrectUses((n) => n + 1)}><Plus size={13} /></Button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-surface-700">Incorrect uses</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIncorrectUses((n) => Math.max(0, n - 1))}><Minus size={13} /></Button>
            <span className="w-8 text-center font-bold text-red-600">{incorrectUses}</span>
            <Button size="sm" variant="secondary" onClick={() => setIncorrectUses((n) => n + 1)}><Plus size={13} /></Button>
          </div>
        </div>
      </div>

      <Textarea label="Good grammar examples" rows={2} value={goodGrammarExamples} onChange={(e) => setGoodGrammarExamples(e.target.value)} />
      <Textarea label="Errors noted" rows={2} value={errorsNoted} onChange={(e) => setErrorsNoted(e.target.value)} />

      <Button
        loading={saving}
        onClick={() => onSave({ wordOfDay, correctUses, incorrectUses, goodGrammarExamples, errorsNoted })}
      >
        Save Grammarian Log
      </Button>
    </div>
  );
}
