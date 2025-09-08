// Database types matching the complete schema from Task 6

export interface Patient {
  id: string
  rut: string // Chilean format: XX.XXX.XXX-X
  name: string
  age?: string
  gender?: string
  age_at_test?: number
  sex?: 'M' | 'F' | 'masculino' | 'femenino'
  priority_score: number
  last_contact_date?: string | Date
  contact_status: 'pending' | 'contacted' | 'processed'
  created_at: string | Date
  updated_at: string | Date
}

export interface LabReport {
  id: string
  patient_id: string
  file_name: string
  file_path: string
  file_size: number
  upload_date: string | Date
  uploaded_by: string // User email
  extraction_confidence: number
  processing_status: 'pending' | 'processed' | 'failed'
  priority_score: number
  test_date?: string | Date
  laboratory_name?: string
  status: 'pending' | 'processed' | 'contacted' | 'failed'
  created_at: string | Date
  updated_at: string | Date
}

export interface HealthMarker {
  id: string
  lab_report_id: string
  marker_type: string
  value: number
  unit: string
  extracted_text?: string
  confidence?: number // 0-1 scale
  is_abnormal: boolean
  abnormal_indicator?: string // [ * ] or other markers from PDF
  severity?: 'normal' | 'mild' | 'moderate' | 'severe'
  is_critical_value: boolean
  created_at: string | Date
  updated_at: string | Date
}

export interface NormalRange {
  id: string
  marker_type: string
  min_value?: number | null
  max_value?: number | null
  unit: string
  source: string
  raw_text?: string // Original reference text from PDF
  is_active: boolean
  created_at: string | Date
  updated_at: string | Date
}

export interface AbnormalFlag {
  id: string
  health_marker_id: string
  severity: 'mild' | 'moderate' | 'severe'
  is_above_range: boolean
  is_below_range: boolean
  priority_weight: number
  flagged_at: string | Date
}

export interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  resource_type: string
  resource_id?: string
  patient_rut?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string | Date
}

// View types
export interface PrioritizedPatient {
  id: string
  name: string
  rut: string
  priority_score: number
  contact_status: 'pending' | 'contacted' | 'processed'
  last_contact_date?: string | Date
  test_date?: string | Date
  upload_date: string | Date
  laboratory_name?: string
  abnormal_count: number
  abnormal_markers?: string
  priority_level: 'HIGH' | 'MEDIUM' | 'LOW'
  lab_report_id?: string
  pdf_file_path?: string
  age_at_test?: number
  gender?: string
  total_tests_count?: number
}

// Spanish health marker types for Chilean healthcare
export type SpanishHealthMarkerType = 
  | 'GLICEMIA EN AYUNO'
  | 'GLUCOSA'
  | 'GLICEMIA'
  | 'COLESTEROL TOTAL'
  | 'COLESTEROL'
  | 'COL TOTAL'
  | 'TRIGLICERIDOS'
  | 'TRIGLICERIDEMIA'
  | 'TG'
  | 'ALT'
  | 'TGP'
  | 'AST'
  | 'TGO'
  | 'TRANSAMINASAS ALT'
  | 'TRANSAMINASAS AST'
  | 'H. TIROESTIMULANTE (TSH)'
  | 'TSH'
  | 'TIROTROPINA'
  | 'HEMOGLOBINA GLICADA A1C'
  | 'HBA1C'
  | 'HEMOGLOBINA GLICOSILADA'

// Critical value thresholds for Chilean healthcare
export const CRITICAL_VALUE_THRESHOLDS = {
  'GLICEMIA EN AYUNO': { high: 250, low: 50 },
  'GLUCOSA': { high: 250, low: 50 },
  'GLICEMIA': { high: 250, low: 50 },
  'HEMOGLOBINA GLICADA A1C': { high: 10, low: null },
  'HBA1C': { high: 10, low: null },
  'HEMOGLOBINA GLICOSILADA': { high: 10, low: null },
  'COLESTEROL TOTAL': { high: 300, low: null },
  'TRIGLICERIDOS': { high: 500, low: null },
  'ALT': { high: 200, low: null },
  'TGP': { high: 200, low: null },
  'AST': { high: 200, low: null },
  'TGO': { high: 200, low: null },
} as const

// User profile types
export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'healthcare_worker' | 'admin'
  healthcare_role?: 'nurse' | 'medic' | 'nutritionist' | 'psychologist' | 'social_worker' | 'administrative'
  created_at: Date
  last_login?: Date
  updated_at: Date
}

// Validation and confidence scoring types
export interface ValidationResult {
  confidence: number // 0-1 scale
  autoApproved: boolean
  requiresManualReview: boolean
  issues: string[]
  criticalValueDetected: boolean
  structuralIntegrity: number
  contentAccuracy: number
  healthcareLogicScore: number
}

export interface ParsedLabData {
  patientInfo: {
    name?: string
    rut?: string
    age?: string
    sex?: string
    folio?: string
    solicitingDoctor?: string
    fechaIngreso?: Date
    tomaMuestra?: Date
    fechaValidacion?: Date
    procedencia?: string
    testDate?: Date
    laboratoryName?: string
  }
  healthMarkers: Array<{
    type: string
    value: number
    unit: string
    extractedText: string
    confidence: number
    isAbnormal: boolean
    abnormalIndicator?: string
    severity: 'normal' | 'mild' | 'moderate' | 'severe'
    isCriticalValue: boolean
  }>
  validationResult: ValidationResult
}

// Filter and search types
export interface PatientFilters {
  dateRange?: { start: Date; end: Date }
  markerTypes?: string[]
  priorityLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
  contactStatus?: 'pending' | 'contacted' | 'processed'
  searchQuery?: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UploadResult {
  success: boolean
  labReportId?: string
  patientInfo?: ParsedLabData['patientInfo']
  validationResult?: ValidationResult
  errors?: string[]
}

// Dashboard summary types
export interface DashboardSummary {
  totalPatients: number
  pendingReviews: number
  highPriorityPatients: number
  processedToday: number
  averageConfidence: number
  criticalValuesDetected: number
}

// Audit action types for logging
export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD_PDF'
  | 'VIEW_PATIENT'
  | 'UPDATE_PATIENT_STATUS'
  | 'VIEW_PDF'
  | 'MANUAL_REVIEW'
  | 'APPROVE_PARSING'
  | 'REJECT_PARSING'
  | 'UPDATE_NORMAL_RANGES'
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_DATA'
  | 'VIEW_DASHBOARD'
  | 'CREATE_ABNORMAL_FLAGS'

export type ResourceType = 
  | 'patient'
  | 'lab_report'
  | 'health_marker'
  | 'pdf_file'
  | 'user_profile'
  | 'normal_range'
  | 'audit_log'
  | 'dashboard'