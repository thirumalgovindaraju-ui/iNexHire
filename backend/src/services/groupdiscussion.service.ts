// src/services/groupdiscussion.service.ts
// Domain logic for the Group Discussion Simulation module — dominance detection,
// when to have the AI moderator summarize, and turning raw scores into a report.
// The actual Claude calls live in ai.service.ts (moderateGroupDiscussion /
// evaluateGroupDiscussion), following this app's convention of centralizing
// text-generation calls there.
import { prisma } from '../config/db';
import { moderateGroupDiscussion, evaluateGroupDiscussion } from './ai.service';

export interface GDParticipant {
  candidateId: string;
  name: string;
  speakingTime: number;
  score: number | null;
}

export interface GDTranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

// If one speaker holds more than this share of turns (once there have been
// enough turns to judge), the moderator redirects to quieter participants.
const DOMINANCE_THRESHOLD = 0.45;
const MIN_TURNS_BEFORE_DOMINANCE_CHECK = 4;
const SUMMARIZE_EVERY_N_TURNS = 8;

export async function moderateGD(
  sessionId: string,
  message: string,
  speakerId: string,
  transcript: GDTranscriptEntry[]
): Promise<{ moderatorMessage: string | null; updatedTranscript: GDTranscriptEntry[] }> {
  const gd = await prisma.groupDiscussion.findUniqueOrThrow({ where: { id: sessionId } });
  const participants = (gd.participants as unknown as GDParticipant[]) ?? [];
  const speakerName = participants.find((p) => p.candidateId === speakerId)?.name ?? 'A participant';

  const newEntry: GDTranscriptEntry = { speaker: speakerName, text: message, timestamp: new Date().toISOString() };
  const updatedTranscript = [...transcript, newEntry];

  const turnCounts = updatedTranscript.reduce((acc, e) => {
    acc[e.speaker] = (acc[e.speaker] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalTurns = updatedTranscript.length;

  const dominant = totalTurns >= MIN_TURNS_BEFORE_DOMINANCE_CHECK
    ? Object.entries(turnCounts).find(([, count]) => count / totalTurns > DOMINANCE_THRESHOLD)
    : undefined;

  const shouldSummarize = !dominant && totalTurns > 0 && totalTurns % SUMMARIZE_EVERY_N_TURNS === 0;

  const moderation = await moderateGroupDiscussion({
    topic: gd.topic,
    participantNames: participants.map((p) => p.name),
    transcript: updatedTranscript,
    dominantSpeakerName: dominant ? dominant[0] : null,
    shouldSummarize,
  });

  return { moderatorMessage: moderation.message, updatedTranscript };
}

export async function evaluateGD(
  sessionId: string,
  participants: GDParticipant[],
  transcript: GDTranscriptEntry[]
) {
  const gd = await prisma.groupDiscussion.findUniqueOrThrow({ where: { id: sessionId } });
  return evaluateGroupDiscussion({
    topic: gd.topic,
    participants: participants.map((p) => ({ candidateId: p.candidateId, name: p.name, speakingTime: p.speakingTime })),
    transcript,
  });
}
