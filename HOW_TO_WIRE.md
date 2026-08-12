# How to wire up the Compliance module

Three files to copy + two small edits. Total time: ~10 minutes.

---

## Step 1 — Install Anthropic SDK (backend)

```bash
cd iNexHire/backend
npm install @anthropic-ai/sdk
```

---

## Step 2 — Add to backend/.env

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## Step 3 — Update ai.service.ts (add import + scanBias)

At the top of `backend/src/services/ai.service.ts`, add:

```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

Then paste the entire contents of `scanBias.ts` (the function + interfaces)
at the bottom of `ai.service.ts`. Remove the comment block at the top of
`scanBias.ts` that says "ADD THIS TO..." — that's just instruction text.

---

## Step 4 — Copy the route file

```bash
cp compliance.routes.ts iNexHire/backend/src/routes/compliance.routes.ts
```

---

## Step 5 — Register the route in app.ts

Open `backend/src/app.ts`. Add these two lines following the existing pattern:

```typescript
// At the top with the other imports:
import complianceRoutes from './routes/compliance.routes';

// In the routes section (after the other app.use lines):
app.use('/api/compliance', complianceRoutes);
```

---

## Step 6 — Fix the BiasAudit Prisma model (add unique constraint)

The `upsert` in the route requires a `@unique` on `openingId`.
Open `backend/prisma/schema.prisma` and update the `BiasAudit` model:

```prisma
model BiasAudit {
  id         String    @id @default(cuid())
  openingId  String    @unique           // ← add @unique here
  flags      Json
  score      Int
  resolvedAt DateTime?
  resolvedBy String?
  createdAt  DateTime  @default(now())

  opening Opening @relation(fields: [openingId], references: [id], onDelete: Cascade)

  @@map("bias_audits")
}
```

Then run the migration:

```bash
npx prisma migrate dev --name add_bias_audit_unique
```

---

## Step 7 — Replace the frontend page

```bash
cp Compliance.tsx iNexHire/frontend/src/pages/recruiter/Compliance.tsx
```

---

## Step 8 — Test it end to end

```bash
# Terminal 1
cd iNexHire/backend && npm run dev

# Terminal 2
cd iNexHire/frontend && npm run dev
```

1. Log in as a recruiter
2. Create a job opening with a real job description
3. Navigate to Compliance in the sidebar
4. Click "Run Scan" — the page now calls Claude, stores results in
   `bias_audits`, and renders real flags instead of hardcoded mock data

---

## What Claude Code should do next (after this works)

Tell it: "Apply the same pattern to OfferLetters.tsx — the OfferLetter
model already exists in schema.prisma. Build the route, add any needed
ai.service.ts functions, and wire the frontend page."
