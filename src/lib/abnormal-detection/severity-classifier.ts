// Severity classification system for Task 7: Abnormal Value Detection

import { HealthMarker, NormalRange } from '@/types/database'
import { CriticalThresholdChecker } from './critical-thresholds'

export type SeverityLevel = 'normal' | 'mild' | 'moderate' | 'severe'

export interface SeverityClassification {
  severity: SeverityLevel
  isAbnormal: boolean
  isCriticalValue: boolean
  deviationPercent: number
  reasoning: string
  priorityWeight: number
}

export class SeverityClassifier {
  /**
   * Classify the severity of a health marker value based on normal ranges
   * and Chilean healthcare critical value thresholds
   */
  static classifySeverity(
    marker: HealthMarker,
    normalRange: NormalRange
  ): SeverityClassification {
    const { value, marker_type, unit } = marker
    const { min_value, max_value } = normalRange

    // Check if value is within normal range
    const isWithinRange = this.isValueWithinRange(value, min_value ?? null, max_value ?? null)
    
    if (isWithinRange) {
      return {
        severity: 'normal',
        isAbnormal: false,
        isCriticalValue: false,
        deviationPercent: 0,
        reasoning: 'Valor dentro del rango normal',
        priorityWeight: 0
      }
    }

    // Calculate deviation from normal range
    const deviation = this.calculateDeviation(value, min_value ?? null, max_value ?? null)
    const deviationPercent = this.calculateDeviationPercent(deviation, min_value ?? null, max_value ?? null)

    // Check for critical values first (overrides other classifications)
    const isCriticalValue = this.isCriticalValue(marker_type, value, unit)
    if (isCriticalValue) {
      return {
        severity: 'severe',
        isAbnormal: true,
        isCriticalValue: true,
        deviationPercent,
        reasoning: `Valor crítico detectado: ${value} ${unit}`,
        priorityWeight: 5
      }
    }

    // Classify based on deviation percentage
    const severity = this.classifyByDeviation(deviationPercent)
    const isAbove = max_value ? value > max_value : false
    const isBelow = min_value ? value < min_value : false

    return {
      severity,
      isAbnormal: true,
      isCriticalValue: false,
      deviationPercent,
      reasoning: this.generateReasoning(severity, isAbove, isBelow, value, unit, normalRange),
      priorityWeight: this.getPriorityWeight(severity)
    }
  }

  /**
   * Check if value is within normal range
   */
  private static isValueWithinRange(
    value: number,
    minValue: number | null,
    maxValue: number | null
  ): boolean {
    if (minValue !== null && value < minValue) return false
    if (maxValue !== null && value > maxValue) return false
    return true
  }

  /**
   * Calculate absolute deviation from normal range
   */
  private static calculateDeviation(
    value: number,
    minValue: number | null,
    maxValue: number | null
  ): number {
    if (maxValue !== null && value > maxValue) {
      return value - maxValue
    }
    if (minValue !== null && value < minValue) {
      return minValue - value
    }
    return 0
  }

  /**
   * Calculate deviation as percentage of normal range
   */
  private static calculateDeviationPercent(
    deviation: number,
    minValue: number | null,
    maxValue: number | null
  ): number {
    if (deviation === 0) return 0

    const range = (maxValue || 0) - (minValue || 0)
    if (range <= 0) return 100 // If no valid range, consider 100% deviation

    return (deviation / range) * 100
  }

  /**
   * Check if value meets critical value thresholds for Chilean healthcare
   */
  private static isCriticalValue(markerType: string, value: number, unit: string): boolean {
    return CriticalThresholdChecker.isCriticalValue(markerType, value, unit)
  }

  /**
   * Classify severity based on deviation percentage
   */
  private static classifyByDeviation(deviationPercent: number): SeverityLevel {
    if (deviationPercent >= 100) return 'severe'    // 100%+ deviation
    if (deviationPercent >= 50) return 'moderate'   // 50-99% deviation
    if (deviationPercent > 0) return 'mild'         // Any deviation
    return 'normal'
  }

  /**
   * Get priority weight for severity level
   */
  private static getPriorityWeight(severity: SeverityLevel): number {
    switch (severity) {
      case 'severe': return 5
      case 'moderate': return 3
      case 'mild': return 1
      case 'normal': return 0
      default: return 0
    }
  }

  /**
   * Generate human-readable reasoning in Spanish
   */
  private static generateReasoning(
    severity: SeverityLevel,
    isAbove: boolean,
    isBelow: boolean,
    value: number,
    unit: string,
    normalRange: NormalRange
  ): string {
    const rangeText = this.formatRangeText(normalRange.min_value ?? null, normalRange.max_value ?? null, unit)
    
    if (isAbove) {
      switch (severity) {
        case 'severe':
          return `Valor severamente elevado: ${value} ${unit} (normal: ${rangeText})`
        case 'moderate':
          return `Valor moderadamente elevado: ${value} ${unit} (normal: ${rangeText})`
        case 'mild':
          return `Valor ligeramente elevado: ${value} ${unit} (normal: ${rangeText})`
      }
    }

    if (isBelow) {
      switch (severity) {
        case 'severe':
          return `Valor severamente bajo: ${value} ${unit} (normal: ${rangeText})`
        case 'moderate':
          return `Valor moderadamente bajo: ${value} ${unit} (normal: ${rangeText})`
        case 'mild':
          return `Valor ligeramente bajo: ${value} ${unit} (normal: ${rangeText})`
      }
    }

    return `Valor anormal: ${value} ${unit} (normal: ${rangeText})`
  }

  /**
   * Format normal range text for display
   */
  private static formatRangeText(
    minValue: number | null,
    maxValue: number | null,
    unit: string
  ): string {
    if (minValue !== null && maxValue !== null) {
      return `${minValue}-${maxValue} ${unit}`
    }
    if (maxValue !== null) {
      return `≤${maxValue} ${unit}`
    }
    if (minValue !== null) {
      return `≥${minValue} ${unit}`
    }
    return 'No definido'
  }

  /**
   * Batch classify multiple health markers
   */
  static classifyMultipleMarkers(
    markers: HealthMarker[],
    normalRanges: NormalRange[]
  ): Map<string, SeverityClassification> {
    const classifications = new Map<string, SeverityClassification>()

    for (const marker of markers) {
      const normalRange = normalRanges.find(
        nr => nr.marker_type === marker.marker_type && 
              nr.unit === marker.unit && 
              nr.is_active
      )

      if (normalRange) {
        const classification = this.classifySeverity(marker, normalRange)
        classifications.set(marker.id, classification)
      }
    }

    return classifications
  }

  /**
   * Get summary statistics for a set of classifications
   */
  static getSeveritySummary(classifications: Map<string, SeverityClassification>) {
    const summary = {
      total: classifications.size,
      normal: 0,
      mild: 0,
      moderate: 0,
      severe: 0,
      critical: 0,
      totalPriorityWeight: 0
    }

    Array.from(classifications.values()).forEach(classification => {
      summary[classification.severity as keyof typeof summary]++
      if (classification.isCriticalValue) summary.critical++
      summary.totalPriorityWeight += classification.priorityWeight
    })

    return summary
  }
}