# NexHire Enterprise Edition — Upgrade Guide

## What's New in Enterprise Edition

### 6 New Frontend Modules

| Module | Route | Description |
|--------|-------|-------------|
| Compliance & Bias Detection | `/compliance` | AI-powered JD scanner flagging gender, age & racial bias |
| Offer Letter Automation | `/offers` | Auto-generate, send & e-sign offer letters |
| Talent Pool | `/talent-pool` | Re-engage past candidates for new matching openings |
| ATS/HRIS Integrations | `/integrations` | Greenhouse, Workday, BambooHR, LinkedIn & 12+ |
| Pipeline Board | `/pipeline` | Kanban view of all candidates across stages |
| Audit Logs | `/audit` | Immutable GDPR/EEOC-compliant activity trail |

### Enhanced Dashboard
- Live **AI Hiring Intelligence** summary bar
- 5-metric KPI row (Active Openings, Candidates, Interviews, Avg Score, Time-to-Hire)
- Hiring funnel with percentage conversion rates
- Quick Actions panel for urgent items
- Bottom stats row (Strong Hire rate, avg duration, flag rate, pool size)

### Enhanced DashboardLayout
- Enterprise sidebar with ENTERPRISE badge
- ⌘K quick search shortcut UI
- Live alert banner for bias/compliance issues
- Notification bell with badge count
- Structured Primary + Enterprise nav sections

### New Database Models (Prisma)
- `OfferLetter` — full offer lifecycle with e-signature support
- `TalentPoolEntry` — candidate re-engagement pool
- `BiasAudit` — per-JD compliance scan results
- `AuditLog` — immutable system-wide event trail
- `Integration` — third-party service connections

## Backend Routes to Implement

```
POST   /api/compliance/scan/:openingId     — Trigger AI bias scan
GET    /api/compliance/:openingId          — Get scan results
PATCH  /api/compliance/:openingId/resolve  — Apply suggestions

GET    /api/offers                         — List offer letters
POST   /api/offers                         — Generate new offer
PATCH  /api/offers/:id                     — Update / send offer
POST   /api/offers/:id/sign                — Mark as signed

GET    /api/talent-pool                    — List pool entries
POST   /api/talent-pool/:candidateId       — Add to pool
POST   /api/talent-pool/:id/reengage       — Send re-engagement email

GET    /api/pipeline                       — Kanban board data
GET    /api/audit                          — Paginated audit logs

GET    /api/integrations                   — List integrations
POST   /api/integrations/connect           — Connect provider
POST   /api/integrations/:id/sync          — Manual sync
```

## AI Enhancements

### Bias Detection Prompt (add to ai.service.ts)
```typescript
async scanJobDescriptionBias(jdText: string) {
  const prompt = `Analyze this job description for biased language that may deter candidates from underrepresented groups.
  Return JSON array: [{type, word, suggestion, severity: 'high'|'medium'|'low'}]
  Focus on: gender-coded words, age bias, exclusionary culture language, unnecessary credential inflation.
  JD: ${jdText}`;
  // call Claude claude-sonnet-4-20250514
}
```

### Talent Matching Prompt
```typescript
async matchCandidateToOpening(candidateProfile: any, opening: any) {
  // Returns match percentage 0-100 + reasoning
}
```

### Offer Letter Generation Prompt
```typescript
async generateOfferLetter(candidate: any, opening: any, compensation: any) {
  // Returns formatted offer letter HTML/PDF ready
}
```

## Environment Variables (add to .env)
```
ESIGN_PROVIDER_KEY=         # HelloSign / DocuSign API key
GREENHOUSE_API_KEY=
WORKDAY_CLIENT_ID=
WORKDAY_CLIENT_SECRET=
SLACK_WEBHOOK_URL=
LINKEDIN_CLIENT_ID=
```
