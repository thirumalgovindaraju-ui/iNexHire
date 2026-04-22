# NexHire — AI-Powered Interview SaaS

> Recruiter creates job → Candidate does AI interview → Report generated → Recruiter decides

## Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in OPENAI_API_KEY + JWT_SECRET
docker-compose up -d   # postgres + redis
npx prisma migrate dev --name init
npm run dev            # http://localhost:4000

# Frontend
cd frontend && npm install
npm run dev            # http://localhost:5173
```

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + Zustand |
| Backend | Node.js + Express + TypeScript + Prisma ORM |
| Database | PostgreSQL + Redis |
| AI | OpenAI GPT-4o-mini (swap to GPT-4o before go-live) |
| Jobs | BullMQ |
| Email | SendGrid |
| Storage | AWS S3 (optional for v1) |

## 30-Day Launch Plan
- **Week 1** — Backend running + AI pipeline working
- **Week 2** — Frontend wired to real backend  
- **Week 3** — Deploy + first real users
- **Week 4** — Sell + stabilize

## Core Loop
```
Recruiter creates job → AI generates questions
→ Candidate gets invite link → Does AI interview (STT)
→ BullMQ job → OpenAI scores answers → Report generated
→ Recruiter views report → Makes hiring decision
```
