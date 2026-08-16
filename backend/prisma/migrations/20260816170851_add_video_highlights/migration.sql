-- CreateTable
CREATE TABLE "video_highlights" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "startWord" INTEGER,
    "endWord" INTEGER,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_highlights_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "video_highlights" ADD CONSTRAINT "video_highlights_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
