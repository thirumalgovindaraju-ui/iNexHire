// ─── ADD ALL THESE FUNCTIONS TO backend/src/services/ai.service.ts ───────────
// These use the existing `anthropic` client already added in the compliance work.
// All follow the same defensive parse + typed fallback pattern.

const CLAUDE = 'claude-sonnet-4-6';

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

export async function analyseSentiment(
  transcripts: string[],
): Promise<SentimentResult> {
  const fullText = transcripts
    .map((t, i) => `[Response ${i + 1}]: ${t}`)
    .join('\n\n');

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
      model: CLAUDE, max_tokens: 1500, temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as SentimentResult;
    return {
      confidence: parsed.confidence ?? 50, engagement: parsed.engagement ?? 50,
      clarity: parsed.clarity ?? 50, stress: parsed.stress ?? 50,
      deceptionScore: parsed.deceptionScore ?? 0,
      overallSentiment: parsed.overallSentiment ?? 'NEUTRAL',
      emotionTimeline: parsed.emotionTimeline ?? [],
      summary: parsed.summary ?? 'Sentiment analysis unavailable.',
    };
  } catch {
    return { confidence: 50, engagement: 50, clarity: 50, stress: 50,
      deceptionScore: 0, overallSentiment: 'NEUTRAL', emotionTimeline: [], summary: 'Analysis unavailable.' };
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
      model: CLAUDE, max_tokens: 1500, temperature: 0,
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
  } catch {
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
      model: CLAUDE, max_tokens: 1200, temperature: 0,
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
  } catch {
    return { retentionScore: 50, flightRisk: 'MEDIUM', riskFactors: [],
      positiveFactors: [], predictedTenure: 'Unknown', summary: 'Unavailable.' };
  }
}

// ─── Offer Letter Generation ───────────────────────────────────────────────────

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
      model: CLAUDE, max_tokens: 1500, temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    return text.replace(/```html|```/g, '').trim();
  } catch {
    return `<p>Dear ${params.candidateName},</p><p>We are pleased to offer you the position of ${params.jobTitle} at ${params.companyName}.</p><p>Please contact HR for full details.</p>`;
  }
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
      model: CLAUDE, max_tokens: 400, temperature: 0.7,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    return res.content[0].type === 'text'
      ? res.content[0].text
      : 'Thank you for your message. A member of our team will be in touch shortly.';
  } catch {
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
  candidates: Array<{
    id: string;
    name: string;
    overallScore: number;
    skills: string[];
    summary: string;
  }>,
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
      model: CLAUDE, max_tokens: 1500, temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '[]';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as RankedCandidate[];
    // Map index back to real candidateId
    return parsed.map(r => ({
      ...r,
      candidateId: candidates[parseInt(r.candidateId)]?.id ?? r.candidateId,
    }));
  } catch {
    return candidates.map((c, i) => ({
      candidateId: c.id, rank: i + 1,
      overallScore: c.overallScore, strengths: [], gaps: [],
      recommendation: 'Manual review required.',
    }));
  }
}
