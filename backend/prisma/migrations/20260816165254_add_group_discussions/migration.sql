-- CreateTable
CREATE TABLE "group_discussions" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "participants" JSONB NOT NULL,
    "aiModerator" BOOLEAN NOT NULL DEFAULT true,
    "transcript" JSONB,
    "report" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_discussions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "group_discussions" ADD CONSTRAINT "group_discussions_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "openings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
