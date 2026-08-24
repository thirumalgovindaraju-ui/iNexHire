-- AlterTable
ALTER TABLE "tm_evaluations" ADD COLUMN     "bodyFeedback" TEXT,
ADD COLUMN     "conclusionFeedback" TEXT,
ADD COLUMN     "openingFeedback" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "tm_general_evaluations" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "overallFeedback" TEXT,
    "evaluatorFeedback" JSONB,
    "bestSpeakerRoleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_general_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tm_general_evaluations_meetingId_key" ON "tm_general_evaluations"("meetingId");

-- AddForeignKey
ALTER TABLE "tm_general_evaluations" ADD CONSTRAINT "tm_general_evaluations_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
