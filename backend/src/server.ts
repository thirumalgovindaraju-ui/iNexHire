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

  // Test Redis connection — required in production, optional in development.
  // ioredis retries forever by default, so give it a bounded window here rather
  // than letting a missing Redis hang server startup indefinitely.
  let redisAvailable = true;
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timed out')), 3000)),
    ]);
    console.log('[Redis] Connected');
  } catch (err) {
    if (env.isProd) throw err;
    redisAvailable = false;
    redis.disconnect();
    console.warn('[Redis] Not reachable — continuing without it in development. BullMQ evaluation queue is disabled until Redis is available.');
  }

  // Start BullMQ worker only if Redis is actually available
  if (redisAvailable) {
    startEvaluationWorker();
  }

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
    if (redisAvailable) await redis.quit();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
