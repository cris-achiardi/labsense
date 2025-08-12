// Critical value thresholds for Chilean healthcare - Task 7 implementation

export interface CriticalThreshold {
  markerType: string
  unit: string
  high?: number
  low?: number
  description: string
  clinicalSignificance: string
  urgencyLevel: 'immediate' | 'urgent' | 'priority'
}

/**
 * Critical value thresholds based on Chilean healthcare standards
 * These values require immediate medical attention and override normal severity classification
 */
export const CHILEAN_CRITICAL_THRESHOLDS: CriticalThreshold[] = [
  // Glucose/Diabetes markers - Immediate attention required
  {
    markerType: 'GLICEMIA EN AYUNO',
    unit: 'mg/dL',
    high: 250,
    low: 50,
    description: 'Glicemia en ayuno crítica',
    clinicalSignificance: 'Riesgo de coma diabético o hipoglicémico',
    urgencyLevel: 'immediate'
  },
  {
    markerType: 'GLUCOSA',
    unit: 'mg/dL',
    high: 250,
    low: 50,
    description: 'Glucosa crítica',
    clinicalSignificance: 'Riesgo de coma diabético o hipoglicémico',
    urgencyLevel: 'immediate'
  },
  {
    markerType: 'GLICEMIA',
    unit: 'mg/dL',
    high: 250,
    low: 50,
    description: 'Glicemia crítica',
    clinicalSignificance: 'Riesgo de coma diabético o hipoglicémico',
    urgencyLevel: 'immediate'
  },

  // HbA1c - Priority attention for diabetes management
  {
    markerType: 'HEMOGLOBINA GLICADA A1C',
    unit: '%',
    high: 10.0,
    description: 'HbA1c severamente elevada',
    clinicalSignificance: 'Control diabético muy deficiente, riesgo de complicaciones',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'HBA1C',
    unit: '%',
    high: 10.0,
    description: 'HbA1c severamente elevada',
    clinicalSignificance: 'Control diabético muy deficiente, riesgo de complicaciones',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'HEMOGLOBINA GLICOSILADA',
    unit: '%',
    high: 10.0,
    description: 'Hemoglobina glicosilada severamente elevada',
    clinicalSignificance: 'Control diabético muy deficiente, riesgo de complicaciones',
    urgencyLevel: 'urgent'
  },

  // Cholesterol - Priority for cardiovascular risk
  {
    markerType: 'COLESTEROL TOTAL',
    unit: 'mg/dL',
    high: 300,
    description: 'Colesterol total severamente elevado',
    clinicalSignificance: 'Riesgo cardiovascular muy alto',
    urgencyLevel: 'priority'
  },
  {
    markerType: 'COLESTEROL',
    unit: 'mg/dL',
    high: 300,
    description: 'Colesterol severamente elevado',
    clinicalSignificance: 'Riesgo cardiovascular muy alto',
    urgencyLevel: 'priority'
  },
  {
    markerType: 'COL TOTAL',
    unit: 'mg/dL',
    high: 300,
    description: 'Colesterol total severamente elevado',
    clinicalSignificance: 'Riesgo cardiovascular muy alto',
    urgencyLevel: 'priority'
  },

  // Triglycerides - Priority for pancreatitis risk
  {
    markerType: 'TRIGLICERIDOS',
    unit: 'mg/dL',
    high: 500,
    description: 'Triglicéridos severamente elevados',
    clinicalSignificance: 'Riesgo de pancreatitis aguda',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TRIGLICERIDEMIA',
    unit: 'mg/dL',
    high: 500,
    description: 'Trigliceridemia severamente elevada',
    clinicalSignificance: 'Riesgo de pancreatitis aguda',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TG',
    unit: 'mg/dL',
    high: 500,
    description: 'Triglicéridos severamente elevados',
    clinicalSignificance: 'Riesgo de pancreatitis aguda',
    urgencyLevel: 'urgent'
  },

  // Liver enzymes - Urgent attention for liver damage
  {
    markerType: 'ALT',
    unit: 'U/L',
    high: 200,
    description: 'ALT severamente elevada',
    clinicalSignificance: 'Posible daño hepático severo',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TGP',
    unit: 'U/L',
    high: 200,
    description: 'TGP severamente elevada',
    clinicalSignificance: 'Posible daño hepático severo',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'AST',
    unit: 'U/L',
    high: 200,
    description: 'AST severamente elevada',
    clinicalSignificance: 'Posible daño hepático o cardíaco severo',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TGO',
    unit: 'U/L',
    high: 200,
    description: 'TGO severamente elevada',
    clinicalSignificance: 'Posible daño hepático o cardíaco severo',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TRANSAMINASAS ALT',
    unit: 'U/L',
    high: 200,
    description: 'Transaminasas ALT severamente elevadas',
    clinicalSignificance: 'Posible daño hepático severo',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TRANSAMINASAS AST',
    unit: 'U/L',
    high: 200,
    description: 'Transaminasas AST severamente elevadas',
    clinicalSignificance: 'Posible daño hepático o cardíaco severo',
    urgencyLevel: 'urgent'
  },

  // Thyroid - Priority for thyroid crisis risk
  {
    markerType: 'H. TIROESTIMULANTE (TSH)',
    unit: 'μUI/mL',
    high: 20.0,
    low: 0.1,
    description: 'TSH críticamente anormal',
    clinicalSignificance: 'Riesgo de crisis tiroidea o mixedema',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TSH',
    unit: 'μUI/mL',
    high: 20.0,
    low: 0.1,
    description: 'TSH críticamente anormal',
    clinicalSignificance: 'Riesgo de crisis tiroidea o mixedema',
    urgencyLevel: 'urgent'
  },
  {
    markerType: 'TIROTROPINA',
    unit: 'μUI/mL',
    high: 20.0,
    low: 0.1,
    description: 'Tirotropina críticamente anormal',
    clinicalSignificance: 'Riesgo de crisis tiroidea o mixedema',
    urgencyLevel: 'urgent'
  }
]

export class CriticalThresholdChecker {
  private static thresholds = new Map<string, CriticalThreshold[]>()

  static {
    // Initialize threshold lookup map
    for (const threshold of CHILEAN_CRITICAL_THRESHOLDS) {
      const key = `${threshold.markerType}:${threshold.unit}`
      if (!this.thresholds.has(key)) {
        this.thresholds.set(key, [])
      }
      this.thresholds.get(key)!.push(threshold)
    }
  }

  /**
   * Check if a value meets critical threshold criteria
   */
  static isCriticalValue(markerType: string, value: number, unit: string): boolean {
    const key = `${markerType}:${unit}`
    const thresholds = this.thresholds.get(key)
    
    if (!thresholds) return false

    for (const threshold of thresholds) {
      if (threshold.high && value >= threshold.high) return true
      if (threshold.low && value <= threshold.low) return true
    }

    return false
  }

  /**
   * Get critical threshold information for a marker
   */
  static getCriticalThreshold(markerType: string, unit: string): CriticalThreshold | null {
    const key = `${markerType}:${unit}`
    const thresholds = this.thresholds.get(key)
    return thresholds?.[0] || null
  }

  /**
   * Get all critical thresholds for a marker type (regardless of unit)
   */
  static getCriticalThresholdsForMarker(markerType: string): CriticalThreshold[] {
    return CHILEAN_CRITICAL_THRESHOLDS.filter(t => t.markerType === markerType)
  }

  /**
   * Check multiple values and return critical ones
   */
  static findCriticalValues(
    markers: Array<{ markerType: string; value: number; unit: string; id: string }>
  ): Array<{ markerId: string; threshold: CriticalThreshold; value: number }> {
    const criticalValues = []

    for (const marker of markers) {
      if (this.isCriticalValue(marker.markerType, marker.value, marker.unit)) {
        const threshold = this.getCriticalThreshold(marker.markerType, marker.unit)
        if (threshold) {
          criticalValues.push({
            markerId: marker.id,
            threshold,
            value: marker.value
          })
        }
      }
    }

    return criticalValues
  }

  /**
   * Get urgency level for critical values
   */
  static getUrgencyLevel(markerType: string, value: number, unit: string): 'immediate' | 'urgent' | 'priority' | null {
    const threshold = this.getCriticalThreshold(markerType, unit)
    if (!threshold) return null

    if (this.isCriticalValue(markerType, value, unit)) {
      return threshold.urgencyLevel
    }

    return null
  }

  /**
   * Generate clinical alert message for critical value
   */
  static generateCriticalAlert(
    markerType: string,
    value: number,
    unit: string
  ): string | null {
    const threshold = this.getCriticalThreshold(markerType, unit)
    if (!threshold || !this.isCriticalValue(markerType, value, unit)) {
      return null
    }

    const urgencyText = {
      immediate: '🚨 INMEDIATO',
      urgent: '⚠️ URGENTE',
      priority: '📋 PRIORITARIO'
    }[threshold.urgencyLevel]

    return `${urgencyText}: ${threshold.description} - ${value} ${unit}. ${threshold.clinicalSignificance}`
  }

  /**
   * Get statistics about critical thresholds
   */
  static getThresholdStatistics() {
    const stats = {
      totalThresholds: CHILEAN_CRITICAL_THRESHOLDS.length,
      byUrgency: {
        immediate: 0,
        urgent: 0,
        priority: 0
      },
      byMarkerCategory: {
        diabetes: 0,
        cardiovascular: 0,
        liver: 0,
        thyroid: 0,
        other: 0
      }
    }

    for (const threshold of CHILEAN_CRITICAL_THRESHOLDS) {
      stats.byUrgency[threshold.urgencyLevel]++

      // Categorize by marker type
      if (threshold.markerType.includes('GLICEMIA') || 
          threshold.markerType.includes('GLUCOSA') || 
          threshold.markerType.includes('HEMOGLOBINA')) {
        stats.byMarkerCategory.diabetes++
      } else if (threshold.markerType.includes('COLESTEROL') || 
                 threshold.markerType.includes('TRIGLICERIDOS')) {
        stats.byMarkerCategory.cardiovascular++
      } else if (threshold.markerType.includes('ALT') || 
                 threshold.markerType.includes('AST') || 
                 threshold.markerType.includes('TG')) {
        stats.byMarkerCategory.liver++
      } else if (threshold.markerType.includes('TSH') || 
                 threshold.markerType.includes('TIRO')) {
        stats.byMarkerCategory.thyroid++
      } else {
        stats.byMarkerCategory.other++
      }
    }

    return stats
  }
}