/**
 * Comprehensive Lab Results Extraction for Chilean Lab Reports
 * Handles ALL 68+ health markers including qualitative results
 */

import { CHILEAN_HEALTH_MARKERS, createHealthMarkerLookup, type HealthMarkerMapping } from './spanish-health-markers'

export interface ComprehensiveLabResult {
  examen: string
  resultado: string | number | null
  unidad: string | null
  valorReferencia: string | null
  metodo: string | null
  tipoMuestra: string
  isAbnormal: boolean
  abnormalIndicator: string
  systemCode: string | null
  category: string | null
  priority: string | null
  confidence: number
  position: number
  context: string
  resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy'
}

/**
 * Extract ALL lab results from Chilean PDF text
 */
export function extractAllLabResults(text: string): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  console.log('🔍 Starting comprehensive lab extraction...')
  
  // Split text into sections by equipment/sample type separators
  const sections = text.split(/_{50,}/)
  
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex]
    
    // Extract sample type information
    const tipoMuestra = extractSampleType(section)
    
    // Try multiple extraction strategies for this section
    const sectionResults = [
      ...extractNumericResults(section, healthMarkerLookup, tipoMuestra),
      ...extractQualitativeResults(section, healthMarkerLookup, tipoMuestra),
      ...extractCalculatedResults(section, healthMarkerLookup, tipoMuestra),
      ...extractMicroscopyResults(section, healthMarkerLookup, tipoMuestra),
      ...extractTabularResults(section, healthMarkerLookup, tipoMuestra)
    ]
    
    results.push(...sectionResults)
  }
  
  // Remove duplicates and merge results
  const uniqueResults = removeDuplicateResults(results)
  
  console.log(`🎯 Comprehensive extraction found ${uniqueResults.length} results`)
  return uniqueResults
}

/**
 * Extract numeric lab results with units and reference ranges
 */
function extractNumericResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Pattern for standard numeric results: EXAMEN RESULTADO (UNIDAD) REFERENCIA
  const numericPatterns = [
    // Standard pattern: GLICEMIA EN AYUNO (BASAL) 269 (mg/dL) [ * ] 74 - 106
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{5,50})\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s+([A-Za-z].+))?$/gm,
    
    // Compact pattern: CREATININA0,91(mg/dL) 0,55 - 1,02
    /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{5,40})(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+)/g,
    
    // Spaced pattern: HEMOGLOBINA    14.2    (g/dL)    12.3 - 15.3
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{5,50})\s{2,}(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s+(.+)/gm
  ]
  
  for (const pattern of numericPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, examen, resultado, unidad, abnormalMarker = '', valorReferencia, metodo = ''] = match
      
      if (isAlreadyExtracted(results, examen)) continue
      
      const labResult = createLabResult({
        examen: examen.trim(),
        resultado: parseFloat(resultado.replace(',', '.')),
        unidad,
        valorReferencia: valorReferencia?.trim() || null,
        metodo: metodo?.trim() || null,
        tipoMuestra,
        isAbnormal: abnormalMarker.includes('*'),
        abnormalIndicator: abnormalMarker.trim(),
        resultType: 'numeric',
        confidence: 95,
        position: text.indexOf(fullMatch),
        context: fullMatch,
        healthMarkerLookup
      })
      
      results.push(labResult)
    }
  }
  
  return results
}

/**
 * Extract qualitative results (No reactivo, Negativo, Claro, etc.)
 */
function extractQualitativeResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Patterns for qualitative results
  const qualitativePatterns = [
    // R.P.R. No reactivo    No reactivo
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{3,40})\s+(No reactivo|Negativo|Positivo|Reactivo|Claro|Amarillo|Turbio)\s*(.*)$/gm,
    
    // ASPECTO Claro
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{3,30})\s+(Claro|Turbio|Amarillo|Rojizo|Verde|Transparente|Opaco)\s*$/gm,
    
    // CELULAS EPITELIALES No se observan
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,40})\s+(No se observan|Escasa cantidad|Abundante|Moderada cantidad|Presentes|Ausentes)\s*$/gm
  ]
  
  for (const pattern of qualitativePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, examen, resultado, valorReferencia = ''] = match
      
      if (isAlreadyExtracted(results, examen)) continue
      
      const labResult = createLabResult({
        examen: examen.trim(),
        resultado: resultado.trim(),
        unidad: null,
        valorReferencia: valorReferencia.trim() || null,
        metodo: null,
        tipoMuestra,
        isAbnormal: false, // Qualitative results typically aren't marked as abnormal
        abnormalIndicator: '',
        resultType: 'qualitative',
        confidence: 90,
        position: text.indexOf(fullMatch),
        context: fullMatch,
        healthMarkerLookup
      })
      
      results.push(labResult)
    }
  }
  
  return results
}

/**
 * Extract calculated results (ratios, estimates, etc.)
 */
function extractCalculatedResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Patterns for calculated values
  const calculatedPatterns = [
    // CALCULO TOTAL/HDL 4,02
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\/\(\)]{8,40})\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*$/gm,
    
    // VFG 64,4 (mL/min/1.73 mt²) Mayor a 60
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)]{3,30})\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s+(.+)$/gm
  ]
  
  for (const pattern of calculatedPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, examen, resultado, unidad = null, valorReferencia = null] = match
      
      if (isAlreadyExtracted(results, examen)) continue
      
      const labResult = createLabResult({
        examen: examen.trim(),
        resultado: parseFloat(resultado.replace(',', '.')),
        unidad,
        valorReferencia,
        metodo: 'Cálculo',
        tipoMuestra,
        isAbnormal: false,
        abnormalIndicator: '',
        resultType: 'calculated',
        confidence: 85,
        position: text.indexOf(fullMatch),
        context: fullMatch,
        healthMarkerLookup
      })
      
      results.push(labResult)
    }
  }
  
  return results
}

/**
 * Extract microscopy results (ranges, observations)
 */
function extractMicroscopyResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Patterns for microscopy
  const microscopyPatterns = [
    // HEMATIES POR CAMPO 0 - 2
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{8,40})\s+(\d+\s*-\s*\d+)\s*$/gm,
    
    // MUCUS Escasa cantidad
    /^([A-ZÁÉÍÓÚÑ\s]{4,20})\s+(Escasa cantidad|No se observan|Presentes|Abundante)\s*$/gm
  ]
  
  for (const pattern of microscopyPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, examen, resultado] = match
      
      if (isAlreadyExtracted(results, examen)) continue
      
      const labResult = createLabResult({
        examen: examen.trim(),
        resultado: resultado.trim(),
        unidad: null,
        valorReferencia: null,
        metodo: 'Microscopía',
        tipoMuestra,
        isAbnormal: false,
        abnormalIndicator: '',
        resultType: 'microscopy',
        confidence: 80,
        position: text.indexOf(fullMatch),
        context: fullMatch,
        healthMarkerLookup
      })
      
      results.push(labResult)
    }
  }
  
  return results
}

/**
 * Extract results from tabular format (like lipid profile)
 */
function extractTabularResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for table-like structures
  const lines = text.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines or headers
    if (!line || line.length < 10) continue
    if (line.includes('Examen') && line.includes('Resultado')) continue
    
    // Try to match tabular format: NAME  VALUE  (UNIT)  REFERENCE  METHOD
    const tabularMatch = line.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{5,50})\s+(\d+(?:,\d+)?(?:\.\d+)?|\w+)\s*(?:\(([^)]+)\))?\s*(.*)$/)
    
    if (tabularMatch) {
      const [fullMatch, examen, resultado, unidad = null, rest = ''] = tabularMatch
      
      if (isAlreadyExtracted(results, examen)) continue
      
      // Parse the rest to separate reference from method
      const restParts = rest.split(/\s{2,}/)
      const valorReferencia = restParts[0] || null
      const metodo = restParts[1] || null
      
      const labResult = createLabResult({
        examen: examen.trim(),
        resultado: isNaN(parseFloat(resultado.replace(',', '.'))) ? resultado : parseFloat(resultado.replace(',', '.')),
        unidad,
        valorReferencia,
        metodo,
        tipoMuestra,
        isAbnormal: line.includes('[*]') || line.includes('[ * ]'),
        abnormalIndicator: line.includes('[*]') ? '[*]' : '',
        resultType: isNaN(parseFloat(resultado.replace(',', '.'))) ? 'qualitative' : 'numeric',
        confidence: 75,
        position: text.indexOf(fullMatch),
        context: fullMatch,
        healthMarkerLookup
      })
      
      results.push(labResult)
    }
  }
  
  return results
}

/**
 * Extract sample type from section text
 */
function extractSampleType(text: string): string {
  const sampleTypes = ['SUERO', 'SANGRE TOTAL + E.D.T.A.', 'SANGRE TOTAL', 'ORINA', 'Suero y plasma (heparina de litio)']
  
  for (const sampleType of sampleTypes) {
    if (text.includes(`Tipo de Muestra : ${sampleType}`)) {
      return sampleType
    }
  }
  
  return 'SUERO' // Default
}

/**
 * Check if result already extracted to avoid duplicates
 */
function isAlreadyExtracted(results: ComprehensiveLabResult[], examen: string): boolean {
  const normalizedExamen = examen.toUpperCase().trim()
  return results.some(r => r.examen.toUpperCase().trim() === normalizedExamen)
}

/**
 * Create a lab result with proper mapping
 */
function createLabResult(params: {
  examen: string
  resultado: string | number
  unidad: string | null
  valorReferencia: string | null
  metodo: string | null
  tipoMuestra: string
  isAbnormal: boolean
  abnormalIndicator: string
  resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy'
  confidence: number
  position: number
  context: string
  healthMarkerLookup: Map<string, HealthMarkerMapping>
}): ComprehensiveLabResult {
  
  // Try to map to known health marker
  let systemCode: string | null = null
  let category: string = 'other'
  let priority: string = 'low'
  
  const upperExamen = params.examen.toUpperCase()
  const markerEntries = Array.from(params.healthMarkerLookup.entries())
  
  for (const [searchTerm, marker] of markerEntries) {
    if (upperExamen.includes(searchTerm) || searchTerm.includes(upperExamen)) {
      systemCode = marker.systemCode
      category = marker.category
      priority = marker.priority
      break
    }
  }
  
  return {
    examen: params.examen,
    resultado: params.resultado,
    unidad: params.unidad,
    valorReferencia: params.valorReferencia,
    metodo: params.metodo,
    tipoMuestra: params.tipoMuestra,
    isAbnormal: params.isAbnormal,
    abnormalIndicator: params.abnormalIndicator,
    systemCode,
    category,
    priority,
    confidence: systemCode ? params.confidence + 5 : params.confidence,
    position: params.position,
    context: params.context.substring(0, 200),
    resultType: params.resultType
  }
}

/**
 * Remove duplicate results and keep the best one
 */
function removeDuplicateResults(results: ComprehensiveLabResult[]): ComprehensiveLabResult[] {
  const uniqueResults: ComprehensiveLabResult[] = []
  const seenExamenes = new Set<string>()
  
  // Sort by confidence (highest first)
  results.sort((a, b) => b.confidence - a.confidence)
  
  for (const result of results) {
    const normalizedExamen = result.examen.toUpperCase().trim()
    
    if (!seenExamenes.has(normalizedExamen)) {
      seenExamenes.add(normalizedExamen)
      uniqueResults.push(result)
    }
  }
  
  return uniqueResults
}