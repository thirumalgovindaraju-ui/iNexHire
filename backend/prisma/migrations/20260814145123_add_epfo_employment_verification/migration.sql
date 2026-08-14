-- CreateTable
CREATE TABLE "employment_verifications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "uanNumber" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "employmentHistory" JSONB,
    "discrepancies" JSONB,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employment_verifications_candidateId_key" ON "employment_verifications"("candidateId");

-- AddForeignKey
ALTER TABLE "employment_verifications" ADD CONSTRAINT "employment_verifications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
