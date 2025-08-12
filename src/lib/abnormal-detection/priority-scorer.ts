// Priority scoring algorithm for Task 7: Abnormal Value Detection

import { SeverityClassification, SeverityClassifier } from './severity-classifier'
import { HealthMarker, NormalRange, AbnormalFlag } from '@/types/database'

export interface PriorityScore {
  totalScore: number
  priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  breakdown: {
    severityScore: number
    criticalValueBonus: number
    markerTypeWeights: number
    ageFactorBonus: number
    multipleAbnormalBonus: number
  }
  reasoning: string[]
}

export interface PatientContext {
  age?: number
  sex?: string
  hasHistoricalData?: boolean
  previousPriorityScore?: number
}

export class PriorityScorer {
  // Base scores for severity levels
  private static readonly SEVERITY_SCORES = {
    normal: 0,
    mild: 10,
    moderate: 25,
    severe: 50
  } as const

  // Critical value bonus
  private static readonly CRITICAL_VALUE_BONUS = 30

  // Marker type weights (some markers are more clinically significant)
  private static readonly MARKER_TYPE_WEIGHTS = {
    // Diabetes markers - high priority
    'GLICEMIA EN AYUNO': 1.5,
    'GLUCOSA': 1.5,
    'GLICEMIA': 1.5,
    'HEMOGLOBINA GLICADA A1C': 1.8,
    'HBA1C': 1.8,
    'HEMOGLOBINA GLICOSILADA': 1.8,

    // Cardiovascular markers - high priority
    'COLESTEROL TOTAL': 1.3,
    'COLESTEROL': 1.3,
    'COL TOTAL': 1.3,
    'TRIGLICERIDOS': 1.2,
    'TRIGLICERIDEMIA': 1.2,
    'TG': 1.2,

    // Liver function - moderate priority
    'ALT': 1.1,
    'TGP': 1.1,
    'AST': 1.1,
    'TGO': 1.1,
    'TRANSAMINASAS ALT': 1.1,
    'TRANSAMINASAS AST': 1.1,

    // Thyroid - moderate priority
    'H. TIROESTIMULANTE (TSH)': 1.0,
    'TSH': 1.0,
    'TIROTROPINA': 1.0,

    // Default weight for unknown markers
    'DEFAULT': 1.0
  } as const

  // Age factor multipliers (older patients get higher priority)
  private static readonly AGE_FACTORS = {
    YOUNG: { min: 0, max: 40, multiplier: 1.0 },      // 18-40: normal priority
    MIDDLE: { min: 41, max: 65, multiplier: 1.2 },    // 41-65: slight increase
    SENIOR: { min: 66, max: 80, multiplier: 1.4 },    // 66-80: moderate increase
    ELDERLY: { min: 81, max: 120, multiplier: 1.6 }   // 81+: high increase
  } as const

  /**
   * Calculate comprehensive priority score for a patient based on their abnormal values
   */
  static calculatePriorityScore(
    classifications: Map<string, SeverityClassification>,
    markers: HealthMarker[],
    patientContext?: PatientContext
  ): PriorityScore {
    const breakdown = {
      severityScore: 0,
      criticalValueBonus: 0,
      markerTypeWeights: 0,
      ageFactorBonus: 0,
      multipleAbnormalBonus: 0
    }

    const reasoning: string[] = []
    let baseScore = 0

    // 1. Calculate base severity scores
    for (const [markerId, classification] of classifications) {
      if (!classification.isAbnormal) continue

      const marker = markers.find(m => m.id === markerId)
      if (!marker) continue

      // Base severity score
      const severityScore = this.SEVERITY_SCORES[classification.severity]
      breakdown.severityScore += severityScore
      baseScore += severityScore

      // Critical value bonus
      if (classification.isCriticalValue) {
        breakdown.criticalValueBonus += this.CRITICAL_VALUE_BONUS
        baseScore += this.CRITICAL_VALUE_BONUS
        reasoning.push(`Valor crítico detectado: ${marker.marker_type}`)
      }

      // Marker type weight
      const weight = this.getMarkerTypeWeight(marker.marker_type)
      const weightedScore = severityScore * (weight - 1) // Only the bonus part
      breakdown.markerTypeWeights += weightedScore
      baseScore += weightedScore

      if (weight > 1.0) {
        reasoning.push(`Marcador de alta prioridad clínica: ${marker.marker_type} (peso: ${weight})`)
      }
    }

    // 2. Multiple abnormal values bonus
    const abnormalCount = Array.from(classifications.values()).filter(c => c.isAbnormal).length
    if (abnormalCount > 1) {
      const multipleBonus = Math.min((abnormalCount - 1) * 5, 20) // Max 20 points bonus
      breakdown.multipleAbnormalBonus = multipleBonus
      baseScore += multipleBonus
      reasoning.push(`Múltiples valores anormales detectados: ${abnormalCount}`)
    }

    // 3. Age factor bonus
    if (patientContext?.age) {
      const ageFactor = this.getAgeFactor(patientContext.age)
      const ageBonus = baseScore * (ageFactor - 1) // Only the bonus part
      breakdown.ageFactorBonus = ageBonus
      baseScore += ageBonus

      if (ageFactor > 1.0) {
        reasoning.push(`Factor de edad aplicado: ${patientContext.age} años (factor: ${ageFactor})`)
      }
    }

    const totalScore = Math.round(baseScore)
    const priorityLevel = this.determinePriorityLevel(totalScore)

    return {
      totalScore,
      priorityLevel,
      breakdown,
      reasoning
    }
  }

  /**
   * Get marker type weight for clinical significance
   */
  private static getMarkerTypeWeight(markerType: string): number {
    return this.MARKER_TYPE_WEIGHTS[markerType as keyof typeof this.MARKER_TYPE_WEIGHTS] || 
           this.MARKER_TYPE_WEIGHTS.DEFAULT
  }

  /**
   * Get age factor multiplier
   */
  private static getAgeFactor(age: number): number {
    for (const factor of Object.values(this.AGE_FACTORS)) {
      if (age >= factor.min && age <= factor.max) {
        return factor.multiplier
      }
    }
    return this.AGE_FACTORS.YOUNG.multiplier // Default to young adult
  }

  /**
   * Determine priority level based on total score
   */
  private static determinePriorityLevel(totalScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (totalScore >= 80) return 'HIGH'    // Severe abnormalities or multiple moderate
    if (totalScore >= 30) return 'MEDIUM'  // Moderate abnormalities or multiple mild
    if (totalScore > 0) return 'LOW'       // Mild abnormalities
    return 'LOW' // Fallback
  }

  /**
   * Create abnormal flags from severity classifications
   */
  static createAbnormalFlags(
    classifications: Map<string, SeverityClassification>,
    markers: HealthMarker[]
  ): Omit<AbnormalFlag, 'id' | 'flagged_at'>[] {
    const flags: Omit<AbnormalFlag, 'id' | 'flagged_at'>[] = []

    for (const [markerId, classification] of classifications) {
      if (!classification.isAbnormal) continue

      const marker = markers.find(m => m.id === markerId)
      if (!marker) continue

      // Determine if value is above or below range
      // This would need normal range data to determine precisely
      // For now, we'll use a heuristic based on common medical knowledge
      const isAboveRange = this.isLikelyAboveRange(marker.marker_type, marker.value)
      const isBelowRange = !isAboveRange

      flags.push({
        health_marker_id: markerId,
        severity: classification.severity as 'mild' | 'moderate' | 'severe',
        is_above_range: isAboveRange,
        is_below_range: isBelowRange,
        priority_weight: classification.priorityWeight
      })
    }

    return flags
  }

  /**
   * Heuristic to determine if a value is likely above normal range
   * This is a simplified approach - in production, this should use actual normal ranges
   */
  private static isLikelyAboveRange(markerType: string, value: number): boolean {
    // Common patterns for Chilean lab values that are typically "high" when abnormal
    const typicallyHighWhenAbnormal = [
      'GLICEMIA EN AYUNO',
      'GLUCOSA',
      'GLICEMIA',
      'COLESTEROL TOTAL',
      'COLESTEROL',
      'TRIGLICERIDOS',
      'ALT',
      'TGP',
      'AST',
      'TGO',
      'HEMOGLOBINA GLICADA A1C',
      'HBA1C'
    ]

    // TSH can be high or low when abnormal, but high is more common
    const canBeEither = [
      'H. TIROESTIMULANTE (TSH)',
      'TSH',
      'TIROTROPINA'
    ]

    if (typicallyHighWhenAbnormal.includes(markerType)) {
      return true
    }

    if (canBeEither.includes(markerType)) {
      // For TSH, values > 5 are typically high, < 0.5 are typically low
      if (markerType.includes('TSH') || markerType.includes('TIROESTIMULANTE')) {
        return value > 5
      }
      return true // Default to high for unknown cases
    }

    return true // Default assumption
  }

  /**
   * Batch process multiple patients for priority scoring
   */
  static batchCalculatePriorities(
    patientData: Array<{
      patientId: string
      markers: HealthMarker[]
      normalRanges: NormalRange[]
      context?: PatientContext
    }>
  ): Map<string, PriorityScore> {
    const results = new Map<string, PriorityScore>()

    for (const patient of patientData) {
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        patient.markers,
        patient.normalRanges
      )

      const priorityScore = this.calculatePriorityScore(
        classifications,
        patient.markers,
        patient.context
      )

      results.set(patient.patientId, priorityScore)
    }

    return results
  }

  /**
   * Get priority distribution statistics
   */
  static getPriorityDistribution(scores: Map<string, PriorityScore>) {
    const distribution = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      totalPatients: scores.size,
      averageScore: 0,
      maxScore: 0,
      minScore: Infinity
    }

    let totalScore = 0

    for (const score of scores.values()) {
      distribution[score.priorityLevel]++
      totalScore += score.totalScore
      distribution.maxScore = Math.max(distribution.maxScore, score.totalScore)
      distribution.minScore = Math.min(distribution.minScore, score.totalScore)
    }

    distribution.averageScore = scores.size > 0 ? totalScore / scores.size : 0
    if (distribution.minScore === Infinity) distribution.minScore = 0

    return distribution
  }
}