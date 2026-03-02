-- Move FloorPlan from SiteInspection to Project
-- Issue #662: floor plan is building metadata, not an inspection finding

-- Step 1: Add projectId column
ALTER TABLE "FloorPlan" ADD COLUMN "projectId" TEXT;

-- Step 2: Populate projectId from the inspection's project
UPDATE "FloorPlan" fp
SET "projectId" = si."projectId"
FROM "SiteInspection" si
WHERE fp."inspectionId" = si.id;

-- Step 3: Make projectId NOT NULL
ALTER TABLE "FloorPlan" ALTER COLUMN "projectId" SET NOT NULL;

-- Step 4: Add FK constraint
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Drop old unique index and index on inspectionId
DROP INDEX IF EXISTS "FloorPlan_inspectionId_floor_key";
DROP INDEX IF EXISTS "FloorPlan_inspectionId_idx";

-- Step 6: Add new unique index and index on projectId
CREATE UNIQUE INDEX "FloorPlan_projectId_floor_key" ON "FloorPlan"("projectId", "floor");
CREATE INDEX "FloorPlan_projectId_idx" ON "FloorPlan"("projectId");

-- Step 7: Drop old FK and column
ALTER TABLE "FloorPlan" DROP CONSTRAINT IF EXISTS "FloorPlan_inspectionId_fkey";
ALTER TABLE "FloorPlan" DROP COLUMN "inspectionId";
