# NexHire — Project Memory

## What this is
AI-powered interview SaaS. Core loop: recruiter creates job → AI generates
questions → candidate does AI interview (STT) → BullMQ job scores answers via
Claude → report generated → recruiter decides.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **DB**: PostgreSQL (Neon in production) + Redis (optional — see note below)
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) for every text-generation
  function in `ai.service.ts` and `adaptive.service.ts`. OpenAI is only kept
  around (and is optional at boot — warns, doesn't throw, if unset) for a
  future Whisper STT integration that doesn't exist yet.
- **Jobs**: BullMQ (`evaluation.job.ts`) — skipped entirely if Redis isn't
  reachable at boot; AI evaluation just doesn't run in that case, it doesn't
  crash the server.
- **Email**: Nodemailer / SendGrid
- **Validation**: Zod (`middleware/validate.ts`)
- **Auth**: JWT + refresh tokens (`utils/jwt.ts`, `middleware/auth.ts`)

## Repo layout
```
backend/
  prisma/schema.prisma        # 20 models — see "Data model" below
  src/routes/                 # auth, opening, candidate, interview, report,
                               #   dashboard, upload, adaptive, compliance,
                               #   offer, sentiment, culturefit, retention,
                               #   chatbot, ranking, talentpool, analytics,
                               #   notifications, auditlog
  src/services/                # ai.service.ts, adaptive.service.ts,
                               #   email.service.ts, storage.service.ts
  src/jobs/evaluation.job.ts  # BullMQ worker — scores responses async
  src/middleware/              # auth, errorHandler, validate
frontend/
  src/pages/recruiter/         # dashboard + all module pages (see below)
  src/pages/interview/         # candidate-facing interview flow
  src/pages/auth/, settings/
  src/services/api.ts          # the ONE place real API calls should live
  src/store/                   # Zustand: authStore, interviewStore
```

## Data model (real, in schema.prisma)
`Organization`, `User`, `RefreshToken`, `Opening`, `Question`, `Candidate`,
`Interview`, `Response`, `Report`, `ProctorLog`, `OfferLetter`,
`TalentPoolEntry`, `BiasAudit`, `AuditLog`, `Integration`, `SentimentReport`,
`CultureFitScore`, `RetentionPrediction`, `ChatSession`, `Notification`.

## ⚠️ Critical context: docs vs. reality
There are three READMEs. **Don't trust the enterprise ones as a description
of current state:**

- `README.md` — accurate. Describes the real MVP core loop above.
- `README-ENTERPRISE.md` / `README-ENTERPRISE-V3.md` — **aspirational specs**,
  only partially implemented (see wiring status below). Don't assume every
  route/model/module they list has been built just because *some* have.

**Frontend wiring status (updated 2026-08-14):**

*Production-tested — real backend, exercised end-to-end:*
- `Compliance.tsx` → `BiasAudit` model, `/api/compliance/*`, `scanBias()`.
- `OfferLetters.tsx` → `OfferLetter` model, `/api/offers/*`, `generateOfferLetter()`.

*Newly wired (2026-08-14) — real backend, but only typechecked/built, not
manually tested end-to-end. **Review org-ownership checks in each route
before relying on these in production** — they were adapted quickly from
an unapplied draft (`enterprise/enterprise.routes.ts`) and deserve a second
look, particularly the `findOwnedInterview`-style checks in
`sentiment.routes.ts` / `culturefit.routes.ts` / `retention.routes.ts` and
the notifications mark-read scoping:*
- `SentimentAnalysis.tsx` → `SentimentReport` model, `/api/sentiment/*`, `analyseSentiment()`.
- `CultureFit.tsx` → `CultureFitScore` model, `/api/culture-fit/*`, `scoreCultureFit()`.
- `PredictiveRetention.tsx` → `RetentionPrediction` model, `/api/retention/*`, `predictRetention()`.
- `CandidateChatbot.tsx` → `ChatSession` model, `/api/chatbot/message`, `chatbotReply()`.
- `CandidateRanking.tsx` → real `GET /api/reports` list endpoint (added alongside this work), sorted by score. Does not call the also-new `/api/ranking/:openingId` AI-rerank route — that route exists but nothing in the frontend calls it yet.
- `TalentPool.tsx` → `TalentPoolEntry` model (pre-existing), `/api/talent-pool`.
- `Analytics.tsx` → KPI row + recommendation pie chart use real `/api/dashboard` data. The funnel, weekly trend, department table, and cost-savings block are still hardcoded sample data (explicitly labeled "SAMPLE DATA" in the UI) — no backend aggregation exists for those yet.
- `AuditLogs.tsx` → `AuditLog` model (pre-existing), `/api/audit-logs`.

*Still UI-only mock, zero API calls, not touched by the 2026-08-14 pass:*
- `VideoHighlights.tsx`, `CollaborativeReview.tsx`, `ScorecardBuilder.tsx`,
  `MockMate.tsx`, `MultiLanguage.tsx`, `WhiteLabel.tsx`, `Integrations.tsx`,
  `TeamRoles.tsx`, `SSOSettings.tsx`, `PipelineBoard.tsx`. These would need
  new Prisma models (e.g. `VideoHighlight`, `Scorecard`, `PanelVote`,
  `BrandingConfig`) that don't exist in `schema.prisma` — treat as new work.

**When asked to "build feature X from the v3 README," always confirm first**
whether the backend piece exists. Don't assume the enterprise README
describes shipped functionality.

## Working conventions
- One module at a time: Prisma migration → service function → route →
  wire the corresponding frontend page's mock array to a real `api.ts` call.
  Don't attempt multiple v3 modules in a single pass.
- Follow the existing `ai.service.ts` pattern for new AI functions: strip
  markdown code fences from model output, `JSON.parse` defensively, always
  return a typed fallback object on parse failure — never throw raw.
- New Prisma models should mirror the naming/style already in
  `schema.prisma` (cuid ids, `@@map` snake_case table names, `createdAt`
  defaults).
- Run `npx prisma migrate dev --name <name>` after schema changes, not
  manual SQL.
- Backend dev server: `npm run dev` (localhost:4000). Frontend: `npm run dev`
  (localhost:5173, Vite).
- `.env.example` in both `backend/` and `frontend/` — copy to `.env` and fill
  in real values (`ANTHROPIC_API_KEY`, `JWT_SECRET`, DB/Redis URLs) before
  running anything. `OPENAI_API_KEY` is optional (Whisper STT only, not
  built yet) — the app won't fail to boot without it.

## Known gaps / good first tasks
1. Manually test the 8 newly-wired enterprise pages end-to-end (see wiring
   status above) and specifically re-check org-ownership scoping on the new
   routes before treating them as production-ready.
2. Wire the AI-rerank route `/api/ranking/:openingId` into `CandidateRanking.tsx`
   (or drop the route if the plain score-sort is judged sufficient — right
   now the route exists but nothing calls it).
3. Everything still in the "UI-only mock" list above needs schema + service +
   route + frontend wiring all four, in that order — treat it as new work,
   not a "connect the dots" task.

## Don't
- Don't treat README-ENTERPRISE-V3.md's route list or Prisma snippets as
  already-applied migrations — they're a proposal, copy-pasted for planning,
  not synced with `schema.prisma`.
- Don't add new OpenAI/Claude calls without following the existing
  parse-defensively-with-fallback pattern used throughout `ai.service.ts`.
