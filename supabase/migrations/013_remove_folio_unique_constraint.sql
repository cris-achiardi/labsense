-- Remove UNIQUE constraint from folio column to allow overwrite functionality
-- The UNIQUE constraint was created directly on the column in migration 007

-- Drop the UNIQUE constraint on folio column
-- PostgreSQL creates a constraint named "table_column_key" for UNIQUE columns
ALTER TABLE lab_reports DROP CONSTRAINT IF EXISTS lab_reports_folio_key;

-- Verify the column is now nullable and non-unique
-- (The column itself remains, just without the UNIQUE constraint)

-- Add comment explaining the change
COMMENT ON COLUMN lab_reports.folio IS 'Lab report folio - duplicates allowed for overwrite functionality, managed by store_complete_lab_extraction function';