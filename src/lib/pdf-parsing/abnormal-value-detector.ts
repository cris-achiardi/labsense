/**
 * Abnormal Value Detector for Chilean Lab Reports
 * Extracts lab result values and detects abnormalities using [ * ] markers
 * and numerical comparison with reference ranges
 * Critical for patient prioritization in Chilean public healthcare
 */

import { extractSpanishHealthMarkers, HealthMarkerResult } from './spanish-health-markers'
import { extractReferenceRanges, isValueInRange, ReferenceRange } from './reference-range-parser'

export interface LabValue {
  value: number
  unit?: string
  originalText: string
  confidence: number
  position: number
  hasAbnormalMarker: boolean // [ * ] marker present
}

export interface AbnormalValueResult {
  success: boolean
  healthMarker: HealthMarkerResult
  labValue: LabValue | null
  referenceRange: ReferenceRange | null
  isAbnormal: boolean
  abnormalitySource: 'marker' | 'numerical' | 'both' | 'none'
  severity: 'mild' | 'moderate' | 'severe' | 'critical' | 'normal'
  status: 'normal' | 'low' | 'high' | 'unknown'
  priorityScore: number // 0-100 for patient prioritization
  confidence: number
  context: string
}

export interface AbnormalValueExtractionResult {
  success: boolean
  results: AbnormalValueResult[]
  criticalAbnormalities: AbnormalValueResult[]
  severeAbnormalities: AbnormalValueResult[]
  totalAbnormalities: number
  overallPriorityScore: number
  error?: string
}

/**
 * Chilean lab value patterns for extracting numerical results
 */
const CHILEAN_LAB_VALUE_PATTERNS = [
  // Standard table format: MARKER    VALUE    UNIT    REFERENCE
  {
    pattern: /(\d+(?:\.\d+)?)\s+(mg\/dL|g\/dL|mUI\/L|U\/L|ng\/dL|pg\/mL|ng\/mL|mg\/L|%|mill\/mm³|\/mm³)/gi,
    confidence: 95,
    description: 'Value with unit'
  },
  
  // Value with abnormal marker: 269    mg/dL    [ * ]
  {
    pattern: /(\d+(?:\.\d+)?)\s+([a-zA-Z\/³]+)\s+\[\s*\*\s*\]/gi,
    confidence: 98,
    description: 'Value with abnormal marker'
  },
  
  // Decimal values: 11.040, 0.55
  {
    pattern: /\b(\d+\.\d+)\b/g,
    confidence: 80,
    description: 'Decimal value'
  },
  
  // Integer values in lab context: 269, 220
  {
    pattern: /\b(\d{2,4})\b/g,
    confidence: 75,
    description: 'Integer value'
  },
  
  // Values with comma decimal separator: 11,2 (Chilean format)
  {
    pattern: /(\d+,\d+)/g,
    confidence: 85,
    description: 'Chilean decimal format'
  }
]

/**
 * Extracts lab values from text near a health marker
 */
function extractLabValuesNearMarker(
  text: string, 
  markerPosition: number, 
  markerName: string
): LabValue[] {
  const values: LabValue[] = []
  
  // Extract context around the marker (same line + nearby lines)
  const contextStart = Math.max(0, markerPosition - 50)
  const contextEnd = Math.min(text.length, markerPosition + 300)
  const context = text.substring(contextStart, contextEnd)
  
  // Check for abnormal marker [ * ] in context
  const hasAbnormalMarker = /\[\s*\*\s*\]/.test(context)
  
  // Apply value patterns to context
  for (const pattern of CHILEAN_LAB_VALUE_PATTERNS) {
    let match
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags)
    
    while ((match = regex.exec(context)) !== null) {
      let valueStr = match[1]
      let confidence = pattern.confidence
      
      // Convert Chilean decimal format (comma to dot)
      if (valueStr.includes(',')) {
        valueStr = valueStr.replace(',', '.')
        confidence += 5 // Boost confidence for Chilean format
      }
      
      const value = parseFloat(valueStr)
      
      // Skip unrealistic values
      if (isNaN(value) || value < 0 || value > 100000) {
        continue
      }
      
      // Extract unit if present
      let unit: string | undefined
      if (match[2]) {
        unit = match[2]
        confidence += 10 // Boost confidence when unit is present
      }
      
      // Boost confidence if abnormal marker is present
      if (hasAbnormalMarker) {
        confidence += 15
      }
      
      // Boost confidence based on marker type
      if (markerName.includes('GLICEMIA') && value > 50 && value < 500) {
        confidence += 10
      } else if (markerName.includes('COLESTEROL') && value > 100 && value < 400) {
        confidence += 10
      } else if (markerName.includes('TSH') && value > 0.1 && value < 50) {
        confidence += 10
      }
      
      values.push({
        value,
        unit,
        originalText: match[0],
        confidence: Math.min(100, confidence),
        position: contextStart + match.index,
        hasAbnormalMarker
      })
    }
  }
  
  // Remove duplicates and sort by confidence
  const uniqueValues = values.filter((val, index, array) => {
    return array.findIndex(v => 
      Math.abs(v.value - val.value) < 0.01 && 
      Math.abs(v.position - val.position) < 20
    ) === index
  })
  
  return uniqueValues.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculates priority score based on marker type, abnormality, and severity
 */
function calculatePriorityScore(
  marker: HealthMarkerResult,
  labValue: LabValue | null,
  referenceRange: ReferenceRange | null,
  isAbnormal: boolean,
  severity: string
): number {
  let score = 0
  
  if (!isAbnormal || !labValue) {
    return 0 // Normal values get 0 priority
  }
  
  // Base score by marker priority
  switch (marker.marker?.priority) {
    case 'critical':
      score = 40 // Glucose, HbA1c, TSH
      break
    case 'high':
      score = 25 // Cholesterol, liver enzymes
      break
    case 'medium':
      score = 15 // Blood count, kidney function
      break
    case 'low':
      score = 5 // Vitamins
      break
    default:
      score = 10
  }
  
  // Multiply by severity
  switch (severity) {
    case 'critical':
      score *= 2.5
      break
    case 'severe':
      score *= 2.0
      break
    case 'moderate':
      score *= 1.5
      break
    case 'mild':
      score *= 1.2
      break
  }
  
  // Boost for specific critical conditions
  if (marker.marker?.systemCode === 'glucose_fasting' && labValue.value > 250) {
    score += 30 // Severe diabetes
  } else if (marker.marker?.systemCode === 'hba1c' && labValue.value > 10) {
    score += 25 // Very poor glucose control
  } else if (marker.marker?.systemCode === 'tsh' && labValue.value > 10) {
    score += 20 // Severe hypothyroidism
  }
  
  // Boost for abnormal markers [ * ]
  if (labValue.hasAbnormalMarker) {
    score += 10
  }
  
  return Math.min(100, Math.round(score))
}

/**
 * Determines severity based on how far outside normal range
 */
function determineSeverity(
  value: number,
  range: ReferenceRange | null,
  markerType: string
): 'mild' | 'moderate' | 'severe' | 'critical' | 'normal' {
  if (!range || !range.minValue || !range.maxValue) {
    return 'normal'
  }
  
  const rangeSize = range.maxValue - range.minValue
  let deviation = 0
  
  if (value < range.minValue) {
    deviation = (range.minValue - value) / rangeSize
  } else if (value > range.maxValue) {
    deviation = (value - range.maxValue) / rangeSize
  } else {
    return 'normal'
  }
  
  // Critical thresholds for specific markers
  if (markerType === 'glucose_fasting') {
    if (value > 300) return 'critical'
    if (value > 250) return 'severe'
    if (value > 180) return 'moderate'
    return 'mild'
  } else if (markerType === 'hba1c') {
    if (value > 12) return 'critical'
    if (value > 10) return 'severe'
    if (value > 8) return 'moderate'
    return 'mild'
  } else if (markerType === 'tsh') {
    if (value > 20 || value < 0.1) return 'critical'
    if (value > 10 || value < 0.2) return 'severe'
    if (value > 6 || value < 0.3) return 'moderate'
    return 'mild'
  }
  
  // General severity based on deviation
  if (deviation > 3) return 'critical'
  if (deviation > 2) return 'severe'
  if (deviation > 1) return 'moderate'
  return 'mild'
}

/**
 * Main function to detect abnormal values in Chilean lab reports
 */
export function detectAbnormalValues(text: string): AbnormalValueExtractionResult {
  const results: AbnormalValueResult[] = []
  
  try {
    // Extract health markers
    const markerExtraction = extractSpanishHealthMarkers(text)
    if (!markerExtraction.success || markerExtraction.results.length === 0) {
      return {
        success: false,
        results: [],
        criticalAbnormalities: [],
        severeAbnormalities: [],
        totalAbnormalities: 0,
        overallPriorityScore: 0,
        error: 'No se encontraron marcadores de salud en el texto'
      }
    }
    
    // Extract reference ranges
    const rangeExtraction = extractReferenceRanges(text)
    
    // Process each health marker
    for (const markerResult of markerExtraction.results) {
      if (!markerResult.marker) continue
      
      // Extract lab values near this marker
      const labValues = extractLabValuesNearMarker(
        text, 
        markerResult.position, 
        markerResult.marker.spanishName
      )
      
      if (labValues.length === 0) {
        // No values found for this marker
        results.push({
          success: false,
          healthMarker: markerResult,
          labValue: null,
          referenceRange: null,
          isAbnormal: false,
          abnormalitySource: 'none',
          severity: 'normal',
          status: 'unknown',
          priorityScore: 0,
          confidence: 0,
          context: text.substring(
            Math.max(0, markerResult.position - 100),
            Math.min(text.length, markerResult.position + 200)
          )
        })
        continue
      }
      
      // Use the highest confidence lab value
      const bestLabValue = labValues[0]
      
      // Find reference range for this marker
      let referenceRange: ReferenceRange | null = null
      if (rangeExtraction.success && rangeExtraction.results.length > 0) {
        // Find the closest reference range
        const nearbyRanges = rangeExtraction.results.filter(r => 
          Math.abs(r.position - markerResult.position) < 300
        )
        
        if (nearbyRanges.length > 0) {
          referenceRange = nearbyRanges.sort((a, b) => {
            const distanceA = Math.abs(a.position - markerResult.position)
            const distanceB = Math.abs(b.position - markerResult.position)
            return distanceA - distanceB
          })[0].range
        }
      }
      
      // Determine if value is abnormal
      let isAbnormal = false
      let abnormalitySource: 'marker' | 'numerical' | 'both' | 'none' = 'none'
      let status: 'normal' | 'low' | 'high' | 'unknown' = 'unknown'
      
      // Check abnormal marker [ * ]
      const hasMarkerAbnormal = bestLabValue.hasAbnormalMarker
      
      // Check numerical comparison with reference range
      let numericalAbnormal = false
      if (referenceRange) {
        const validation = isValueInRange(bestLabValue.value, referenceRange)
        numericalAbnormal = !validation.inRange
        status = validation.status
      }
      
      // Determine abnormality source
      if (hasMarkerAbnormal && numericalAbnormal) {
        isAbnormal = true
        abnormalitySource = 'both'
      } else if (hasMarkerAbnormal) {
        isAbnormal = true
        abnormalitySource = 'marker'
      } else if (numericalAbnormal) {
        isAbnormal = true
        abnormalitySource = 'numerical'
      }
      
      // Determine severity
      const severity = isAbnormal 
        ? determineSeverity(bestLabValue.value, referenceRange, markerResult.marker.systemCode)
        : 'normal'
      
      // Calculate priority score
      const priorityScore = calculatePriorityScore(
        markerResult,
        bestLabValue,
        referenceRange,
        isAbnormal,
        severity
      )
      
      // Calculate overall confidence
      const confidence = Math.round(
        (markerResult.confidence + bestLabValue.confidence + (referenceRange?.confidence || 0)) / 3
      )
      
      results.push({
        success: true,
        healthMarker: markerResult,
        labValue: bestLabValue,
        referenceRange,
        isAbnormal,
        abnormalitySource,
        severity,
        status,
        priorityScore,
        confidence,
        context: text.substring(
          Math.max(0, markerResult.position - 100),
          Math.min(text.length, markerResult.position + 300)
        )
      })
    }
    
    // Filter abnormalities by severity
    const abnormalResults = results.filter(r => r.isAbnormal)
    const criticalAbnormalities = abnormalResults.filter(r => r.severity === 'critical')
    const severeAbnormalities = abnormalResults.filter(r => r.severity === 'severe')
    
    // Calculate overall priority score
    const overallPriorityScore = Math.min(100, 
      abnormalResults.reduce((sum, r) => sum + r.priorityScore, 0)
    )
    
    return {
      success: true,
      results,
      criticalAbnormalities,
      severeAbnormalities,
      totalAbnormalities: abnormalResults.length,
      overallPriorityScore
    }
    
  } catch (error) {
    console.error('Error detecting abnormal values:', error)
    return {
      success: false,
      results: [],
      criticalAbnormalities: [],
      severeAbnormalities: [],
      totalAbnormalities: 0,
      overallPriorityScore: 0,
      error: error instanceof Error ? error.message : 'Error desconocido al detectar valores anormales'
    }
  }
}

/**
 * Analyzes abnormal value detection quality for debugging
 */
export function analyzeAbnormalValueDetection(text: string): {
  totalMarkers: number
  markersWithValues: number
  markersWithRanges: number
  abnormalCount: number
  criticalCount: number
  severeCount: number
  averageConfidence: number
  overallPriorityScore: number
  recommendations: string[]
} {
  const detection = detectAbnormalValues(text)
  const results = detection.results
  
  const analysis = {
    totalMarkers: results.length,
    markersWithValues: results.filter(r => r.labValue !== null).length,
    markersWithRanges: results.filter(r => r.referenceRange !== null).length,
    abnormalCount: detection.totalAbnormalities,
    criticalCount: detection.criticalAbnormalities.length,
    severeCount: detection.severeAbnormalities.length,
    averageConfidence: 0,
    overallPriorityScore: detection.overallPriorityScore,
    recommendations: [] as string[]
  }
  
  // Calculate average confidence
  if (results.length > 0) {
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
    analysis.averageConfidence = Math.round(totalConfidence / results.length)
  }
  
  // Generate recommendations
  if (analysis.totalMarkers === 0) {
    analysis.recommendations.push('⚠️ No se encontraron marcadores de salud para analizar')
  } else {
    analysis.recommendations.push(`✅ Se analizaron ${analysis.totalMarkers} marcadores de salud`)
  }
  
  if (analysis.abnormalCount === 0) {
    analysis.recommendations.push('✅ No se detectaron valores anormales - paciente estable')
  } else {
    analysis.recommendations.push(`🚨 ${analysis.abnormalCount} valores anormales detectados`)
  }
  
  if (analysis.criticalCount > 0) {
    analysis.recommendations.push(`🚨 CRÍTICO: ${analysis.criticalCount} valores críticos requieren atención inmediata`)
  }
  
  if (analysis.severeCount > 0) {
    analysis.recommendations.push(`⚠️ SEVERO: ${analysis.severeCount} valores severos requieren seguimiento urgente`)
  }
  
  if (analysis.overallPriorityScore > 50) {
    analysis.recommendations.push(`🔴 ALTA PRIORIDAD: Puntuación ${analysis.overallPriorityScore}/100 - Paciente requiere atención prioritaria`)
  } else if (analysis.overallPriorityScore > 20) {
    analysis.recommendations.push(`🟡 PRIORIDAD MEDIA: Puntuación ${analysis.overallPriorityScore}/100 - Seguimiento recomendado`)
  } else if (analysis.overallPriorityScore > 0) {
    analysis.recommendations.push(`🟢 PRIORIDAD BAJA: Puntuación ${analysis.overallPriorityScore}/100 - Monitoreo rutinario`)
  }
  
  if (analysis.markersWithValues < analysis.totalMarkers) {
    const missing = analysis.totalMarkers - analysis.markersWithValues
    analysis.recommendations.push(`⚠️ ${missing} marcadores sin valores detectados - revisar formato PDF`)
  }
  
  if (analysis.markersWithRanges < analysis.totalMarkers) {
    const missing = analysis.totalMarkers - analysis.markersWithRanges
    analysis.recommendations.push(`⚠️ ${missing} marcadores sin rangos de referencia - revisar completitud PDF`)
  }
  
  if (analysis.averageConfidence < 70) {
    analysis.recommendations.push('⚠️ Confianza promedio baja - revisar manualmente los resultados')
  }
  
  return analysis
}

/**
 * Gets patient priority level based on overall score
 */
export function getPatientPriorityLevel(overallScore: number): {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL'
  color: 'red' | 'orange' | 'yellow' | 'green'
  description: string
  urgency: 'immediate' | 'urgent' | 'routine' | 'normal'
} {
  if (overallScore > 50) {
    return {
      level: 'HIGH',
      color: 'red',
      description: 'Requiere atención médica inmediata',
      urgency: 'immediate'
    }
  } else if (overallScore > 20) {
    return {
      level: 'MEDIUM',
      color: 'orange',
      description: 'Requiere seguimiento médico urgente',
      urgency: 'urgent'
    }
  } else if (overallScore > 0) {
    return {
      level: 'LOW',
      color: 'yellow',
      description: 'Monitoreo médico rutinario recomendado',
      urgency: 'routine'
    }
  } else {
    return {
      level: 'NORMAL',
      color: 'green',
      description: 'Valores dentro de rangos normales',
      urgency: 'normal'
    }
  }
}