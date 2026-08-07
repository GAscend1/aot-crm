-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "wonReason" TEXT;
