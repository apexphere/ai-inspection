-- Add BRANZ zone data fields to Property — Issue #543

ALTER TABLE "Property" ADD COLUMN "climateZone" TEXT;
ALTER TABLE "Property" ADD COLUMN "earthquakeZone" TEXT;
ALTER TABLE "Property" ADD COLUMN "exposureZone" TEXT;
ALTER TABLE "Property" ADD COLUMN "leeZone" TEXT;
ALTER TABLE "Property" ADD COLUMN "rainfallRange" TEXT;
ALTER TABLE "Property" ADD COLUMN "windRegion" TEXT;
ALTER TABLE "Property" ADD COLUMN "windZone" TEXT;
