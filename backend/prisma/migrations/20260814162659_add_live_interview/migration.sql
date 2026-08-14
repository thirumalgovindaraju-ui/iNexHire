-- CreateTable
CREATE TABLE "live_interviews" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "hostJoined" BOOLEAN NOT NULL DEFAULT false,
    "guestJoined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_interviews_interviewId_key" ON "live_interviews"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "live_interviews_roomName_key" ON "live_interviews"("roomName");

-- AddForeignKey
ALTER TABLE "live_interviews" ADD CONSTRAINT "live_interviews_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
