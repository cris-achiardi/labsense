/**
 * Confidence Scoring Algorithm for Chilean Lab Report Parsing
 * Combines confidence from RUT parsing, health markers, reference ranges, and abnormal values
 * Critical for determining auto-approval vs manual review in Chilean healthcare
 */

import { RUTExtractionResult } from '@/lib/pdf-parsing/chilean-rut-parser'
import { HealthMarkerExtractionResult } from '@/lib/pdf-parsing/spanish-health-markers'
import { ReferenceRangeExtractionResult } from '@/lib/pdf-parsing/reference-range-parser'
import { AbnormalValueExtractionResult } from '@/lib/pdf-parsing/abnormal-value-detector'

export interface ComponentConfidence {
  component: 'rut' | 'health_markers' | 'reference_ranges' | 'abnormal_values'
  score: number // 0-100
  weight: number // Importance weight
  details: string
  issues: string[]
}

export interface OverallConfidenceResult {
  overallScore: number // 0-100 weighted average
  recommendation: 'auto_approve' | 'manual_review' | 'reject'
  components: ComponentConfidence[]
  qualityMetrics: {
    completeness: number // How much data was extracted
    accuracy: number // How reliable the extraction seems
    consistency: number // How well components agree
  }
  riskFactors: string[]
  approvalThresholds: {
    autoApprove: number // 85%
    manualReview: number // 70%
    reject: number // Below 50%
  }
}

/**
 * Component weights for overall confidence calculation
 * Based on importance for Chilean healthcare decision-making
 */
const COMPONENT_WEIGHTS = {
  rut: 0.20, // 20% - Patient identification is critical
  health_markers: 0.30, // 30% - Core medical data
  reference_ranges: 0.25, // 25% - Needed for abnormality detection
  abnormal_values: 0.25 // 25% - Critical for patient prioritization
}

/**
 * Confidence thresholds for decision-making
 */
const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 85, // High confidence - automatic processing
  MANUAL_REVIEW: 70, // Medium confidence - human review needed
  REJECT: 50 // Low confidence - likely parsing failure
}

/**
 * Evaluates RUT parsing confidence
 */
function evaluateRUTConfidence(rutExtraction: RUTExtractionResult): ComponentConfidence {
  let score = 0
  const issues: string[] = []
  let details = ''
  
  if (!rutExtraction.success || !rutExtraction.bestMatch) {
    return {
      component: 'rut',
      score: 0,
      weight: COMPONENT_WEIGHTS.rut,
      details: 'No se pudo extraer RUT del paciente',
      issues: ['No RUT found', 'Patient identification failed']
    }
  }
  
  const bestMatch = rutExtraction.bestMatch
  score = bestMatch.confidence
  
  // Adjust score based on validation
  if (!bestMatch.success) {
    score = Math.max(0, score - 40)
    issues.push('RUT format invalid')
  }
  
  // Check for multiple RUTs (potential confusion)
  if (rutExtraction.results.length > 3) {
    score = Math.max(0, score - 15)
    issues.push('Multiple RUTs detected')
  }
  
  // Boost confidence for high-quality sources
  if (bestMatch.source === 'form' || bestMatch.source === 'header') {
    score = Math.min(100, score + 5)
  }
  
  details = `RUT: ${bestMatch.formattedRut || bestMatch.rut}, Fuente: ${bestMatch.source}, Confianza: ${bestMatch.confidence}%`
  
  return {
    component: 'rut',
    score: Math.round(score),
    weight: COMPONENT_WEIGHTS.rut,
    details,
    issues
  }
}

/**
 * Evaluates health marker extraction confidence
 */
function evaluateHealthMarkerConfidence(markerExtraction: HealthMarkerExtractionResult): ComponentConfidence {
  let score = 0
  const issues: string[] = []
  let details = ''
  
  if (!markerExtraction.success || markerExtraction.totalMarkersFound === 0) {
    return {
      component: 'health_markers',
      score: 0,
      weight: COMPONENT_WEIGHTS.health_markers,
      details: 'No se encontraron marcadores de salud',
      issues: ['No health markers found', 'Medical data extraction failed']
    }
  }
  
  const totalMarkers = markerExtraction.totalMarkersFound
  const criticalMarkers = markerExtraction.criticalMarkers.length
  const highPriorityMarkers = markerExtraction.highPriorityMarkers.length
  
  // Base score from average marker confidence
  const avgConfidence = markerExtraction.results.reduce((sum, r) => sum + r.confidence, 0) / markerExtraction.results.length
  score = avgConfidence
  
  // Boost for critical markers (glucose, HbA1c, TSH)
  if (criticalMarkers > 0) {
    score = Math.min(100, score + (criticalMarkers * 5))
  }
  
  // Boost for high priority markers
  if (highPriorityMarkers > 0) {
    score = Math.min(100, score + (highPriorityMarkers * 3))
  }
  
  // Penalize if very few markers found (incomplete extraction)
  if (totalMarkers < 3) {
    score = Math.max(0, score - 20)
    issues.push('Few health markers detected')
  }
  
  // Boost for comprehensive extraction
  if (totalMarkers >= 10) {
    score = Math.min(100, score + 10)
  }
  
  details = `${totalMarkers} marcadores encontrados (${criticalMarkers} críticos, ${highPriorityMarkers} alta prioridad)`
  
  return {
    component: 'health_markers',
    score: Math.round(score),
    weight: COMPONENT_WEIGHTS.health_markers,
    details,
    issues
  }
}

/**
 * Evaluates reference range extraction confidence
 */
function evaluateReferenceRangeConfidence(rangeExtraction: ReferenceRangeExtractionResult): ComponentConfidence {
  let score = 0
  const issues: string[] = []
  let details = ''
  
  if (!rangeExtraction.success || rangeExtraction.totalRangesFound === 0) {
    return {
      component: 'reference_ranges',
      score: 30, // Partial score - ranges might be implicit
      weight: COMPONENT_WEIGHTS.reference_ranges,
      details: 'No se encontraron rangos de referencia explícitos',
      issues: ['No reference ranges found', 'Cannot validate abnormal values']
    }
  }
  
  const totalRanges = rangeExtraction.totalRangesFound
  
  // Base score from average range confidence
  const avgConfidence = rangeExtraction.results.reduce((sum, r) => sum + r.confidence, 0) / rangeExtraction.results.length
  score = avgConfidence
  
  // Boost for comprehensive range extraction
  if (totalRanges >= 5) {
    score = Math.min(100, score + 15)
  } else if (totalRanges >= 3) {
    score = Math.min(100, score + 10)
  } else if (totalRanges === 1) {
    score = Math.max(0, score - 10)
    issues.push('Limited reference ranges')
  }
  
  // Check for abnormal markers in ranges
  const hasAbnormalMarkers = rangeExtraction.results.some(r => 
    r.context.includes('[ * ]') || r.context.includes('[*]')
  )
  
  if (hasAbnormalMarkers) {
    score = Math.min(100, score + 10)
  }
  
  details = `${totalRanges} rangos de referencia encontrados`
  
  return {
    component: 'reference_ranges',
    score: Math.round(score),
    weight: COMPONENT_WEIGHTS.reference_ranges,
    details,
    issues
  }
}

/**
 * Evaluates abnormal value detection confidence
 */
function evaluateAbnormalValueConfidence(abnormalDetection: AbnormalValueExtractionResult): ComponentConfidence {
  let score = 0
  const issues: string[] = []
  let details = ''
  
  if (!abnormalDetection.success) {
    return {
      component: 'abnormal_values',
      score: 0,
      weight: COMPONENT_WEIGHTS.abnormal_values,
      details: 'Error en la detección de valores anormales',
      issues: ['Abnormal value detection failed', 'Cannot prioritize patient']
    }
  }
  
  const totalResults = abnormalDetection.results.length
  const abnormalCount = abnormalDetection.totalAbnormalities
  const criticalCount = abnormalDetection.criticalAbnormalities.length
  const severeCount = abnormalDetection.severeAbnormalities.length
  
  if (totalResults === 0) {
    return {
      component: 'abnormal_values',
      score: 20,
      weight: COMPONENT_WEIGHTS.abnormal_values,
      details: 'No se procesaron valores de laboratorio',
      issues: ['No lab values processed', 'Cannot assess patient condition']
    }
  }
  
  // Base score from average result confidence
  const avgConfidence = abnormalDetection.results.reduce((sum, r) => sum + r.confidence, 0) / totalResults
  score = avgConfidence
  
  // Boost for successful value extraction
  const valuesWithData = abnormalDetection.results.filter(r => r.labValue !== null).length
  const valueExtractionRate = valuesWithData / totalResults
  
  if (valueExtractionRate >= 0.8) {
    score = Math.min(100, score + 15)
  } else if (valueExtractionRate >= 0.6) {
    score = Math.min(100, score + 10)
  } else if (valueExtractionRate < 0.4) {
    score = Math.max(0, score - 20)
    issues.push('Low value extraction rate')
  }
  
  // Boost for critical abnormalities (high medical importance)
  if (criticalCount > 0) {
    score = Math.min(100, score + 10)
  }
  
  // Boost for severe abnormalities
  if (severeCount > 0) {
    score = Math.min(100, score + 5)
  }
  
  details = `${totalResults} marcadores procesados, ${abnormalCount} anormales (${criticalCount} críticos, ${severeCount} severos)`
  
  return {
    component: 'abnormal_values',
    score: Math.round(score),
    weight: COMPONENT_WEIGHTS.abnormal_values,
    details,
    issues
  }
}/**

 * Calculates quality metrics for the overall extraction
 */
function calculateQualityMetrics(components: ComponentConfidence[]): {
  completeness: number
  accuracy: number
  consistency: number
} {
  // Completeness: How much data was successfully extracted
  const completeness = components.reduce((sum, comp) => {
    if (comp.component === 'rut') {
      return sum + (comp.score > 0 ? 25 : 0) // RUT is binary - found or not
    } else if (comp.component === 'health_markers') {
      return sum + Math.min(25, comp.score * 0.25) // Scale to 0-25
    } else if (comp.component === 'reference_ranges') {
      return sum + Math.min(25, comp.score * 0.25) // Scale to 0-25
    } else if (comp.component === 'abnormal_values') {
      return sum + Math.min(25, comp.score * 0.25) // Scale to 0-25
    }
    return sum
  }, 0)
  
  // Accuracy: Average confidence of all components
  const accuracy = components.reduce((sum, comp) => sum + comp.score, 0) / components.length
  
  // Consistency: How well components agree (low variance = high consistency)
  const scores = components.map(comp => comp.score)
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  const consistency = Math.max(0, 100 - Math.sqrt(variance)) // Lower variance = higher consistency
  
  return {
    completeness: Math.round(completeness),
    accuracy: Math.round(accuracy),
    consistency: Math.round(consistency)
  }
}

/**
 * Identifies risk factors that might affect confidence
 */
function identifyRiskFactors(components: ComponentConfidence[]): string[] {
  const riskFactors: string[] = []
  
  // Collect all issues from components
  const allIssues = components.flatMap(comp => comp.issues)
  
  // Critical risk factors
  if (allIssues.includes('No RUT found')) {
    riskFactors.push('🚨 CRÍTICO: No se pudo identificar al paciente (RUT faltante)')
  }
  
  if (allIssues.includes('No health markers found')) {
    riskFactors.push('🚨 CRÍTICO: No se encontraron datos médicos para analizar')
  }
  
  if (allIssues.includes('RUT format invalid')) {
    riskFactors.push('⚠️ ALTO: RUT con formato inválido - verificar identidad del paciente')
  }
  
  // High risk factors
  if (allIssues.includes('Multiple RUTs detected')) {
    riskFactors.push('⚠️ ALTO: Múltiples RUTs detectados - posible confusión de pacientes')
  }
  
  if (allIssues.includes('Low value extraction rate')) {
    riskFactors.push('⚠️ ALTO: Baja extracción de valores - resultados incompletos')
  }
  
  // Medium risk factors
  if (allIssues.includes('Few health markers detected')) {
    riskFactors.push('⚠️ MEDIO: Pocos marcadores detectados - análisis limitado')
  }
  
  if (allIssues.includes('No reference ranges found')) {
    riskFactors.push('⚠️ MEDIO: Sin rangos de referencia - validación limitada')
  }
  
  if (allIssues.includes('Limited reference ranges')) {
    riskFactors.push('⚠️ MEDIO: Rangos de referencia limitados')
  }
  
  // Low risk factors
  if (allIssues.includes('Cannot validate abnormal values')) {
    riskFactors.push('ℹ️ BAJO: Validación de valores anormales limitada')
  }
  
  return riskFactors
}

/**
 * Main confidence scoring function
 * Combines all parsing components into overall confidence score
 */
export function calculateOverallConfidence(
  rutExtraction: RUTExtractionResult,
  markerExtraction: HealthMarkerExtractionResult,
  rangeExtraction: ReferenceRangeExtractionResult,
  abnormalDetection: AbnormalValueExtractionResult
): OverallConfidenceResult {
  
  // Evaluate each component
  const components: ComponentConfidence[] = [
    evaluateRUTConfidence(rutExtraction),
    evaluateHealthMarkerConfidence(markerExtraction),
    evaluateReferenceRangeConfidence(rangeExtraction),
    evaluateAbnormalValueConfidence(abnormalDetection)
  ]
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0)
  )
  
  // Determine recommendation
  let recommendation: 'auto_approve' | 'manual_review' | 'reject'
  if (overallScore >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
    recommendation = 'auto_approve'
  } else if (overallScore >= CONFIDENCE_THRESHOLDS.MANUAL_REVIEW) {
    recommendation = 'manual_review'
  } else {
    recommendation = 'reject'
  }
  
  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(components)
  
  // Identify risk factors
  const riskFactors = identifyRiskFactors(components)
  
  return {
    overallScore,
    recommendation,
    components,
    qualityMetrics,
    riskFactors,
    approvalThresholds: {
      autoApprove: CONFIDENCE_THRESHOLDS.AUTO_APPROVE,
      manualReview: CONFIDENCE_THRESHOLDS.MANUAL_REVIEW,
      reject: CONFIDENCE_THRESHOLDS.REJECT
    }
  }
}

/**
 * Analyzes confidence trends for debugging and improvement
 */
export function analyzeConfidenceTrends(results: OverallConfidenceResult[]): {
  averageScore: number
  autoApprovalRate: number
  manualReviewRate: number
  rejectionRate: number
  commonIssues: string[]
  recommendations: string[]
} {
  if (results.length === 0) {
    return {
      averageScore: 0,
      autoApprovalRate: 0,
      manualReviewRate: 0,
      rejectionRate: 0,
      commonIssues: [],
      recommendations: ['No hay datos para analizar']
    }
  }
  
  const averageScore = Math.round(
    results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
  )
  
  const autoApprovals = results.filter(r => r.recommendation === 'auto_approve').length
  const manualReviews = results.filter(r => r.recommendation === 'manual_review').length
  const rejections = results.filter(r => r.recommendation === 'reject').length
  
  const autoApprovalRate = Math.round((autoApprovals / results.length) * 100)
  const manualReviewRate = Math.round((manualReviews / results.length) * 100)
  const rejectionRate = Math.round((rejections / results.length) * 100)
  
  // Find common issues
  const allIssues = results.flatMap(r => r.components.flatMap(c => c.issues))
  const issueCounts = allIssues.reduce((counts, issue) => {
    counts[issue] = (counts[issue] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  const commonIssues = Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([issue]) => issue)
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (autoApprovalRate < 60) {
    recommendations.push('⚠️ Baja tasa de aprobación automática - revisar patrones de extracción')
  }
  
  if (rejectionRate > 20) {
    recommendations.push('🚨 Alta tasa de rechazo - mejorar calidad de PDFs o algoritmos')
  }
  
  if (commonIssues.includes('No RUT found')) {
    recommendations.push('🔧 Mejorar detección de RUT - patrón más común de falla')
  }
  
  if (commonIssues.includes('Few health markers detected')) {
    recommendations.push('🔧 Expandir patrones de marcadores de salud')
  }
  
  if (averageScore < 70) {
    recommendations.push('📈 Confianza promedio baja - revisar algoritmos de extracción')
  } else if (averageScore > 85) {
    recommendations.push('✅ Excelente confianza promedio - sistema funcionando bien')
  }
  
  return {
    averageScore,
    autoApprovalRate,
    manualReviewRate,
    rejectionRate,
    commonIssues,
    recommendations
  }
}

/**
 * Gets confidence level description for UI display
 */
export function getConfidenceLevelDescription(score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red'
  description: string
  action: string
} {
  if (score >= 90) {
    return {
      level: 'excellent',
      color: 'green',
      description: 'Confianza excelente',
      action: 'Procesamiento automático recomendado'
    }
  } else if (score >= 85) {
    return {
      level: 'good',
      color: 'blue',
      description: 'Confianza buena',
      action: 'Aprobación automática'
    }
  } else if (score >= 70) {
    return {
      level: 'fair',
      color: 'yellow',
      description: 'Confianza aceptable',
      action: 'Revisión manual recomendada'
    }
  } else if (score >= 50) {
    return {
      level: 'poor',
      color: 'orange',
      description: 'Confianza baja',
      action: 'Revisión manual requerida'
    }
  } else {
    return {
      level: 'critical',
      color: 'red',
      description: 'Confianza crítica',
      action: 'Rechazar o reprocesar'
    }
  }
}