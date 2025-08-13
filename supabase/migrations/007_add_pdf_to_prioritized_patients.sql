-- Add PDF file path and lab report ID to prioritized_patients view for Task 11

CREATE OR REPLACE VIEW prioritized_patients AS
SELECT 
  p.id,
  p.name,
  p.rut,
  p.priority_score,
  p.contact_status,
  p.last_contact_date,
  lr.id as lab_report_id,
  lr.file_path as pdf_file_path,
  lr.test_date,
  lr.upload_date,
  lr.laboratory_name,
  COUNT(af.id) as abnormal_count,
  STRING_AGG(DISTINCT hm.marker_type, ', ') as abnormal_markers,
  MAX(CASE WHEN hm.is_critical_value THEN 'HIGH'
           WHEN af.severity = 'severe' THEN 'HIGH'
           WHEN af.severity = 'moderate' THEN 'MEDIUM'
           ELSE 'LOW' END) as priority_level
FROM patients p
LEFT JOIN lab_reports lr ON p.id = lr.patient_id
LEFT JOIN health_markers hm ON lr.id = hm.lab_report_id AND hm.is_abnormal = true
LEFT JOIN abnormal_flags af ON hm.id = af.health_marker_id
GROUP BY p.id, p.name, p.rut, p.priority_score, p.contact_status, p.last_contact_date, 
         lr.id, lr.file_path, lr.test_date, lr.upload_date, lr.laboratory_name
ORDER BY p.priority_score DESC, lr.upload_date DESC;

-- Grant necessary permissions
GRANT SELECT ON prioritized_patients TO authenticated;