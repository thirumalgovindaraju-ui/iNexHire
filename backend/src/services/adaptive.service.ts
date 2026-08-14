// backend/src/services/adaptive.service.ts
// Adaptive follow-up question engine
// Called after each candidate response to decide: continue or ask a follow-up

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = 'claude-sonnet-4-6';

export interface AdaptiveDecision {
  action: 'follow_up' | 'next_question' | 'complete';
  followUpQuestion?: string;
  reason: string;
}

export async function getAdaptiveDecision(params: {
  jobTitle: string;
  question: string;
  answer: string;
  score: number;
  questionNumber: number;
  totalQuestions: number;
  previousFollowUps: number; // how many follow-ups already asked for this question
}): Promise<AdaptiveDecision> {

  // Don't follow up more than once per question, or if near the end
  if (params.previousFollowUps >= 1 || params.questionNumber >= params.totalQuestions) {
    return { action: 'next_question', reason: 'Max follow-ups reached or interview ending' };
  }

  // Only follow up on borderline answers (40–70 score)
  if (params.score < 40 || params.score > 75) {
    return {
      action: params.score < 40 ? 'next_question' : 'next_question',
      reason: params.score < 40 ? 'Score too low — not worth probing further' : 'Strong answer — move on',
    };
  }

  const prompt = `You are conducting a job interview for: ${params.jobTitle}

Original question: "${params.question}"
Candidate's answer: "${params.answer}"
Answer score: ${params.score}/100

The answer was partially good but missing something. Decide if a follow-up question would get useful additional signal.

Return ONLY JSON:
{
  "action": "follow_up" | "next_question",
  "followUpQuestion": "<specific follow-up if action is follow_up, else null>",
  "reason": "<1 sentence why>"
}

Guidelines:
- Only follow up if the answer was vague and a specific probe would reveal real depth
- Make the follow-up short and specific (max 15 words)
- Don't follow up if the candidate clearly doesn't know`;

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[adaptive.service] getAdaptiveDecision failed:', err);
    return { action: 'next_question', reason: 'Adaptive engine error — skipping follow-up' };
  }
}
