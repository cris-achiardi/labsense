// Main database interface for Task 6 schema implementation

import { supabase } from './supabase'
import { DatabaseSchemaHelpers } from './schema-helpers'

// Create a singleton instance of our database helpers
export const db = new DatabaseSchemaHelpers(supabase)

// Re-export the supabase client for direct access when needed
export { supabase }

// Re-export types for convenience
export type {
  Patient,
  LabReport,
  HealthMarker,
  NormalRange,
  AbnormalFlag,
  AuditLog,
  PrioritizedPatient,
  ValidationResult,
  ParsedLabData,
  UserProfile,
  PatientFilters,
  ApiResponse,
  UploadResult,
  DashboardSummary,
  AuditAction,
  ResourceType,
  SpanishHealthMarkerType
} from '@/types/database'

export { CRITICAL_VALUE_THRESHOLDS } from '@/types/database'

// Export database initialization functions
export { initializeSchema, getSchemaStatus, createTestData } from './init-schema'

// Convenience functions for common operations
export const dbOperations = {
  // Patient operations
  async createPatient(patientData: { rut: string; name: string; age?: string; gender?: string }) {
    return db.createPatient({
      ...patientData,
      priority_score: 0,
      contact_status: 'pending'
    })
  },

  async findOrCreatePatient(rut: string, name: string) {
    const existing = await db.getPatientByRut(rut)
    if (existing) return existing
    
    return db.createPatient({
      rut,
      name,
      priority_score: 0,
      contact_status: 'pending'
    })
  },

  // Lab report operations
  async createLabReportWithProcessing(
    patientId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    uploadedBy: string,
    extractedData?: any
  ) {
    const labReport = await db.createLabReport({
      patient_id: patientId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      upload_date: new Date(),
      uploaded_by: uploadedBy,
      extraction_confidence: extractedData?.validationResult?.confidence ? 
        Math.round(extractedData.validationResult.confidence * 100) : 0,
      processing_status: 'pending',
      priority_score: 0,
      test_date: extractedData?.patientInfo?.testDate || null,
      laboratory_name: extractedData?.patientInfo?.laboratoryName || null,
      status: 'pending'
    })

    // If we have extracted health markers, create them
    if (extractedData?.healthMarkers?.length > 0) {
      const healthMarkers = extractedData.healthMarkers.map((marker: any) => ({
        lab_report_id: labReport.id,
        marker_type: marker.type,
        value: marker.value,
        unit: marker.unit,
        extracted_text: marker.extractedText,
        confidence: marker.confidence,
        is_abnormal: marker.isAbnormal,
        abnormal_indicator: marker.abnormalIndicator,
        severity: marker.severity,
        is_critical_value: marker.isCriticalValue
      }))

      const createdMarkers = await db.createHealthMarkers(healthMarkers)
      
      // Flag abnormal values and update priority scores
      await db.flagAbnormalValues(createdMarkers)
      await db.calculatePatientPriorityScore(patientId)
    }

    return labReport
  },

  // Dashboard operations
  async getDashboardData(userId: string, userEmail: string) {
    // Log dashboard access
    await db.logAuditEvent(userId, userEmail, 'VIEW_DASHBOARD', 'dashboard')

    const patients = await db.getPrioritizedPatients(50, 0)
    
    const summary = {
      totalPatients: patients.length,
      pendingReviews: patients.filter(p => p.contact_status === 'pending').length,
      highPriorityPatients: patients.filter(p => p.priority_level === 'HIGH').length,
      processedToday: patients.filter(p => {
        const today = new Date().toISOString().split('T')[0]
        const contactDate = typeof p.last_contact_date === 'string' 
          ? p.last_contact_date 
          : p.last_contact_date?.toISOString()
        return contactDate?.startsWith(today)
      }).length,
      averageConfidence: 0, // Would need to calculate from lab reports
      criticalValuesDetected: patients.filter(p => p.priority_level === 'HIGH').length
    }

    return { patients, summary }
  },

  // Audit operations
  async logUserAction(
    userId: string,
    userEmail: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    patientRut?: string,
    details?: any
  ) {
    return db.logAuditEvent(
      userId,
      userEmail,
      action as any,
      resourceType as any,
      resourceId,
      patientRut,
      details
    )
  }
}

// Export the main database interface
export default db