-- AlterEnum: Replace binary PASS/FAIL with nuanced inspection outcomes
--
-- PostgreSQL does not allow using newly-added enum values within the same
-- transaction that adds them. To avoid this, we create the new enum type
-- directly and migrate data via a CASE expression (text cast), skipping
-- the ADD VALUE approach entirely.

-- Step 1: Create replacement enum with full set of values
CREATE TYPE "Decision_new" AS ENUM ('SATISFACTORY', 'MAINTENANCE_REQUIRED', 'MONITOR', 'FURTHER_INVESTIGATION', 'IMMEDIATE_ATTENTION', 'NA');

-- Step 2: Migrate column, mapping legacy PASS/FAIL values
ALTER TABLE "ChecklistItem"
  ALTER COLUMN "decision" TYPE "Decision_new"
  USING (
    CASE decision::text
      WHEN 'PASS' THEN 'SATISFACTORY'
      WHEN 'FAIL' THEN 'IMMEDIATE_ATTENTION'
      ELSE decision::text
    END
  )::"Decision_new";

-- Step 3: Swap enum names
ALTER TYPE "Decision" RENAME TO "Decision_old";
ALTER TYPE "Decision_new" RENAME TO "Decision";
DROP TYPE "Decision_old";
