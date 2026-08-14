-- CreateTable
CREATE TABLE "sentiment_reports" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "deceptionScore" INTEGER NOT NULL,
    "overallSentiment" TEXT NOT NULL,
    "emotionTimeline" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sentiment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture_fit_scores" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "dimensions" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_fit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_predictions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "retentionScore" INTEGER NOT NULL,
    "flightRisk" TEXT NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "positiveFactors" JSONB NOT NULL,
    "predictedTenure" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_reports_interviewId_key" ON "sentiment_reports"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "culture_fit_scores_interviewId_key" ON "culture_fit_scores"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "retention_predictions_interviewId_key" ON "retention_predictions"("interviewId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_reports" ADD CONSTRAINT "sentiment_reports_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culture_fit_scores" ADD CONSTRAINT "culture_fit_scores_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_predictions" ADD CONSTRAINT "retention_predictions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "openings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
