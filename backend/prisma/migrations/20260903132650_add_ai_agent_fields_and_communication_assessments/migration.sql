-- AlterTable
ALTER TABLE "tm_evaluations" ADD COLUMN     "generatedByAgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tm_general_evaluations" ADD COLUMN     "generatedByAgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tm_grammarian_logs" ADD COLUMN     "generatedByAgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tm_meetings" ADD COLUMN     "agentCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "agentInputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "agentOutputTokens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tm_role_assignments" ADD COLUMN     "agentOutput" JSONB,
ADD COLUMN     "agentRunAt" TIMESTAMP(3),
ADD COLUMN     "agentStatus" TEXT,
ADD COLUMN     "assigneeType" TEXT NOT NULL DEFAULT 'HUMAN';

-- AlterTable
ALTER TABLE "tm_speech_analyses" ADD COLUMN     "generatedByAgent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "communication_assessments" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "communicationScore" INTEGER NOT NULL,
    "communicationLevel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "linguisticAccuracy" JSONB NOT NULL,
    "phoneticClarity" JSONB NOT NULL,
    "vocalProsody" JSONB NOT NULL,
    "operationalFluency" JSONB NOT NULL,
    "lexicalInteractiveIntelligence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communication_assessments_interviewId_key" ON "communication_assessments"("interviewId");

-- AddForeignKey
ALTER TABLE "communication_assessments" ADD CONSTRAINT "communication_assessments_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
