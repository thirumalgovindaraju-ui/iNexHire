# Claude Code Session — Complete Enterprise Implementation

Paste this entire prompt into Claude Code from the iNexHire repo root.

---

## Task

Implement the complete NexHire enterprise backend in one session.
All source files are already in the repo under their correct paths.
Follow the existing patterns in compliance.routes.ts and ai.service.ts exactly.

## Step 1 — Schema

Add all models from `enterprise/schema-additions.prisma` to the END of
`backend/prisma/schema.prisma`. Then also add these back-relations to
existing models:

In `model Interview`, add:
- `sentimentReport  SentimentReport?`
- `cultureFitScore  CultureFitScore?`
- `retentionPrediction RetentionPrediction?`
- `scorecardEvaluations ScorecardEvaluation[]`
- `panelVotes       PanelVote[]`

In `model Opening`, add:
- `scorecards       Scorecard[]`
- `chatSessions     ChatSession[]`

In `model Candidate`, add:
- `chatSessions     ChatSession[]`

In `model Organization`, add:
- `notifications    Notification[]`
- `brandingConfig   BrandingConfig?`

In `model User`, add:
- `scorecards       Scorecard[]`
- `scorecardEvaluations ScorecardEvaluation[]`
- `panelVotes       PanelVote[]`
- `notifications    Notification[]`

Then run:
```
cd backend && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npx prisma migrate dev --name enterprise_models
```

## Step 2 — AI Service Functions

Append ALL functions from `enterprise/ai-enterprise.service.ts` to the
END of `backend/src/services/ai.service.ts`.
Remove the comment block at the top of that file (instructions only).

## Step 3 — Create Route Files

Create these files in `backend/src/routes/` by splitting
`enterprise/enterprise.routes.ts` into separate files:

- `sentiment.routes.ts` — copy the sentimentRouter section
- `culturefit.routes.ts` — copy the cultureFitRouter section
- `retention.routes.ts` — copy the retentionRouter section
- `offer.routes.ts` — copy the offerRouter section
- `auditlog.routes.ts` — copy the auditLogRouter section
- `chatbot.routes.ts` — copy the chatbotRouter section
- `ranking.routes.ts` — copy the rankingRouter section
- `notifications.routes.ts` — copy the notificationsRouter section
- `branding.routes.ts` — copy the brandingRouter section
- `talentpool.routes.ts` — copy the talentPoolRouter section
- `analytics.routes.ts` — copy the analyticsRouter section

Note: Each file already has its own imports. Remove duplicate import
statements (Router, prisma, authenticate, AppError) since they will
be at the top of each individual file.

## Step 4 — Replace app.ts

Replace `backend/src/app.ts` with the contents of `enterprise/app.ts`.

## Step 5 — Wire Frontend Pages

For each frontend page below, replace the mock/empty data with real
apiClient calls following the pattern in Compliance.tsx:

- `SentimentAnalysis.tsx` → GET `/api/sentiment/:interviewId`
- `CultureFit.tsx` → GET `/api/culture-fit/:interviewId`
- `PredictiveRetention.tsx` → GET `/api/retention/:interviewId`
- `OfferLetters.tsx` → GET `/api/offers`, POST `/api/offers`
- `AuditLogs.tsx` → GET `/api/audit-logs`
- `CandidateRanking.tsx` → POST `/api/ranking/:openingId`
- `TalentPool.tsx` → GET `/api/talent-pool`
- `Analytics.tsx` → GET `/api/analytics`
- `Notifications.tsx` → GET `/api/notifications`
- `CandidateChatbot.tsx` → POST `/api/chatbot/message`

## Step 6 — Commit

```
git add .
git commit -m "feat: complete enterprise backend - 11 new routes, 6 Claude AI functions, all frontend pages wired"
git push
```

## Important Rules

- Follow the exact defensive JSON parse + typed fallback pattern from ai.service.ts
- All new Claude calls use `claude-sonnet-4-6` and `temperature: 0`
- All routes use the existing `authenticate` middleware except chatbot (candidate-facing)
- Do NOT modify existing working routes (auth, opening, candidate, interview, report, dashboard)
- Confirm schema migration success before creating route files
