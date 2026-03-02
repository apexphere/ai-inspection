-- Move FloorPlan ownership from SiteInspection to Project
-- Issue #662: floor plan is building metadata, not an inspection finding

-- Step 1: Add projectId to existing FloorPlan table
ALTER TABLE "FloorPlan" ADD COLUMN "projectId" TEXT;

-- Step 2: Populate projectId from inspection's project
UPDATE "FloorPlan" fp
SET "projectId" = si."projectId"
FROM "SiteInspection" si
WHERE fp."inspectionId" = si.id;

-- Step 3: Make NOT NULL
ALTER TABLE "FloorPlan" ALTER COLUMN "projectId" SET NOT NULL;

-- Step 4: Drop old FK and indexes
ALTER TABLE "FloorPlan" DROP CONSTRAINT "FloorPlan_inspectionId_fkey";
DROP INDEX "FloorPlan_inspectionId_floor_key";
DROP INDEX "FloorPlan_inspectionId_idx";

-- Step 5: Drop old column
ALTER TABLE "FloorPlan" DROP COLUMN "inspectionId";

-- Step 6: Add new FK and indexes
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "FloorPlan_projectId_floor_key" ON "FloorPlan"("projectId", "floor");
CREATE INDEX "FloorPlan_projectId_idx" ON "FloorPlan"("projectId");
