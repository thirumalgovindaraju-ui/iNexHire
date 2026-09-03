// src/services/ai.service.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

// Reserved for future Whisper STT — every text-generation function below runs on Anthropic.
const openai = new OpenAI({ apiKey: env.openaiApiKey });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// claude-sonnet-4-6 pricing: $3.00 / 1M input tokens, $15.00 / 1M output tokens.
const CLAUDE_PRICE_PER_INPUT_TOKEN = 3 / 1_000_000;
const CLAUDE_PRICE_PER_OUTPUT_TOKEN = 15 / 1_000_000;

export interface AgentUsage { inputTokens: number; outputTokens: number }
const ZERO_USAGE: AgentUsage = { inputTokens: 0, outputTokens: 0 };

export function computeAgentCostUsd(usage: AgentUsage): number {
  return usage.inputTokens * CLAUDE_PRICE_PER_INPUT_TOKEN + usage.outputTokens * CLAUDE_PRICE_PER_OUTPUT_TOKEN;
}

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

export type Jurisdiction = 'IN' | 'UK' | 'US' | 'ALL';

const JURISDICTION_LAW_BLOCKS: Record<'IN' | 'UK' | 'US', string> = {
  IN: `INDIA:
- Persons with Disabilities Act 2016 (RPwD Act) — disability-exclusionary language
- Equal Remuneration Act 1976 — gender-based pay discrimination signals
- Maternity Benefit Act 1961 — language that may deter women of childbearing age (e.g. implying continuous availability, no career breaks)
- Sexual Harassment of Women at Workplace Act 2013 (POSH) — hostile work environment signals
- SC/ST (Prevention of Atrocities) Act — caste-discriminatory language or coded caste/community references
- Age discrimination — age limits beyond what's reasonable given India's standard retirement age of 58-60
- Caste, religion, or community references, coded or explicit — illegal
- "Hindi speaking only" required in a non-Hindi-speaking state — potential linguistic/regional discrimination
- "Only male candidates" / "Only female candidates" or similar gender-specific candidate requirements — illegal in India`,
  UK: `UK:
- Equality Act 2010 — discrimination based on the 9 protected characteristics (age, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, race, religion/belief, sex, sexual orientation)
- UK GDPR — excessive or unnecessary personal data requests in the posting/questions
- Equality and Human Rights Commission (EHRC) guidelines on non-discriminatory recruitment language`,
  US: `US:
- EEOC guidelines — language that could constitute disparate treatment or disparate impact
- Age Discrimination in Employment Act (ADEA) — age-restrictive or age-coded language (40+ protected)
- Americans with Disabilities Act (ADA) — disability-exclusionary language or unnecessary physical requirements
- Title VII of the Civil Rights Act — discrimination based on race, color, religion, sex, or national origin`,
};

function lawBlocksFor(jurisdiction: Jurisdiction): string {
  const codes: Array<'IN' | 'UK' | 'US'> = jurisdiction === 'ALL' ? ['IN', 'UK', 'US'] : [jurisdiction];
  return codes.map((c) => JURISDICTION_LAW_BLOCKS[c]).join('\n\n');
}

function jurisdictionFraming(jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case 'IN':
      return 'The applicable jurisdiction is INDIA.';
    case 'UK':
      return 'The applicable jurisdiction is the UK.';
    case 'US':
      return 'The applicable jurisdiction is the US.';
    case 'ALL':
    default:
      return `This client (e.g. iOPEX) serves multiple markets — check against ALL of India, UK, and US
employment law simultaneously. Weight every jurisdiction equally; do not treat any one of
them as secondary.`;
  }
}

export async function scanBias(
  text: string,
  scanType: 'jd' | 'questions',
  jurisdiction: Jurisdiction = 'ALL'
): Promise<BiasScanResult> {
  const context =
    scanType === 'jd'
      ? 'job description'
      : 'interview questions';

  const prompt = `You are an expert in inclusive hiring practices and employment law compliance.
${jurisdictionFraming(jurisdiction)}
Analyse this ${context} for language that could deter qualified candidates from underrepresented groups or create legal liability.

${context.toUpperCase()}:
"""
${text.slice(0, 3000)}
"""

Check for general signals (relevant regardless of jurisdiction):
- Gender-coded language (e.g. "rockstar", "ninja", "aggressive", "dominate")
- Exclusionary culture language (e.g. "culture fit", "fraternity", "brotherhood")
- Credential inflation (e.g. "degree required" when experience would suffice)
- "Local candidates only" — may violate equal opportunity principles

Check for these jurisdiction-specific legal signals:
${lawBlocksFor(jurisdiction)}

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
  } catch (err) {
    console.error('[ai.service] scanBias failed:', err);
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

// ─── Sentiment & Emotion Analysis ─────────────────────────────────────────────

export interface EmotionPoint {
  questionIndex: number;
  confidence: number;
  engagement: number;
  clarity: number;
  stress: number;
}

export interface SentimentResult {
  confidence: number;
  engagement: number;
  clarity: number;
  stress: number;
  deceptionScore: number;
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  emotionTimeline: EmotionPoint[];
  summary: string;
}

export async function analyseSentiment(transcripts: string[]): Promise<SentimentResult> {
  const fullText = transcripts.map((t, i) => `[Response ${i + 1}]: ${t}`).join('\n\n');

  const prompt = `You are an expert in communication analysis and interview psychology.
Analyse the following interview transcripts for sentiment, emotion, and communication quality.

TRANSCRIPTS:
"""
${fullText.slice(0, 4000)}
"""

Evaluate:
- Confidence: How assured and self-assured does the candidate appear?
- Engagement: How interested and enthusiastic are they?
- Clarity: How clear and structured is their communication?
- Stress: How much stress/anxiety is apparent from their language?
- Deception: Any inconsistencies, hedging, or evasive patterns?

Also provide an emotion timeline per response and a brief summary.

Return ONLY valid JSON:
{
  "confidence": <0-100>,
  "engagement": <0-100>,
  "clarity": <0-100>,
  "stress": <0-100>,
  "deceptionScore": <0-100>,
  "overallSentiment": <"POSITIVE"|"NEUTRAL"|"NEGATIVE">,
  "emotionTimeline": [
    { "questionIndex": 0, "confidence": 75, "engagement": 80, "clarity": 70, "stress": 30 }
  ],
  "summary": "<2-3 sentence assessment>"
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as SentimentResult;
    return {
      confidence: parsed.confidence ?? 50,
      engagement: parsed.engagement ?? 50,
      clarity: parsed.clarity ?? 50,
      stress: parsed.stress ?? 50,
      deceptionScore: parsed.deceptionScore ?? 0,
      overallSentiment: parsed.overallSentiment ?? 'NEUTRAL',
      emotionTimeline: parsed.emotionTimeline ?? [],
      summary: parsed.summary ?? 'Sentiment analysis unavailable.',
    };
  } catch (err) {
    console.error('[ai.service] analyseSentiment failed:', err);
    return {
      confidence: 50, engagement: 50, clarity: 50, stress: 50,
      deceptionScore: 0, overallSentiment: 'NEUTRAL', emotionTimeline: [],
      summary: 'Sentiment analysis unavailable.',
    };
  }
}

// ─── Culture Fit Scoring ───────────────────────────────────────────────────────

export interface CultureDimension {
  score: number;
  evidence: string;
}

export interface CultureFitResult {
  overall: number;
  dimensions: Record<string, CultureDimension>;
  summary: string;
  recommendation: 'STRONG_FIT' | 'FIT' | 'NEUTRAL' | 'POOR_FIT';
}

export async function scoreCultureFit(
  transcripts: string[],
  cultureDimensions: string[],
  companyValues: string,
): Promise<CultureFitResult> {
  const fullText = transcripts.join('\n\n');
  const dims = cultureDimensions.length > 0
    ? cultureDimensions
    : ['Collaboration', 'Innovation', 'Ownership', 'Communication', 'Growth Mindset'];

  const prompt = `You are an expert in organizational culture and talent assessment.
Evaluate how well this candidate fits the company culture based on their interview responses.

COMPANY VALUES: ${companyValues || 'Innovation, Collaboration, Excellence, Integrity'}

CULTURE DIMENSIONS TO SCORE: ${dims.join(', ')}

INTERVIEW TRANSCRIPTS:
"""
${fullText.slice(0, 4000)}
"""

For each dimension, provide a score (0-100) and a specific evidence quote or observation from their responses.
Then provide an overall fit score and recommendation.

Return ONLY valid JSON:
{
  "overall": <0-100>,
  "dimensions": {
    "${dims[0]}": { "score": 75, "evidence": "Candidate mentioned..." }
  },
  "summary": "<2-3 sentence culture fit assessment>",
  "recommendation": <"STRONG_FIT"|"FIT"|"NEUTRAL"|"POOR_FIT">
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as CultureFitResult;
    return {
      overall: parsed.overall ?? 0,
      dimensions: parsed.dimensions ?? {},
      summary: parsed.summary ?? 'Culture fit assessment unavailable.',
      recommendation: parsed.recommendation ?? 'NEUTRAL',
    };
  } catch (err) {
    console.error('[ai.service] scoreCultureFit failed:', err);
    return { overall: 0, dimensions: {}, summary: 'Assessment unavailable.', recommendation: 'NEUTRAL' };
  }
}

// ─── Predictive Retention ──────────────────────────────────────────────────────

export interface RiskFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface RetentionResult {
  retentionScore: number;
  flightRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: RiskFactor[];
  positiveFactors: string[];
  predictedTenure: string;
  summary: string;
}

export async function predictRetention(
  transcripts: string[],
  jobTitle: string,
  salaryRange?: string,
): Promise<RetentionResult> {
  const fullText = transcripts.join('\n\n');

  const prompt = `You are an expert in HR analytics and employee retention prediction.
Based on this candidate's interview responses, predict their likely retention and flight risk.

JOB: ${jobTitle}
${salaryRange ? `SALARY RANGE: ${salaryRange}` : ''}

INTERVIEW TRANSCRIPTS:
"""
${fullText.slice(0, 4000)}
"""

Look for signals of:
- Career motivation alignment (are they excited about THIS role or just any job?)
- Stability indicators (job hopping history mentioned, long-term goals)
- Red flags (mentions of competing offers, salary dissatisfaction, location issues)
- Engagement with the company mission
- Growth expectations vs what this role offers

Return ONLY valid JSON:
{
  "retentionScore": <0-100, where 100 = very likely to stay>,
  "flightRisk": <"LOW"|"MEDIUM"|"HIGH">,
  "riskFactors": [
    { "factor": "<specific risk>", "severity": "<high|medium|low>", "mitigation": "<suggested action>" }
  ],
  "positiveFactors": ["<retention positive 1>", "<retention positive 2>"],
  "predictedTenure": "<e.g. 1-2 years | 3-5 years | 5+ years>",
  "summary": "<2-3 sentence retention assessment>"
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as RetentionResult;
    return {
      retentionScore: parsed.retentionScore ?? 50,
      flightRisk: parsed.flightRisk ?? 'MEDIUM',
      riskFactors: parsed.riskFactors ?? [],
      positiveFactors: parsed.positiveFactors ?? [],
      predictedTenure: parsed.predictedTenure ?? 'Unknown',
      summary: parsed.summary ?? 'Retention prediction unavailable.',
    };
  } catch (err) {
    console.error('[ai.service] predictRetention failed:', err);
    return {
      retentionScore: 50, flightRisk: 'MEDIUM', riskFactors: [],
      positiveFactors: [], predictedTenure: 'Unknown', summary: 'Retention prediction unavailable.',
    };
  }
}

// ─── Communication Assessment Scorecard ────────────────────────────────────────
// Scores SPEECH/COMMUNICATION QUALITY ONLY — never interview content/correctness
// (that's generateReport's job). Phonetic Clarity and Vocal Prosody are best-effort,
// inferred from the transcript alone (this app has no audio-level signal — see the
// VideoHighlight model comment in schema.prisma for the same constraint elsewhere).
// Treat this as a supplementary signal only, never a standalone hiring decision input —
// see scanBias for the equivalent fairness-review pattern used on job postings.

export interface CommunicationSubMetric {
  score: number; // 0-100
  comments: string;
  errorTypes: string[];
}

export interface CommunicationAssessmentResult {
  overallScore: number;
  communicationScore: number;
  communicationLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  summary: string;
  linguisticAccuracy: CommunicationSubMetric;
  phoneticClarity: CommunicationSubMetric;
  vocalProsody: CommunicationSubMetric;
  operationalFluency: CommunicationSubMetric;
  lexicalInteractiveIntelligence: CommunicationSubMetric;
}

// Fixed score -> CEFR band mapping. Exported so tests can assert the boundaries directly.
export const CEFR_BANDS: Array<{ min: number; band: CommunicationAssessmentResult['communicationLevel'] }> = [
  { min: 95, band: 'C2' },
  { min: 85, band: 'C1' },
  { min: 70, band: 'B2' },
  { min: 55, band: 'B1' },
  { min: 40, band: 'A2' },
  { min: 0, band: 'A1' },
];

export function scoreToCefrBand(score: number): CommunicationAssessmentResult['communicationLevel'] {
  const clamped = Math.max(0, Math.min(100, score));
  return CEFR_BANDS.find((b) => clamped >= b.min)!.band;
}

const COMM_SUB_METRIC_FALLBACK: CommunicationSubMetric = {
  score: 50,
  comments: 'Assessment unavailable.',
  errorTypes: [],
};

function communicationAssessmentFallback(): CommunicationAssessmentResult {
  return {
    overallScore: 50,
    communicationScore: 50,
    communicationLevel: 'B1',
    summary: 'Communication assessment unavailable.',
    linguisticAccuracy: { ...COMM_SUB_METRIC_FALLBACK },
    phoneticClarity: { ...COMM_SUB_METRIC_FALLBACK },
    vocalProsody: { ...COMM_SUB_METRIC_FALLBACK },
    operationalFluency: { ...COMM_SUB_METRIC_FALLBACK },
    lexicalInteractiveIntelligence: { ...COMM_SUB_METRIC_FALLBACK },
  };
}

function normalizeSubMetric(raw: any): CommunicationSubMetric {
  return {
    score: typeof raw?.score === 'number' ? Math.max(0, Math.min(100, Math.round(raw.score))) : 50,
    comments: typeof raw?.comments === 'string' ? raw.comments : '',
    errorTypes: Array.isArray(raw?.errorTypes) ? raw.errorTypes.filter((t: unknown) => typeof t === 'string') : [],
  };
}

function buildCommunicationAssessmentPrompt(transcript: string, retryNotice = false): string {
  const retryPrefix = retryNotice
    ? 'Your previous response was not valid JSON. Return ONLY the JSON object below, no other text, no markdown code fences.\n\n'
    : '';

  return `${retryPrefix}You are a speech and communication assessment expert (similar to a CEFR language examiner).
Score ONLY the CANDIDATE's speech/communication quality in this job interview transcript. Do NOT evaluate
whether their answers are factually or technically correct, relevant to the role, or a good interview
answer — that is scored elsewhere. Score purely how they communicate.

INTERVIEW TRANSCRIPT (interviewer and candidate turns):
"""
${transcript.slice(0, 6000)}
"""

Score these 5 dimensions, each 0-100, with a 1-2 sentence comment and a list of error tags chosen ONLY
from that dimension's controlled tag list below (use an empty array if none apply):

1. Linguistic Accuracy — grammar, article/preposition/tense errors, sentence structure.
   Allowed tags: "Article Misuse", "Preposition Error", "Tense Error", "Subject-Verb Agreement", "Sentence Fragment", "Run-on Sentence", "Word Order Error"

2. Phonetic Clarity & Articulation — intelligibility, diction, mispronunciations. This is a TRANSCRIPT
   ONLY — there is no audio signal available, so infer only what's visible in the text (e.g. repeated
   spelling-out of a word, garbled STT output) and otherwise score conservatively around 60-75 while
   noting the limitation.
   Allowed tags: "Unclear Diction", "Mispronunciation", "Word Stress Error", "Consonant Cluster Difficulty", "Audio Signal Unavailable"

3. Vocal Prosody — tone variation, monotone delivery, emphasis. Also transcript-only (best-effort) —
   infer from punctuation/phrasing patterns where possible, otherwise score conservatively and use the
   "Audio Signal Unavailable" tag.
   Allowed tags: "Monotone Delivery", "Flat Intonation", "Inappropriate Emphasis", "Audio Signal Unavailable"

4. Operational Fluency — fillers, false starts, repetitions, run-on delivery, forward momentum.
   Allowed tags: "Excessive Fillers", "False Start", "Repetitive Language", "Long Pause", "Run-on Delivery"

5. Lexical & Interactive Intelligence — vocabulary range, relevance/conciseness of answers, appropriate
   use of technical terms.
   Allowed tags: "Limited Vocabulary Range", "Off-Topic Response", "Overly Verbose", "Imprecise Word Choice", "Inappropriate Register"

Return ONLY valid JSON, no markdown, no other text:
{
  "linguisticAccuracy": { "score": 0, "comments": "", "errorTypes": [] },
  "phoneticClarity": { "score": 0, "comments": "", "errorTypes": [] },
  "vocalProsody": { "score": 0, "comments": "", "errorTypes": [] },
  "operationalFluency": { "score": 0, "comments": "", "errorTypes": [] },
  "lexicalInteractiveIntelligence": { "score": 0, "comments": "", "errorTypes": [] },
  "summary": "<1-2 sentence overall narrative of the candidate's communication quality>"
}`;
}

export async function generateCommunicationAssessment(
  transcript: string,
  interviewMeta: { startedAt: Date; endedAt: Date },
): Promise<CommunicationAssessmentResult & { startedAt: Date; endedAt: Date; durationSeconds: number }> {
  const durationSeconds = Math.max(
    0,
    Math.round((interviewMeta.endedAt.getTime() - interviewMeta.startedAt.getTime()) / 1000),
  );

  async function callOnce(retryNotice: boolean) {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0,
      messages: [{ role: 'user', content: buildCommunicationAssessmentPrompt(transcript, retryNotice) }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned); // throws on malformed JSON — caller retries once
  }

  let parsed: any;
  try {
    parsed = await callOnce(false);
  } catch (firstErr) {
    console.error('[ai.service] generateCommunicationAssessment malformed JSON, retrying once:', firstErr);
    try {
      parsed = await callOnce(true);
    } catch (secondErr) {
      console.error('[ai.service] generateCommunicationAssessment failed after retry:', secondErr);
      return { ...communicationAssessmentFallback(), ...interviewMeta, durationSeconds };
    }
  }

  const linguisticAccuracy = normalizeSubMetric(parsed.linguisticAccuracy);
  const phoneticClarity = normalizeSubMetric(parsed.phoneticClarity);
  const vocalProsody = normalizeSubMetric(parsed.vocalProsody);
  const operationalFluency = normalizeSubMetric(parsed.operationalFluency);
  const lexicalInteractiveIntelligence = normalizeSubMetric(parsed.lexicalInteractiveIntelligence);

  const communicationScore = Math.round(
    (linguisticAccuracy.score +
      phoneticClarity.score +
      vocalProsody.score +
      operationalFluency.score +
      lexicalInteractiveIntelligence.score) /
      5,
  );

  return {
    overallScore: communicationScore,
    communicationScore,
    communicationLevel: scoreToCefrBand(communicationScore),
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'Communication assessment unavailable.',
    linguisticAccuracy,
    phoneticClarity,
    vocalProsody,
    operationalFluency,
    lexicalInteractiveIntelligence,
    ...interviewMeta,
    durationSeconds,
  };
}

// ─── Candidate Chatbot ─────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatbotReply(
  messages: ChatMessage[],
  jobTitle: string,
  companyName: string,
  openingContext: string,
): Promise<string> {
  const systemPrompt = `You are a friendly and professional AI hiring assistant for ${companyName}.
You are helping a candidate who has applied for the role of: ${jobTitle}.

Context about this role:
${openingContext.slice(0, 1000)}

Your job is to:
- Answer questions about the interview process, timeline, and role
- Keep the candidate engaged and excited about the opportunity
- Never make promises about hiring decisions
- Be honest about what you don't know — say "let me connect you with the team"
- Keep responses concise (2-4 sentences max)
- Always be warm, professional, and encouraging

Never discuss: compensation specifics, other candidates, rejection reasons, or anything legally sensitive.`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return res.content[0].type === 'text'
      ? res.content[0].text
      : 'Thank you for your message. A member of our team will be in touch shortly.';
  } catch (err) {
    console.error('[ai.service] chatbotReply failed:', err);
    return 'Thank you for reaching out. Please check your email for updates on your application.';
  }
}

// ─── Candidate Ranking ─────────────────────────────────────────────────────────

export interface RankedCandidate {
  candidateId: string;
  rank: number;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export async function rankCandidates(
  candidates: Array<{ id: string; name: string; overallScore: number; skills: string[]; summary: string }>,
  jobTitle: string,
  requiredSkills: string[],
): Promise<RankedCandidate[]> {
  if (candidates.length === 0) return [];

  const candidateList = candidates
    .map((c, i) => `[${i + 1}] ${c.name} | Score: ${c.overallScore} | Skills: ${c.skills.join(', ')} | ${c.summary}`)
    .join('\n');

  const prompt = `You are a senior talent acquisition specialist.
Rank these candidates for the role of ${jobTitle}.

Required skills: ${requiredSkills.join(', ')}

CANDIDATES:
${candidateList}

Rank them from best to worst fit. For each, identify 2-3 key strengths and any skill gaps.

Return ONLY valid JSON array:
[
  {
    "candidateId": "<use the array position index as string, 0-based>",
    "rank": 1,
    "overallScore": 85,
    "strengths": ["Strong technical skills", "Excellent communication"],
    "gaps": ["Limited leadership experience"],
    "recommendation": "1-sentence hire recommendation"
  }
]`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as RankedCandidate[];
    return parsed.map((r) => ({
      ...r,
      candidateId: candidates[parseInt(r.candidateId)]?.id ?? r.candidateId,
    }));
  } catch (err) {
    console.error('[ai.service] rankCandidates failed:', err);
    return candidates.map((c, i) => ({
      candidateId: c.id, rank: i + 1,
      overallScore: c.overallScore, strengths: [], gaps: [],
      recommendation: 'Manual review required.',
    }));
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

// ─── Simulated EPFO Employment History ────────────────────────────────────────
// SIMULATION ONLY. There is no real EPFO API integration in this app (that
// requires government approval from the Ministry of Labour). This function
// fabricates a plausible, entirely fictional employment history purely to
// prototype the verification UI — it is never a query against a real UAN or
// real government record, and the caller must always label it as simulated.

export interface SimulatedEmploymentRecord {
  employer: string;
  startDate: string;      // "YYYY-MM"
  endDate: string | null; // "YYYY-MM", null = ongoing
  epfoOffice: string;
}

export async function generateSimulatedEmploymentHistory(params: {
  candidateName: string;
  roleAppliedFor: string;
}): Promise<SimulatedEmploymentRecord[]> {
  const prompt = `You are generating a FICTIONAL, SIMULATED dataset for a software prototype only.
This is NOT a real government record, NOT sourced from any real EPFO/UAN lookup, and must never be
described as authentic. It exists only to populate a demo UI for an employment-verification feature
that has no real backend integration.

Generate a plausible but entirely fictional Indian employment history, structured as if it came from
an EPFO UAN passbook, for a demo candidate profile. Do not attempt to reflect any real person's actual
work history — invent generic, unremarkable company names and offices.

Demo candidate name: ${params.candidateName}
Role being considered for: ${params.roleAppliedFor}

Generate 1-3 employment entries spanning a plausible total career length (1-8 years), using:
- employer: a generic, plausible-sounding Indian company name (invented, not a real specific company)
- startDate / endDate: "YYYY-MM" format; endDate should be null only for the most recent entry if it
  represents an ongoing job
- epfoOffice: a plausible EPFO regional/sub-regional office name, e.g. "EPFO Bengaluru Sub-Regional Office"

Return ONLY valid JSON array, no other text:
[
  { "employer": "...", "startDate": "2019-06", "endDate": "2021-08", "epfoOffice": "..." }
]`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as SimulatedEmploymentRecord[];
  } catch (err) {
    console.error('[ai.service] generateSimulatedEmploymentHistory failed:', err);
    return [];
  }
}

// ─── Simulated LinkedIn Applicants ─────────────────────────────────────────────
// SIMULATION ONLY. There is no real LinkedIn Talent Solutions API integration
// in this app (that requires LinkedIn partner approval). This fabricates
// plausible, entirely fictional applicant profiles purely to prototype the
// "import candidates who applied via LinkedIn" UI — never a real API response.

export interface SimulatedApplicant {
  name: string;
  headline: string;
  currentRole: string;
  experienceYears: number;
  location: string;
  skills: string[];
}

export async function generateSimulatedLinkedInApplicants(params: {
  jobTitle: string;
  skills: string[];
  count: number;
}): Promise<SimulatedApplicant[]> {
  const prompt = `You are generating a FICTIONAL, SIMULATED dataset for a software prototype only.
This is NOT real LinkedIn data and must never be described as authentic. It exists only to populate
a demo UI for a "candidates who applied via LinkedIn" feature that has no real LinkedIn API integration.

Generate ${params.count} plausible but entirely fictional Indian job-seeker profiles who might have
applied for this role. Invent generic names and headlines — do not reference any real, identifiable
person.

Job title: ${params.jobTitle}
Key skills for the role: ${params.skills.join(', ')}

For each fictional applicant, generate:
- name: a plausible Indian full name (invented)
- headline: a short LinkedIn-style headline, e.g. "Senior Backend Engineer at [fictional company]"
- currentRole: their current job title
- experienceYears: total years of experience (integer)
- location: an Indian city
- skills: 4-6 skills relevant to the role, mixing exact matches and adjacent skills

Return ONLY valid JSON array, no other text:
[
  { "name": "...", "headline": "...", "currentRole": "...", "experienceYears": 5, "location": "Bengaluru", "skills": ["..."] }
]`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as SimulatedApplicant[];
  } catch (err) {
    console.error('[ai.service] generateSimulatedLinkedInApplicants failed:', err);
    return [];
  }
}

// ─── Extract LinkedIn Profile From Pasted Text ─────────────────────────────────
// NOT a scrape. This never fetches linkedin.com — it only structures text the
// recruiter copy-pasted themselves from a profile page they viewed in their own
// browser. Claude is instructed to extract only what's explicitly present and
// never invent or infer fields that aren't in the text.

export interface ExtractedLinkedInProfile {
  name: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
}

export async function extractLinkedInProfileFromText(pastedText: string): Promise<ExtractedLinkedInProfile> {
  const prompt = `You are extracting structured fields from text a recruiter copy-pasted from a
candidate's public LinkedIn profile page. This text was provided directly by the user — you did
not look anything up and have no other source of information about this person.

Extract ONLY information explicitly present in the text below. Do NOT guess, infer, or invent
anything that isn't directly stated, even if it seems like a reasonable assumption. If a field
isn't present in the text, return null for it (or an empty array for skills).

PASTED TEXT:
"""
${pastedText.slice(0, 4000)}
"""

Return ONLY valid JSON, no other text:
{
  "name": "<full name if present, else null>",
  "headline": "<professional headline/title if present, else null>",
  "location": "<city/location if present, else null>",
  "skills": ["<skill explicitly mentioned in the text>"]
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      name: parsed.name ?? null,
      headline: parsed.headline ?? null,
      location: parsed.location ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    };
  } catch (err) {
    console.error('[ai.service] extractLinkedInProfileFromText failed:', err);
    return { name: null, headline: null, location: null, skills: [] };
  }
}

// ─── Naukri.com Candidate Search (SIMULATION) ──────────────────────────────────
// SIMULATION ONLY — there is no real Naukri.com API integration. Every profile
// below is entirely fictional, generated to populate a demo "search Naukri
// candidates" UI, and must never be presented as a real Naukri.com search result.

export interface SimulatedNaukriCandidate {
  name: string;
  currentRole: string;
  currentCompany: string;
  experienceYears: number;
  skills: string[];
  location: string;
  salaryLakhs: number;
  resumeHeadline: string;
}

export async function generateSimulatedNaukriCandidates(params: {
  skills: string[];
  location: string;
  minExp?: number;
  maxExp?: number;
  minSalary?: number;
  maxSalary?: number;
  count: number;
}): Promise<SimulatedNaukriCandidate[]> {
  const expRange = params.minExp != null || params.maxExp != null
    ? `${params.minExp ?? 0}-${params.maxExp ?? (params.minExp ?? 0) + 5} years`
    : 'varied, 1-12 years';
  const salaryLine = params.minSalary != null || params.maxSalary != null
    ? `Expected salary range: ${params.minSalary ?? 0}-${params.maxSalary ?? 100} lakhs per annum (INR)`
    : '';

  const prompt = `You are generating a FICTIONAL, SIMULATED dataset for a software prototype only.
This is NOT real Naukri.com data and must never be described as authentic. It exists only to populate
a demo UI for a "search Naukri.com candidates" feature that has no real Naukri API integration.

Generate ${params.count} plausible but entirely fictional Indian candidates for a role requiring:
Skills: ${params.skills.join(', ') || 'general professional skills'}
Location: ${params.location || 'any major Indian city'}
Experience: ${expRange}
${salaryLine}

Invent generic names — do not reference any real, identifiable person. Use realistic Indian names,
companies (TCS, Infosys, Wipro, HCL, Cognizant, Accenture, etc.), and Chennai/Bengaluru/Hyderabad/Mumbai/
Pune/Delhi locations.

For each fictional candidate, generate:
- name: a plausible Indian full name (invented)
- currentRole: current job title
- currentCompany: current employer (from the list above or a similar well-known Indian company)
- experienceYears: total years of experience (integer)
- skills: 5-8 skills, mixing exact matches to the required skills and adjacent skills
- location: an Indian city
- salaryLakhs: current/expected annual salary in INR lakhs (integer)
- resumeHeadline: a short Naukri-style resume headline

Return ONLY valid JSON array, no other text:
[{ "name": "...", "currentRole": "...", "currentCompany": "...", "experienceYears": 5, "skills": ["..."], "location": "...", "salaryLakhs": 12, "resumeHeadline": "..." }]`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as SimulatedNaukriCandidate[];
  } catch (err) {
    console.error('[ai.service] generateSimulatedNaukriCandidates failed:', err);
    return [];
  }
}

// Scores fictional/imported Naukri candidates against an opening's requirements.
// Returns a { candidateName: matchPercent } map — best-effort, empty map on failure
// (callers should treat a missing entry as "no match score available", not 0).
export async function scoreNaukriMatches(params: {
  candidates: { name: string; skills: string[]; experienceYears: number; currentRole: string }[];
  jobTitle: string;
  requiredSkills: string[];
}): Promise<Record<string, number>> {
  if (params.candidates.length === 0) return {};

  const prompt = `You are scoring how well each candidate matches a job opening's requirements.

Job title: ${params.jobTitle}
Required skills: ${params.requiredSkills.join(', ') || 'not specified'}

Candidates:
${params.candidates.map((c, i) => `${i + 1}. ${c.name} — ${c.currentRole}, ${c.experienceYears}y exp, skills: ${c.skills.join(', ')}`).join('\n')}

For each candidate, score 0-100 how well they match the job's required skills and role, considering
skill overlap and relevant experience. Return ONLY valid JSON, no other text:
{ "matches": [{ "name": "<candidate name exactly as given above>", "matchPercent": 78 }] }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const matches: { name: string; matchPercent: number }[] = Array.isArray(parsed.matches) ? parsed.matches : [];
    return Object.fromEntries(matches.map((m) => [m.name, m.matchPercent]));
  } catch (err) {
    console.error('[ai.service] scoreNaukriMatches failed:', err);
    return {};
  }
}

// ─── Coding Assessment Code Review ─────────────────────────────────────────────
// Used when no Judge0 API key is configured — Claude reviews the code for
// correctness, efficiency, and quality without actually executing it.

export interface CodeReviewResult {
  score: number;
  feedback: string;
  bugs: string[];
  suggestions: string[];
}

export async function reviewCode(params: {
  code: string;
  language: string;
  question: string;
  testCases?: any[];
}): Promise<CodeReviewResult> {
  const testCasesBlock = params.testCases?.length
    ? `\nTest cases to consider:\n${JSON.stringify(params.testCases, null, 2)}`
    : '';

  const prompt = `Review this ${params.language} code for the following problem:

Problem: ${params.question}
${testCasesBlock}

Candidate's code:
\`\`\`${params.language}
${params.code}
\`\`\`

Score 0-100 for correctness, efficiency, and code quality. Provide specific feedback on bugs,
edge cases missed, and improvements.

Return ONLY valid JSON, no other text:
{ "score": 75, "feedback": "<2-3 sentence overall assessment>", "bugs": ["<specific bug or edge case, if any>"], "suggestions": ["<specific improvement>"] }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 900,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 0,
      feedback: parsed.feedback ?? 'Unable to generate feedback for this submission.',
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (err) {
    console.error('[ai.service] reviewCode failed:', err);
    return {
      score: 0,
      feedback: 'Automated code review is temporarily unavailable. Your submission was saved and a recruiter can review it manually.',
      bugs: [],
      suggestions: [],
    };
  }
}

// ─── Group Discussion AI Moderator ─────────────────────────────────────────────
// groupdiscussion.service.ts owns the domain logic (dominance detection, when to
// summarize); these functions just wrap the two Claude calls it needs.

export interface GDModerationResult {
  message: string | null;
}

export async function moderateGroupDiscussion(params: {
  topic: string;
  participantNames: string[];
  transcript: { speaker: string; text: string; timestamp: string }[];
  dominantSpeakerName: string | null;
  shouldSummarize: boolean;
}): Promise<GDModerationResult> {
  const recentTranscript = params.transcript.slice(-12).map((t) => `${t.speaker}: ${t.text}`).join('\n');

  const instruction = params.dominantSpeakerName
    ? `${params.dominantSpeakerName} has been dominating the conversation. Politely redirect the discussion, e.g. "Thank you ${params.dominantSpeakerName}, let's hear from others," and invite a quieter participant to weigh in.`
    : params.shouldSummarize
    ? `Summarise what has been discussed so far in 1-2 sentences (e.g. "So far we have discussed..."), then ask a follow-up question to keep the discussion moving.`
    : `Decide whether the discussion needs a brief moderator nudge right now — e.g. asking a quieter participant "What does <name> think about this?" — or whether it's flowing naturally and needs no intervention.`;

  const prompt = `You are an AI moderator for a group discussion round in a hiring interview process.

Topic: "${params.topic}"
Participants: ${params.participantNames.join(', ')}

Recent transcript:
${recentTranscript}

${instruction}

Return ONLY valid JSON, no other text:
{ "message": "<moderator message, or null if no intervention is needed right now>" }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { message: parsed.message ?? null };
  } catch (err) {
    console.error('[ai.service] moderateGroupDiscussion failed:', err);
    return { message: null };
  }
}

export interface GDIndividualScore {
  candidateId: string;
  name: string;
  communication: number;
  content: number;
  leadership: number;
  listening: number;
  overall: number;
  feedback: string;
}

export interface GDEvaluationResult {
  scores: GDIndividualScore[];
  ranking: string[]; // candidateIds, best to worst
  topPerformer: string | null; // candidateId
  summary: string;
}

export async function evaluateGroupDiscussion(params: {
  topic: string;
  participants: { candidateId: string; name: string; speakingTime: number }[];
  transcript: { speaker: string; text: string; timestamp: string }[];
}): Promise<GDEvaluationResult> {
  const transcriptText = params.transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');

  const prompt = `You are evaluating a group discussion round in a hiring interview process.

Topic: "${params.topic}"
Participants: ${params.participants.map((p) => `${p.name} (spoke ${p.speakingTime} turns)`).join(', ')}

Full transcript:
${transcriptText || '(no messages were exchanged)'}

For each participant, score 0-100 on: communication, content (quality of ideas), leadership
(initiative, guiding the discussion), and listening (building on others' points, not interrupting).
Compute an overall score (average of the four). Provide 1-2 sentences of individual feedback.
Then rank participants best to worst and identify the top performer, plus a 2-3 sentence session summary.

Return ONLY valid JSON, no other text:
{
  "scores": [{ "name": "<participant name exactly as given above>", "communication": 80, "content": 75, "leadership": 60, "listening": 85, "overall": 75, "feedback": "..." }],
  "ranking": ["<name, best to worst>"],
  "topPerformer": "<name>",
  "summary": "..."
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const nameToId = new Map(params.participants.map((p) => [p.name, p.candidateId]));
    const scores: GDIndividualScore[] = (Array.isArray(parsed.scores) ? parsed.scores : []).map((s: any) => ({
      candidateId: nameToId.get(s.name) ?? s.name,
      name: s.name,
      communication: s.communication ?? 0,
      content: s.content ?? 0,
      leadership: s.leadership ?? 0,
      listening: s.listening ?? 0,
      overall: s.overall ?? 0,
      feedback: s.feedback ?? '',
    }));
    const ranking: string[] = (Array.isArray(parsed.ranking) ? parsed.ranking : []).map((n: string) => nameToId.get(n) ?? n);

    return {
      scores,
      ranking,
      topPerformer: parsed.topPerformer ? (nameToId.get(parsed.topPerformer) ?? parsed.topPerformer) : null,
      summary: parsed.summary ?? '',
    };
  } catch (err) {
    console.error('[ai.service] evaluateGroupDiscussion failed:', err);
    return { scores: [], ranking: [], topPerformer: null, summary: 'Unable to generate evaluation for this session.' };
  }
}

// ─── Video Highlight Extraction ────────────────────────────────────────────────
// No video file is ever processed — this identifies the best moments in the
// interview transcript. Each entry in `transcripts` should already describe
// which question it answers (see highlights.routes.ts), and its index in the
// array is what questionIndex below refers back to.

export interface ExtractedHighlight {
  type: 'STRONG_ANSWER' | 'CULTURE_FIT_MOMENT' | 'LEADERSHIP_SIGNAL' | 'RED_FLAG' | 'BEST_MOMENT';
  questionIndex: number;
  transcript: string;
  score: number;
  summary: string;
}

const HIGHLIGHT_TYPES = new Set(['STRONG_ANSWER', 'CULTURE_FIT_MOMENT', 'LEADERSHIP_SIGNAL', 'RED_FLAG', 'BEST_MOMENT']);

export async function extractHighlights(transcripts: string[], jobTitle: string): Promise<ExtractedHighlight[]> {
  if (transcripts.length === 0) return [];

  const transcriptBlock = transcripts.map((t, i) => `[${i}]\n${t}`).join('\n\n');

  const prompt = `You are an expert talent analyst. Review this interview transcript for a ${jobTitle} role
and identify the 5-8 most significant moments across the numbered entries below.

${transcriptBlock}

For each significant moment, identify:
- type: one of STRONG_ANSWER, CULTURE_FIT_MOMENT, LEADERSHIP_SIGNAL, RED_FLAG, BEST_MOMENT
- questionIndex: the bracketed entry number [N] it came from (integer)
- transcript: the exact excerpt from that entry's answer that makes this moment notable
- score: 0-100 significance score
- summary: a one-line description of why this moment is notable

Return ONLY valid JSON array, no other text:
[{ "type": "STRONG_ANSWER", "questionIndex": 0, "transcript": "...", "score": 88, "summary": "..." }]`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((h: any) => HIGHLIGHT_TYPES.has(h.type))
      .map((h: any) => ({
        type: h.type,
        questionIndex: typeof h.questionIndex === 'number' ? h.questionIndex : 0,
        transcript: h.transcript ?? '',
        score: typeof h.score === 'number' ? Math.max(0, Math.min(100, Math.round(h.score))) : 0,
        summary: h.summary ?? '',
      }));
  } catch (err) {
    console.error('[ai.service] extractHighlights failed:', err);
    return [];
  }
}

// ─── Compensation Benchmarking ─────────────────────────────────────────────────
// AI-estimated market rates, not a real compensation survey/data licensing feed —
// callers should treat `source: 'AI_ESTIMATE'` (the schema default) as authoritative
// about how this number was derived.

export interface CompensationBenchmarkResult {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  topCompanies: string[];
  premiumSkills: string[];
  trend: 'rising' | 'stable' | 'declining';
  analysis: string;
}

export async function generateCompensationBenchmark(params: {
  jobTitle: string;
  location: string;
  minExp: number;
  maxExp: number;
}): Promise<CompensationBenchmarkResult> {
  const prompt = `You are an expert in Indian IT compensation. Provide realistic salary benchmarks for
${params.jobTitle} in ${params.location} with ${params.minExp}-${params.maxExp} years experience.
Base this on current Indian market rates (2026). Include P25, P50, P75, P90 percentiles in INR lakhs
per annum. Also provide: top paying companies for this role, skills that command a premium, and the
market trend (rising/stable/declining).

Return ONLY valid JSON, no other text:
{ "p25": 12, "p50": 18, "p75": 26, "p90": 38, "topCompanies": ["..."], "premiumSkills": ["..."], "trend": "rising", "analysis": "<2-3 sentence market analysis>" }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 900,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const trend = ['rising', 'stable', 'declining'].includes(parsed.trend) ? parsed.trend : 'stable';
    return {
      p25: Math.round(parsed.p25 ?? 0),
      p50: Math.round(parsed.p50 ?? 0),
      p75: Math.round(parsed.p75 ?? 0),
      p90: Math.round(parsed.p90 ?? 0),
      topCompanies: Array.isArray(parsed.topCompanies) ? parsed.topCompanies : [],
      premiumSkills: Array.isArray(parsed.premiumSkills) ? parsed.premiumSkills : [],
      trend,
      analysis: parsed.analysis ?? 'Unable to generate a market analysis at this time.',
    };
  } catch (err) {
    console.error('[ai.service] generateCompensationBenchmark failed:', err);
    return {
      p25: 0, p50: 0, p75: 0, p90: 0,
      topCompanies: [], premiumSkills: [], trend: 'stable',
      analysis: 'Unable to generate a compensation benchmark at this time.',
    };
  }
}

// ─── Toastmasters: Speech Analysis (grammar, filler words, AI evaluation) ──────
// Note: highlighted-transcript HTML is deliberately NOT requested from the model —
// the frontend does its own safe, deterministic filler-word highlighting from the
// plain transcript instead of trusting model-generated markup.

export interface SpeechGrammarError { text: string; correction: string; rule: string }

export interface SpeechFillerWordCounts {
  um: number; uh: number; so: number; like: number; er: number; you_know: number;
  total: number; ratePerMinute: number; worstOffender: string;
}

export interface SpeechAnalysisResult {
  grammar: { score: number; errors: SpeechGrammarError[]; suggestions: string[] };
  fillerWords: SpeechFillerWordCounts;
  evaluation: {
    contentScore: number; deliveryScore: number; languageScore: number; overallScore: number;
    commendations: string[]; recommendations: string[];
    openingFeedback: string; bodyFeedback: string; conclusionFeedback: string;
  };
  wordOfDayUsed: boolean;
  summary: string;
  usage: AgentUsage;
}

const EMPTY_FILLER_WORD_COUNTS: SpeechFillerWordCounts = {
  um: 0, uh: 0, so: 0, like: 0, er: 0, you_know: 0, total: 0, ratePerMinute: 0, worstOffender: 'none',
};

export async function analyzeSpeech(params: {
  transcript: string;
  durationSeconds?: number;
  wordOfDay?: string;
}): Promise<SpeechAnalysisResult> {
  const minutes = params.durationSeconds ? params.durationSeconds / 60 : undefined;

  const prompt = `You are an expert Toastmasters evaluator and English-language coach analysing a club speech transcript.

${params.wordOfDay ? `Word of the Day for this meeting: "${params.wordOfDay}" — check whether the speaker used it.` : 'No word of the day was set for this meeting.'}
Speech duration: ${minutes ? `${minutes.toFixed(1)} minutes` : 'unknown'}.

TRANSCRIPT:
"""
${params.transcript.slice(0, 6000)}
"""

Analyse this speech and return ONLY valid JSON in this exact shape, no other text:
{
  "grammar": {
    "score": <0-10 float>,
    "errors": [{"text": "<exact phrase from the transcript>", "correction": "<corrected phrase>", "rule": "<short grammar rule name>"}],
    "suggestions": ["<general writing/speaking improvement tip>"]
  },
  "fillerWords": {
    "um": <count>, "uh": <count>, "so": <count>, "like": <count>, "er": <count>, "you_know": <count>,
    "total": <sum of the above>, "ratePerMinute": <total divided by duration in minutes, 1 decimal>, "worstOffender": "<the most-used filler word>"
  },
  "evaluation": {
    "contentScore": <1-5 int>, "deliveryScore": <1-5 int>, "languageScore": <1-5 int>, "overallScore": <1-5 int>,
    "commendations": ["<specific thing that went well, referencing actual phrases from the transcript>"],
    "recommendations": ["<specific thing to improve, referencing actual phrases from the transcript>"],
    "openingFeedback": "<was the opening attention-grabbing?>",
    "bodyFeedback": "<was the body clearly structured?>",
    "conclusionFeedback": "<was the conclusion memorable?>"
  },
  "wordOfDayUsed": <true|false>,
  "summary": "<2-3 sentence overall summary of the speech>"
}

Count filler words by scanning the transcript literally: "um", "uh", "er" always count; "so" and "like" only
count when used as a verbal filler/tic, not as a conjunction, verb, or comparison; "you know" counts as a
single phrase toward "you_know". Only flag genuine grammar errors, quoting the exact words used in the transcript.
Be specific — reference actual phrases from the transcript wherever you give feedback.`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      grammar: {
        score: parsed.grammar?.score ?? 5,
        errors: Array.isArray(parsed.grammar?.errors) ? parsed.grammar.errors : [],
        suggestions: Array.isArray(parsed.grammar?.suggestions) ? parsed.grammar.suggestions : [],
      },
      fillerWords: { ...EMPTY_FILLER_WORD_COUNTS, ...parsed.fillerWords },
      evaluation: {
        contentScore: parsed.evaluation?.contentScore ?? 3,
        deliveryScore: parsed.evaluation?.deliveryScore ?? 3,
        languageScore: parsed.evaluation?.languageScore ?? 3,
        overallScore: parsed.evaluation?.overallScore ?? 3,
        commendations: Array.isArray(parsed.evaluation?.commendations) ? parsed.evaluation.commendations : [],
        recommendations: Array.isArray(parsed.evaluation?.recommendations) ? parsed.evaluation.recommendations : [],
        openingFeedback: parsed.evaluation?.openingFeedback ?? '',
        bodyFeedback: parsed.evaluation?.bodyFeedback ?? '',
        conclusionFeedback: parsed.evaluation?.conclusionFeedback ?? '',
      },
      wordOfDayUsed: parsed.wordOfDayUsed ?? false,
      summary: parsed.summary ?? 'Speech analysis unavailable.',
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] analyzeSpeech failed:', err);
    return {
      grammar: { score: 0, errors: [], suggestions: [] },
      fillerWords: EMPTY_FILLER_WORD_COUNTS,
      evaluation: {
        contentScore: 0, deliveryScore: 0, languageScore: 0, overallScore: 0,
        commendations: [], recommendations: [],
        openingFeedback: '', bodyFeedback: '', conclusionFeedback: '',
      },
      wordOfDayUsed: false,
      summary: 'Speech analysis unavailable.',
      usage: ZERO_USAGE,
    };
  }
}

// ─── Toastmasters: AI Agent role-fulfillment ──────────────────────────────────
// When a meeting role is assigned to "AI Agent" instead of a human member, these
// functions generate the content that role would normally produce, so the agent's
// work shows up in the same tables/report a human's work would. Same defensive
// pattern as analyzeSpeech(): strip markdown fences, parse defensively, typed
// fallback, never throw raw.

export async function generateAgentSpeech(params: {
  roleName: string;
  speechTitle?: string;
  pathwaysProject?: string;
  manualNumber?: string;
  wordOfDay?: string;
  theme?: string;
}): Promise<{ title: string; transcript: string; usage: AgentUsage }> {
  const prompt = `You are an experienced Toastmasters club member preparing to deliver a prepared speech at a club meeting.

${params.speechTitle ? `The speech title is: "${params.speechTitle}"` : 'No title has been set yet — invent a fitting one.'}
${params.pathwaysProject ? `Pathways project: ${params.pathwaysProject}` : ''}
${params.manualNumber ? `Manual project number: ${params.manualNumber}` : ''}
${params.theme ? `Meeting theme: ${params.theme}` : ''}
${params.wordOfDay ? `Try to naturally use the meeting's Word of the Day at least once: "${params.wordOfDay}"` : ''}

Write a full ~5-7 minute Toastmasters speech transcript (roughly 700-950 words) as if being spoken aloud — first person,
natural spoken cadence, a clear opening hook, a structured body (2-3 points or a short story arc), and a memorable
conclusion. This is the literal transcript, not an outline or stage directions.

Return ONLY valid JSON in this exact shape, no other text:
{ "title": "<the speech title, either the one given above or your invented one>", "transcript": "<the full speech text>" }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      title: parsed.title || params.speechTitle || 'Untitled Speech',
      transcript: parsed.transcript || '',
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] generateAgentSpeech failed:', err);
    return { title: params.speechTitle || 'Untitled Speech', transcript: '', usage: ZERO_USAGE };
  }
}

export async function generateAgentEvaluation(params: {
  speechTranscript: string;
  speechTitle?: string;
  wordOfDay?: string;
}): Promise<{
  commendations: string; recommendations: string;
  ratingContent: number; ratingDelivery: number; ratingLanguage: number; overallRating: number;
  openingFeedback: string; bodyFeedback: string; conclusionFeedback: string;
  usage: AgentUsage;
}> {
  const prompt = `You are an experienced Toastmasters evaluator giving a verbal evaluation of a fellow member's prepared speech.

${params.speechTitle ? `Speech title: "${params.speechTitle}"` : ''}
${params.wordOfDay ? `Word of the Day: "${params.wordOfDay}"` : ''}

TRANSCRIPT:
"""
${params.speechTranscript.slice(0, 6000)}
"""

Evaluate this speech and return ONLY valid JSON in this exact shape, no other text:
{
  "commendations": "<2-4 sentences on what went well, referencing actual phrases from the transcript>",
  "recommendations": "<2-4 sentences of specific, actionable improvement advice>",
  "ratingContent": <1-5 int>, "ratingDelivery": <1-5 int>, "ratingLanguage": <1-5 int>, "overallRating": <1-5 int>,
  "openingFeedback": "<was the opening attention-grabbing?>",
  "bodyFeedback": "<was the body clearly structured?>",
  "conclusionFeedback": "<was the conclusion memorable?>"
}
Be specific and encouraging, in the warm-but-honest tone of a real Toastmasters evaluator.`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      commendations: parsed.commendations ?? '',
      recommendations: parsed.recommendations ?? '',
      ratingContent: parsed.ratingContent ?? 3,
      ratingDelivery: parsed.ratingDelivery ?? 3,
      ratingLanguage: parsed.ratingLanguage ?? 3,
      overallRating: parsed.overallRating ?? 3,
      openingFeedback: parsed.openingFeedback ?? '',
      bodyFeedback: parsed.bodyFeedback ?? '',
      conclusionFeedback: parsed.conclusionFeedback ?? '',
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] generateAgentEvaluation failed:', err);
    return {
      commendations: '', recommendations: '',
      ratingContent: 0, ratingDelivery: 0, ratingLanguage: 0, overallRating: 0,
      openingFeedback: '', bodyFeedback: '', conclusionFeedback: '',
      usage: ZERO_USAGE,
    };
  }
}

export async function generateAgentGeneralEvaluation(params: {
  meetingTitle: string;
  theme?: string;
  evaluations: { speakerName: string; speechTitle?: string; overallRating?: number }[];
}): Promise<{ overallFeedback: string; evaluatorFeedback: { evaluatorRoleId: string; feedback: string }[]; usage: AgentUsage }> {
  const prompt = `You are the General Evaluator giving the closing meeting-wide evaluation at a Toastmasters club meeting.

Meeting: "${params.meetingTitle}"${params.theme ? ` (theme: ${params.theme})` : ''}

Speakers evaluated this meeting:
${params.evaluations.map((e) => `- ${e.speakerName}${e.speechTitle ? ` — "${e.speechTitle}"` : ''}${e.overallRating ? ` (rated ${e.overallRating}/5)` : ''}`).join('\n') || '(none)'}

Return ONLY valid JSON in this exact shape, no other text:
{ "overallFeedback": "<3-5 sentence overall meeting critique covering pacing, energy, and general club practice>" }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      overallFeedback: parsed.overallFeedback ?? '', evaluatorFeedback: [],
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] generateAgentGeneralEvaluation failed:', err);
    return { overallFeedback: 'General evaluation unavailable.', evaluatorFeedback: [], usage: ZERO_USAGE };
  }
}

export async function generateAgentGrammarianReport(params: {
  wordOfDay?: string;
  transcripts: { speakerName: string; transcript: string }[];
}): Promise<{ correctUses: number; incorrectUses: number; goodGrammarExamples: string; errorsNoted: string; usage: AgentUsage }> {
  const prompt = `You are the Grammarian at a Toastmasters club meeting, tracking Word of the Day usage and grammar across all speeches.

${params.wordOfDay ? `Word of the Day: "${params.wordOfDay}"` : 'No word of the day was set.'}

SPEECHES:
${params.transcripts.map((t) => `--- ${t.speakerName} ---\n${t.transcript.slice(0, 3000)}`).join('\n\n')}

Return ONLY valid JSON in this exact shape, no other text:
{
  "correctUses": <count of correct Word of the Day usages across all speeches>,
  "incorrectUses": <count of grammar errors noticed across all speeches>,
  "goodGrammarExamples": "<1-3 sentences citing specific well-phrased moments, with speaker names>",
  "errorsNoted": "<1-3 sentences citing specific grammar issues, with speaker names>"
}`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      correctUses: parsed.correctUses ?? 0,
      incorrectUses: parsed.incorrectUses ?? 0,
      goodGrammarExamples: parsed.goodGrammarExamples ?? '',
      errorsNoted: parsed.errorsNoted ?? '',
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] generateAgentGrammarianReport failed:', err);
    return { correctUses: 0, incorrectUses: 0, goodGrammarExamples: '', errorsNoted: 'Grammarian report unavailable.', usage: ZERO_USAGE };
  }
}

export async function generateAgentTableTopics(params: { theme?: string; wordOfDay?: string }): Promise<{ topics: string[]; usage: AgentUsage }> {
  const prompt = `You are the Table Topics Master preparing impromptu speaking questions for a Toastmasters club meeting.
${params.theme ? `Meeting theme: ${params.theme}` : ''}
${params.wordOfDay ? `Try to relate at least one question to the Word of the Day: "${params.wordOfDay}"` : ''}

Return ONLY valid JSON in this exact shape, no other text:
{ "topics": ["<question 1>", "<question 2>", "...5-8 short, thought-provoking 1-2 minute impromptu speaking questions"] }`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  } catch (err) {
    console.error('[ai.service] generateAgentTableTopics failed:', err);
    return { topics: [], usage: ZERO_USAGE };
  }
}
