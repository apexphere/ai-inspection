-- AlterEnum: Replace binary PASS/FAIL with nuanced inspection outcomes
-- Migrate existing data first: PASS → SATISFACTORY, FAIL → IMMEDIATE_ATTENTION

-- Step 1: Add new values to existing enum
ALTER TYPE "Decision" ADD VALUE IF NOT EXISTS 'SATISFACTORY';
ALTER TYPE "Decision" ADD VALUE IF NOT EXISTS 'MAINTENANCE_REQUIRED';
ALTER TYPE "Decision" ADD VALUE IF NOT EXISTS 'MONITOR';
ALTER TYPE "Decision" ADD VALUE IF NOT EXISTS 'FURTHER_INVESTIGATION';
ALTER TYPE "Decision" ADD VALUE IF NOT EXISTS 'IMMEDIATE_ATTENTION';

-- Step 2: Migrate existing data
UPDATE "ChecklistItem" SET decision = 'SATISFACTORY' WHERE decision = 'PASS';
UPDATE "ChecklistItem" SET decision = 'IMMEDIATE_ATTENTION' WHERE decision = 'FAIL';

-- Step 3: Replace enum with clean set (no PASS/FAIL)
CREATE TYPE "Decision_new" AS ENUM ('SATISFACTORY', 'MAINTENANCE_REQUIRED', 'MONITOR', 'FURTHER_INVESTIGATION', 'IMMEDIATE_ATTENTION', 'NA');
ALTER TABLE "ChecklistItem" ALTER COLUMN "decision" TYPE "Decision_new" USING ("decision"::text::"Decision_new");
ALTER TYPE "Decision" RENAME TO "Decision_old";
ALTER TYPE "Decision_new" RENAME TO "Decision";
DROP TYPE "Decision_old";
