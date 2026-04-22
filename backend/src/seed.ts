// src/seed.ts
// Run: npx tsx src/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create org + recruiter
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-demo' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme-demo' },
  });

  const passwordHash = await bcrypt.hash('password123', 12);
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@acme.com' },
    update: {},
    create: {
      name: 'Demo Recruiter',
      email: 'recruiter@acme.com',
      passwordHash,
      organizationId: org.id,
    },
  });

  // Create an opening
  const opening = await prisma.opening.upsert({
    where: { id: 'seed-opening-001' },
    update: {},
    create: {
      id: 'seed-opening-001',
      title: 'Senior React Developer',
      department: 'Engineering',
      location: 'Remote',
      jobDescription: `We are looking for a Senior React Developer to join our team.
      
## Responsibilities
- Build and maintain scalable React applications
- Collaborate with designers and backend engineers
- Mentor junior developers
- Lead technical discussions and code reviews

## Requirements
- 4+ years React experience
- Strong TypeScript skills
- Experience with REST APIs
- Knowledge of testing (Jest, RTL)

## Nice to Have
- Experience with Next.js
- GraphQL knowledge
- CI/CD experience`,
      skills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Testing', 'Git'],
      difficulty: 'MEDIUM',
      questionCount: 8,
      createdById: recruiter.id,
      organizationId: org.id,
    },
  });

  // Create questions
  const questions = [
    { text: 'Tell me about yourself and your experience with React.', type: 'behavioral', order: 1, timeLimit: 120 },
    { text: 'Explain the difference between useState and useReducer. When would you use each?', type: 'technical', order: 2, timeLimit: 150 },
    { text: 'Describe a challenging performance problem you solved in a React application.', type: 'behavioral', order: 3, timeLimit: 180 },
    { text: 'How do you approach state management in large React applications?', type: 'technical', order: 4, timeLimit: 150 },
    { text: 'A junior dev on your team is struggling with async/await. How do you explain it?', type: 'situational', order: 5, timeLimit: 120 },
    { text: 'What is your experience with TypeScript? Give an example of a complex type you wrote.', type: 'technical', order: 6, timeLimit: 150 },
    { text: 'Describe your code review process. What do you look for?', type: 'behavioral', order: 7, timeLimit: 120 },
    { text: 'How would you approach migrating a large class component app to hooks?', type: 'technical', order: 8, timeLimit: 180 },
  ];

  await prisma.question.deleteMany({ where: { openingId: opening.id } });
  for (const q of questions) {
    await prisma.question.create({ data: { ...q, openingId: opening.id } });
  }

  // Create a candidate + interview
  const candidate = await prisma.candidate.upsert({
    where: { email_openingId: { email: 'candidate@example.com', openingId: opening.id } },
    update: {},
    create: {
      name: 'Arjun Kumar',
      email: 'candidate@example.com',
      phone: '+91 99999 88888',
      openingId: opening.id,
    },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.interview.upsert({
    where: { inviteToken: 'demo-interview-token-123' },
    update: {},
    create: {
      candidateId: candidate.id,
      inviteToken: 'demo-interview-token-123',
      expiresAt,
    },
  });

  console.log(`
✅ Seed complete!

Recruiter login:
  Email: recruiter@acme.com
  Password: password123

Demo interview link:
  http://localhost:5173/interview/demo-interview-token-123
  `);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
