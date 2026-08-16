-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'MAPS_AUDIT_GENERATED';

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'MAPS_FUNNEL';

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "website" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MapsReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "placeId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "proposal" JSONB NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "MapsReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapsReport_clientId_key" ON "MapsReport"("clientId");

-- AddForeignKey
ALTER TABLE "MapsReport" ADD CONSTRAINT "MapsReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
