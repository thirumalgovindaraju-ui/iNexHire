// src/server.ts
import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './config/db';
import { redis } from './config/redis';
import { startEvaluationWorker } from './jobs/evaluation.job';

async function main() {
  // Test DB connection
  await prisma.$connect();
  console.log('[DB] PostgreSQL connected');

  // Test Redis connection
  await redis.ping();
  console.log('[Redis] Connected');

  // Start BullMQ worker
  startEvaluationWorker();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`
╔═══════════════════════════════════════╗
║        NexHire API Server             ║
╠═══════════════════════════════════════╣
║  Port:  ${env.port}                         ║
║  Env:   ${env.nodeEnv.padEnd(27)}║
║  Model: ${env.openaiModel.padEnd(27)}║
╚═══════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM received, shutting down...');
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
