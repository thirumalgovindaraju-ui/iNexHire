// src/routes/chatbot.routes.ts
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { chatbotReply, ChatMessage } from '../services/ai.service';

const router = Router();

// POST /api/chatbot/message — candidate-facing, no auth required
router.post('/message', async (req, res, next) => {
  try {
    const { candidateId, openingId, messages, userMessage } = req.body as {
      candidateId?: string;
      openingId?: string;
      messages?: ChatMessage[];
      userMessage?: string;
    };
    if (!userMessage) throw new AppError(400, 'Message required');
    if (!openingId) throw new AppError(400, 'openingId required');

    const opening = await prisma.opening.findUnique({
      where: { id: openingId },
      select: { title: true, jobDescription: true, organization: { select: { name: true } } },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const allMessages: ChatMessage[] = [...(messages ?? []), { role: 'user', content: userMessage }];

    const reply = await chatbotReply(
      allMessages,
      opening.title,
      opening.organization.name,
      opening.jobDescription ?? ''
    );

    // Persist the conversation if we know who's chatting — best effort, never blocks the reply.
    if (candidateId) {
      try {
        const updatedMessages = [
          ...allMessages,
          { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
        ] as unknown as Prisma.InputJsonValue;

        const existing = await prisma.chatSession.findFirst({
          where: { candidateId, openingId, status: 'active' },
        });
        if (existing) {
          await prisma.chatSession.update({ where: { id: existing.id }, data: { messages: updatedMessages } });
        } else {
          await prisma.chatSession.create({ data: { candidateId, openingId, messages: updatedMessages } });
        }
      } catch (err) {
        console.error('[chatbot.routes] failed to persist chat session:', err);
      }
    }

    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
});

export default router;
