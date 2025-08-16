-- Migration 007: Add fields for complete lab extraction (Task 11.1)
-- Adds folio, dates, healthcare context, and enhanced lab result fields

-- Add folio and healthcare context fields to lab_reports table
ALTER TABLE lab_reports 
ADD COLUMN IF NOT EXISTS folio TEXT UNIQUE, -- Unique exam identifier for duplicate prevention
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE, -- Registration date
ADD COLUMN IF NOT EXISTS toma_muestra DATE, -- Sample collection date (most important)
ADD COLUMN IF NOT EXISTS fecha_validacion DATE, -- Validation date
ADD COLUMN IF NOT EXISTS profesional_solicitante TEXT, -- Requesting doctor
ADD COLUMN IF NOT EXISTS procedencia TEXT; -- Primary care center (CESFAM, etc.)

-- Add constraint to prevent duplicate folios
CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_reports_folio_unique 
ON lab_reports(folio) WHERE folio IS NOT NULL;

-- Update health_markers table to support complete lab result data
ALTER TABLE health_markers 
ADD COLUMN IF NOT EXISTS examen TEXT, -- Spanish lab name (e.g., "GLICEMIA EN AYUNO (BASAL)")
ADD COLUMN IF NOT EXISTS resultado_raw TEXT, -- Raw result value as extracted
ADD COLUMN IF NOT EXISTS valor_referencia TEXT, -- Reference range text from PDF
ADD COLUMN IF NOT EXISTS metodo TEXT, -- Method (Hexoquinasa, Enzimático, etc.)
ADD COLUMN IF NOT EXISTS tipo_muestra TEXT DEFAULT 'SUERO', -- Sample type (SUERO, SANGRE TOTAL, ORINA)
ADD COLUMN IF NOT EXISTS system_code TEXT, -- Mapped system code (glucose_fasting, hba1c, etc.)
ADD COLUMN IF NOT EXISTS category TEXT, -- Category (glucose, lipids, liver, thyroid, etc.)
ADD COLUMN IF NOT EXISTS priority TEXT; -- Priority (critical, high, medium, low)

-- Add check constraints for new fields
ALTER TABLE health_markers 
ADD CONSTRAINT check_tipo_muestra 
CHECK (tipo_muestra IN ('SUERO', 'SANGRE TOTAL', 'ORINA', 'PLASMA'));

ALTER TABLE health_markers 
ADD CONSTRAINT check_category 
CHECK (category IN ('glucose', 'lipids', 'liver', 'thyroid', 'kidney', 'blood', 'other'));

ALTER TABLE health_markers 
ADD CONSTRAINT check_priority 
CHECK (priority IN ('critical', 'high', 'medium', 'low'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_lab_reports_folio ON lab_reports(folio);
CREATE INDEX IF NOT EXISTS idx_lab_reports_toma_muestra ON lab_reports(toma_muestra DESC);
CREATE INDEX IF NOT EXISTS idx_lab_reports_procedencia ON lab_reports(procedencia);

CREATE INDEX IF NOT EXISTS idx_health_markers_examen ON health_markers(examen);
CREATE INDEX IF NOT EXISTS idx_health_markers_system_code ON health_markers(system_code);
CREATE INDEX IF NOT EXISTS idx_health_markers_category ON health_markers(category);
CREATE INDEX IF NOT EXISTS idx_health_markers_priority ON health_markers(priority);
CREATE INDEX IF NOT EXISTS idx_health_markers_tipo_muestra ON health_markers(tipo_muestra);

-- Update normal_ranges table to support more Chilean lab markers
-- Add comprehensive Chilean healthcare normal ranges
INSERT INTO normal_ranges (marker_type, min_value, max_value, unit, source) VALUES
-- Additional glucose markers
('GLICEMIA EN AYUNO (BASAL)', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),
('GLUCOSA EN AYUNO', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),

-- HDL/LDL Cholesterol
('COLESTEROL HDL', 40, 999, 'mg/dL', 'Chilean Healthcare Standards'),
('COLESTEROL LDL', 0, 130, 'mg/dL', 'Chilean Healthcare Standards'),

-- Liver enzymes with Chilean terminology
('GOT (A.S.T)', 10, 40, 'U/L', 'Chilean Healthcare Standards'),
('GPT (A.L.T)', 7, 56, 'U/L', 'Chilean Healthcare Standards'),
('FOSF. ALCALINAS', 46, 116, 'U/L', 'Chilean Healthcare Standards'),
('FOSFATASA ALCALINA', 46, 116, 'U/L', 'Chilean Healthcare Standards'),

-- Kidney function
('CREATININA', 0.6, 1.2, 'mg/dL', 'Chilean Healthcare Standards'),
('UREA', 15, 45, 'mg/dL', 'Chilean Healthcare Standards'),
('ACIDO URICO', 3.5, 7.0, 'mg/dL', 'Chilean Healthcare Standards'),

-- Blood count
('HEMOGLOBINA', 12.0, 16.0, 'g/dL', 'Chilean Healthcare Standards'),
('HEMATOCRITO', 36, 48, '%', 'Chilean Healthcare Standards'),
('GLOBULOS ROJOS', 4.0, 5.5, 'mill/mm³', 'Chilean Healthcare Standards'),
('GLOBULOS BLANCOS', 4000, 11000, '/mm³', 'Chilean Healthcare Standards'),
('PLAQUETAS', 150000, 450000, '/mm³', 'Chilean Healthcare Standards'),

-- Thyroid hormones
('T4 LIBRE', 0.8, 1.8, 'ng/dL', 'Chilean Healthcare Standards'),
('T3 LIBRE', 2.3, 4.2, 'pg/mL', 'Chilean Healthcare Standards'),

-- Other important markers
('PROTEINA C REACTIVA', 0, 3, 'mg/L', 'Chilean Healthcare Standards'),
('PCR', 0, 3, 'mg/L', 'Chilean Healthcare Standards'),
('FERRITINA', 15, 300, 'ng/mL', 'Chilean Healthcare Standards'),
('VITAMINA D', 30, 100, 'ng/mL', 'Chilean Healthcare Standards'),
('VITAMINA B12', 200, 900, 'pg/mL', 'Chilean Healthcare Standards');

-- Create function to extract folio from lab report for duplicate checking
CREATE OR REPLACE FUNCTION check_duplicate_folio()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if folio already exists (only if folio is provided)
  IF NEW.folio IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM lab_reports WHERE folio = NEW.folio AND id != NEW.id) THEN
      RAISE EXCEPTION 'Lab report with folio % already exists', NEW.folio;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicate folios
CREATE TRIGGER trigger_check_duplicate_folio
  BEFORE INSERT OR UPDATE ON lab_reports
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_folio();

-- Create function to store complete lab extraction results
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
      COALESCE((lab_result->>'resultado')::DECIMAL, 0),
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

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION store_complete_lab_extraction TO authenticated;

-- Create view for complete lab report data
CREATE OR REPLACE VIEW complete_lab_reports AS
SELECT 
  lr.id as lab_report_id,
  lr.folio,
  lr.toma_muestra,
  lr.fecha_validacion,
  lr.profesional_solicitante,
  lr.procedencia,
  lr.upload_date,
  lr.extraction_confidence,
  p.id as patient_id,
  p.rut,
  p.name as patient_name,
  p.age,
  p.gender,
  p.priority_score,
  p.contact_status,
  COUNT(hm.id) as total_markers,
  COUNT(CASE WHEN hm.is_abnormal THEN 1 END) as abnormal_markers,
  COUNT(CASE WHEN hm.priority = 'critical' AND hm.is_abnormal THEN 1 END) as critical_markers,
  STRING_AGG(
    CASE WHEN hm.is_abnormal THEN hm.examen END, 
    ', ' ORDER BY hm.priority DESC, hm.examen
  ) as abnormal_marker_names
FROM lab_reports lr
JOIN patients p ON lr.patient_id = p.id
LEFT JOIN health_markers hm ON lr.id = hm.lab_report_id
GROUP BY lr.id, lr.folio, lr.toma_muestra, lr.fecha_validacion, lr.profesional_solicitante, 
         lr.procedencia, lr.upload_date, lr.extraction_confidence,
         p.id, p.rut, p.name, p.age, p.gender, p.priority_score, p.contact_status
ORDER BY p.priority_score DESC, lr.upload_date DESC;

-- Grant permissions for the new view
GRANT SELECT ON complete_lab_reports TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN lab_reports.folio IS 'Unique exam identifier from Chilean lab reports for duplicate prevention';
COMMENT ON COLUMN lab_reports.toma_muestra IS 'Sample collection date - most important for medical timeline';
COMMENT ON COLUMN health_markers.examen IS 'Spanish lab name as it appears in the PDF';
COMMENT ON COLUMN health_markers.resultado_raw IS 'Raw result value as extracted from PDF';
COMMENT ON COLUMN health_markers.valor_referencia IS 'Reference range text exactly as it appears in PDF';
COMMENT ON COLUMN health_markers.system_code IS 'Standardized system code for health marker';
COMMENT ON FUNCTION store_complete_lab_extraction IS 'Stores complete lab extraction results with all metadata and relationships';