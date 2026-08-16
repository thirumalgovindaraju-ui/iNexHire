-- CreateTable
CREATE TABLE "compensation_benchmarks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "experienceMin" INTEGER NOT NULL,
    "experienceMax" INTEGER NOT NULL,
    "p25Salary" INTEGER NOT NULL,
    "p50Salary" INTEGER NOT NULL,
    "p75Salary" INTEGER NOT NULL,
    "p90Salary" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "source" TEXT NOT NULL DEFAULT 'AI_ESTIMATE',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_benchmarks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "compensation_benchmarks" ADD CONSTRAINT "compensation_benchmarks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
