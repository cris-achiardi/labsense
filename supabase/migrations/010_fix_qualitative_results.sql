-- Migration 008: Fix store_complete_lab_extraction to handle qualitative results
-- Updates function to store qualitative results like "Negativo", "Positivo" in value column as text

-- First, change the health_markers.value column type from numeric to text
ALTER TABLE health_markers ALTER COLUMN value TYPE TEXT;

-- Update the store_complete_lab_extraction function to handle both numeric and qualitative results
CREATE OR REPLACE FUNCTION store_complete_lab_extraction(
  p_patient_data JSONB,
  p_lab_results JSONB[],
  p_metadata JSONB,
  p_uploaded_by TEXT,
  p_file_name TEXT,
  p_file_path TEXT,
  p_file_size INTEGER
) RETURNS UUID AS $$
DECLARE
  patient_id UUID;
  lab_report_id UUID;
  lab_result JSONB;
  health_marker_id UUID;
BEGIN
  -- Insert or update patient
  INSERT INTO patients (rut, name, age, gender)
  VALUES (
    p_patient_data->>'rut',
    p_patient_data->>'name',
    p_patient_data->>'age',
    p_patient_data->>'gender'
  )
  ON CONFLICT (rut) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    updated_at = NOW()
  RETURNING id INTO patient_id;
  
  -- Insert lab report with complete metadata
  INSERT INTO lab_reports (
    patient_id,
    file_name,
    file_path,
    file_size,
    uploaded_by,
    folio,
    fecha_ingreso,
    toma_muestra,
    fecha_validacion,
    profesional_solicitante,
    procedencia,
    extraction_confidence,
    processing_status
  ) VALUES (
    patient_id,
    p_file_name,
    p_file_path,
    p_file_size,
    p_uploaded_by,
    p_metadata->>'folio',
    (p_metadata->>'fechaIngreso')::DATE,
    (p_metadata->>'tomaMuestra')::DATE,
    (p_metadata->>'fechaValidacion')::DATE,
    p_metadata->>'profesionalSolicitante',
    p_metadata->>'procedencia',
    (p_metadata->>'confidence')::INTEGER,
    'processed'
  ) RETURNING id INTO lab_report_id;
  
  -- Insert all lab results
  FOREACH lab_result IN ARRAY p_lab_results
  LOOP
    INSERT INTO health_markers (
      lab_report_id,
      examen,
      marker_type,
      value,
      resultado_raw,
      unit,
      valor_referencia,
      metodo,
      tipo_muestra,
      system_code,
      category,
      priority,
      is_abnormal,
      abnormal_indicator,
      confidence,
      extracted_text
    ) VALUES (
      lab_report_id,
      lab_result->>'examen',
      lab_result->>'examen', -- Use examen as marker_type for now
      -- FIXED: Store value as text to handle both numeric and qualitative results
      lab_result->>'resultado',
      lab_result->>'resultado',
      lab_result->>'unidad',
      lab_result->>'valorReferencia',
      lab_result->>'metodo',
      lab_result->>'tipoMuestra',
      lab_result->>'systemCode',
      lab_result->>'category',
      lab_result->>'priority',
      (lab_result->>'isAbnormal')::BOOLEAN,
      lab_result->>'abnormalIndicator',
      (lab_result->>'confidence')::DECIMAL / 100, -- Convert percentage to decimal
      lab_result->>'context'
    ) RETURNING id INTO health_marker_id;
    
    -- Create abnormal flag if needed
    IF (lab_result->>'isAbnormal')::BOOLEAN THEN
      INSERT INTO abnormal_flags (
        health_marker_id,
        severity,
        is_above_range,
        is_below_range,
        priority_weight
      ) VALUES (
        health_marker_id,
        CASE 
          WHEN lab_result->>'priority' = 'critical' THEN 'severe'
          WHEN lab_result->>'priority' = 'high' THEN 'moderate'
          ELSE 'mild'
        END,
        true, -- Assume above range for now, can be refined later
        false,
        CASE 
          WHEN lab_result->>'priority' = 'critical' THEN 3
          WHEN lab_result->>'priority' = 'high' THEN 2
          ELSE 1
        END
      );
    END IF;
  END LOOP;
  
  -- Calculate and update patient priority score
  PERFORM calculate_patient_priority_score(patient_id);
  
  -- Log audit event
  PERFORM log_audit_event(
    auth.uid(),
    p_uploaded_by,
    'complete_lab_extraction',
    'lab_report',
    lab_report_id,
    p_patient_data->>'rut',
    jsonb_build_object(
      'folio', p_metadata->>'folio',
      'total_results', array_length(p_lab_results, 1),
      'abnormal_count', (
        SELECT COUNT(*) 
        FROM unnest(p_lab_results) AS lr 
        WHERE (lr->>'isAbnormal')::BOOLEAN
      )
    )
  );
  
  RETURN lab_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the change
COMMENT ON COLUMN health_markers.value IS 'Lab result value - can be numeric (145.5) or qualitative (Negativo, Positivo)';
COMMENT ON FUNCTION store_complete_lab_extraction IS 'Stores complete lab extraction results - handles both numeric and qualitative values';