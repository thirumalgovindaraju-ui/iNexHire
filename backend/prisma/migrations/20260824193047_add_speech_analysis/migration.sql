-- CreateTable
CREATE TABLE "tm_speech_analyses" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "roleAssignmentId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "grammarScore" DOUBLE PRECISION,
    "grammarErrors" JSONB,
    "grammarSuggestions" JSONB,
    "fillerWordCounts" JSONB NOT NULL,
    "contentScore" INTEGER,
    "deliveryScore" INTEGER,
    "languageScore" INTEGER,
    "overallScore" INTEGER,
    "commendations" JSONB,
    "recommendations" JSONB,
    "openingFeedback" TEXT,
    "bodyFeedback" TEXT,
    "conclusionFeedback" TEXT,
    "wordOfDayUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_speech_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tm_speech_analyses_roleAssignmentId_key" ON "tm_speech_analyses"("roleAssignmentId");

-- AddForeignKey
ALTER TABLE "tm_speech_analyses" ADD CONSTRAINT "tm_speech_analyses_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_speech_analyses" ADD CONSTRAINT "tm_speech_analyses_roleAssignmentId_fkey" FOREIGN KEY ("roleAssignmentId") REFERENCES "tm_role_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
