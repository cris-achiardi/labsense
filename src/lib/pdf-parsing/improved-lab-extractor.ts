/**
 * Improved Lab Results Extraction
 * Fixes the issue where 0 lab results are extracted
 * 
 * This approach is more flexible and handles the actual PDF text format
 */

import { CHILEAN_HEALTH_MARKERS, createHealthMarkerLookup, type HealthMarkerMapping } from './spanish-health-markers'

export interface ImprovedLabResult {
  examen: string
  resultado: string | number
  unidad: string
  valorReferencia: string
  metodo: string
  tipoMuestra: string
  isAbnormal: boolean
  abnormalIndicator: string
  systemCode: string | null
  category: string | null
  priority: string | null
  confidence: number
  position: number
  context: string
}

/**
 * Extract lab results using a more flexible approach
 * This handles the actual text format from Chilean PDFs
 */
export function extractLabResultsImproved(text: string): ImprovedLabResult[] {
  const results: ImprovedLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  // Split into lines and process
  const lines = text.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.length < 10) continue // Skip very short lines
    
    // Look for health markers in this line
    const foundMarker = findHealthMarkerInLine(line, healthMarkerLookup)
    
    if (foundMarker) {
      // Try to extract lab result from this line and surrounding context
      const labResult = extractLabResultFromContext(line, foundMarker, i, lines)
      if (labResult) {
        results.push(labResult)
      }
    }
  }
  
  return results
}

/**
 * Find health marker in a line of text
 */
function findHealthMarkerInLine(line: string, lookup: Map<string, HealthMarkerMapping>): HealthMarkerMapping | null {
  const upperLine = line.toUpperCase()
  
  // Convert Map to Array for iteration
  const entries = Array.from(lookup.entries())
  
  for (const [searchTerm, marker] of entries) {
    if (upperLine.includes(searchTerm)) {
      return marker
    }
  }
  
  return null
}

/**
 * Extract lab result from line and surrounding context
 */
function extractLabResultFromContext(
  line: string,
  marker: HealthMarkerMapping,
  lineIndex: number,
  allLines: string[]
): ImprovedLabResult | null {
  
  // Get context (current line + next few lines)
  const contextLines = allLines.slice(lineIndex, Math.min(lineIndex + 3, allLines.length))
  const context = contextLines.join(' ')
  
  // Try different extraction strategies
  const strategies = [
    extractFromSingleLine,
    extractFromMultipleLines,
    extractFromTabularFormat
  ]
  
  for (const strategy of strategies) {
    const result = strategy(line, context, marker, lineIndex)
    if (result) {
      return result
    }
  }
  
  return null
}

/**
 * Strategy 1: Extract from a single line with various patterns
 */
function extractFromSingleLine(
  line: string,
  context: string,
  marker: HealthMarkerMapping,
  lineIndex: number
): ImprovedLabResult | null {
  
  // Pattern 1: Spaces or tabs as separators
  // GLICEMIA EN AYUNO (BASAL)    269    (mg/dL)    [ * ] 74 - 106    Hexoquinasa
  const spacedMatch = line.match(/^(.+?)\s{2,}(.+?)\s{2,}\(([^)]+)\)\s{2,}(.+?)(?:\s{2,}(.+))?$/)
  
  if (spacedMatch) {
    const [, examen, resultado, unidad, valorReferencia, metodo = ''] = spacedMatch
    return createLabResult(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
  }
  
  // Pattern 2: Pipe separators
  // GLICEMIA EN AYUNO (BASAL) | 269 | (mg/dL) | [ * ] 74 - 106 | Hexoquinasa
  const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*\(([^)]+)\)\s*\|\s*(.+?)\s*\|\s*(.+)$/)
  
  if (pipeMatch) {
    const [, examen, resultado, unidad, valorReferencia, metodo] = pipeMatch
    return createLabResult(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
  }
  
  // Pattern 3: Mixed separators
  const mixedMatch = line.match(/^(.+?)\s+(.+?)\s+\(([^)]+)\)\s+(.+?)(?:\s+(.+))?$/)
  
  if (mixedMatch) {
    const [, examen, resultado, unidad, valorReferencia, metodo = ''] = mixedMatch
    return createLabResult(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
  }
  
  return null
}

/**
 * Strategy 2: Extract from multiple lines (when data spans lines)
 */
function extractFromMultipleLines(
  line: string,
  context: string,
  marker: HealthMarkerMapping,
  lineIndex: number
): ImprovedLabResult | null {
  
  // Look for patterns across multiple lines
  const contextMatch = context.match(/(.+?)\s+(\d+(?:\.\d+)?)\s+\(([^)]+)\)\s+(.+?)(?:\s+([A-Za-z].+))?/)
  
  if (contextMatch) {
    const [, examen, resultado, unidad, valorReferencia, metodo = ''] = contextMatch
    return createLabResult(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
  }
  
  return null
}

/**
 * Strategy 3: Extract from tabular format (when PDF preserves table structure)
 */
function extractFromTabularFormat(
  line: string,
  context: string,
  marker: HealthMarkerMapping,
  lineIndex: number
): ImprovedLabResult | null {
  
  // Look for tabular data patterns
  const parts = line.split(/\s{2,}|\t+/)
  
  if (parts.length >= 4) {
    const examen = parts[0]
    const resultado = parts[1]
    const unidad = parts[2].replace(/[()]/g, '') // Remove parentheses
    const valorReferencia = parts[3]
    const metodo = parts[4] || ''
    
    return createLabResult(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
  }
  
  return null
}

/**
 * Create a lab result object with all required fields
 */
function createLabResult(
  examen: string,
  resultado: string,
  unidad: string,
  valorReferencia: string,
  metodo: string,
  marker: HealthMarkerMapping,
  lineIndex: number,
  context: string
): ImprovedLabResult {
  
  // Clean up extracted values
  examen = examen.trim()
  resultado = resultado.trim()
  unidad = unidad.trim().replace(/[()]/g, '')
  valorReferencia = valorReferencia.trim()
  metodo = metodo.trim()
  
  // Check for abnormal indicators
  const abnormalIndicators = ['[ * ]', '[*]', '(*)', '*']
  let isAbnormal = false
  let abnormalIndicator = ''
  
  for (const indicator of abnormalIndicators) {
    if (valorReferencia.includes(indicator) || context.includes(indicator)) {
      isAbnormal = true
      abnormalIndicator = indicator
      break
    }
  }
  
  // Parse result value
  const parsedResultado = parseResultValue(resultado)
  
  // Calculate confidence
  const confidence = calculateConfidence(examen, resultado, unidad, valorReferencia, metodo, marker)
  
  return {
    examen,
    resultado: parsedResultado,
    unidad,
    valorReferencia,
    metodo,
    tipoMuestra: 'SUERO', // Default, can be improved
    isAbnormal,
    abnormalIndicator,
    systemCode: marker.systemCode,
    category: marker.category,
    priority: marker.priority,
    confidence,
    position: lineIndex,
    context: context.substring(0, 200) // Limit context length
  }
}

/**
 * Parse result value to number if possible
 */
function parseResultValue(resultado: string): string | number {
  // Remove common prefixes/suffixes
  const cleaned = resultado.replace(/[<>≤≥]/g, '').trim()
  
  // Try to parse as number
  const numValue = parseFloat(cleaned)
  if (!isNaN(numValue)) {
    return numValue
  }
  
  return resultado
}

/**
 * Calculate confidence score for extraction
 */
function calculateConfidence(
  examen: string,
  resultado: string,
  unidad: string,
  valorReferencia: string,
  metodo: string,
  marker: HealthMarkerMapping
): number {
  let confidence = 50 // Base confidence
  
  // Boost for having all fields
  if (examen && resultado && unidad && valorReferencia) {
    confidence += 30
  }
  
  // Boost for matching known marker
  if (marker) {
    confidence += 15
  }
  
  // Boost for numeric result
  if (!isNaN(parseFloat(resultado))) {
    confidence += 10
  }
  
  // Boost for having reference range
  if (valorReferencia.includes('-') || valorReferencia.includes('<') || valorReferencia.includes('>')) {
    confidence += 10
  }
  
  // Boost for having method
  if (metodo && metodo.length > 3) {
    confidence += 5
  }
  
  return Math.min(100, confidence)
}