-- CreateTable
CREATE TABLE "naukri_candidates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "naukriId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "currentRole" TEXT,
    "currentCompany" TEXT,
    "experienceYears" INTEGER,
    "skills" JSONB,
    "location" TEXT,
    "salaryLakhs" INTEGER,
    "resumeHeadline" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "candidateId" TEXT,

    CONSTRAINT "naukri_candidates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "naukri_candidates" ADD CONSTRAINT "naukri_candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
