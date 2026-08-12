# NexHire — Project Memory

## What this is
AI-powered interview SaaS. Core loop: recruiter creates job → AI generates
questions → candidate does AI interview (STT) → BullMQ job scores answers via
OpenAI → report generated → recruiter decides.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **DB**: PostgreSQL + Redis
- **AI**: OpenAI (`ai.service.ts`) — model configurable via `env.openaiModel`
- **Jobs**: BullMQ (`evaluation.job.ts`)
- **Email**: Nodemailer / SendGrid
- **Validation**: Zod (`middleware/validate.ts`)
- **Auth**: JWT + refresh tokens (`utils/jwt.ts`, `middleware/auth.ts`)

## Repo layout
```
backend/
  prisma/schema.prisma        # 15 models — see "Data model" below
  src/routes/                 # auth, opening, candidate, interview,
                               #   report, dashboard, upload, adaptive
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
`TalentPoolEntry`, `BiasAudit`, `AuditLog`, `Integration`.

## ⚠️ Critical context: docs vs. reality
There are three READMEs. **Don't trust the enterprise ones as a description
of current state:**

- `README.md` — accurate. Describes the real MVP core loop above.
- `README-ENTERPRISE.md` / `README-ENTERPRISE-V3.md` — **aspirational specs**,
  not implemented. They list ~45 modules, new API routes, and new Prisma
  models (`SentimentReport`, `CultureFitScore`, `RetentionPrediction`,
  `VideoHighlight`, `PanelVote`, `Scorecard`, `ChatbotConversation`,
  `BrandingConfig`, `NotificationRule`) that **do not exist yet** in
  `schema.prisma`.

**The frontend is ahead of the backend.** These pages exist and render, but
are currently **UI-only with hardcoded mock data arrays and zero API calls**
(verified: no `api.ts`/`fetch`/`axios` usage in them as of this writing):
- `SentimentAnalysis.tsx`
- `CultureFit.tsx`
- `PredictiveRetention.tsx`
- `CandidateChatbot.tsx`
- `VideoHighlights.tsx`
- `CollaborativeReview.tsx`
- `ScorecardBuilder.tsx`
- `MockMate.tsx`
- `CandidateRanking.tsx`
- `MultiLanguage.tsx`, `WhiteLabel.tsx`, `Integrations.tsx`,
  `TeamRoles.tsx`, `SSOSettings.tsx`, `AuditLogs.tsx`, `OfferLetters.tsx`,
  `TalentPool.tsx`, `PipelineBoard.tsx`, `Compliance.tsx` — check each
  individually before assuming they're wired up; some (e.g. `Compliance.tsx`
  against `BiasAudit`, `OfferLetters.tsx` against `OfferLetter`,
  `AuditLogs.tsx` against `AuditLog`) have a real backing model already and
  are the cheapest to wire up first.

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
  in real values (`OPENAI_API_KEY`, `JWT_SECRET`, DB/Redis URLs) before
  running anything.

## Known gaps / good first tasks
1. Wire `Compliance.tsx` → real `BiasAudit` model + a `/api/compliance/*`
   route + a `scanBias()` addition to `ai.service.ts`. Model already exists,
   frontend already exists — just the middle layer is missing.
2. Same pattern for `OfferLetters.tsx` (`OfferLetter` model exists) and
   `AuditLogs.tsx` (`AuditLog` model exists).
3. Everything else in README-ENTERPRISE-V3.md needs schema + service + route
   + frontend wiring all four, in that order — treat it as new work, not a
   "connect the dots" task.

## Don't
- Don't treat README-ENTERPRISE-V3.md's route list or Prisma snippets as
  already-applied migrations — they're a proposal, copy-pasted for planning,
  not synced with `schema.prisma`.
- Don't add new OpenAI/Claude calls without following the existing
  parse-defensively-with-fallback pattern used throughout `ai.service.ts`.
