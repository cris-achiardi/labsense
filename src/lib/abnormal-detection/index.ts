// Main abnormal detection module for Task 7: Abnormal Value Detection

import { HealthMarker, NormalRange, Patient } from '@/types/database'
import { SeverityClassifier, SeverityClassification } from './severity-classifier'
import { PriorityScorer, PriorityScore, PatientContext } from './priority-scorer'
import { CriticalThresholdChecker, CriticalThreshold } from './critical-thresholds'
import { AbnormalFlagStorage, FlagCreationResult, FlagSummary } from './flag-storage'

export interface AbnormalDetectionResult {
  classifications: Map<string, SeverityClassification>
  priorityScore: PriorityScore
  criticalValues: Array<{
    markerId: string
    threshold: CriticalThreshold
    value: number
    alert: string
  }>
  flagCreationResult?: FlagCreationResult
  summary: {
    totalMarkers: number
    abnormalMarkers: number
    criticalMarkers: number
    highestSeverity: 'normal' | 'mild' | 'moderate' | 'severe'
    recommendedAction: string
  }
}

export interface DetectionOptions {
  createFlags?: boolean
  updatePriority?: boolean
  userId?: string
  userEmail?: string
  patientContext?: PatientContext
}

/**
 * Main abnormal detection service that orchestrates all detection components
 */
export class AbnormalDetectionService {
  /**
   * Comprehensive abnormal value detection for a set of health markers
   */
  static async detectAbnormalValues(
    labReportId: string,
    patientId: string,
    healthMarkers: HealthMarker[],
    normalRanges: NormalRange[],
    options: DetectionOptions = {}
  ): Promise<AbnormalDetectionResult> {
    // 1. Classify severity for all markers
    const classifications = SeverityClassifier.classifyMultipleMarkers(
      healthMarkers,
      normalRanges
    )

    // 2. Check for critical values
    const criticalValues = CriticalThresholdChecker.findCriticalValues(
      healthMarkers.map(m => ({
        markerType: m.marker_type,
        value: m.value,
        unit: m.unit,
        id: m.id
      }))
    ).map(cv => ({
      ...cv,
      alert: CriticalThresholdChecker.generateCriticalAlert(
        cv.threshold.markerType,
        cv.value,
        cv.threshold.unit
      ) || ''
    }))

    // 3. Calculate priority score
    const priorityScore = PriorityScorer.calculatePriorityScore(
      classifications,
      healthMarkers,
      options.patientContext
    )

    // 4. Create flags if requested
    let flagCreationResult: FlagCreationResult | undefined
    if (options.createFlags && options.userId && options.userEmail) {
      flagCreationResult = await AbnormalFlagStorage.processAndCreateFlags(
        labReportId,
        patientId,
        healthMarkers,
        normalRanges,
        options.userId,
        options.userEmail
      )
    }

    // 5. Generate summary
    const summary = this.generateSummary(classifications, criticalValues, priorityScore)

    return {
      classifications,
      priorityScore,
      criticalValues,
      flagCreationResult,
      summary
    }
  }

  /**
   * Quick abnormal detection without database operations
   */
  static detectAbnormalValuesQuick(
    healthMarkers: HealthMarker[],
    normalRanges: NormalRange[],
    patientContext?: PatientContext
  ): Omit<AbnormalDetectionResult, 'flagCreationResult'> {
    const classifications = SeverityClassifier.classifyMultipleMarkers(
      healthMarkers,
      normalRanges
    )

    const criticalValues = CriticalThresholdChecker.findCriticalValues(
      healthMarkers.map(m => ({
        markerType: m.marker_type,
        value: m.value,
        unit: m.unit,
        id: m.id
      }))
    ).map(cv => ({
      ...cv,
      alert: CriticalThresholdChecker.generateCriticalAlert(
        cv.threshold.markerType,
        cv.value,
        cv.threshold.unit
      ) || ''
    }))

    const priorityScore = PriorityScorer.calculatePriorityScore(
      classifications,
      healthMarkers,
      patientContext
    )

    const summary = this.generateSummary(classifications, criticalValues, priorityScore)

    return {
      classifications,
      priorityScore,
      criticalValues,
      summary
    }
  }

  /**
   * Generate summary of detection results
   */
  private static generateSummary(
    classifications: Map<string, SeverityClassification>,
    criticalValues: Array<any>,
    priorityScore: PriorityScore
  ) {
    const abnormalClassifications = Array.from(classifications.values()).filter(c => c.isAbnormal)
    const severities = abnormalClassifications.map(c => c.severity)
    
    let highestSeverity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal'
    if (severities.includes('severe')) highestSeverity = 'severe'
    else if (severities.includes('moderate')) highestSeverity = 'moderate'
    else if (severities.includes('mild')) highestSeverity = 'mild'

    const recommendedAction = this.getRecommendedAction(
      priorityScore.priorityLevel,
      criticalValues.length > 0,
      highestSeverity
    )

    return {
      totalMarkers: classifications.size,
      abnormalMarkers: abnormalClassifications.length,
      criticalMarkers: criticalValues.length,
      highestSeverity,
      recommendedAction
    }
  }

  /**
   * Get recommended action based on detection results
   */
  private static getRecommendedAction(
    priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW',
    hasCriticalValues: boolean,
    highestSeverity: 'normal' | 'mild' | 'moderate' | 'severe'
  ): string {
    if (hasCriticalValues) {
      return 'Contactar al paciente inmediatamente - Valores críticos detectados'
    }

    switch (priorityLevel) {
      case 'HIGH':
        return 'Contactar al paciente dentro de 24 horas - Prioridad alta'
      case 'MEDIUM':
        return 'Contactar al paciente dentro de 3-5 días - Prioridad media'
      case 'LOW':
        if (highestSeverity === 'mild') {
          return 'Contactar al paciente dentro de 1-2 semanas - Seguimiento rutinario'
        }
        return 'Valores normales - No requiere acción inmediata'
      default:
        return 'Revisar resultados manualmente'
    }
  }

  /**
   * Batch process multiple lab reports
   */
  static async batchDetectAbnormalValues(
    labReports: Array<{
      labReportId: string
      patientId: string
      healthMarkers: HealthMarker[]
      patientContext?: PatientContext
    }>,
    normalRanges: NormalRange[],
    options: DetectionOptions = {}
  ): Promise<Map<string, AbnormalDetectionResult>> {
    const results = new Map<string, AbnormalDetectionResult>()

    for (const report of labReports) {
      try {
        const result = await this.detectAbnormalValues(
          report.labReportId,
          report.patientId,
          report.healthMarkers,
          normalRanges,
          {
            ...options,
            patientContext: report.patientContext
          }
        )
        results.set(report.labReportId, result)
      } catch (error) {
        console.error(`Error processing lab report ${report.labReportId}:`, error)
        // Continue with other reports
      }
    }

    return results
  }

  /**
   * Get detection statistics across multiple results
   */
  static getDetectionStatistics(results: Map<string, AbnormalDetectionResult>) {
    const stats = {
      totalReports: results.size,
      reportsWithAbnormals: 0,
      reportsWithCriticals: 0,
      priorityDistribution: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      severityDistribution: {
        normal: 0,
        mild: 0,
        moderate: 0,
        severe: 0
      },
      averagePriorityScore: 0,
      totalAbnormalMarkers: 0,
      totalCriticalValues: 0
    }

    let totalPriorityScore = 0

    Array.from(results.values()).forEach(result => {
      if (result.summary.abnormalMarkers > 0) {
        stats.reportsWithAbnormals++
      }
      
      if (result.summary.criticalMarkers > 0) {
        stats.reportsWithCriticals++
      }

      stats.priorityDistribution[result.priorityScore.priorityLevel as keyof typeof stats.priorityDistribution]++
      stats.severityDistribution[result.summary.highestSeverity as keyof typeof stats.severityDistribution]++
      
      totalPriorityScore += result.priorityScore.totalScore
      stats.totalAbnormalMarkers += result.summary.abnormalMarkers
      stats.totalCriticalValues += result.summary.criticalMarkers
    })

    stats.averagePriorityScore = results.size > 0 ? totalPriorityScore / results.size : 0

    return stats
  }
}

// Re-export all components for convenience
export {
  SeverityClassifier,
  PriorityScorer,
  CriticalThresholdChecker,
  AbnormalFlagStorage
}

export type {
  SeverityClassification,
  PriorityScore,
  CriticalThreshold,
  FlagCreationResult,
  FlagSummary,
  PatientContext
}

// Export Chilean critical thresholds
export { CHILEAN_CRITICAL_THRESHOLDS } from './critical-thresholds'