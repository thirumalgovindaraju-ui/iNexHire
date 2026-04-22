# NexHire v3 — Complete Enterprise Platform
## The Most Comprehensive AI Hiring Platform — Beyond Zinterview.ai

---

## 📦 Total Feature Count: 45+ Modules

---

## 🗂 Page & Route Index

| Route | Page | Status |
|-------|------|--------|
| `/dashboard` | Executive Overview Dashboard | ✅ Enhanced |
| `/openings` | Job Openings | ✅ Core |
| `/openings/new` | Create Opening (AI JD gen) | ✅ Core |
| `/openings/:id` | Opening Detail | ✅ Core |
| `/candidates` | Candidate List | ✅ Core |
| `/candidates/:id` | Candidate Profile | ✅ Core |
| `/reports/:id` | AI Evaluation Report | ✅ Core |
| `/analytics` | Enterprise Analytics | ✅ Enhanced v3 |
| `/pipeline` | Kanban Pipeline Board | ✅ v2 |
| `/rankings` | Candidate Ranking Engine | ✅ v3 NEW |
| `/sentiment` | Sentiment & Emotion AI | ✅ v3 NEW |
| `/culture-fit` | Culture Fit Scoring | ✅ v3 NEW |
| `/retention` | Predictive Retention AI | ✅ v3 NEW |
| `/video-highlights` | AI Video Highlights Reel | ✅ v3 NEW |
| `/panel-review` | Collaborative Panel Review | ✅ v3 NEW |
| `/scorecards` | Custom Scorecard Builder | ✅ v3 NEW |
| `/mockmate` | MockMate Candidate Prep | ✅ v3 NEW |
| `/chatbot` | AI Candidate Chatbot (24/7) | ✅ v3 NEW |
| `/compliance` | Bias Detection & Compliance | ✅ v2 |
| `/offers` | Offer Letter Automation | ✅ v2 |
| `/talent-pool` | Talent Pool & Re-engagement | ✅ v2 |
| `/languages` | 15+ Language Management | ✅ v3 NEW |
| `/integrations` | ATS/HRIS Integrations | ✅ v2 |
| `/branding` | White-label & Branding | ✅ v3 NEW |
| `/settings/team` | Team & RBAC | ✅ v3 NEW |
| `/settings/sso` | SSO & Security (Okta/Azure) | ✅ v3 NEW |
| `/notifications` | Smart Notifications | ✅ v3 NEW |
| `/audit` | Immutable Audit Logs | ✅ v2 |

---

## 🚀 Backend API Routes to Implement

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/sso/okta
POST /api/auth/sso/azure
POST /api/auth/sso/google
```

### Openings
```
GET    /api/openings
POST   /api/openings
GET    /api/openings/:id
PATCH  /api/openings/:id
DELETE /api/openings/:id
POST   /api/openings/:id/generate-questions   — AI JD → questions
```

### Candidates & Interviews
```
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/:id
POST   /api/candidates/:id/invite
GET    /api/interviews/:token
POST   /api/interviews/:token/start
POST   /api/interviews/:token/responses
POST   /api/interviews/:token/complete
GET    /api/reports/:interviewId
PATCH  /api/reports/:interviewId/decision
```

### AI Intelligence (NEW v3)
```
GET    /api/sentiment/:interviewId           — Emotion & confidence analysis
GET    /api/culture-fit/:candidateId         — Culture dimension scores
GET    /api/rankings?openingId=X             — Ranked candidate list
PATCH  /api/rankings/weights                 — Update scoring weights
GET    /api/retention/:candidateId           — 90-day retention prediction
GET    /api/video-highlights/:interviewId    — AI-clipped video moments
POST   /api/scorecards                       — Create custom scorecard
GET    /api/scorecards
PATCH  /api/scorecards/:id
```

### Panel Review
```
GET    /api/panel-review/:interviewId
POST   /api/panel-review/:interviewId/vote
POST   /api/panel-review/:interviewId/comment
POST   /api/panel-review/:interviewId/invite
```

### Chatbot
```
POST   /api/chatbot/message                  — Process candidate message
GET    /api/chatbot/config                   — Get bot configuration
PATCH  /api/chatbot/config                   — Update bot settings
GET    /api/chatbot/conversations            — Conversation history
```

### Enterprise Features
```
POST   /api/compliance/scan/:openingId       — Trigger bias scan
GET    /api/compliance/:openingId
PATCH  /api/compliance/:openingId/resolve
GET    /api/offers
POST   /api/offers
PATCH  /api/offers/:id
POST   /api/offers/:id/send
POST   /api/offers/:id/sign
GET    /api/talent-pool
POST   /api/talent-pool/:candidateId
POST   /api/talent-pool/:id/reengage
GET    /api/pipeline                         — Kanban board data
GET    /api/audit?page=1&limit=50
GET    /api/integrations
POST   /api/integrations/connect
POST   /api/integrations/:id/sync
DELETE /api/integrations/:id
```

### Settings
```
GET    /api/settings/team
POST   /api/settings/team/invite
PATCH  /api/settings/team/:userId
DELETE /api/settings/team/:userId
GET    /api/settings/sso
POST   /api/settings/sso/connect
PATCH  /api/settings/security
GET    /api/settings/notifications
PATCH  /api/settings/notifications
GET    /api/settings/branding
PATCH  /api/settings/branding
```

### Analytics
```
GET    /api/analytics/dashboard
GET    /api/analytics/funnel
GET    /api/analytics/trends?period=30d
GET    /api/analytics/departments
GET    /api/analytics/export?format=pdf
```

---

## 🤖 New AI Service Methods (ai.service.ts)

```typescript
// Sentiment & Emotion Analysis
async analyzeInterview(interviewId: string) {
  // Analyze audio/transcript for: confidence, engagement, clarity, stress
  // Return: emotion timeline, deception index, per-question scores
}

// Culture Fit
async scoreCultureFit(responses: string[], dimensions: CultureDimension[]) {
  // Score each response against dimension behavioral indicators
  // Return: per-dimension scores, overall culture fit %
}

// Candidate Ranking  
async computeCompositeScore(interview: Interview, weights: ScoreWeights) {
  // Weighted average of: AI score, culture fit, technical, communication, resume fit
}

// Predictive Retention
async predictRetention(candidateProfile: any, jobProfile: any) {
  // Predict 90-day retention probability
  // Return: score, risk factors, skill gaps, learning path recommendations
}

// Video Highlights
async extractHighlights(videoUrl: string, transcript: string) {
  // Identify top moments by: score spike, keyword density, sentiment peak
  // Return: timestamped clips with labels and scores
}

// AI Chatbot
async chatbotReply(message: string, context: ChatContext) {
  // Generate contextual reply for candidate FAQ
  // Use Claude claude-sonnet-4-20250514 with structured system prompt
}

// Bias Detection (enhanced)
async scanBias(text: string, scanType: 'jd' | 'questions') {
  // Detect: gendered language, age bias, credential inflation, exclusionary culture language
  // Return: flagged phrases with suggestions and severity
}

// Offer Letter Generation
async generateOfferLetter(candidate: any, opening: any, compensation: any) {
  // Return: formatted HTML offer letter ready for PDF export
}

// Resume Fitment
async scoreResumeFitment(resumeText: string, jdText: string) {
  // Return: match % + matched/missing skills breakdown
}

// Multilingual STT
async transcribeMultilingual(audioBuffer: Buffer, language: string) {
  // STT via Whisper API with language hint
  // Support: en, hi, ta, te, ar, es, fr, de, pt, zh, ja, ko, id, ms, bn
}
```

---

## 🔐 New Prisma Schema Models (schema.prisma additions)

```prisma
model SentimentReport {
  id          String @id @default(cuid())
  interviewId String @unique
  confidence  Int    // 0-100
  engagement  Int
  clarity     Int
  stressIndex Int
  deceptionScore Int
  emotions    Json   // {happy, neutral, focused, anxious}
  timeline    Json   // [{question, score, emotions}]
  createdAt   DateTime @default(now())
  interview   Interview @relation(fields:[interviewId], references:[id])
  @@map("sentiment_reports")
}

model CultureFitScore {
  id          String @id @default(cuid())
  candidateId String
  openingId   String
  overall     Int
  dimensions  Json   // {innovation: 88, collab: 92, ...}
  createdAt   DateTime @default(now())
  @@map("culture_fit_scores")
}

model RetentionPrediction {
  id              String  @id @default(cuid())
  candidateId     String  @unique
  score           Int     // 0-100
  riskLevel       String  // low | medium | high
  predictedTenure String  // "8-12 months"
  factors         Json    // [{label, score, positive}]
  skillGaps       String[]
  learningPath    String[]
  createdAt       DateTime @default(now())
  @@map("retention_predictions")
}

model VideoHighlight {
  id          String @id @default(cuid())
  interviewId String
  timestamp   String // "02:14"
  label       String
  clipScore   Int
  type        String // technical | behavioral | culture
  clipUrl     String?
  @@map("video_highlights")
}

model PanelVote {
  id          String @id @default(cuid())
  interviewId String
  userId      String
  vote        String // hire | neutral | reject
  comment     String? @db.Text
  createdAt   DateTime @default(now())
  @@map("panel_votes")
}

model Scorecard {
  id             String @id @default(cuid())
  organizationId String
  name           String // e.g. "Software Engineer L4"
  criteria       Json   // [{name, weight, type, threshold, description}]
  createdAt      DateTime @default(now())
  @@map("scorecards")
}

model ChatbotConversation {
  id          String @id @default(cuid())
  candidateId String
  messages    Json   // [{role, text, time}]
  resolved    Boolean @default(false)
  escalated   Boolean @default(false)
  createdAt   DateTime @default(now())
  @@map("chatbot_conversations")
}

model BrandingConfig {
  id             String @id @default(cuid())
  organizationId String @unique
  companyName    String
  domain         String?
  logoUrl        String?
  primaryColor   String @default("#4f46e5")
  accentColor    String @default("#10b981")
  fontFamily     String @default("Inter")
  welcomeMessage String?
  @@map("branding_configs")
}

model NotificationRule {
  id             String  @id @default(cuid())
  organizationId String
  event          String
  channel        String  // email | slack | sms
  enabled        Boolean @default(true)
  threshold      Int?
  @@map("notification_rules")
}
```

---

## 🌍 Competitive Positioning

| Feature | NexHire v3 | Zinterview.ai | HireVue |
|---------|-----------|--------------|---------|
| AI Avatar Interview | ✅ | ✅ | ❌ |
| 15+ Languages | ✅ | ✅ | ❌ |
| Code Editor | ✅ | ✅ | ✅ |
| ID Verification | ✅ | ✅ | ✅ |
| Sentiment/Emotion AI | ✅ | ❌ | ✅ |
| Culture Fit Scoring | ✅ | ❌ | ❌ |
| Predictive Retention | ✅ | ❌ | ❌ |
| Video Highlights | ✅ | ❌ | ❌ |
| AI Chatbot (24/7) | ✅ | ❌ | ❌ |
| Candidate Ranking | ✅ | ❌ | ❌ |
| Panel Collaboration | ✅ | ❌ | ✅ |
| Bias Detection | ✅ | ❌ | ❌ |
| Offer Automation | ✅ | ❌ | ❌ |
| White-label | ✅ | ❌ | ❌ |
| MockMate Prep | ✅ | ✅ | ❌ |
| SSO (Okta/Azure) | ✅ | ❌ | ✅ |
| RBAC | ✅ | ❌ | ✅ |
| ATS/HRIS Integrations | ✅ (20+) | ❌ | ✅ |
| Audit Logs (SOC2) | ✅ | ❌ | ✅ |
| Pricing (starting) | ₹X/seat | ₹XX/seat | $35k+/yr |

---

## 💰 Suggested Pricing Tiers

| Tier | Target | Price | Included |
|------|--------|-------|---------|
| **Starter** | SMBs, startups | ₹4,999/mo | 5 openings, 100 interviews/mo, core AI |
| **Growth** | Mid-market | ₹14,999/mo | Unlimited openings, 500 interviews, all AI modules |
| **Enterprise** | Large orgs | ₹39,999/mo | Unlimited everything, white-label, SSO, dedicated CSM |
| **Agency** | Staffing firms | Custom | Multi-tenant, client workspaces, volume discounts |

---

## 🔧 Environment Variables

```env
# Core
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=

# AI
ANTHROPIC_API_KEY=           # Claude claude-sonnet-4-20250514 for all AI features
OPENAI_API_KEY=              # Whisper for multilingual STT

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# E-Signature (Offer Letters)
HELLOSIGN_API_KEY=

# SSO
OKTA_DOMAIN=
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=

# Notifications
SLACK_WEBHOOK_URL=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=         # For SMS notifications
TWILIO_AUTH_TOKEN=

# Integrations
GREENHOUSE_API_KEY=
WORKDAY_CLIENT_ID=
WORKDAY_CLIENT_SECRET=
BAMBOOHR_API_KEY=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```
