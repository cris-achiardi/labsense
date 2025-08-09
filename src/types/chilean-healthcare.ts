// Chilean healthcare-specific types

export interface ChileanPatient {
  id: string
  name: string
  rut: string // Chilean format: XX.XXX.XXX-X
  age: {
    years: number
    months: number
    days: number
  }
  sex: 'Masculino' | 'Femenino'
  folio: string
  solicitingDoctor: string
  fechaIngreso: Date
  tomaMuestra: Date // Most important for medical timeline
  fechaValidacion: Date
  procedencia: string // Primary care center
}

export interface ChileanLabResult {
  id: string
  patientId: string
  examen: string // Spanish lab name
  resultado: string | number
  unidad: string
  valorReferencia: string // Raw reference text from PDF
  metodo: string
  tipoMuestra: string // SUERO, SANGRE TOTAL, ORINA
  isAbnormal: boolean
  abnormalIndicator?: string // [ * ] or other markers
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
  isCriticalValue: boolean
  confidence: number // 0-100 parsing confidence
  createdAt: Date
}

export interface PriorityScore {
  patientId: string
  totalScore: number
  priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  abnormalCount: number
  criticalValueCount: number
  calculatedAt: Date
}

export interface ValidationResult {
  confidence: number // 0-100
  autoApproved: boolean
  requiresManualReview: boolean
  issues: string[]
  criticalValueDetected: boolean
  structuralIntegrity: number
  contentAccuracy: number
  healthcareLogicScore: number
}

export type UserRole = 'healthcare_worker' | 'admin'

export interface HealthcareWorker {
  id: string
  email: string
  name: string
  role: UserRole
  healthcareRole?: 'nurse' | 'medic' | 'nutritionist' | 'psychologist' | 'social_worker' | 'administrative'
  createdAt: Date
  lastLogin: Date
}