-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "isCoding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "testCases" JSONB;

-- CreateTable
CREATE TABLE "coding_assessments" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "output" TEXT,
    "aiScore" INTEGER,
    "aiFeedback" TEXT,
    "timeSpentSec" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_assessments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coding_assessments" ADD CONSTRAINT "coding_assessments_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_assessments" ADD CONSTRAINT "coding_assessments_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
