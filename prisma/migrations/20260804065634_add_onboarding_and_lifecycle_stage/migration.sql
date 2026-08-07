-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('Lead', 'Prospect', 'Qualified', 'Customer', 'FormerCustomer', 'Partner');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'Prospect';

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'Prospect',
ADD COLUMN     "linkedIn" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'Customer';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingDismissedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingLastStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "onboardingNeverShowAgain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStartedAt" TIMESTAMP(3);
