-- Complete database schema implementation for Task 6
-- Adds health_markers, normal_ranges, abnormal_flags, and audit_logs tables

-- Create health_markers table with Spanish terminology support
CREATE TABLE IF NOT EXISTS health_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
  marker_type VARCHAR(100) NOT NULL,
  value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  extracted_text TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_indicator TEXT, -- Store [ * ] or other markers from PDF
  severity VARCHAR(20) CHECK (severity IN ('normal', 'mild', 'moderate', 'severe')),
  is_critical_value BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create normal_ranges table for reference values
CREATE TABLE IF NOT EXISTS normal_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_type VARCHAR(100) NOT NULL,
  min_value DECIMAL(10,3),
  max_value DECIMAL(10,3),
  unit VARCHAR(20) NOT NULL,
  source VARCHAR(255) DEFAULT 'Chilean Healthcare Standards',
  raw_text TEXT, -- Original reference text from PDF
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(marker_type, unit, is_active)
);

-- Create abnormal_flags table for flagged values
CREATE TABLE IF NOT EXISTS abnormal_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_marker_id UUID NOT NULL REFERENCES health_markers(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_above_range BOOLEAN NOT NULL,
  is_below_range BOOLEAN NOT NULL,
  priority_weight INTEGER DEFAULT 1,
  flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_range_direction CHECK (is_above_range != is_below_range)
);

-- Create audit_logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT, -- Store email for reference even if user is deleted
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  patient_rut VARCHAR(20), -- For patient-related actions
  details JSONB, -- Additional context data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update lab_reports table to add priority scoring and status tracking
ALTER TABLE lab_reports 
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_date DATE,
ADD COLUMN IF NOT EXISTS laboratory_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'contacted', 'failed'));

-- Update patients table to ensure proper Chilean RUT format
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS age_at_test INTEGER,
ADD COLUMN IF NOT EXISTS sex VARCHAR(10) CHECK (sex IN ('M', 'F', 'masculino', 'femenino')),
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contact_status VARCHAR(50) DEFAULT 'pending' CHECK (contact_status IN ('pending', 'contacted', 'processed'));

-- Enable Row Level Security on new tables
ALTER TABLE health_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE normal_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE abnormal_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_markers
CREATE POLICY "Healthcare workers can read health_markers" ON health_markers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "Healthcare workers can insert health_markers" ON health_markers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "Healthcare workers can update health_markers" ON health_markers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Create RLS policies for normal_ranges
CREATE POLICY "Healthcare workers can read normal_ranges" ON normal_ranges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Only admins can modify normal ranges
CREATE POLICY "Admins can modify normal_ranges" ON normal_ranges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Create RLS policies for abnormal_flags
CREATE POLICY "Healthcare workers can read abnormal_flags" ON abnormal_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "Healthcare workers can insert abnormal_flags" ON abnormal_flags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can read audit_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- System can always insert audit logs
CREATE POLICY "System can insert audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_markers_lab_report_id ON health_markers(lab_report_id);
CREATE INDEX IF NOT EXISTS idx_health_markers_marker_type ON health_markers(marker_type);
CREATE INDEX IF NOT EXISTS idx_health_markers_is_abnormal ON health_markers(is_abnormal);
CREATE INDEX IF NOT EXISTS idx_health_markers_is_critical ON health_markers(is_critical_value);

CREATE INDEX IF NOT EXISTS idx_normal_ranges_marker_type ON normal_ranges(marker_type);
CREATE INDEX IF NOT EXISTS idx_normal_ranges_active ON normal_ranges(is_active);

CREATE INDEX IF NOT EXISTS idx_abnormal_flags_health_marker_id ON abnormal_flags(health_marker_id);
CREATE INDEX IF NOT EXISTS idx_abnormal_flags_severity ON abnormal_flags(severity);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_rut ON audit_logs(patient_rut);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_reports_priority_score ON lab_reports(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON lab_reports(status);
CREATE INDEX IF NOT EXISTS idx_lab_reports_test_date ON lab_reports(test_date DESC);

CREATE INDEX IF NOT EXISTS idx_patients_priority_score ON patients(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_patients_contact_status ON patients(contact_status);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_health_markers_updated_at 
  BEFORE UPDATE ON health_markers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_normal_ranges_updated_at 
  BEFORE UPDATE ON normal_ranges 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial normal ranges for Chilean healthcare markers
INSERT INTO normal_ranges (marker_type, min_value, max_value, unit, source) VALUES
-- Glucose/Glicemia
('GLICEMIA EN AYUNO', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),
('GLUCOSA', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),
('GLICEMIA', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),

-- Cholesterol
('COLESTEROL TOTAL', 0, 200, 'mg/dL', 'Chilean Healthcare Standards'),
('COLESTEROL', 0, 200, 'mg/dL', 'Chilean Healthcare Standards'),
('COL TOTAL', 0, 200, 'mg/dL', 'Chilean Healthcare Standards'),

-- Triglycerides
('TRIGLICERIDOS', 0, 150, 'mg/dL', 'Chilean Healthcare Standards'),
('TRIGLICERIDEMIA', 0, 150, 'mg/dL', 'Chilean Healthcare Standards'),
('TG', 0, 150, 'mg/dL', 'Chilean Healthcare Standards'),

-- Liver enzymes
('ALT', 7, 56, 'U/L', 'Chilean Healthcare Standards'),
('TGP', 7, 56, 'U/L', 'Chilean Healthcare Standards'),
('AST', 10, 40, 'U/L', 'Chilean Healthcare Standards'),
('TGO', 10, 40, 'U/L', 'Chilean Healthcare Standards'),
('TRANSAMINASAS ALT', 7, 56, 'U/L', 'Chilean Healthcare Standards'),
('TRANSAMINASAS AST', 10, 40, 'U/L', 'Chilean Healthcare Standards'),

-- Thyroid
('H. TIROESTIMULANTE (TSH)', 0.55, 4.78, 'μUI/mL', 'Chilean Healthcare Standards'),
('TSH', 0.55, 4.78, 'μUI/mL', 'Chilean Healthcare Standards'),
('TIROTROPINA', 0.55, 4.78, 'μUI/mL', 'Chilean Healthcare Standards'),

-- HbA1c
('HEMOGLOBINA GLICADA A1C', 4.0, 6.0, '%', 'Chilean Healthcare Standards'),
('HBA1C', 4.0, 6.0, '%', 'Chilean Healthcare Standards'),
('HEMOGLOBINA GLICOSILADA', 4.0, 6.0, '%', 'Chilean Healthcare Standards')

ON CONFLICT (marker_type, unit, is_active) DO NOTHING;

-- Create function to automatically log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_patient_rut TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    patient_rut,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_patient_rut,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate patient priority score
CREATE OR REPLACE FUNCTION calculate_patient_priority_score(p_patient_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  flag_record RECORD;
BEGIN
  -- Calculate priority based on abnormal flags
  FOR flag_record IN 
    SELECT af.severity, af.priority_weight, hm.is_critical_value
    FROM abnormal_flags af
    JOIN health_markers hm ON af.health_marker_id = hm.id
    JOIN lab_reports lr ON hm.lab_report_id = lr.id
    WHERE lr.patient_id = p_patient_id
  LOOP
    -- Base score by severity
    CASE flag_record.severity
      WHEN 'severe' THEN total_score := total_score + 10;
      WHEN 'moderate' THEN total_score := total_score + 5;
      WHEN 'mild' THEN total_score := total_score + 2;
    END CASE;
    
    -- Critical value multiplier
    IF flag_record.is_critical_value THEN
      total_score := total_score + 15;
    END IF;
    
    -- Apply priority weight
    total_score := total_score * flag_record.priority_weight;
  END LOOP;
  
  -- Update patient priority score
  UPDATE patients SET priority_score = total_score WHERE id = p_patient_id;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update priority scores when abnormal flags are added
CREATE OR REPLACE FUNCTION update_patient_priority_on_flag_change()
RETURNS TRIGGER AS $$
DECLARE
  patient_id UUID;
BEGIN
  -- Get patient_id from the health marker
  SELECT lr.patient_id INTO patient_id
  FROM health_markers hm
  JOIN lab_reports lr ON hm.lab_report_id = lr.id
  WHERE hm.id = COALESCE(NEW.health_marker_id, OLD.health_marker_id);
  
  -- Recalculate priority score
  PERFORM calculate_patient_priority_score(patient_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_priority_on_flag_change
  AFTER INSERT OR UPDATE OR DELETE ON abnormal_flags
  FOR EACH ROW EXECUTE FUNCTION update_patient_priority_on_flag_change();

-- Create view for prioritized patients dashboard
CREATE OR REPLACE VIEW prioritized_patients AS
SELECT 
  p.id,
  p.name,
  p.rut,
  p.priority_score,
  p.contact_status,
  p.last_contact_date,
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
         lr.test_date, lr.upload_date, lr.laboratory_name
ORDER BY p.priority_score DESC, lr.upload_date DESC;

-- Grant necessary permissions
GRANT SELECT ON prioritized_patients TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_patient_priority_score TO authenticated;