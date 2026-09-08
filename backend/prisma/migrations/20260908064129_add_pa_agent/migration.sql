-- CreateTable
CREATE TABLE "pa_google_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pa_google_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pa_briefings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pa_briefings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pa_action_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "briefingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pa_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pa_email_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "toEmail" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "gmailDraftId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pa_email_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pa_google_accounts_userId_key" ON "pa_google_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pa_briefings_userId_date_key" ON "pa_briefings"("userId", "date");

-- CreateIndex
CREATE INDEX "pa_action_items_userId_status_idx" ON "pa_action_items"("userId", "status");

-- AddForeignKey
ALTER TABLE "pa_google_accounts" ADD CONSTRAINT "pa_google_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pa_briefings" ADD CONSTRAINT "pa_briefings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pa_action_items" ADD CONSTRAINT "pa_action_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pa_email_drafts" ADD CONSTRAINT "pa_email_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
