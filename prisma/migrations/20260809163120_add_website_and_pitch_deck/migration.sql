-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'PITCH_DECK_GENERATED';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "website" TEXT;
