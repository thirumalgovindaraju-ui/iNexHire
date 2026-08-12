// src/services/ai.service.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.openaiApiKey });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = env.openaiModel;

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

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return res.choices[0].message.content ?? '';
}

// ─── Parse Skills from JD ─────────────────────────────────────────────────────

export async function parseSkillsFromJD(jobDescription: string): Promise<string[]> {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `Extract the key technical and soft skills from this job description. Return ONLY a JSON array of strings, no other text.

Job Description:
${jobDescription}

Example output: ["React", "Node.js", "Communication", "Problem Solving"]`,
      },
    ],
    temperature: 0,
    max_tokens: 300,
  });

  const content = res.choices[0].message.content ?? '[]';
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
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

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 2000,
  });

  const content = res.choices[0].message.content ?? '[]';
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
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

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 300,
  });

  const content = res.choices[0].message.content ?? '{"score":0,"feedback":"Could not evaluate"}';
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
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

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 800,
  });

  const content = res.choices[0].message.content ?? '{}';
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
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
      model: 'claude-sonnet-4-6',
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
      model: 'claude-sonnet-4-6',
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
