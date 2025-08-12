// Abnormal flags storage system for Task 7: Abnormal Value Detection

import { supabase } from '@/lib/database/supabase'
import { AbnormalFlag, HealthMarker, NormalRange } from '@/types/database'
import { SeverityClassifier, SeverityClassification } from './severity-classifier'
import { PriorityScorer } from './priority-scorer'
import { CriticalThresholdChecker } from './critical-thresholds'

export interface FlagCreationResult {
  success: boolean
  flagsCreated: number
  criticalValuesDetected: number
  priorityScoreUpdated: boolean
  errors: string[]
}

export interface FlagSummary {
  totalFlags: number
  bySeverity: {
    mild: number
    moderate: number
    severe: number
  }
  byDirection: {
    aboveRange: number
    belowRange: number
  }
  criticalValues: number
  averagePriorityWeight: number
}

export class AbnormalFlagStorage {
  /**
   * Process health markers and create abnormal flags
   */
  static async processAndCreateFlags(
    labReportId: string,
    patientId: string,
    healthMarkers: HealthMarker[],
    normalRanges: NormalRange[],
    userId: string,
    userEmail: string
  ): Promise<FlagCreationResult> {
    const result: FlagCreationResult = {
      success: false,
      flagsCreated: 0,
      criticalValuesDetected: 0,
      priorityScoreUpdated: false,
      errors: []
    }

    try {
      // 1. Classify severity for all markers
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        healthMarkers,
        normalRanges
      )

      // 2. Create abnormal flags for abnormal values
      const flagsToCreate: Omit<AbnormalFlag, 'id' | 'flagged_at'>[] = []
      
      for (const [markerId, classification] of Array.from(classifications.entries())) {
        if (!classification.isAbnormal) continue

        const marker = healthMarkers.find(m => m.id === markerId)
        if (!marker) continue

        // Determine range direction using normal ranges
        const normalRange = normalRanges.find(
          nr => nr.marker_type === marker.marker_type && 
                nr.unit === marker.unit && 
                nr.is_active
        )

        if (!normalRange) {
          result.errors.push(`No se encontró rango normal para ${marker.marker_type}`)
          continue
        }

        const { isAboveRange, isBelowRange } = this.determineRangeDirection(
          marker.value,
          normalRange
        )

        flagsToCreate.push({
          health_marker_id: markerId,
          severity: classification.severity as 'mild' | 'moderate' | 'severe',
          is_above_range: isAboveRange,
          is_below_range: isBelowRange,
          priority_weight: classification.priorityWeight
        })

        // Update health marker with abnormal status
        await this.updateHealthMarkerStatus(markerId, classification)

        if (classification.isCriticalValue) {
          result.criticalValuesDetected++
        }
      }

      // 3. Insert abnormal flags into database
      if (flagsToCreate.length > 0) {
        const { data: createdFlags, error: flagError } = await supabase
          .from('abnormal_flags')
          .insert(flagsToCreate)
          .select()

        if (flagError) {
          result.errors.push(`Error creando flags: ${flagError.message}`)
          return result
        }

        result.flagsCreated = createdFlags?.length || 0
      }

      // 4. Calculate and update patient priority score
      const priorityUpdateSuccess = await this.updatePatientPriorityScore(
        patientId,
        classifications,
        healthMarkers
      )

      result.priorityScoreUpdated = priorityUpdateSuccess

      // 5. Log audit event
      await this.logFlagCreationEvent(
        userId,
        userEmail,
        labReportId,
        patientId,
        result.flagsCreated,
        result.criticalValuesDetected
      )

      result.success = true
      return result

    } catch (error) {
      result.errors.push(`Error procesando flags: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      return result
    }
  }

  /**
   * Determine if value is above or below normal range
   */
  private static determineRangeDirection(
    value: number,
    normalRange: NormalRange
  ): { isAboveRange: boolean; isBelowRange: boolean } {
    let isAboveRange = false
    let isBelowRange = false

    if (normalRange.max_value != null && value > normalRange.max_value) {
      isAboveRange = true
    }

    if (normalRange.min_value != null && value < normalRange.min_value) {
      isBelowRange = true
    }

    // Ensure only one direction is true
    if (isAboveRange && isBelowRange) {
      // This shouldn't happen, but if it does, prioritize the larger deviation
      const aboveDeviation = normalRange.max_value ? value - normalRange.max_value : 0
      const belowDeviation = normalRange.min_value ? normalRange.min_value - value : 0
      
      if (aboveDeviation > belowDeviation) {
        isBelowRange = false
      } else {
        isAboveRange = false
      }
    }

    return { isAboveRange, isBelowRange }
  }

  /**
   * Update health marker with abnormal status and severity
   */
  private static async updateHealthMarkerStatus(
    markerId: string,
    classification: SeverityClassification
  ): Promise<void> {
    const { error } = await supabase
      .from('health_markers')
      .update({
        is_abnormal: classification.isAbnormal,
        severity: classification.severity,
        is_critical_value: classification.isCriticalValue
      })
      .eq('id', markerId)

    if (error) {
      throw new Error(`Error actualizando marcador de salud: ${error.message}`)
    }
  }

  /**
   * Update patient priority score using database function
   */
  private static async updatePatientPriorityScore(
    patientId: string,
    classifications: Map<string, SeverityClassification>,
    healthMarkers: HealthMarker[]
  ): Promise<boolean> {
    try {
      // Use the database function to calculate priority score
      const { error } = await supabase
        .rpc('calculate_patient_priority_score', { p_patient_id: patientId })

      if (error) {
        console.error('Error calculando puntaje de prioridad:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error actualizando puntaje de prioridad:', error)
      return false
    }
  }

  /**
   * Log flag creation event for audit trail
   */
  private static async logFlagCreationEvent(
    userId: string,
    userEmail: string,
    labReportId: string,
    patientId: string,
    flagsCreated: number,
    criticalValues: number
  ): Promise<void> {
    try {
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_action: 'CREATE_ABNORMAL_FLAGS',
        p_resource_type: 'lab_report',
        p_resource_id: labReportId,
        p_details: {
          patient_id: patientId,
          flags_created: flagsCreated,
          critical_values_detected: criticalValues,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error logging flag creation event:', error)
      // Don't throw - audit logging failure shouldn't break the main process
    }
  }

  /**
   * Get abnormal flags for a patient
   */
  static async getPatientFlags(patientId: string): Promise<AbnormalFlag[]> {
    const { data, error } = await supabase
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
      .order('flagged_at', { ascending: false })

    if (error) {
      throw new Error(`Error obteniendo flags del paciente: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get abnormal flags for a lab report
   */
  static async getLabReportFlags(labReportId: string): Promise<AbnormalFlag[]> {
    const { data, error } = await supabase
      .from('abnormal_flags')
      .select(`
        *,
        health_markers!inner(
          lab_report_id
        )
      `)
      .eq('health_markers.lab_report_id', labReportId)
      .order('flagged_at', { ascending: false })

    if (error) {
      throw new Error(`Error obteniendo flags del reporte: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get flag summary statistics
   */
  static async getFlagSummary(
    patientId?: string,
    labReportId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<FlagSummary> {
    let query = supabase
      .from('abnormal_flags')
      .select(`
        *,
        health_markers!inner(
          lab_report_id,
          lab_reports!inner(
            patient_id
          )
        )
      `)

    if (patientId) {
      query = query.eq('health_markers.lab_reports.patient_id', patientId)
    }

    if (labReportId) {
      query = query.eq('health_markers.lab_report_id', labReportId)
    }

    if (dateRange) {
      query = query
        .gte('flagged_at', dateRange.start.toISOString())
        .lte('flagged_at', dateRange.end.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error obteniendo resumen de flags: ${error.message}`)
    }

    const flags = data || []
    
    const summary: FlagSummary = {
      totalFlags: flags.length,
      bySeverity: {
        mild: flags.filter(f => f.severity === 'mild').length,
        moderate: flags.filter(f => f.severity === 'moderate').length,
        severe: flags.filter(f => f.severity === 'severe').length
      },
      byDirection: {
        aboveRange: flags.filter(f => f.is_above_range).length,
        belowRange: flags.filter(f => f.is_below_range).length
      },
      criticalValues: 0, // Would need to join with health_markers to get this
      averagePriorityWeight: flags.length > 0 
        ? flags.reduce((sum, f) => sum + f.priority_weight, 0) / flags.length 
        : 0
    }

    return summary
  }

  /**
   * Delete flags for a lab report (for reprocessing)
   */
  static async deleteLabReportFlags(labReportId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('abnormal_flags')
        .delete()
        .in('health_marker_id', 
          // Get health marker IDs first
          (await supabase
            .from('health_markers')
            .select('id')
            .eq('lab_report_id', labReportId)
          ).data?.map(hm => hm.id) || []
        )

      if (error) {
        console.error('Error eliminando flags:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error eliminando flags:', error)
      return false
    }
  }

  /**
   * Reprocess flags for a lab report
   */
  static async reprocessLabReportFlags(
    labReportId: string,
    userId: string,
    userEmail: string
  ): Promise<FlagCreationResult> {
    try {
      // Get lab report and patient info
      const { data: labReport, error: reportError } = await supabase
        .from('lab_reports')
        .select('patient_id')
        .eq('id', labReportId)
        .single()

      if (reportError || !labReport) {
        return {
          success: false,
          flagsCreated: 0,
          criticalValuesDetected: 0,
          priorityScoreUpdated: false,
          errors: ['Reporte de laboratorio no encontrado']
        }
      }

      // Get health markers
      const { data: healthMarkers, error: markersError } = await supabase
        .from('health_markers')
        .select('*')
        .eq('lab_report_id', labReportId)

      if (markersError) {
        return {
          success: false,
          flagsCreated: 0,
          criticalValuesDetected: 0,
          priorityScoreUpdated: false,
          errors: [`Error obteniendo marcadores: ${markersError.message}`]
        }
      }

      // Get normal ranges
      const { data: normalRanges, error: rangesError } = await supabase
        .from('normal_ranges')
        .select('*')
        .eq('is_active', true)

      if (rangesError) {
        return {
          success: false,
          flagsCreated: 0,
          criticalValuesDetected: 0,
          priorityScoreUpdated: false,
          errors: [`Error obteniendo rangos normales: ${rangesError.message}`]
        }
      }

      // Delete existing flags
      await this.deleteLabReportFlags(labReportId)

      // Reprocess flags
      return await this.processAndCreateFlags(
        labReportId,
        labReport.patient_id,
        healthMarkers || [],
        normalRanges || [],
        userId,
        userEmail
      )

    } catch (error) {
      return {
        success: false,
        flagsCreated: 0,
        criticalValuesDetected: 0,
        priorityScoreUpdated: false,
        errors: [`Error reprocesando flags: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      }
    }
  }
}