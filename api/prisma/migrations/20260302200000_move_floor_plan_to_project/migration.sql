-- Move FloorPlan ownership from SiteInspection to Project
-- Issue #662: floor plan is building metadata, not an inspection finding

-- Step 1: Create new table matching exact Prisma-generated column spec
CREATE TABLE "FloorPlan_new" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "label" TEXT,
    "rooms" TEXT[],
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate data
INSERT INTO "FloorPlan_new" ("id", "projectId", "floor", "label", "rooms", "photoIds", "createdAt", "updatedAt")
SELECT fp."id", si."projectId", fp."floor", fp."label", fp."rooms", fp."photoIds", fp."createdAt", fp."updatedAt"
FROM "FloorPlan" fp
JOIN "SiteInspection" si ON si.id = fp."inspectionId";

-- Step 3: Drop ChecklistItem FK to FloorPlan
ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_floorPlanId_fkey";

-- Step 4: Drop old FloorPlan table (cascades indexes and constraints)
DROP TABLE "FloorPlan";

-- Step 5: Rename new table
ALTER TABLE "FloorPlan_new" RENAME TO "FloorPlan";

-- Step 6: Add FK to Project
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Add indexes
CREATE UNIQUE INDEX "FloorPlan_projectId_floor_key" ON "FloorPlan"("projectId", "floor");
CREATE INDEX "FloorPlan_projectId_idx" ON "FloorPlan"("projectId");

-- Step 8: Restore ChecklistItem FK
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_floorPlanId_fkey"
    FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
