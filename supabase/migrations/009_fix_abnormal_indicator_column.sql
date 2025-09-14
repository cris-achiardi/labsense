-- Migration 008: Fix missing abnormal_indicator column
-- Ensures the abnormal_indicator column exists in health_markers table

-- Add abnormal_indicator column if it doesn't exist
ALTER TABLE health_markers 
ADD COLUMN IF NOT EXISTS abnormal_indicator TEXT;

-- Add other missing columns that might be needed
ALTER TABLE health_markers 
ADD COLUMN IF NOT EXISTS examen TEXT,
ADD COLUMN IF NOT EXISTS resultado_raw TEXT,
ADD COLUMN IF NOT EXISTS valor_referencia TEXT,
ADD COLUMN IF NOT EXISTS metodo TEXT,
ADD COLUMN IF NOT EXISTS tipo_muestra TEXT DEFAULT 'SUERO',
ADD COLUMN IF NOT EXISTS system_code TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT;

-- Add check constraints for new fields if they don't exist
DO $$
BEGIN
    -- Check if constraint exists before adding
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_tipo_muestra') THEN
        ALTER TABLE health_markers 
        ADD CONSTRAINT check_tipo_muestra 
        CHECK (tipo_muestra IN ('SUERO', 'SANGRE TOTAL', 'ORINA', 'PLASMA'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_category') THEN
        ALTER TABLE health_markers 
        ADD CONSTRAINT check_category 
        CHECK (category IN ('glucose', 'lipids', 'liver', 'thyroid', 'kidney', 'blood', 'electrolytes', 'other'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_priority') THEN
        ALTER TABLE health_markers 
        ADD CONSTRAINT check_priority 
        CHECK (priority IN ('critical', 'high', 'medium', 'low'));
    END IF;
END
$$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_health_markers_abnormal_indicator ON health_markers(abnormal_indicator);
CREATE INDEX IF NOT EXISTS idx_health_markers_examen ON health_markers(examen);
CREATE INDEX IF NOT EXISTS idx_health_markers_system_code ON health_markers(system_code);
CREATE INDEX IF NOT EXISTS idx_health_markers_category ON health_markers(category);
CREATE INDEX IF NOT EXISTS idx_health_markers_priority ON health_markers(priority);
CREATE INDEX IF NOT EXISTS idx_health_markers_tipo_muestra ON health_markers(tipo_muestra);

-- Add comment for documentation
COMMENT ON COLUMN health_markers.abnormal_indicator IS 'Stores abnormal indicators from PDF like [ * ], (*), etc.';