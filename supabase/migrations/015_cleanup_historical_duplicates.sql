-- Clean up historical duplicates from when overwrite wasn't working
-- Keep only the lab_report that's being used for overwrite and clean up old ones

-- First, show what we're dealing with for folio 394499
SELECT
    id,
    folio,
    created_at,
    (SELECT COUNT(*) FROM health_markers hm WHERE hm.lab_report_id = lr.id) as health_markers_count
FROM lab_reports lr
WHERE folio = '394499'
ORDER BY created_at DESC;

-- Delete old lab_reports for folio 394499, keeping only the most recent one
-- (The overwrite is now using the most recent one, so we can safely delete the old ones)
WITH reports_to_keep AS (
    SELECT id
    FROM lab_reports
    WHERE folio = '394499'
    ORDER BY created_at DESC
    LIMIT 1
),
reports_to_delete AS (
    SELECT id
    FROM lab_reports
    WHERE folio = '394499'
    AND id NOT IN (SELECT id FROM reports_to_keep)
)
DELETE FROM abnormal_flags
WHERE health_marker_id IN (
    SELECT hm.id
    FROM health_markers hm
    JOIN reports_to_delete rtd ON hm.lab_report_id = rtd.id
);

-- Delete health_markers for old reports
WITH reports_to_keep AS (
    SELECT id
    FROM lab_reports
    WHERE folio = '394499'
    ORDER BY created_at DESC
    LIMIT 1
),
reports_to_delete AS (
    SELECT id
    FROM lab_reports
    WHERE folio = '394499'
    AND id NOT IN (SELECT id FROM reports_to_keep)
)
DELETE FROM health_markers
WHERE lab_report_id IN (SELECT id FROM reports_to_delete);

-- Delete the old lab_reports themselves
WITH reports_to_keep AS (
    SELECT id
    FROM lab_reports
    WHERE folio = '394499'
    ORDER BY created_at DESC
    LIMIT 1
)
DELETE FROM lab_reports
WHERE folio = '394499'
AND id NOT IN (SELECT id FROM reports_to_keep);

-- Show final state for folio 394499
SELECT
    'AFTER CLEANUP' as status,
    id,
    folio,
    created_at,
    (SELECT COUNT(*) FROM health_markers hm WHERE hm.lab_report_id = lr.id) as health_markers_count
FROM lab_reports lr
WHERE folio = '394499'
ORDER BY created_at DESC;

-- Clean up any other folios that might have duplicates
DO $$
DECLARE
    duplicate_folio TEXT;
    reports_deleted INTEGER := 0;
BEGIN
    FOR duplicate_folio IN
        SELECT folio
        FROM lab_reports
        WHERE folio IS NOT NULL
        GROUP BY folio
        HAVING COUNT(*) > 1
    LOOP
        -- For each duplicate folio, keep only the most recent report
        WITH reports_to_keep AS (
            SELECT id
            FROM lab_reports
            WHERE folio = duplicate_folio
            ORDER BY created_at DESC
            LIMIT 1
        ),
        reports_to_delete AS (
            SELECT id
            FROM lab_reports
            WHERE folio = duplicate_folio
            AND id NOT IN (SELECT id FROM reports_to_keep)
        )
        DELETE FROM lab_reports
        WHERE id IN (SELECT id FROM reports_to_delete);

        GET DIAGNOSTICS reports_deleted = ROW_COUNT;
        RAISE NOTICE 'Cleaned up % duplicate reports for folio %', reports_deleted, duplicate_folio;
    END LOOP;
END $$;

-- Final verification - should show no duplicates
SELECT
    folio,
    COUNT(*) as report_count
FROM lab_reports
WHERE folio IS NOT NULL
GROUP BY folio
HAVING COUNT(*) > 1;