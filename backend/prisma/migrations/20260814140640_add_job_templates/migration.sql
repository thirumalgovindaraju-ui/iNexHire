-- CreateTable
CREATE TABLE "job_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "sampleQuestions" JSONB NOT NULL,
    "salaryMinLakhs" INTEGER NOT NULL,
    "salaryMaxLakhs" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_templates_title_level_key" ON "job_templates"("title", "level");
