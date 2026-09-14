-- Add Microsoft Graph email → CRM activity association support.
-- graphMessageId (unique) is the dedupe key: a refresh can never create
-- duplicate CRM email activities for the same Outlook message.
ALTER TABLE "Activity" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "graphMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Activity_graphMessageId_key" ON "Activity"("graphMessageId");

-- CreateIndex
CREATE INDEX "Activity_contactId_idx" ON "Activity"("contactId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
