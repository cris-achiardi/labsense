# Database Schema Implementation - Task 6

## Overview

This document describes the complete database schema implementation for the Lab Result Prioritization System, completed as part of Phase 3 Task 6.

## Implemented Tables

### Core Tables

#### 1. `patients`
- **Purpose**: Store patient information with Chilean RUT validation
- **Key Features**:
  - Unique RUT constraint for Chilean identification
  - Priority scoring for dashboard prioritization
  - Contact status tracking
  - Support for both age formats (string and numeric)

#### 2. `lab_reports`
- **Purpose**: Store PDF lab reports and processing metadata
- **Key Features**:
  - File storage references
  - Processing status tracking
  - Priority scoring
  - Test date and laboratory information

#### 3. `health_markers`
- **Purpose**: Store extracted health marker values with Spanish terminology
- **Key Features**:
  - Support for Spanish health marker names
  - Confidence scoring for parsing accuracy
  - Abnormal value flagging
  - Critical value detection

#### 4. `normal_ranges`
- **Purpose**: Reference ranges for health markers
- **Key Features**:
  - Chilean healthcare standards
  - Support for multiple units
  - Version control with active/inactive status
  - Raw text preservation from PDFs

#### 5. `abnormal_flags`
- **Purpose**: Flag abnormal health marker values
- **Key Features**:
  - Severity classification (mild/moderate/severe)
  - Direction tracking (above/below range)
  - Priority weighting for scoring

#### 6. `audit_logs`
- **Purpose**: Compliance tracking for healthcare regulations
- **Key Features**:
  - User action logging
  - Patient data access tracking
  - IP address and user agent capture
  - Flexible details storage with JSONB

### Views and Functions

#### `prioritized_patients` View
- Aggregates patient data with priority information
- Includes abnormal marker counts and priority levels
- Optimized for dashboard display

#### Database Functions
- `calculate_patient_priority_score()`: Automatic priority calculation
- `log_audit_event()`: Standardized audit logging
- `update_updated_at_column()`: Automatic timestamp updates

## Security Implementation

### Row Level Security (RLS)
- All tables have RLS enabled
- Healthcare workers can access patient data
- Admins have additional privileges for system management
- Audit logs restricted to admin access only

### Data Protection
- Patient RUT anonymization support
- Secure audit logging
- IP address tracking for compliance
- User agent logging for security

## Spanish Healthcare Support

### Health Marker Types
The system supports Chilean Spanish terminology:
- `GLICEMIA EN AYUNO` (Fasting Glucose)
- `COLESTEROL TOTAL` (Total Cholesterol)
- `TRIGLICERIDOS` (Triglycerides)
- `ALT/TGP` (Liver Enzymes)
- `AST/TGO` (Liver Enzymes)
- `H. TIROESTIMULANTE (TSH)` (Thyroid)
- `HEMOGLOBINA GLICADA A1C` (HbA1c)

### Normal Ranges
Pre-populated with Chilean healthcare standards:
- Glucose: 74-106 mg/dL
- Cholesterol: 0-200 mg/dL
- Triglycerides: 0-150 mg/dL
- TSH: 0.55-4.78 μUI/mL
- HbA1c: 4-6%

## Critical Value Detection

### Thresholds
- Glucose ≥250 mg/dL or ≤50 mg/dL
- HbA1c ≥10%
- Cholesterol ≥300 mg/dL
- Triglycerides ≥500 mg/dL
- Liver enzymes ≥200 U/L

## Priority Scoring Algorithm

### Calculation Logic
1. **Base Severity Score**:
   - Severe: 10 points
   - Moderate: 5 points
   - Mild: 2 points

2. **Critical Value Bonus**: +15 points

3. **Priority Weight Multiplier**: 1-3x based on severity

4. **Automatic Updates**: Triggers recalculate patient priority when flags change

## Files Created

### Migration
- `supabase/migrations/006_complete_database_schema.sql`

### TypeScript Types
- `src/types/database.ts` - Complete database type definitions
- Updated `src/lib/database/supabase.ts` - Supabase client types

### Helper Libraries
- `src/lib/database/schema-helpers.ts` - Database operation helpers
- `src/lib/database/init-schema.ts` - Development and testing utilities
- `src/lib/database/index.ts` - Main database interface

### Documentation
- `docs/database-schema-implementation.md` - This document

## Usage Examples

### Creating a Patient
```typescript
import { db } from '@/lib/database'

const patient = await db.createPatient({
  rut: '12.345.678-9',
  name: 'Juan Pérez',
  priority_score: 0,
  contact_status: 'pending'
})
```

### Processing Lab Results
```typescript
const labReport = await dbOperations.createLabReportWithProcessing(
  patientId,
  'lab_report.pdf',
  '/storage/path',
  1024000,
  'user@example.com',
  extractedData
)
```

### Getting Prioritized Patients
```typescript
const patients = await db.getPrioritizedPatients(50, 0, {
  priorityLevel: 'HIGH',
  contactStatus: 'pending'
})
```

### Audit Logging
```typescript
await db.logAuditEvent(
  userId,
  userEmail,
  'VIEW_PATIENT',
  'patient',
  patientId,
  patientRut
)
```

## Testing and Development

### Schema Initialization
```bash
# Check schema status
node src/lib/database/init-schema.ts status

# Initialize schema
node src/lib/database/init-schema.ts init

# Create test data
node src/lib/database/init-schema.ts test-data
```

### Database Migration
```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/006_complete_database_schema.sql
```

## Next Steps

With the database schema complete, the system is ready for:
1. **Task 7**: Abnormal Value Detection implementation
2. **Dashboard Integration**: Connect UI components to database
3. **PDF Processing**: Store extracted data in new schema
4. **Audit Compliance**: Implement comprehensive logging

## Compliance Notes

This schema implementation supports:
- ✅ Chilean healthcare data standards
- ✅ Patient data protection (RUT anonymization)
- ✅ Comprehensive audit trails
- ✅ Role-based access control
- ✅ Data retention policies
- ✅ Spanish medical terminology

The implementation follows healthcare data protection best practices and provides a solid foundation for the complete Lab Result Prioritization System.