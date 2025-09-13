-- Add missing fields to prioritized_patients view for proper table rendering
-- This fixes the issue where age_at_test, gender, and total_tests_count were not displaying

DROP VIEW IF EXISTS prioritized_patients;

CREATE VIEW prioritized_patients AS
WITH latest_reports AS (
  SELECT DISTINCT ON (patient_id)
    patient_id,
    id as lab_report_id,
    file_path as pdf_file_path,
    test_date,
    upload_date,
    laboratory_name
  FROM lab_reports
  ORDER BY patient_id, upload_date DESC
),
patient_stats AS (
  SELECT 
    p.id as patient_id,
    COUNT(DISTINCT CASE WHEN hm.is_abnormal THEN af.id END) as abnormal_count,
    COUNT(DISTINCT hm.id) as total_tests_count,
    STRING_AGG(DISTINCT CASE WHEN hm.is_abnormal THEN hm.marker_type END, ', ') as abnormal_markers,
    MAX(CASE 
      WHEN hm.is_critical_value THEN 'HIGH'
      WHEN af.severity = 'severe' THEN 'HIGH'
      WHEN af.severity = 'moderate' THEN 'MEDIUM'
      ELSE 'LOW'
    END) as priority_level
  FROM patients p
  LEFT JOIN lab_reports lr ON p.id = lr.patient_id
  LEFT JOIN health_markers hm ON lr.id = hm.lab_report_id
  LEFT JOIN abnormal_flags af ON hm.id = af.health_marker_id
  GROUP BY p.id
)
SELECT 
  p.id,
  p.name,
  p.rut,
  p.age as age_at_test,
  p.gender,
  p.priority_score,
  p.contact_status,
  p.last_contact_date,
  lr.lab_report_id,
  lr.pdf_file_path,
  lr.test_date,
  lr.upload_date,
  lr.laboratory_name,
  COALESCE(ps.abnormal_count, 0) as abnormal_count,
  COALESCE(ps.total_tests_count, 0) as total_tests_count,
  ps.abnormal_markers,
  COALESCE(ps.priority_level, 'LOW') as priority_level
FROM patients p
LEFT JOIN latest_reports lr ON p.id = lr.patient_id
LEFT JOIN patient_stats ps ON p.id = ps.patient_id
ORDER BY p.priority_score DESC, lr.upload_date DESC;

-- Grant necessary permissions
GRANT SELECT ON prioritized_patients TO authenticated;