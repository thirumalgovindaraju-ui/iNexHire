-- CreateTable
CREATE TABLE "tm_clubs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'iOpex Toastmasters Club',
    "charterNumber" TEXT,
    "area" TEXT,
    "division" TEXT,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "memberNumber" TEXT,
    "pathwaysPath" TEXT,
    "level" TEXT,
    "baseUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_meetings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "clubId" TEXT,
    "meetingNumber" INTEGER,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "wordOfDay" TEXT,
    "wordMeaning" TEXT,
    "wordType" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_agenda_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "activityName" TEXT NOT NULL,
    "durationMins" INTEGER,
    "plannedStart" TEXT,
    "plannedEnd" TEXT,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "notes" TEXT,
    "roleAssignmentId" TEXT,

    CONSTRAINT "tm_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_role_assignments" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "memberId" TEXT,
    "speechTitle" TEXT,
    "speechProject" TEXT,
    "manualNumber" TEXT,
    "pathwaysProject" TEXT,
    "greenMins" INTEGER,
    "yellowMins" INTEGER,
    "redMins" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tm_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_education_sessions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "presenterId" TEXT,
    "durationMins" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tm_education_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_timer_logs" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "roleAssignmentId" TEXT NOT NULL,
    "actualDurationSecs" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tm_timer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_ah_counters" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "umCount" INTEGER NOT NULL DEFAULT 0,
    "uhCount" INTEGER NOT NULL DEFAULT 0,
    "soCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "erCount" INTEGER NOT NULL DEFAULT 0,
    "youKnowCount" INTEGER NOT NULL DEFAULT 0,
    "otherCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_ah_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_grammarian_logs" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "wordOfDay" TEXT,
    "correctUses" INTEGER NOT NULL DEFAULT 0,
    "incorrectUses" INTEGER NOT NULL DEFAULT 0,
    "goodGrammarExamples" TEXT,
    "errorsNoted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_grammarian_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_evaluations" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speakerRoleId" TEXT NOT NULL,
    "evaluatorRoleId" TEXT NOT NULL,
    "commendations" TEXT,
    "recommendations" TEXT,
    "ratingContent" INTEGER,
    "ratingDelivery" INTEGER,
    "ratingLanguage" INTEGER,
    "overallRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tm_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_table_topic_responses" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speakerName" TEXT NOT NULL,
    "isMember" BOOLEAN NOT NULL DEFAULT true,
    "memberId" TEXT,
    "topicGiven" TEXT,
    "durationSecs" INTEGER,
    "timerResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tm_table_topic_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tm_meeting_reports" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportJson" JSONB NOT NULL,
    "bestSpeakerRoleId" TEXT,
    "bestTableTopicId" TEXT,
    "bestEvaluatorRoleId" TEXT,

    CONSTRAINT "tm_meeting_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tm_clubs_organizationId_key" ON "tm_clubs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tm_role_assignments_meetingId_roleName_key" ON "tm_role_assignments"("meetingId", "roleName");

-- CreateIndex
CREATE UNIQUE INDEX "tm_timer_logs_meetingId_roleAssignmentId_key" ON "tm_timer_logs"("meetingId", "roleAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "tm_ah_counters_meetingId_memberId_key" ON "tm_ah_counters"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "tm_grammarian_logs_meetingId_key" ON "tm_grammarian_logs"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "tm_evaluations_meetingId_speakerRoleId_key" ON "tm_evaluations"("meetingId", "speakerRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "tm_meeting_reports_meetingId_key" ON "tm_meeting_reports"("meetingId");

-- AddForeignKey
ALTER TABLE "tm_clubs" ADD CONSTRAINT "tm_clubs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_members" ADD CONSTRAINT "tm_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_members" ADD CONSTRAINT "tm_members_baseUserId_fkey" FOREIGN KEY ("baseUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_meetings" ADD CONSTRAINT "tm_meetings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_meetings" ADD CONSTRAINT "tm_meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_meetings" ADD CONSTRAINT "tm_meetings_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "tm_clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_agenda_items" ADD CONSTRAINT "tm_agenda_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_agenda_items" ADD CONSTRAINT "tm_agenda_items_roleAssignmentId_fkey" FOREIGN KEY ("roleAssignmentId") REFERENCES "tm_role_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_role_assignments" ADD CONSTRAINT "tm_role_assignments_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_role_assignments" ADD CONSTRAINT "tm_role_assignments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "tm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_education_sessions" ADD CONSTRAINT "tm_education_sessions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_education_sessions" ADD CONSTRAINT "tm_education_sessions_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "tm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_timer_logs" ADD CONSTRAINT "tm_timer_logs_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_timer_logs" ADD CONSTRAINT "tm_timer_logs_roleAssignmentId_fkey" FOREIGN KEY ("roleAssignmentId") REFERENCES "tm_role_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_ah_counters" ADD CONSTRAINT "tm_ah_counters_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_ah_counters" ADD CONSTRAINT "tm_ah_counters_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "tm_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_grammarian_logs" ADD CONSTRAINT "tm_grammarian_logs_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_evaluations" ADD CONSTRAINT "tm_evaluations_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_evaluations" ADD CONSTRAINT "tm_evaluations_speakerRoleId_fkey" FOREIGN KEY ("speakerRoleId") REFERENCES "tm_role_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_evaluations" ADD CONSTRAINT "tm_evaluations_evaluatorRoleId_fkey" FOREIGN KEY ("evaluatorRoleId") REFERENCES "tm_role_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_table_topic_responses" ADD CONSTRAINT "tm_table_topic_responses_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_table_topic_responses" ADD CONSTRAINT "tm_table_topic_responses_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "tm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tm_meeting_reports" ADD CONSTRAINT "tm_meeting_reports_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tm_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
