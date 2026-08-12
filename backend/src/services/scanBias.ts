// ─── ADD THIS TO backend/src/services/ai.service.ts ──────────────────────────
//
// Step 1: Add Anthropic SDK to the imports at the top of ai.service.ts:
//
//   import Anthropic from '@anthropic-ai/sdk';
//   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//
// Step 2: Run:  npm install @anthropic-ai/sdk
//
// Step 3: Paste the function below into ai.service.ts
// ─────────────────────────────────────────────────────────────────────────────

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
