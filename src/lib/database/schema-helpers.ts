// Database schema helper functions for Task 6 implementation

import { createClient } from '@supabase/supabase-js'
import { 
  Patient, 
  LabReport, 
  HealthMarker, 
  NormalRange, 
  AbnormalFlag, 
  AuditLog,
  PrioritizedPatient,
  ValidationResult,
  ParsedLabData,
  CRITICAL_VALUE_THRESHOLDS,
  AuditAction,
  ResourceType
} from '@/types/database'

// Initialize Supabase client (will be imported from existing supabase.ts)
// This is just for type reference - actual client should come from existing setup

export class DatabaseSchemaHelpers {
  constructor(private supabase: any) {}

  // Patient operations
  async createPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const { data, error } = await this.supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getPatientByRut(rut: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('rut', rut)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updatePatientContactStatus(
    patientId: string, 
    status: 'pending' | 'contacted' | 'processed',
    userId: string,
    userEmail: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('patients')
      .update({ 
        contact_status: status,
        last_contact_date: status !== 'pending' ? new Date().toISOString() : null
      })
      .eq('id', patientId)

    if (error) throw error

    // Log the action
    await this.logAuditEvent(
      userId,
      userEmail,
      'UPDATE_PATIENT_STATUS',
      'patient',
      patientId,
      undefined,
      { new_status: status, previous_status: 'pending' }
    )
  }

  // Lab report operations
  async createLabReport(reportData: Omit<LabReport, 'id' | 'created_at' | 'updated_at'>): Promise<LabReport> {
    const { data, error } = await this.supabase
      .from('lab_reports')
      .insert(reportData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getLabReportsByPatient(patientId: string): Promise<LabReport[]> {
    const { data, error } = await this.supabase
      .from('lab_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Health marker operations
  async createHealthMarkers(markers: Omit<HealthMarker, 'id' | 'created_at' | 'updated_at'>[]): Promise<HealthMarker[]> {
    const { data, error } = await this.supabase
      .from('health_markers')
      .insert(markers)
      .select()

    if (error) throw error
    return data || []
  }

  async getHealthMarkersByLabReport(labReportId: string): Promise<HealthMarker[]> {
    const { data, error } = await this.supabase
      .from('health_markers')
      .select('*')
      .eq('lab_report_id', labReportId)
      .order('marker_type')

    if (error) throw error
    return data || []
  }

  // Normal range operations
  async getNormalRanges(): Promise<NormalRange[]> {
    const { data, error } = await this.supabase
      .from('normal_ranges')
      .select('*')
      .eq('is_active', true)
      .order('marker_type')

    if (error) throw error
    return data || []
  }

  async getNormalRangeForMarker(markerType: string, unit: string): Promise<NormalRange | null> {
    const { data, error } = await this.supabase
      .from('normal_ranges')
      .select('*')
      .eq('marker_type', markerType)
      .eq('unit', unit)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateNormalRange(
    id: string, 
    updates: Partial<NormalRange>,
    userId: string,
    userEmail: string
  ): Promise<NormalRange> {
    const { data, error } = await this.supabase
      .from('normal_ranges')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log the action
    await this.logAuditEvent(
      userId,
      userEmail,
      'UPDATE_NORMAL_RANGES',
      'normal_range',
      id,
      undefined,
      { updates }
    )

    return data
  }

  // Abnormal flag operations
  async createAbnormalFlags(flags: Omit<AbnormalFlag, 'id' | 'flagged_at'>[]): Promise<AbnormalFlag[]> {
    const { data, error } = await this.supabase
      .from('abnormal_flags')
      .insert(flags)
      .select()

    if (error) throw error
    return data || []
  }

  async getAbnormalFlagsByPatient(patientId: string): Promise<AbnormalFlag[]> {
    const { data, error } = await this.supabase
      .from('abnormal_flags')
      .select(`
        *,
        health_markers!inner(
          *,
          lab_reports!inner(
            patient_id
          )
        )
      `)
      .eq('health_markers.lab_reports.patient_id', patientId)

    if (error) throw error
    return data || []
  }

  // Priority and flagging logic
  async flagAbnormalValues(healthMarkers: HealthMarker[]): Promise<AbnormalFlag[]> {
    const flags: Omit<AbnormalFlag, 'id' | 'flagged_at'>[] = []
    const normalRanges = await this.getNormalRanges()

    for (const marker of healthMarkers) {
      const normalRange = normalRanges.find(
        nr => nr.marker_type === marker.marker_type && nr.unit === marker.unit
      )

      if (!normalRange) continue

      let isAbnormal = false
      let isAboveRange = false
      let isBelowRange = false
      let severity: 'mild' | 'moderate' | 'severe' = 'mild'

      // Check if value is outside normal range
      if (normalRange.max_value && marker.value > normalRange.max_value) {
        isAbnormal = true
        isAboveRange = true
      } else if (normalRange.min_value && marker.value < normalRange.min_value) {
        isAbnormal = true
        isBelowRange = true
      }

      if (isAbnormal) {
        // Determine severity based on how far outside normal range
        const range = (normalRange.max_value || 0) - (normalRange.min_value || 0)
        const deviation = isAboveRange 
          ? marker.value - (normalRange.max_value || 0)
          : (normalRange.min_value || 0) - marker.value

        const deviationPercent = (deviation / range) * 100

        if (deviationPercent > 50) {
          severity = 'severe'
        } else if (deviationPercent > 20) {
          severity = 'moderate'
        }

        // Check for critical values
        const criticalThreshold = CRITICAL_VALUE_THRESHOLDS[marker.marker_type as keyof typeof CRITICAL_VALUE_THRESHOLDS]
        if (criticalThreshold) {
          if (criticalThreshold.high && marker.value >= criticalThreshold.high) {
            severity = 'severe'
          }
          if (criticalThreshold.low && marker.value <= criticalThreshold.low) {
            severity = 'severe'
          }
        }

        flags.push({
          health_marker_id: marker.id,
          severity,
          is_above_range: isAboveRange,
          is_below_range: isBelowRange,
          priority_weight: severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1
        })

        // Update the health marker
        await this.supabase
          .from('health_markers')
          .update({
            is_abnormal: true,
            severity,
            is_critical_value: severity === 'severe'
          })
          .eq('id', marker.id)
      }
    }

    if (flags.length > 0) {
      return await this.createAbnormalFlags(flags)
    }

    return []
  }

  // Dashboard and prioritization
  async getPrioritizedPatients(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      priorityLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
      contactStatus?: 'pending' | 'contacted' | 'processed'
      searchQuery?: string
    }
  ): Promise<PrioritizedPatient[]> {
    let query = this.supabase
      .from('prioritized_patients')
      .select('*')

    if (filters?.priorityLevel) {
      query = query.eq('priority_level', filters.priorityLevel)
    }

    if (filters?.contactStatus) {
      query = query.eq('contact_status', filters.contactStatus)
    }

    if (filters?.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,rut.ilike.%${filters.searchQuery}%`)
    }

    const { data, error } = await query
      .order('priority_score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  async calculatePatientPriorityScore(patientId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('calculate_patient_priority_score', { p_patient_id: patientId })

    if (error) throw error
    return data || 0
  }

  // Audit logging
  async logAuditEvent(
    userId: string,
    userEmail: string,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    patientRut?: string,
    details?: Record<string, any>
  ): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .rpc('log_audit_event', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_patient_rut: patientRut,
        p_details: details
      })

    if (error) throw error
    return data
  }

  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
    filters?: {
      userId?: string
      action?: AuditAction
      resourceType?: ResourceType
      patientRut?: string
      dateRange?: { start: Date; end: Date }
    }
  ): Promise<AuditLog[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*')

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType)
    }

    if (filters?.patientRut) {
      query = query.eq('patient_rut', filters.patientRut)
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString())
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  // Validation helpers
  async validateParsedData(
    extractedData: ParsedLabData,
    originalText: string
  ): Promise<ValidationResult> {
    let confidence = 0
    let issues: string[] = []
    let criticalValueDetected = false

    // Structural integrity check
    let structuralIntegrity = 0
    if (extractedData.patientInfo.rut) structuralIntegrity += 25
    if (extractedData.patientInfo.name) structuralIntegrity += 25
    if (extractedData.healthMarkers.length > 0) structuralIntegrity += 25
    if (extractedData.patientInfo.testDate) structuralIntegrity += 25

    // Content accuracy check
    let contentAccuracy = 0
    const validMarkers = extractedData.healthMarkers.filter(m => m.value > 0 && m.unit)
    contentAccuracy = (validMarkers.length / Math.max(extractedData.healthMarkers.length, 1)) * 100

    // Healthcare logic check
    let healthcareLogicScore = 100
    for (const marker of extractedData.healthMarkers) {
      // Check for impossible values
      if (marker.value < 0 || marker.value > 10000) {
        healthcareLogicScore -= 20
        issues.push(`Impossible value for ${marker.type}: ${marker.value}`)
      }

      // Check for critical values
      const criticalThreshold = CRITICAL_VALUE_THRESHOLDS[marker.type as keyof typeof CRITICAL_VALUE_THRESHOLDS]
      if (criticalThreshold) {
        if (criticalThreshold.high && marker.value >= criticalThreshold.high) {
          criticalValueDetected = true
        }
        if (criticalThreshold.low && marker.value <= criticalThreshold.low) {
          criticalValueDetected = true
        }
      }
    }

    // Calculate overall confidence
    confidence = (structuralIntegrity + contentAccuracy + healthcareLogicScore) / 3

    const autoApproved = confidence >= 85 && !criticalValueDetected
    const requiresManualReview = confidence < 70 || criticalValueDetected

    return {
      confidence: confidence / 100, // Convert to 0-1 scale
      autoApproved,
      requiresManualReview,
      issues,
      criticalValueDetected,
      structuralIntegrity,
      contentAccuracy,
      healthcareLogicScore
    }
  }
}