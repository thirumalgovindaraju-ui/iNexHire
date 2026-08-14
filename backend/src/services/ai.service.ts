// src/services/ai.service.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

// Reserved for future Whisper STT — every text-generation function below runs on Anthropic.
const openai = new OpenAI({ apiKey: env.openaiApiKey });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// ─── Generate Job Description ─────────────────────────────────────────────────

export async function generateJobDescription(params: {
  title: string;
  department?: string;
  skills?: string[];
  level?: string;
}): Promise<string> {
  const prompt = `Write a professional job description for:
Title: ${params.title}
${params.department ? `Department: ${params.department}` : ''}
${params.level ? `Level: ${params.level}` : ''}
${params.skills?.length ? `Key skills: ${params.skills.join(', ')}` : ''}

Format with: Overview, Responsibilities, Requirements, Nice to Have, About Company (generic placeholder).
Be concise and compelling. Use markdown formatting.`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    return text.replace(/```markdown|```/g, '').trim();
  } catch (err) {
    console.error('[ai.service] generateJobDescription failed:', err);
    return `## ${params.title}\n\nWe are hiring for the role of ${params.title}${params.department ? ` in ${params.department}` : ''}. Please contact HR for the full job description.`;
  }
}

// ─── Parse Skills from JD ─────────────────────────────────────────────────────

export async function parseSkillsFromJD(jobDescription: string): Promise<string[]> {
  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Extract the key technical and soft skills from this job description. Return ONLY a JSON array of strings, no other text.

Job Description:
${jobDescription}

Example output: ["React", "Node.js", "Communication", "Problem Solving"]`,
        },
      ],
    });

    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[ai.service] parseSkillsFromJD failed, falling back to []:', err);
    return [];
  }
}

// ─── Generate Interview Questions ─────────────────────────────────────────────

export interface GeneratedQuestion {
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  timeLimit: number; // seconds
}

export async function generateInterviewQuestions(params: {
  jobTitle: string;
  jobDescription: string;
  skills: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  count: number;
}): Promise<GeneratedQuestion[]> {
  const prompt = `You are an expert interviewer. Generate ${params.count} interview questions for this role.

Job Title: ${params.jobTitle}
Key Skills: ${params.skills.join(', ')}
Difficulty: ${params.difficulty}

Job Description:
${params.jobDescription.slice(0, 1500)}

Return ONLY a JSON array with this exact structure (no other text):
[
  {
    "text": "Question text here",
    "type": "behavioral|technical|situational",
    "timeLimit": 120
  }
]

Guidelines:
- Mix behavioral (40%), technical (40%), situational (20%)
- EASY: 90s limit, MEDIUM: 120s limit, HARD: 180s limit
- Make questions specific to the role and skills
- Avoid yes/no questions`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[ai.service] generateInterviewQuestions failed, falling back to []:', err);
    return [];
  }
}

// ─── Evaluate a Single Response ───────────────────────────────────────────────

export interface EvaluationResult {
  score: number; // 0-100
  feedback: string;
}

export async function evaluateResponse(params: {
  question: string;
  answer: string;
  jobTitle: string;
  skills: string[];
}): Promise<EvaluationResult> {
  const prompt = `You are evaluating a job interview answer. Score and provide feedback.

Role: ${params.jobTitle}
Key Skills: ${params.skills.join(', ')}
Question: ${params.question}
Candidate Answer: ${params.answer}

Return ONLY JSON (no other text):
{
  "score": <0-100>,
  "feedback": "<2-3 sentence specific feedback on strengths and gaps>"
}

Scoring rubric:
- 90-100: Exceptional, specific, structured answer with clear evidence
- 70-89: Good answer with relevant examples, minor gaps
- 50-69: Adequate but vague or missing specifics
- 30-49: Weak answer, off-topic, or very generic
- 0-29: No answer, incoherent, or completely irrelevant`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{"score":0,"feedback":"Could not evaluate"}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[ai.service] evaluateResponse failed:', err);
    return { score: 0, feedback: 'Evaluation error' };
  }
}

// ─── Generate Full Report ─────────────────────────────────────────────────────

export interface ReportResult {
  overallScore: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NEUTRAL' | 'REJECT';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillScores: Record<string, number>;
}

export async function generateReport(params: {
  jobTitle: string;
  skills: string[];
  responses: Array<{ question: string; answer: string; score: number; feedback: string }>;
}): Promise<ReportResult> {
  const avgScore = Math.round(
    params.responses.reduce((sum, r) => sum + r.score, 0) / params.responses.length
  );

  const responseSummary = params.responses
    .map((r, i) => `Q${i + 1}: "${r.question.slice(0, 100)}..." Score: ${r.score}/100`)
    .join('\n');

  const prompt = `Generate a comprehensive interview evaluation report.

Job Title: ${params.jobTitle}
Skills Evaluated: ${params.skills.join(', ')}
Average Score: ${avgScore}/100

Question Scores:
${responseSummary}

Return ONLY JSON (no other text):
{
  "overallScore": <0-100>,
  "recommendation": "<STRONG_HIRE|HIRE|NEUTRAL|REJECT>",
  "summary": "<3-4 sentence executive summary of the candidate>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "skillScores": { "<skill>": <0-100>, ... }
}

Guidelines:
- STRONG_HIRE: 85+, HIRE: 70-84, NEUTRAL: 55-69, REJECT: below 55
- Be specific and fair in strengths/weaknesses
- Score each skill from the skills list based on evidence`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[ai.service] generateReport failed:', err);
    return {
      overallScore: avgScore,
      recommendation: avgScore >= 70 ? 'HIRE' : 'REJECT',
      summary: 'Report generation failed. Please review individual scores.',
      strengths: [],
      weaknesses: [],
      skillScores: {},
    };
  }
}

// ─── Scan for Bias ─────────────────────────────────────────────────────────────

export interface BiasFlag {
  type: string;       // e.g. "Gender-coded", "Age bias", "Exclusionary"
  word: string;       // the exact phrase flagged
  suggestion: string; // replacement suggestion
  severity: 'high' | 'medium' | 'low';
}

export interface BiasScanResult {
  score: number;      // 0–100 compliance score (100 = perfectly inclusive)
  flags: BiasFlag[];
}

export async function scanBias(
  text: string,
  scanType: 'jd' | 'questions'
): Promise<BiasScanResult> {
  const context =
    scanType === 'jd'
      ? 'job description'
      : 'interview questions';

  const prompt = `You are an expert in inclusive hiring practices and employment law compliance.
Analyse this ${context} for language that could deter qualified candidates from underrepresented groups or create legal liability.

${context.toUpperCase()}:
"""
${text.slice(0, 3000)}
"""

Check for:
- Gender-coded language (e.g. "rockstar", "ninja", "aggressive", "dominate")
- Age bias (e.g. "recent graduate", "digital native", "young and energetic")
- Exclusionary culture language (e.g. "culture fit", "fraternity", "brotherhood")
- Credential inflation (e.g. "degree required" when experience would suffice)
- Disability-exclusionary language
- Any language that could violate equal opportunity employment law

Return ONLY valid JSON (no markdown, no other text):
{
  "score": <integer 0-100, where 100 = fully inclusive, deduct 15 per high, 8 per medium, 3 per low flag>,
  "flags": [
    {
      "type": "<bias category>",
      "word": "<exact phrase from the text>",
      "suggestion": "<inclusive replacement>",
      "severity": "<high|medium|low>"
    }
  ]
}

If no bias is detected, return: { "score": 100, "flags": [] }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as BiasScanResult;

    // Clamp score to 0–100 and cap at 100 if no flags
    const clampedScore = Math.max(0, Math.min(100, parsed.score ?? 100));
    return { score: clampedScore, flags: parsed.flags ?? [] };
  } catch {
    // Fallback — never throw, consistent with rest of ai.service.ts
    return { score: 100, flags: [] };
  }
}

// ─── Generate Offer Letter ─────────────────────────────────────────────────────

export async function generateOfferLetter(params: {
  candidateName: string;
  jobTitle: string;
  department: string;
  salary: string;
  startDate: string;
  reportingTo: string;
  companyName: string;
  benefits?: string[];
}): Promise<string> {
  const prompt = `Generate a professional, formal offer letter for the following:

Candidate: ${params.candidateName}
Job Title: ${params.jobTitle}
Department: ${params.department}
Salary: ${params.salary}
Start Date: ${params.startDate}
Reports To: ${params.reportingTo}
Company: ${params.companyName}
Benefits: ${params.benefits?.join(', ') || 'Health insurance, 18 days PTO, flexible working'}

Write a warm but professional offer letter. Include:
1. Congratulations opening
2. Role and reporting structure
3. Compensation details
4. Benefits summary
5. Start date and next steps
6. Acceptance deadline (14 days from today)
7. Professional closing

Format as HTML with proper paragraph tags. Keep it concise — one page.
Return ONLY the HTML content, no markdown, no explanation.`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    return text.replace(/```html|```/g, '').trim();
  } catch {
    return `<p>Dear ${params.candidateName},</p><p>We are pleased to offer you the position of ${params.jobTitle} at ${params.companyName}.</p><p>Please contact HR for full details.</p>`;
  }
}

// ─── Analyse Proctoring Data ─────────────────────────────────────────────────

export interface ProctoringFlag {
  type: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence?: string;
}

export interface ProctoringAnalysisResult {
  riskScore: number;       // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: ProctoringFlag[];
  aiAnalysis: string;
  recommendation: 'CLEAN' | 'REVIEW' | 'ESCALATE' | 'VOID';
  aiCoachingScore: number; // 0-100 confidence that responses were AI-generated/coached
}

export async function analyseProctoringData(params: {
  events: Array<{ eventType: string; timestamp: string; metadata?: any }>;
  transcripts: string[];
  jobTitle: string;
  durationMinutes: number;
}): Promise<ProctoringAnalysisResult> {
  const { events, transcripts, jobTitle, durationMinutes } = params;

  // Summarise events for the prompt
  const eventSummary = events.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fullTranscript = transcripts.join('\n\n');

  const prompt = `You are an expert in interview integrity assessment and cheating detection.
Analyse this interview session for signs of malpractice, cheating, or integrity violations.

JOB ROLE: ${jobTitle}
INTERVIEW DURATION: ${durationMinutes} minutes
TOTAL EVENTS LOGGED: ${events.length}

BEHAVIOURAL EVENTS DETECTED:
${JSON.stringify(eventSummary, null, 2)}

RAW EVENT TIMELINE (last 20):
${events.slice(-20).map(e => `[${e.timestamp}] ${e.eventType}${e.metadata ? ': ' + JSON.stringify(e.metadata) : ''}`).join('\n')}

INTERVIEW TRANSCRIPTS:
"""
${fullTranscript.slice(0, 3000)}
"""

Analyse for these malpractice indicators:

1. TECHNICAL CHEATING:
   - Tab switching patterns (frequent = looking up answers)
   - Copy-paste events (pre-prepared answers)
   - Multiple faces detected (someone else helping)
   - Phone detected in frame
   - Reading from screen (eyes not on camera)

2. RESPONSE QUALITY ANOMALIES:
   - Responses too perfect/polished for spoken interview (AI-generated)
   - Identical phrasing patterns across answers (pre-scripted)
   - Suspicious pauses before answering (looking up)
   - Background voices audible (coaching)
   - Lip sync mismatch (pre-recorded response playback)

3. IDENTITY CONCERNS:
   - Face not detected for extended periods
   - Multiple different faces across session
   - Significant appearance changes mid-interview

4. STATISTICAL ANOMALIES:
   - Response times that are unnaturally consistent
   - Answer quality dramatically higher than conversational quality
   - No filler words, hesitations, or natural speech patterns

5. AI COACHING / LIVE AI ASSISTANCE DETECTION — analyse the transcript text closely:
   - Unnaturally complete and structured phrasing for a *spoken* answer (spoken answers
     ramble, self-correct, and trail off; written/read answers don't)
   - Perfect bullet-point or numbered-list structure appearing in spoken text — people
     don't speak in bullet points
   - Zero filler words (um, uh, like, you know, so, I mean) across ALL responses —
     statistically near-impossible in unscripted natural speech
   - Vocabulary or sentence complexity that jumps sharply partway through a single
     answer (suggests switching from thinking aloud to reading a generated response)
   - Candidate repeats the question back verbatim before answering, repeatedly — a
     stalling tactic to buy time for an AI tool to generate a response
   - Generic, textbook-perfect answers with no personal anecdotes, specific project
     names, or first-hand detail, especially on behavioural questions that should
     surface a real example

6. SCREEN-READING BEHAVIOURAL PATTERNS — infer from LOOKING_AWAY / FACE_NOT_DETECTED /
   SUSPICIOUS_PAUSE event metadata and timestamps relative to response timing:
   - Gaze consistently shifted in the same direction across multiple events (e.g.
     repeatedly down-left or down-right) rather than varying naturally — suggests a
     fixed second screen or phone rather than incidental glances
   - Recurring head-tilt-down patterns aligned with a reading posture
   - A repeated pattern of a long pause (10-15s) immediately before an answer begins,
     followed by unusually fluent, uninterrupted delivery — consistent with reading a
     pre-generated answer off-screen rather than thinking and speaking naturally
   - Brief mid-sentence micro-pauses recurring at a similar cadence (consistent with
     scrolling or eye movement to the next line of on-screen text)

Rate each flag's severity and provide an overall assessment, including a distinct
confidence score for AI coaching specifically (separate from the general risk score,
since a candidate can have a clean risk score but still show strong AI-coaching signals
in the transcript alone).

Return ONLY valid JSON:
{
  "riskScore": <0-100, where 0=clean, 100=definite cheating>,
  "riskLevel": <"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "flags": [
    {
      "type": "<flag category>",
      "timestamp": "<ISO timestamp or 'throughout'>",
      "severity": "<critical|high|medium|low>",
      "description": "<specific observation>",
      "evidence": "<what triggered this flag>"
    }
  ],
  "aiAnalysis": "<2-3 paragraph narrative assessment of integrity>",
  "recommendation": <"CLEAN"|"REVIEW"|"ESCALATE"|"VOID">,
  "aiCoachingScore": <0-100, confidence that responses were AI-generated or live-coached>
}

Risk score guide:
0-20: CLEAN — normal interview behaviour
21-40: LOW — minor anomalies, likely benign
41-60: MEDIUM — suspicious patterns, human review recommended
61-80: HIGH — strong indicators of assistance or cheating
81-100: CRITICAL — clear evidence, consider voiding interview

AI coaching score guide:
0-20: No indication of AI assistance — natural, imperfect spoken language
21-40: A few isolated polished phrases, likely benign
41-60: Multiple answers show structured/scripted phrasing, worth a human review
61-80: Consistent pattern across most answers — very likely AI-assisted
81-100: Near-certain — transcript reads as generated text, not speech`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as ProctoringAnalysisResult;
    return {
      riskScore: Math.max(0, Math.min(100, parsed.riskScore ?? 0)),
      riskLevel: parsed.riskLevel ?? 'LOW',
      flags: parsed.flags ?? [],
      aiAnalysis: parsed.aiAnalysis ?? 'Analysis unavailable.',
      recommendation: parsed.recommendation ?? 'REVIEW',
      aiCoachingScore: Math.max(0, Math.min(100, parsed.aiCoachingScore ?? 0)),
    };
  } catch (err) {
    console.error('[ai.service] analyseProctoringData failed:', err);
    return {
      riskScore: 0, riskLevel: 'LOW', flags: [],
      aiAnalysis: 'Proctoring analysis unavailable.',
      recommendation: 'REVIEW',
      aiCoachingScore: 0,
    };
  }
}
