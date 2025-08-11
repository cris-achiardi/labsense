/**
 * Auto-Approval System for Chilean Lab Reports
 * Automatically processes high-confidence lab results (85%+) to reduce manual workload
 * Critical for Chilean public healthcare efficiency
 */

import { OverallConfidenceResult } from './confidence-scoring'
import { AbnormalValueExtractionResult } from '@/lib/pdf-parsing/abnormal-value-detector'
import { RUTExtractionResult } from '@/lib/pdf-parsing/chilean-rut-parser'

export interface AutoApprovalDecision {
  approved: boolean
  reason: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresReview: boolean
  processingRecommendation: 'auto_process' | 'manual_review' | 'escalate' | 'reject'
  safeguards: string[]
  auditInfo: {
    timestamp: Date
    decisionCriteria: string[]
    overrides: string[]
  }
}

export interface ProcessedLabResult {
  success: boolean
  patientRUT: string | null
  patientName?: string
  priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL'
  priorityScore: number
  abnormalitiesFound: number
  criticalAbnormalities: number
  autoApproved: boolean
  processingTime: number
  qualityScore: number
  recommendations: string[]
  nextActions: string[]
}

/**
 * Auto-approval thresholds and safety criteria
 */
const AUTO_APPROVAL_CONFIG = {
  // Confidence thresholds
  MIN_CONFIDENCE: 85, // Minimum overall confidence for auto-approval
  MIN_RUT_CONFIDENCE: 80, // Minimum RUT confidence (patient safety)
  MIN_MARKER_CONFIDENCE: 75, // Minimum health marker confidence
  
  // Safety limits
  MAX_CRITICAL_ABNORMALITIES: 3, // Max critical abnormalities for auto-approval
  MAX_RISK_FACTORS: 2, // Max risk factors allowed
  
  // Quality requirements
  MIN_COMPLETENESS: 70, // Minimum data completeness percentage
  MIN_ACCURACY: 80, // Minimum accuracy score
  
  // Override conditions (require manual review even if high confidence)
  MANUAL_REVIEW_TRIGGERS: [
    'Multiple RUTs detected',
    'RUT format invalid', 
    'No health markers found',
    'Critical abnormalities detected'
  ]
}

/**
 * Evaluates if a lab report should be auto-approved
 */
export function evaluateAutoApproval(
  confidenceResult: OverallConfidenceResult,
  abnormalDetection: AbnormalValueExtractionResult,
  rutExtraction: RUTExtractionResult
): AutoApprovalDecision {
  
  const startTime = Date.now()
  const decisionCriteria: string[] = []
  const overrides: string[] = []
  const safeguards: string[] = []
  
  // Initial approval based on confidence threshold
  let approved = confidenceResult.overallScore >= AUTO_APPROVAL_CONFIG.MIN_CONFIDENCE
  let reason = approved 
    ? `Confianza alta (${confidenceResult.overallScore}% ≥ ${AUTO_APPROVAL_CONFIG.MIN_CONFIDENCE}%)`
    : `Confianza insuficiente (${confidenceResult.overallScore}% < ${AUTO_APPROVAL_CONFIG.MIN_CONFIDENCE}%)`
  
  decisionCriteria.push(`Confianza general: ${confidenceResult.overallScore}%`)
  
  // Check component-specific thresholds
  const rutComponent = confidenceResult.components.find(c => c.component === 'rut')
  const markerComponent = confidenceResult.components.find(c => c.component === 'health_markers')
  
  if (rutComponent && rutComponent.score < AUTO_APPROVAL_CONFIG.MIN_RUT_CONFIDENCE) {
    approved = false
    reason = `Confianza de RUT insuficiente (${rutComponent.score}% < ${AUTO_APPROVAL_CONFIG.MIN_RUT_CONFIDENCE}%)`
    overrides.push('RUT confidence too low')
    decisionCriteria.push(`RUT confianza: ${rutComponent.score}% (mínimo: ${AUTO_APPROVAL_CONFIG.MIN_RUT_CONFIDENCE}%)`)
  }
  
  if (markerComponent && markerComponent.score < AUTO_APPROVAL_CONFIG.MIN_MARKER_CONFIDENCE) {
    approved = false
    reason = `Confianza de marcadores insuficiente (${markerComponent.score}% < ${AUTO_APPROVAL_CONFIG.MIN_MARKER_CONFIDENCE}%)`
    overrides.push('Health marker confidence too low')
    decisionCriteria.push(`Marcadores confianza: ${markerComponent.score}% (mínimo: ${AUTO_APPROVAL_CONFIG.MIN_MARKER_CONFIDENCE}%)`)
  }
  
  // Check quality metrics
  if (confidenceResult.qualityMetrics.completeness < AUTO_APPROVAL_CONFIG.MIN_COMPLETENESS) {
    approved = false
    reason = `Completitud insuficiente (${confidenceResult.qualityMetrics.completeness}% < ${AUTO_APPROVAL_CONFIG.MIN_COMPLETENESS}%)`
    overrides.push('Data completeness too low')
    decisionCriteria.push(`Completitud: ${confidenceResult.qualityMetrics.completeness}%`)
  }
  
  if (confidenceResult.qualityMetrics.accuracy < AUTO_APPROVAL_CONFIG.MIN_ACCURACY) {
    approved = false
    reason = `Precisión insuficiente (${confidenceResult.qualityMetrics.accuracy}% < ${AUTO_APPROVAL_CONFIG.MIN_ACCURACY}%)`
    overrides.push('Accuracy too low')
    decisionCriteria.push(`Precisión: ${confidenceResult.qualityMetrics.accuracy}%`)
  }
  
  // Check for critical abnormalities (safety override)
  const criticalCount = abnormalDetection.criticalAbnormalities.length
  if (criticalCount > AUTO_APPROVAL_CONFIG.MAX_CRITICAL_ABNORMALITIES) {
    approved = false
    reason = `Demasiadas anormalidades críticas (${criticalCount} > ${AUTO_APPROVAL_CONFIG.MAX_CRITICAL_ABNORMALITIES})`
    overrides.push('Too many critical abnormalities')
    safeguards.push('🚨 SEGURIDAD: Múltiples anormalidades críticas requieren revisión médica')
    decisionCriteria.push(`Anormalidades críticas: ${criticalCount}`)
  }
  
  // Check risk factors
  const riskFactorCount = confidenceResult.riskFactors.length
  if (riskFactorCount > AUTO_APPROVAL_CONFIG.MAX_RISK_FACTORS) {
    approved = false
    reason = `Demasiados factores de riesgo (${riskFactorCount} > ${AUTO_APPROVAL_CONFIG.MAX_RISK_FACTORS})`
    overrides.push('Too many risk factors')
    decisionCriteria.push(`Factores de riesgo: ${riskFactorCount}`)
  }
  
  // Check for manual review triggers
  for (const trigger of AUTO_APPROVAL_CONFIG.MANUAL_REVIEW_TRIGGERS) {
    if (confidenceResult.riskFactors.some(rf => rf.includes(trigger))) {
      approved = false
      reason = `Trigger de revisión manual: ${trigger}`
      overrides.push(`Manual review trigger: ${trigger}`)
      safeguards.push(`⚠️ SEGURIDAD: ${trigger} requiere validación humana`)
    }
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (criticalCount > 0 || riskFactorCount > 3) {
    riskLevel = 'critical'
  } else if (abnormalDetection.severeAbnormalities.length > 0 || riskFactorCount > 1) {
    riskLevel = 'high'
  } else if (abnormalDetection.totalAbnormalities > 0 || riskFactorCount > 0) {
    riskLevel = 'medium'
  }
  
  // Determine processing recommendation
  let processingRecommendation: 'auto_process' | 'manual_review' | 'escalate' | 'reject'
  if (approved && riskLevel === 'low') {
    processingRecommendation = 'auto_process'
  } else if (confidenceResult.overallScore >= 70) {
    processingRecommendation = riskLevel === 'critical' ? 'escalate' : 'manual_review'
  } else {
    processingRecommendation = 'reject'
  }
  
  // Add standard safeguards for auto-approved cases
  if (approved) {
    safeguards.push('✅ Confianza validada por algoritmo de puntuación múltiple')
    safeguards.push('✅ Umbrales de seguridad verificados')
    safeguards.push('✅ Factores de riesgo dentro de límites aceptables')
    
    if (abnormalDetection.totalAbnormalities > 0) {
      safeguards.push('⚠️ Anormalidades detectadas - incluidas en priorización automática')
    }
  }
  
  return {
    approved,
    reason,
    confidence: confidenceResult.overallScore,
    riskLevel,
    requiresReview: !approved || riskLevel === 'high' || riskLevel === 'critical',
    processingRecommendation,
    safeguards,
    auditInfo: {
      timestamp: new Date(),
      decisionCriteria,
      overrides
    }
  }
}

/**
 * Processes an auto-approved lab report
 */
export function processAutoApprovedReport(
  confidenceResult: OverallConfidenceResult,
  abnormalDetection: AbnormalValueExtractionResult,
  rutExtraction: RUTExtractionResult,
  autoApproval: AutoApprovalDecision
): ProcessedLabResult {
  
  const startTime = Date.now()
  
  // Extract patient information
  const patientRUT = rutExtraction.bestMatch?.formattedRut || rutExtraction.bestMatch?.rut || null
  
  // Determine priority level based on abnormalities
  let priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL' = 'NORMAL'
  let priorityScore = abnormalDetection.overallPriorityScore
  
  if (priorityScore > 50) {
    priorityLevel = 'HIGH'
  } else if (priorityScore > 20) {
    priorityLevel = 'MEDIUM'
  } else if (priorityScore > 0) {
    priorityLevel = 'LOW'
  }
  
  // Generate recommendations
  const recommendations: string[] = []
  const nextActions: string[] = []
  
  if (abnormalDetection.criticalAbnormalities.length > 0) {
    recommendations.push(`🚨 ${abnormalDetection.criticalAbnormalities.length} anormalidades críticas detectadas`)
    nextActions.push('Contactar al paciente inmediatamente')
    nextActions.push('Programar consulta médica urgente')
  }
  
  if (abnormalDetection.severeAbnormalities.length > 0) {
    recommendations.push(`⚠️ ${abnormalDetection.severeAbnormalities.length} anormalidades severas detectadas`)
    nextActions.push('Programar seguimiento médico en 48-72 horas')
  }
  
  if (abnormalDetection.totalAbnormalities > 0) {
    recommendations.push(`📊 Total de ${abnormalDetection.totalAbnormalities} valores anormales encontrados`)
  } else {
    recommendations.push('✅ Todos los valores dentro de rangos normales')
    nextActions.push('Continuar con controles de rutina')
  }
  
  // Add quality assurance recommendations
  recommendations.push(`🎯 Procesado automáticamente con ${autoApproval.confidence}% de confianza`)
  
  if (autoApproval.riskLevel === 'medium') {
    recommendations.push('⚠️ Riesgo medio - considerar revisión adicional si es necesario')
  }
  
  const processingTime = Date.now() - startTime
  
  return {
    success: true,
    patientRUT,
    priorityLevel,
    priorityScore,
    abnormalitiesFound: abnormalDetection.totalAbnormalities,
    criticalAbnormalities: abnormalDetection.criticalAbnormalities.length,
    autoApproved: autoApproval.approved,
    processingTime,
    qualityScore: confidenceResult.overallScore,
    recommendations,
    nextActions
  }
}

/**
 * Analyzes auto-approval performance for system optimization
 */
export function analyzeAutoApprovalPerformance(decisions: AutoApprovalDecision[]): {
  totalDecisions: number
  autoApprovalRate: number
  manualReviewRate: number
  rejectionRate: number
  averageConfidence: number
  riskDistribution: Record<string, number>
  commonOverrides: string[]
  safeguardTriggers: number
  recommendations: string[]
} {
  
  if (decisions.length === 0) {
    return {
      totalDecisions: 0,
      autoApprovalRate: 0,
      manualReviewRate: 0,
      rejectionRate: 0,
      averageConfidence: 0,
      riskDistribution: {},
      commonOverrides: [],
      safeguardTriggers: 0,
      recommendations: ['No hay datos para analizar']
    }
  }
  
  const totalDecisions = decisions.length
  const autoApproved = decisions.filter(d => d.approved).length
  const manualReview = decisions.filter(d => d.processingRecommendation === 'manual_review').length
  const rejected = decisions.filter(d => d.processingRecommendation === 'reject').length
  
  const autoApprovalRate = Math.round((autoApproved / totalDecisions) * 100)
  const manualReviewRate = Math.round((manualReview / totalDecisions) * 100)
  const rejectionRate = Math.round((rejected / totalDecisions) * 100)
  
  const averageConfidence = Math.round(
    decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions
  )
  
  // Risk distribution
  const riskDistribution = decisions.reduce((dist, d) => {
    dist[d.riskLevel] = (dist[d.riskLevel] || 0) + 1
    return dist
  }, {} as Record<string, number>)
  
  // Common overrides
  const allOverrides = decisions.flatMap(d => d.auditInfo.overrides)
  const overrideCounts = allOverrides.reduce((counts, override) => {
    counts[override] = (counts[override] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  const commonOverrides = Object.entries(overrideCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([override]) => override)
  
  const safeguardTriggers = decisions.filter(d => d.safeguards.length > 0).length
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (autoApprovalRate < 50) {
    recommendations.push('⚠️ Baja tasa de aprobación automática - revisar umbrales de confianza')
  } else if (autoApprovalRate > 80) {
    recommendations.push('✅ Excelente tasa de aprobación automática - sistema funcionando bien')
  }
  
  if (rejectionRate > 30) {
    recommendations.push('🚨 Alta tasa de rechazo - mejorar calidad de PDFs o algoritmos')
  }
  
  if (commonOverrides.includes('RUT confidence too low')) {
    recommendations.push('🔧 Mejorar detección de RUT - causa común de rechazo')
  }
  
  if (commonOverrides.includes('Too many critical abnormalities')) {
    recommendations.push('🏥 Muchos casos críticos - revisar umbrales de seguridad')
  }
  
  if (averageConfidence < 75) {
    recommendations.push('📈 Confianza promedio baja - optimizar algoritmos de extracción')
  }
  
  return {
    totalDecisions,
    autoApprovalRate,
    manualReviewRate,
    rejectionRate,
    averageConfidence,
    riskDistribution,
    commonOverrides,
    safeguardTriggers,
    recommendations
  }
}