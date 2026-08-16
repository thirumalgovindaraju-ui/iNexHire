-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
