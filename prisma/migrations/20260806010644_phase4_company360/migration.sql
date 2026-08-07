-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "role" TEXT;

-- CreateIndex
CREATE INDEX "Activity_companyId_idx" ON "Activity"("companyId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
