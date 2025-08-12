/**
 * Critical Value Override System for Chilean Lab Reports
 * Ensures life-threatening lab values are never missed due to low parsing confidence
 * Critical for patient safety in Chilean public healthcare
 */

import { AbnormalValueResult } from '@/lib/pdf-parsing/abnormal-value-detector'
import { OverallConfidenceResult } from './confidence-scoring'

export interface CriticalValueThreshold {
  markerCode: string
  markerName: string
  category: 'glucose' | 'cardiac' | 'kidney' | 'liver' | 'blood' | 'electrolytes' | 'thyroid'
  criticalHigh?: number
  criticalLow?: number
  unit: string
  description: string
  urgency: 'immediate' | 'urgent' | 'priority'
  clinicalSignificance: string
}

export interface CriticalValueAlert {
  id: string
  markerCode: string
  markerName: string
  value: number
  unit: string
  threshold: CriticalValueThreshold
  severity: 'life_threatening' | 'critical' | 'urgent'
  urgency: 'immediate' | 'urgent' | 'priority'
  clinicalRisk: string
  recommendedActions: string[]
  escalationRequired: boolean
  timeToAction: string // e.g., "< 1 hour", "< 4 hours"
  originalConfidence: number
  overrideReason: string
}

export interface CriticalValueOverrideResult {
  hasCriticalValues: boolean
  criticalAlerts: CriticalValueAlert[]
  overrideRecommendation: 'immediate_escalation' | 'urgent_review' | 'priority_processing' | 'standard_processing'
  bypassLowConfidence: boolean
  escalationLevel: 'emergency' | 'urgent' | 'routine'
  totalCriticalCount: number
  lifeThreatening: number
  requiresImmediateAction: boolean
}

/**
 * Critical value thresholds based on Chilean healthcare standards
 * and international emergency medicine guidelines
 */
export const CRITICAL_VALUE_THRESHOLDS: CriticalValueThreshold[] = [
  // GLUCOSE - Critical for diabetes emergencies
  {
    markerCode: 'glucose_fasting',
    markerName: 'GLICEMIA EN AYUNO',
    category: 'glucose',
    criticalHigh: 400, // Severe hyperglycemia
    criticalLow: 50,   // Severe hypoglycemia
    unit: 'mg/dL',
    description: 'Glucosa crítica - riesgo de coma diabético o hipoglucémico',
    urgency: 'immediate',
    clinicalSignificance: 'Riesgo de coma diabético, convulsiones, o muerte'
  },
  
  // HbA1c - Long-term glucose control
  {
    markerCode: 'hba1c',
    markerName: 'HEMOGLOBINA GLICADA A1C',
    category: 'glucose',
    criticalHigh: 15, // Extremely poor control
    unit: '%',
    description: 'Control glucémico extremadamente pobre',
    urgency: 'urgent',
    clinicalSignificance: 'Riesgo muy alto de complicaciones diabéticas'
  },

  // CARDIAC MARKERS
  {
    markerCode: 'troponin',
    markerName: 'TROPONINA',
    category: 'cardiac',
    criticalHigh: 0.4, // Myocardial infarction threshold
    unit: 'ng/mL',
    description: 'Troponina elevada - posible infarto al miocardio',
    urgency: 'immediate',
    clinicalSignificance: 'Infarto agudo al miocardio en curso'
  },

  // KIDNEY FUNCTION - Critical for renal failure
  {
    markerCode: 'creatinine',
    markerName: 'CREATININA',
    category: 'kidney',
    criticalHigh: 5.0, // Severe kidney failure
    unit: 'mg/dL',
    description: 'Insuficiencia renal severa',
    urgency: 'urgent',
    clinicalSignificance: 'Falla renal aguda, posible necesidad de diálisis'
  },

  {
    markerCode: 'urea',
    markerName: 'UREA',
    category: 'kidney',
    criticalHigh: 150, // Severe uremia
    unit: 'mg/dL',
    description: 'Uremia severa',
    urgency: 'urgent',
    clinicalSignificance: 'Intoxicación urémica, alteración neurológica'
  },

  // LIVER FUNCTION - Critical for liver failure
  {
    markerCode: 'ast',
    markerName: 'GOT (A.S.T)',
    category: 'liver',
    criticalHigh: 1000, // Severe hepatic necrosis
    unit: 'U/L',
    description: 'Necrosis hepática severa',
    urgency: 'urgent',
    clinicalSignificance: 'Falla hepática aguda, riesgo de muerte'
  },

  {
    markerCode: 'alt',
    markerName: 'GPT (A.L.T)',
    category: 'liver',
    criticalHigh: 1000, // Severe hepatic necrosis
    unit: 'U/L',
    description: 'Necrosis hepática severa',
    urgency: 'urgent',
    clinicalSignificance: 'Falla hepática aguda, riesgo de muerte'
  },

  {
    markerCode: 'bilirubin_total',
    markerName: 'BILIRRUBINA TOTAL',
    category: 'liver',
    criticalHigh: 20, // Severe jaundice
    unit: 'mg/dL',
    description: 'Ictericia severa',
    urgency: 'urgent',
    clinicalSignificance: 'Falla hepática, posible encefalopatía'
  },

  // BLOOD COUNT - Critical for severe anemia/bleeding
  {
    markerCode: 'hemoglobin',
    markerName: 'HEMOGLOBINA',
    category: 'blood',
    criticalHigh: 20, // Severe polycythemia
    criticalLow: 6,   // Severe anemia
    unit: 'g/dL',
    description: 'Hemoglobina crítica',
    urgency: 'immediate',
    clinicalSignificance: 'Anemia severa o policitemia, riesgo cardiovascular'
  },

  {
    markerCode: 'platelets',
    markerName: 'PLAQUETAS',
    category: 'blood',
    criticalHigh: 1000000, // Severe thrombocytosis
    criticalLow: 20000,    // Severe thrombocytopenia
    unit: '/mm³',
    description: 'Plaquetas críticas',
    urgency: 'immediate',
    clinicalSignificance: 'Riesgo de hemorragia o trombosis'
  },

  {
    markerCode: 'wbc',
    markerName: 'GLÓBULOS BLANCOS',
    category: 'blood',
    criticalHigh: 50000, // Severe leukocytosis
    criticalLow: 1000,   // Severe leukopenia
    unit: '/mm³',
    description: 'Leucocitos críticos',
    urgency: 'urgent',
    clinicalSignificance: 'Infección severa o inmunosupresión crítica'
  },

  // ELECTROLYTES - Critical for cardiac arrhythmias
  {
    markerCode: 'potassium',
    markerName: 'POTASIO',
    category: 'electrolytes',
    criticalHigh: 6.5, // Severe hyperkalemia
    criticalLow: 2.5,  // Severe hypokalemia
    unit: 'mEq/L',
    description: 'Potasio crítico',
    urgency: 'immediate',
    clinicalSignificance: 'Arritmias cardíacas potencialmente fatales'
  },

  {
    markerCode: 'sodium',
    markerName: 'SODIO',
    category: 'electrolytes',
    criticalHigh: 160, // Severe hypernatremia
    criticalLow: 120,  // Severe hyponatremia
    unit: 'mEq/L',
    description: 'Sodio crítico',
    urgency: 'urgent',
    clinicalSignificance: 'Alteraciones neurológicas, convulsiones'
  },

  // THYROID - Critical for thyroid storm/coma
  {
    markerCode: 'tsh',
    markerName: 'H. TIROESTIMULANTE (TSH)',
    category: 'thyroid',
    criticalHigh: 50, // Severe hypothyroidism
    criticalLow: 0.01, // Severe hyperthyroidism
    unit: 'mUI/L',
    description: 'TSH crítico',
    urgency: 'urgent',
    clinicalSignificance: 'Coma mixedematoso o tormenta tiroidea'
  }
]

/**
 * Evaluates lab values for critical thresholds that require immediate attention
 */
export function evaluateCriticalValues(
  abnormalResults: AbnormalValueResult[],
  confidenceResult: OverallConfidenceResult
): CriticalValueOverrideResult {
  
  const criticalAlerts: CriticalValueAlert[] = []
  let lifeThreatening = 0
  let requiresImmediateAction = false

  // Check each abnormal result against critical thresholds
  for (const result of abnormalResults) {
    if (!result.labValue || !result.healthMarker.marker) {
      continue
    }

    const markerCode = result.healthMarker.marker.systemCode
    const threshold = CRITICAL_VALUE_THRESHOLDS.find(t => t.markerCode === markerCode)
    
    if (!threshold) {
      continue // No critical threshold defined for this marker
    }

    const value = result.labValue.value
    let isCritical = false
    let severity: 'life_threatening' | 'critical' | 'urgent' = 'urgent'

    // Check if value exceeds critical thresholds
    if (threshold.criticalHigh && value > threshold.criticalHigh) {
      isCritical = true
      severity = threshold.urgency === 'immediate' ? 'life_threatening' : 'critical'
    } else if (threshold.criticalLow && value < threshold.criticalLow) {
      isCritical = true
      severity = threshold.urgency === 'immediate' ? 'life_threatening' : 'critical'
    }

    if (isCritical) {
      const alert: CriticalValueAlert = {
        id: `critical-${markerCode}-${Date.now()}`,
        markerCode,
        markerName: threshold.markerName,
        value,
        unit: threshold.unit,
        threshold,
        severity,
        urgency: threshold.urgency,
        clinicalRisk: threshold.clinicalSignificance,
        recommendedActions: generateRecommendedActions(threshold, value, severity),
        escalationRequired: severity === 'life_threatening' || threshold.urgency === 'immediate',
        timeToAction: getTimeToAction(threshold.urgency),
        originalConfidence: result.confidence,
        overrideReason: `Valor crítico detectado: ${value} ${threshold.unit} (umbral: ${
          value > (threshold.criticalHigh || 0) ? `>${threshold.criticalHigh}` : `<${threshold.criticalLow}`
        })`
      }

      criticalAlerts.push(alert)

      if (severity === 'life_threatening') {
        lifeThreatening++
        requiresImmediateAction = true
      }
    }
  }

  // Determine overall override recommendation
  let overrideRecommendation: 'immediate_escalation' | 'urgent_review' | 'priority_processing' | 'standard_processing'
  let escalationLevel: 'emergency' | 'urgent' | 'routine'
  let bypassLowConfidence = false

  if (lifeThreatening > 0) {
    overrideRecommendation = 'immediate_escalation'
    escalationLevel = 'emergency'
    bypassLowConfidence = true // Always process critical values regardless of confidence
  } else if (criticalAlerts.some(a => a.severity === 'critical')) {
    overrideRecommendation = 'urgent_review'
    escalationLevel = 'urgent'
    bypassLowConfidence = true
  } else if (criticalAlerts.length > 0) {
    overrideRecommendation = 'priority_processing'
    escalationLevel = 'urgent'
    bypassLowConfidence = confidenceResult.overallScore < 70 // Bypass only if low confidence
  } else {
    overrideRecommendation = 'standard_processing'
    escalationLevel = 'routine'
    bypassLowConfidence = false
  }

  return {
    hasCriticalValues: criticalAlerts.length > 0,
    criticalAlerts,
    overrideRecommendation,
    bypassLowConfidence,
    escalationLevel,
    totalCriticalCount: criticalAlerts.length,
    lifeThreatening,
    requiresImmediateAction
  }
}

/**
 * Generates recommended actions based on critical value type and severity
 */
function generateRecommendedActions(
  threshold: CriticalValueThreshold,
  value: number,
  severity: 'life_threatening' | 'critical' | 'urgent'
): string[] {
  const actions: string[] = []

  // Universal critical value actions
  actions.push('🚨 CONTACTAR AL PACIENTE INMEDIATAMENTE')
  actions.push('📞 Verificar datos de contacto del paciente')

  // Severity-specific actions
  if (severity === 'life_threatening') {
    actions.push('🏥 DERIVAR A SERVICIO DE URGENCIA INMEDIATAMENTE')
    actions.push('🚑 Considerar llamar ambulancia si es necesario')
    actions.push('⏰ Tiempo crítico: acción en menos de 1 hora')
  } else if (severity === 'critical') {
    actions.push('🏥 Programar consulta médica urgente (mismo día)')
    actions.push('📋 Preparar interconsulta con especialista')
    actions.push('⏰ Tiempo crítico: acción en menos de 4 horas')
  } else {
    actions.push('📅 Programar consulta médica prioritaria (24-48 horas)')
    actions.push('📋 Evaluar necesidad de interconsulta')
  }

  // Category-specific actions
  switch (threshold.category) {
    case 'glucose':
      if (value > 400) {
        actions.push('💉 Evaluar cetoacidosis diabética')
        actions.push('💧 Hidratación y control de electrolitos')
      } else if (value < 50) {
        actions.push('🍯 Administrar glucosa inmediatamente')
        actions.push('🧠 Evaluar estado neurológico')
      }
      break

    case 'cardiac':
      actions.push('❤️ Realizar ECG inmediatamente')
      actions.push('🏥 Evaluar síndrome coronario agudo')
      break

    case 'kidney':
      actions.push('💧 Evaluar estado de hidratación')
      actions.push('🔬 Controlar electrolitos y equilibrio ácido-base')
      actions.push('🏥 Considerar necesidad de diálisis')
      break

    case 'liver':
      actions.push('🟡 Evaluar encefalopatía hepática')
      actions.push('🩸 Controlar coagulación')
      actions.push('🏥 Considerar derivación a hepatología')
      break

    case 'blood':
      if (threshold.markerCode === 'hemoglobin' && value < 6) {
        actions.push('🩸 Evaluar necesidad de transfusión')
        actions.push('🔍 Investigar causa de anemia severa')
      } else if (threshold.markerCode === 'platelets' && value < 20000) {
        actions.push('🩸 Riesgo de hemorragia - precauciones')
        actions.push('🏥 Evaluar necesidad de transfusión plaquetaria')
      }
      break

    case 'electrolytes':
      actions.push('❤️ Monitoreo cardíaco continuo')
      actions.push('💉 Corrección electrolítica gradual')
      actions.push('🧠 Evaluar estado neurológico')
      break

    case 'thyroid':
      if (value > 50) {
        actions.push('🥶 Evaluar coma mixedematoso')
        actions.push('🌡️ Control de temperatura corporal')
      } else if (value < 0.01) {
        actions.push('🔥 Evaluar tormenta tiroidea')
        actions.push('❤️ Monitoreo cardiovascular')
      }
      break
  }

  // Documentation and follow-up
  actions.push('📝 Documentar en ficha clínica como VALOR CRÍTICO')
  actions.push('📊 Programar controles de seguimiento')
  actions.push('👨‍⚕️ Informar a médico tratante')

  return actions
}

/**
 * Gets time to action based on urgency level
 */
function getTimeToAction(urgency: 'immediate' | 'urgent' | 'priority'): string {
  switch (urgency) {
    case 'immediate':
      return '< 1 hora'
    case 'urgent':
      return '< 4 horas'
    case 'priority':
      return '< 24 horas'
    default:
      return '< 48 horas'
  }
}

/**
 * Checks if a specific marker code has critical thresholds defined
 */
export function hasCriticalThreshold(markerCode: string): boolean {
  return CRITICAL_VALUE_THRESHOLDS.some(t => t.markerCode === markerCode)
}

/**
 * Gets critical threshold for a specific marker
 */
export function getCriticalThreshold(markerCode: string): CriticalValueThreshold | null {
  return CRITICAL_VALUE_THRESHOLDS.find(t => t.markerCode === markerCode) || null
}

/**
 * Analyzes critical value override patterns for system improvement
 */
export function analyzeCriticalValueOverrides(overrides: CriticalValueOverrideResult[]): {
  totalOverrides: number
  lifeThreatening: number
  bypassedLowConfidence: number
  categoryBreakdown: Record<string, number>
  mostCommonCritical: string[]
  averageResponseTime: string
  recommendations: string[]
} {
  if (overrides.length === 0) {
    return {
      totalOverrides: 0,
      lifeThreatening: 0,
      bypassedLowConfidence: 0,
      categoryBreakdown: {},
      mostCommonCritical: [],
      averageResponseTime: 'N/A',
      recommendations: ['No hay datos de valores críticos para analizar']
    }
  }

  const totalOverrides = overrides.filter(o => o.hasCriticalValues).length
  const lifeThreatening = overrides.reduce((sum, o) => sum + o.lifeThreatening, 0)
  const bypassedLowConfidence = overrides.filter(o => o.bypassLowConfidence).length

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  const criticalMarkers: string[] = []

  for (const override of overrides) {
    for (const alert of override.criticalAlerts) {
      const category = alert.threshold.category
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1
      criticalMarkers.push(alert.markerCode)
    }
  }

  // Most common critical markers
  const markerCounts = criticalMarkers.reduce((counts, marker) => {
    counts[marker] = (counts[marker] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const mostCommonCritical = Object.entries(markerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([marker]) => marker)

  // Generate recommendations
  const recommendations: string[] = []

  if (lifeThreatening > 0) {
    recommendations.push(`🚨 ${lifeThreatening} casos con valores potencialmente mortales detectados`)
  }

  if (bypassedLowConfidence > 0) {
    recommendations.push(`⚠️ ${bypassedLowConfidence} casos de baja confianza procesados por valores críticos`)
  }

  if (categoryBreakdown.glucose > 0) {
    recommendations.push(`🩺 ${categoryBreakdown.glucose} casos críticos de glucosa - revisar protocolo diabetes`)
  }

  if (categoryBreakdown.cardiac > 0) {
    recommendations.push(`❤️ ${categoryBreakdown.cardiac} casos críticos cardíacos - protocolo infarto`)
  }

  if (totalOverrides > 10) {
    recommendations.push('📈 Alto volumen de valores críticos - revisar umbrales y protocolos')
  }

  return {
    totalOverrides,
    lifeThreatening,
    bypassedLowConfidence,
    categoryBreakdown,
    mostCommonCritical,
    averageResponseTime: '< 2 horas', // This would be calculated from actual response data
    recommendations
  }
}