-- Fix ambiguous health_marker_id reference in store_complete_lab_extraction function

DROP FUNCTION IF EXISTS store_complete_lab_extraction;

CREATE OR REPLACE FUNCTION store_complete_lab_extraction(
  p_patient_data JSONB,
  p_lab_results JSONB[],
  p_metadata JSONB,
  p_uploaded_by TEXT,
  p_file_name TEXT,
  p_file_path TEXT,
  p_file_size INTEGER,
  p_overwrite BOOLEAN DEFAULT FALSE,
  p_existing_report_id UUID DEFAULT NULL
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

  -- Handle overwrite scenario
  IF p_overwrite AND p_existing_report_id IS NOT NULL THEN
    -- First delete abnormal flags that reference health markers we're about to delete
    DELETE FROM abnormal_flags af
    WHERE af.health_marker_id IN (
      SELECT hm.id FROM health_markers hm WHERE hm.lab_report_id = p_existing_report_id
    );

    -- Then delete all health markers for this report
    DELETE FROM health_markers hm WHERE hm.lab_report_id = p_existing_report_id;

    -- Log the cleanup
    RAISE NOTICE 'Cleaned up existing health markers for lab_report_id: %', p_existing_report_id;

    -- Update existing lab report
    UPDATE lab_reports SET
      folio = p_metadata->>'folio',
      fecha_ingreso = CASE
        WHEN p_metadata->>'fechaIngreso' != '' AND p_metadata->>'fechaIngreso' IS NOT NULL
        THEN (p_metadata->>'fechaIngreso')::DATE
        ELSE NULL
      END,
      toma_muestra = CASE
        WHEN p_metadata->>'tomaMuestra' != '' AND p_metadata->>'tomaMuestra' IS NOT NULL
        THEN (p_metadata->>'tomaMuestra')::DATE
        ELSE NULL
      END,
      fecha_validacion = CASE
        WHEN p_metadata->>'fechaValidacion' != '' AND p_metadata->>'fechaValidacion' IS NOT NULL
        THEN (p_metadata->>'fechaValidacion')::DATE
        ELSE NULL
      END,
      profesional_solicitante = p_metadata->>'profesionalSolicitante',
      procedencia = p_metadata->>'procedencia',
      file_name = p_file_name,
      file_path = p_file_path,
      file_size = p_file_size,
      uploaded_by = p_uploaded_by,
      extraction_confidence = CASE
        WHEN p_metadata->>'confidence' IS NOT NULL AND p_metadata->>'confidence' != ''
        THEN (p_metadata->>'confidence')::DECIMAL / 100
        ELSE NULL
      END,
      processing_status = 'processed',
      updated_at = NOW()
    WHERE id = p_existing_report_id;

    lab_report_id := p_existing_report_id;
    RAISE NOTICE 'Updated existing lab report: %', lab_report_id;
  ELSE
    -- Create new lab report
    INSERT INTO lab_reports (
      patient_id,
      folio,
      fecha_ingreso,
      toma_muestra,
      fecha_validacion,
      profesional_solicitante,
      procedencia,
      file_name,
      file_path,
      file_size,
      uploaded_by,
      extraction_confidence,
      processing_status
    ) VALUES (
      patient_id,
      p_metadata->>'folio',
      CASE
        WHEN p_metadata->>'fechaIngreso' != '' AND p_metadata->>'fechaIngreso' IS NOT NULL
        THEN (p_metadata->>'fechaIngreso')::DATE
        ELSE NULL
      END,
      CASE
        WHEN p_metadata->>'tomaMuestra' != '' AND p_metadata->>'tomaMuestra' IS NOT NULL
        THEN (p_metadata->>'tomaMuestra')::DATE
        ELSE NULL
      END,
      CASE
        WHEN p_metadata->>'fechaValidacion' != '' AND p_metadata->>'fechaValidacion' IS NOT NULL
        THEN (p_metadata->>'fechaValidacion')::DATE
        ELSE NULL
      END,
      p_metadata->>'profesionalSolicitante',
      p_metadata->>'procedencia',
      p_file_name,
      p_file_path,
      p_file_size,
      p_uploaded_by,
      CASE
        WHEN p_metadata->>'confidence' IS NOT NULL AND p_metadata->>'confidence' != ''
        THEN (p_metadata->>'confidence')::DECIMAL / 100
        ELSE NULL
      END,
      'processed'
    ) RETURNING id INTO lab_report_id;

    RAISE NOTICE 'Created new lab report: %', lab_report_id;
  END IF;

  -- Process each lab result
  FOR lab_result IN SELECT unnest(p_lab_results)
  LOOP
    -- Insert health marker using correct column names
    INSERT INTO health_markers (
      lab_report_id,
      marker_type,
      value,
      unit,
      extracted_text,
      confidence,
      is_abnormal,
      abnormal_indicator,
      examen,
      resultado_raw,
      valor_referencia,
      metodo,
      tipo_muestra,
      system_code,
      category,
      priority
    ) VALUES (
      lab_report_id,
      COALESCE(lab_result->>'examen', lab_result->>'marker_type', 'Unknown'),
      COALESCE(lab_result->>'resultado', lab_result->>'value', ''),
      COALESCE(lab_result->>'unidad', lab_result->>'unit', ''),
      COALESCE(lab_result->>'context', lab_result->>'extracted_text', ''),
      CASE
        WHEN lab_result->>'confidence' IS NOT NULL AND lab_result->>'confidence' != ''
        THEN (lab_result->>'confidence')::DECIMAL / 100
        ELSE NULL
      END,
      COALESCE((lab_result->>'isAbnormal')::BOOLEAN, false),
      lab_result->>'abnormalIndicator',
      lab_result->>'examen',
      lab_result->>'resultado',
      lab_result->>'valorReferencia',
      lab_result->>'metodo',
      lab_result->>'tipoMuestra',
      lab_result->>'systemCode',
      lab_result->>'category',
      lab_result->>'priority'
    ) RETURNING id INTO health_marker_id;

    -- Create abnormal flag if needed
    IF COALESCE((lab_result->>'isAbnormal')::BOOLEAN, false) THEN
      INSERT INTO abnormal_flags (
        health_marker_id,
        severity,
        is_above_range,
        is_below_range,
        priority_weight
      ) VALUES (
        health_marker_id, -- This is the local variable from the RETURNING clause above
        CASE
          WHEN lab_result->>'priority' = 'critical' THEN 'severe'
          WHEN lab_result->>'priority' = 'high' THEN 'moderate'
          ELSE 'mild'
        END,
        true,
        false,
        CASE
          WHEN lab_result->>'priority' = 'critical' THEN 3
          WHEN lab_result->>'priority' = 'high' THEN 2
          ELSE 1
        END
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Inserted % health markers for lab_report_id: %', array_length(p_lab_results, 1), lab_report_id;

  -- Calculate and update patient priority score
  PERFORM calculate_patient_priority_score(patient_id);

  -- Log audit event
  PERFORM log_audit_event(
    auth.uid(),
    p_uploaded_by,
    CASE WHEN p_overwrite THEN 'lab_reprocess' ELSE 'complete_lab_extraction' END,
    'lab_report',
    lab_report_id,
    p_patient_data->>'rut',
    jsonb_build_object(
      'folio', p_metadata->>'folio',
      'total_results', array_length(p_lab_results, 1),
      'abnormal_count', (
        SELECT COUNT(*)
        FROM unnest(p_lab_results) AS lr
        WHERE COALESCE((lr->>'isAbnormal')::BOOLEAN, false)
      ),
      'overwrite', p_overwrite,
      'existing_report_id', p_existing_report_id
    )
  );

  RETURN lab_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update permissions for the updated function
GRANT EXECUTE ON FUNCTION store_complete_lab_extraction TO authenticated;