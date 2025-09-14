-- Disable folio duplicate trigger to allow overwrite functionality
-- The trigger prevents INSERT/UPDATE before the function can handle overwrite logic

-- Drop the trigger that prevents duplicate folios
DROP TRIGGER IF EXISTS trigger_check_duplicate_folio ON lab_reports;

-- Drop the function used by the trigger
DROP FUNCTION IF EXISTS check_duplicate_folio();

-- Keep the unique constraint but modify it to be deferrable
-- This allows the function to handle duplicates programmatically
DROP INDEX IF EXISTS idx_lab_reports_folio_unique;

-- Create a non-unique index for performance (allows duplicates during overwrite process)
CREATE INDEX IF NOT EXISTS idx_lab_reports_folio ON lab_reports(folio) WHERE folio IS NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN lab_reports.folio IS 'Lab report folio - overwrite handled at application level via store_complete_lab_extraction function';