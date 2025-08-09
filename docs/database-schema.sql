-- LabSense Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'healthcare_worker',
  healthcare_role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lab reports table
CREATE TABLE lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  uploaded_by UUID REFERENCES users(id),
  pdf_url VARCHAR(500) NOT NULL,
  test_date DATE,
  laboratory_name VARCHAR(255),
  priority_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Health markers table
CREATE TABLE health_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_report_id UUID REFERENCES lab_reports(id),
  marker_type VARCHAR(100) NOT NULL,
  value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  extracted_text TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Normal ranges table
CREATE TABLE normal_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_type VARCHAR(100) NOT NULL,
  min_value DECIMAL(10,3) NOT NULL,
  max_value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Abnormal flags table
CREATE TABLE abnormal_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_marker_id UUID REFERENCES health_markers(id),
  severity VARCHAR(20) NOT NULL,
  is_above_range BOOLEAN NOT NULL,
  is_below_range BOOLEAN NOT NULL,
  flagged_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  patient_rut VARCHAR(20),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE abnormal_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Healthcare workers can view all patients and lab reports
CREATE POLICY "Healthcare workers can view patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('healthcare_worker', 'admin')
    )
  );

CREATE POLICY "Healthcare workers can view lab reports" ON lab_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('healthcare_worker', 'admin')
    )
  );

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Insert some initial normal ranges for Chilean healthcare
INSERT INTO normal_ranges (marker_type, min_value, max_value, unit, source) VALUES
('GLICEMIA EN AYUNO', 74, 106, 'mg/dL', 'Chilean Healthcare Standards'),
('COLESTEROL TOTAL', 0, 200, 'mg/dL', 'Chilean Healthcare Standards'),
('TRIGLICERIDOS', 0, 150, 'mg/dL', 'Chilean Healthcare Standards'),
('H. TIROESTIMULANTE (TSH)', 0.55, 4.78, 'μUI/mL', 'Chilean Healthcare Standards'),
('HEMOGLOBINA GLICADA A1C', 4, 6, '%', 'Chilean Healthcare Standards');

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-pdfs', 'lab-pdfs', false);

-- Storage policy for lab PDFs
CREATE POLICY "Healthcare workers can upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lab-pdfs' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('healthcare_worker', 'admin')
    )
  );

CREATE POLICY "Healthcare workers can view PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lab-pdfs' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('healthcare_worker', 'admin')
    )
  );