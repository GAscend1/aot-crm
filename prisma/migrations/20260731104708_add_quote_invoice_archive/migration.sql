-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "archivedAt" TIMESTAMP(3);
