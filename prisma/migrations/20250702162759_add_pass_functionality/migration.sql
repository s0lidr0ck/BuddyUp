-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "lastPassedBy" TEXT,
ADD COLUMN     "passCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passedAt" TIMESTAMP(3);
