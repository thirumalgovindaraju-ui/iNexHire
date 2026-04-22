// src/services/ai.service.ts
import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.openaiApiKey });
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
