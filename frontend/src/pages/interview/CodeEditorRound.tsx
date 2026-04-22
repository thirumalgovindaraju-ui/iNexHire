// src/pages/interview/CodeEditorRound.tsx
// Code editor round for technical interviews
// Uses textarea (lightweight) — swap to Monaco Editor later if needed
// Backend route: POST /api/interviews/:id/respond with transcript = code

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../../services/api';

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: Record<string, string>;
  hints?: string[];
}

const LANGUAGES = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C++'];

const DIFFICULTY_COLORS = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-yellow-600 bg-yellow-50',
  Hard: 'text-red-600 bg-red-50',
};

export default function CodeEditorRound() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [interviewId, setInterviewId] = useState('');
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Load interview session
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await interviewsApi.startSession(token);
        setInterviewId(data.interviewId);
        // Filter only coding questions (type === 'technical' with code hint)
        const codingQs: CodingQuestion[] = data.questions
          .filter((q: any) => q.type === 'technical')
          .map((q: any, i: number) => ({
            id: q.id,
            title: q.text.slice(0, 60),
            difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
            description: q.text,
            examples: [
              { input: 'Example input', output: 'Expected output', explanation: 'Explain your approach' },
            ],
            starterCode: {
              JavaScript: `// Write your solution here\nfunction solution() {\n  \n}\n`,
              Python: `# Write your solution here\ndef solution():\n    pass\n`,
              TypeScript: `// Write your solution here\nfunction solution(): void {\n  \n}\n`,
              Java: `// Write your solution here\npublic class Solution {\n    public void solution() {\n        \n    }\n}\n`,
              'C++': `// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    \n}\n`,
            },
            hints: ['Break the problem into smaller steps', 'Think about edge cases', 'Consider time complexity'],
          }));

        if (codingQs.length === 0) {
          navigate(`/interview/${token}/room`);
          return;
        }

        setQuestions(codingQs);
        setCode(codingQs[0].starterCode['JavaScript']);
        setLoading(false);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load interview');
        setLoading(false);
      }
    })();
  }, [token]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQ = questions[currentIdx];

  // Handle Tab key in editor
  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.slice(0, start) + '  ' + code.slice(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  // Simulate code run (real execution needs Judge0 API - Month 2)
  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    await new Promise((r) => setTimeout(r, 800));

    try {
      if (language === 'JavaScript') {
        // Sandbox JS eval for demo
        const logs: string[] = [];
        const sandbox = new Function('console', code);
        sandbox({ log: (...args: any[]) => logs.push(args.join(' ')) });
        setOutput(logs.length ? logs.join('\n') : '✓ Code executed (no output)');
      } else {
        setOutput(`⚠ Live execution for ${language} requires Judge0 API (Month 2 feature).\nCode will be saved and evaluated by AI after submission.`);
      }
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const submitAnswer = useCallback(async () => {
    if (!currentQ || !interviewId) return;
    setIsSubmitting(true);
    try {
      await interviewsApi.submitResponse(interviewId, {
        questionId: currentQ.id,
        transcript: `[${language}]\n\n${code}`,
        duration: (30 * 60) - timeLeft,
      });
      setSubmitted((s) => new Set([...s, currentQ.id]));

      // Move to next or complete
      if (currentIdx < questions.length - 1) {
        const next = questions[currentIdx + 1];
        setCurrentIdx(currentIdx + 1);
        setCode(next.starterCode[language]);
        setOutput('');
        setShowHint(false);
        setHintIdx(0);
      } else {
        await interviewsApi.complete(interviewId);
        navigate('/interview/complete');
      }
    } catch (err: any) {
      setOutput(`❌ Submit failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQ, interviewId, code, language, timeLeft, currentIdx, questions, navigate]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-surface-400">Loading coding challenge...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center text-white">
        <p className="text-red-400 mb-3">{error}</p>
        <button onClick={() => navigate(-1)} className="text-brand-400 underline">Go back</button>
      </div>
    </div>
  );

  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col" style={{ fontFamily: 'monospace' }}>

      {/* Top Bar */}
      <div className="h-12 bg-surface-800 border-b border-surface-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand-400">NexHire</span>
          <span className="text-surface-500">|</span>
          <span className="text-sm text-surface-300">Coding Round</span>
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${DIFFICULTY_COLORS[currentQ.difficulty]}`}>
            {currentQ.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`font-mono text-sm font-bold px-3 py-1 rounded ${timeLeft < 300 ? 'text-red-400 bg-red-900/30' : 'text-surface-300 bg-surface-700'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-surface-500">
            {submitted.size}/{questions.length} submitted
          </div>
          {/* Question nav */}
          <div className="flex gap-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => { setCurrentIdx(i); setCode(q.starterCode[language]); setOutput(''); }}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  i === currentIdx ? 'bg-brand-600 text-white' :
                  submitted.has(q.id) ? 'bg-green-700 text-white' : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Problem */}
        <div className="w-2/5 bg-surface-800 border-r border-surface-700 overflow-y-auto p-5">
          <h2 className="text-base font-bold text-white mb-3">{currentQ.title}</h2>
          <p className="text-sm text-surface-300 leading-relaxed mb-5">{currentQ.description}</p>

          {/* Examples */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Examples</div>
            {currentQ.examples.map((ex, i) => (
              <div key={i} className="bg-surface-900 rounded-lg p-3 mb-2 text-xs font-mono">
                <div className="text-surface-400 mb-1">Input: <span className="text-green-400">{ex.input}</span></div>
                <div className="text-surface-400 mb-1">Output: <span className="text-blue-400">{ex.output}</span></div>
                {ex.explanation && <div className="text-surface-500 text-xs">{ex.explanation}</div>}
              </div>
            ))}
          </div>

          {/* Hint */}
          {currentQ.hints?.length && (
            <div>
              <button
                onClick={() => { setShowHint(true); setHintIdx((h) => Math.min(h + 1, (currentQ.hints?.length ?? 1) - 1)); }}
                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
              >
                💡 {showHint ? 'Next Hint' : 'Show Hint'}
              </button>
              {showHint && (
                <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg text-xs text-yellow-300">
                  {currentQ.hints[hintIdx]}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col">

          {/* Editor toolbar */}
          <div className="h-10 bg-surface-800 border-b border-surface-700 flex items-center justify-between px-4">
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); setCode(currentQ.starterCode[e.target.value] ?? code); }}
              className="bg-surface-700 border border-surface-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-500"
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setCode(currentQ.starterCode[language])}
                className="text-xs px-2 py-1 bg-surface-700 hover:bg-surface-600 text-surface-400 rounded transition-colors"
              >
                Reset
              </button>
              <button
                onClick={runCode}
                disabled={isRunning}
                className="text-xs px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded font-semibold transition-colors disabled:opacity-50"
              >
                {isRunning ? '⏳ Running...' : '▶ Run'}
              </button>
              <button
                onClick={submitAnswer}
                disabled={isSubmitting || submitted.has(currentQ.id)}
                className="text-xs px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : submitted.has(currentQ.id) ? '✓ Submitted' : 'Submit →'}
              </button>
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 relative overflow-hidden">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleTab}
              spellCheck={false}
              className="absolute inset-0 w-full h-full bg-surface-900 text-green-300 p-4 font-mono text-sm resize-none focus:outline-none leading-relaxed"
              style={{ tabSize: 2 }}
              placeholder="Write your code here..."
            />
          </div>

          {/* Output panel */}
          <div className="h-40 bg-surface-900 border-t border-surface-700 flex flex-col">
            <div className="h-8 bg-surface-800 border-b border-surface-700 flex items-center px-4 gap-2">
              <span className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Output</span>
              {output && (
                <button onClick={() => setOutput('')} className="text-xs text-surface-500 hover:text-surface-400 ml-auto">
                  Clear
                </button>
              )}
            </div>
            <pre className="flex-1 overflow-y-auto p-4 text-xs font-mono text-surface-300 leading-relaxed whitespace-pre-wrap">
              {output || <span className="text-surface-600">Click ▶ Run to execute your code</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
