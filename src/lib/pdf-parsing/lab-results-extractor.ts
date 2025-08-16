/**
 * Complete Lab Results Extraction for Chilean Lab Reports
 * Task 11.1: Extract ALL health markers with values, units, and reference ranges
 * 
 * This module extracts complete lab data, not just patient information:
 * - Health marker names (Spanish)
 * - Result values (numeric/text)
 * - Units (mg/dL, %, U/L, etc.)
 * - Reference ranges (normal values)
 * - Abnormal indicators ([ * ] markers)
 * - Sample types (SUERO, SANGRE TOTAL, ORINA)
 * - Methods (Hexoquinasa, Enzimático, etc.)
 */

import { extractTextFromPDF } from './pdf-text-extractor'
import { createHealthMarkerLookup, type HealthMarkerMapping } from './spanish-health-markers'

export interface LabResult {
  // Core lab result data
  examen: string                    // Spanish lab name (e.g., "GLICEMIA EN AYUNO (BASAL)")
  resultado: string | number        // Result value (269, "POSITIVO", etc.)
  unidad: string                    // Unit (mg/dL, %, U/L, etc.)
  valorReferencia: string           // Reference range text ("74 - 106", "< 150", etc.)
  metodo: string                    // Method (Hexoquinasa, Enzimático, etc.)
  
  // Additional metadata
  tipoMuestra: string               // Sample type (SUERO, SANGRE TOTAL, ORINA)
  isAbnormal: boolean               // Has [ * ] or other abnormal indicator
  abnormalIndicator: string         // The actual abnormal marker found
  
  // System mapping
  systemCode: string | null         // Mapped system code (glucose_fasting, hba1c, etc.)
  category: string | null           // Category (glucose, lipids, liver, etc.)
  priority: string | null           // Priority (critical, high, medium, low)
  
  // Extraction metadata
  confidence: number                // Confidence in extraction (0-100)
  position: number                  // Position in PDF text
  context: string                   // Surrounding text for validation
}

export interface LabReportMetadata {
  // Document identification
  folio: string | null              // Unique exam identifier
  fechaIngreso: string | null       // Registration date
  tomaMuestra: string | null        // Sample collection date (most important)
  fechaValidacion: string | null    // Validation date
  
  // Healthcare context
  profesionalSolicitante: string | null  // Requesting doctor
  procedencia: string | null        // Primary care center
  
  // Processing metadata
  totalResults: number              // Number of lab results found
  abnormalCount: number             // Number of abnormal results
  criticalCount: number             // Number of critical results
}

export interface CompleteLabExtractionResult {
  success: boolean
  
  // Patient information (from existing extractor)
  patient: {
    rut: string | null
    name: string | null
    age: string | null
    gender: string | null
  } | null
  
  // Complete lab results (NEW)
  labResults: LabResult[]
  
  // Lab report metadata (NEW)
  metadata: LabReportMetadata
  
  // Overall confidence and errors
  confidence: number
  error?: string
}

/**
 * Extracts folio number from PDF text
 */
function extractFolio(text: string): string | null {
  const folioPatterns = [
    // Folio: 394499
    /FOLIO\s*:?\s*(\d{5,8})/i,
    // N° Folio: 394499
    /N[°º]?\s*FOLIO\s*:?\s*(\d{5,8})/i,
    // Número de Folio: 394499
    /NÚMERO\s+DE\s+FOLIO\s*:?\s*(\d{5,8})/i,
    // Document number patterns
    /DOCUMENTO\s*:?\s*(\d{5,8})/i,
    // ID patterns
    /ID\s*:?\s*(\d{5,8})/i
  ]

  for (const pattern of folioPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Extracts dates from PDF text
 */
function extractDates(text: string): {
  fechaIngreso: string | null
  tomaMuestra: string | null
  fechaValidacion: string | null
} {
  const datePatterns = {
    fechaIngreso: [
      /FECHA\s+DE\s+INGRESO\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /INGRESO\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ],
    tomaMuestra: [
      /TOMA\s+DE\s+MUESTRA\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /MUESTRA\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /FECHA\s+MUESTRA\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ],
    fechaValidacion: [
      /FECHA\s+DE\s+VALIDACIÓN\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /VALIDACIÓN\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /FECHA\s+VALIDACION\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ]
  }

  const result = {
    fechaIngreso: null as string | null,
    tomaMuestra: null as string | null,
    fechaValidacion: null as string | null
  }

  // Extract each date type
  for (const [dateType, patterns] of Object.entries(datePatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        result[dateType as keyof typeof result] = match[1].trim()
        break
      }
    }
  }

  return result
}

/**
 * Extracts healthcare context information
 */
function extractHealthcareContext(text: string): {
  profesionalSolicitante: string | null
  procedencia: string | null
} {
  const contextPatterns = {
    profesionalSolicitante: [
      /PROFESIONAL\s+SOLICITANTE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i,
      /MÉDICO\s+SOLICITANTE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i,
      /DOCTOR\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i
    ],
    procedencia: [
      /PROCEDENCIA\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i,
      /CENTRO\s+DE\s+SALUD\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i,
      /CESFAM\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50})/i
    ]
  }

  const result = {
    profesionalSolicitante: null as string | null,
    procedencia: null as string | null
  }

  // Extract each context type
  for (const [contextType, patterns] of Object.entries(contextPatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        result[contextType as keyof typeof result] = match[1].trim()
        break
      }
    }
  }

  return result
}

/**
 * Extracts individual lab results from text using Chilean 5-column format
 * Format: Examen | Resultado | Unidad | Valor de Referencia | Método
 * 
 * Updated to use improved extraction patterns
 */
function extractLabResults(text: string): LabResult[] {
  const results: LabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  // Split text into lines for processing
  const lines = text.split('\n')
  
  // Debug: Log some lines to understand the format
  console.log('🔍 Analyzing PDF text structure:')
  lines.slice(0, 20).forEach((line, i) => {
    if (line.trim().length > 10) {
      console.log(`Line ${i}: "${line}"`)
    }
  })
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.length < 10) continue // Skip very short lines
    
    // Look for health marker names in the line
    const upperLine = line.toUpperCase()
    
    // Check if this line contains a known health marker
    let foundMarker: HealthMarkerMapping | null = null
    
    // Convert Map.entries() to Array for ES5 compatibility
    const markerEntries = Array.from(healthMarkerLookup.entries())
    
    for (const [searchTerm, marker] of markerEntries) {
      if (upperLine.includes(searchTerm)) {
        foundMarker = marker
        console.log(`✅ Found marker: ${searchTerm} in line: "${line}"`)
        break
      }
    }
    
    if (foundMarker) {
      // Try to extract the complete lab result from this line and surrounding context
      const labResult = parseLabResultLineImproved(line, foundMarker, i, lines)
      if (labResult) {
        console.log(`✅ Extracted lab result: ${labResult.examen} = ${labResult.resultado}`)
        results.push(labResult)
      } else {
        console.log(`❌ Failed to parse lab result from: "${line}"`)
      }
    }
  }
  
  console.log(`🎯 Total lab results extracted: ${results.length}`)
  return results
}

/**
 * Improved lab result parsing with multiple strategies
 */
function parseLabResultLineImproved(
  line: string,
  marker: HealthMarkerMapping,
  lineIndex: number,
  allLines: string[]
): LabResult | null {
  
  // Get context (current line + next few lines)
  const contextLines = allLines.slice(lineIndex, Math.min(lineIndex + 3, allLines.length))
  const context = contextLines.join(' ')
  
  console.log(`🔍 Parsing line: "${line}"`)
  console.log(`📝 Context: "${context}"`)
  
  // Strategy 1: Try different separator patterns
  const patterns = [
    // Pattern 1: Multiple spaces
    /^(.+?)\s{2,}(.+?)\s{2,}\(([^)]+)\)\s{2,}(.+?)(?:\s{2,}(.+))?$/,
    // Pattern 2: Pipe separators
    /^(.+?)\s*\|\s*(.+?)\s*\|\s*\(([^)]+)\)\s*\|\s*(.+?)\s*\|\s*(.+)$/,
    // Pattern 3: Tab separators
    /^(.+?)\t+(.+?)\t+\(([^)]+)\)\t+(.+?)(?:\t+(.+))?$/,
    // Pattern 4: Mixed separators
    /^(.+?)\s+(\d+(?:\.\d+)?)\s+\(([^)]+)\)\s+(.+?)(?:\s+([A-Za-z].+))?$/,
    // Pattern 5: Very flexible pattern
    /^(.+?)\s+(.+?)\s+\(([^)]+)\)\s+(.+?)(?:\s+(.+))?$/
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = line.match(pattern) || context.match(pattern)
    
    if (match) {
      console.log(`✅ Pattern ${i + 1} matched:`, match)
      const [, examen, resultado, unidad, valorReferencia, metodo = ''] = match
      
      if (examen && resultado && unidad && valorReferencia) {
        return createLabResultFromMatch(examen, resultado, unidad, valorReferencia, metodo, marker, lineIndex, context)
      }
    }
  }
  
  // Strategy 2: Try splitting by whitespace and reconstruct
  const parts = line.split(/\s+/)
  if (parts.length >= 4) {
    console.log(`🔧 Trying whitespace split:`, parts)
    
    // Find the numeric result
    let resultIndex = -1
    for (let i = 1; i < parts.length; i++) {
      if (/^\d+(\.\d+)?$/.test(parts[i])) {
        resultIndex = i
        break
      }
    }
    
    if (resultIndex > 0) {
      const examen = parts.slice(0, resultIndex).join(' ')
      const resultado = parts[resultIndex]
      
      // Look for unit in parentheses
      let unidad = ''
      let unitIndex = -1
      for (let i = resultIndex + 1; i < parts.length; i++) {
        if (parts[i].includes('(') && parts[i].includes(')')) {
          unidad = parts[i].replace(/[()]/g, '')
          unitIndex = i
          break
        }
      }
      
      if (unitIndex > 0) {
        const valorReferencia = parts.slice(unitIndex + 1).join(' ')
        return createLabResultFromMatch(examen, resultado, unidad, valorReferencia, '', marker, lineIndex, context)
      }
    }
  }
  
  console.log(`❌ No pattern matched for line: "${line}"`)
  return null
}

/**
 * Create lab result from matched components
 */
function createLabResultFromMatch(
  examen: string,
  resultado: string,
  unidad: string,
  valorReferencia: string,
  metodo: string,
  marker: HealthMarkerMapping,
  lineIndex: number,
  context: string
): LabResult {
  
  // Clean up values
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
  const confidence = calculateLabResultConfidence(examen, resultado, unidad, valorReferencia, marker)
  
  return {
    examen,
    resultado: parsedResultado,
    unidad,
    valorReferencia,
    metodo,
    tipoMuestra: 'SUERO', // Default
    isAbnormal,
    abnormalIndicator,
    systemCode: marker.systemCode,
    category: marker.category,
    priority: marker.priority,
    confidence,
    position: lineIndex,
    context: context.substring(0, 200)
  }
}

/**
 * Original parsing function (kept as fallback)
 */
function parseLabResultLine(
  currentLine: string, 
  marker: HealthMarkerMapping, 
  lineIndex: number, 
  allLines: string[]
): LabResult | null {
  try {
    // Chilean lab format patterns
    // Pattern 1: GLICEMIA EN AYUNO (BASAL) | 269 | (mg/dL) | [ * ] 74 - 106 | Hexoquinasa
    const fullPattern = /^(.+?)\s*\|\s*(.+?)\s*\|\s*\(([^)]+)\)\s*\|\s*(.+?)\s*\|\s*(.+)$/
    
    // Pattern 2: GLICEMIA EN AYUNO (BASAL)    269    (mg/dL)    [ * ] 74 - 106    Hexoquinasa
    const spacedPattern = /^(.+?)\s{3,}(.+?)\s{3,}\(([^)]+)\)\s{3,}(.+?)\s{3,}(.+)$/
    
    // Pattern 3: Simpler format without method
    const simplePattern = /^(.+?)\s*[|\s]{3,}(.+?)\s*[|\s]{3,}\(([^)]+)\)\s*[|\s]{3,}(.+)$/
    
    let match = currentLine.match(fullPattern) || currentLine.match(spacedPattern) || currentLine.match(simplePattern)
    
    if (!match) {
      // Try to extract from multiple lines if the result spans lines
      const context = allLines.slice(Math.max(0, lineIndex - 1), lineIndex + 3).join(' ')
      match = context.match(fullPattern) || context.match(spacedPattern) || context.match(simplePattern)
    }
    
    if (match) {
      const [, examen, resultado, unidad, valorReferencia, metodo = ''] = match
      
      // Check for abnormal indicators
      const abnormalIndicators = ['[ * ]', '[*]', '(*)']
      let isAbnormal = false
      let abnormalIndicator = ''
      
      for (const indicator of abnormalIndicators) {
        if (valorReferencia.includes(indicator)) {
          isAbnormal = true
          abnormalIndicator = indicator
          break
        }
      }
      
      // Extract sample type from context
      const tipoMuestra = extractSampleType(currentLine, allLines, lineIndex)
      
      // Calculate confidence
      const confidence = calculateLabResultConfidence(examen, resultado, unidad, valorReferencia, marker)
      
      const labResult: LabResult = {
        examen: examen.trim(),
        resultado: parseResultValue(resultado.trim()),
        unidad: unidad.trim(),
        valorReferencia: valorReferencia.trim(),
        metodo: metodo.trim(),
        tipoMuestra,
        isAbnormal,
        abnormalIndicator,
        systemCode: marker.systemCode,
        category: marker.category,
        priority: marker.priority,
        confidence,
        position: lineIndex,
        context: currentLine
      }
      
      return labResult
    }
    
    return null
  } catch (error) {
    console.error('Error parsing lab result line:', error)
    return null
  }
}

/**
 * Parses result value to number if possible, otherwise keeps as string
 */
function parseResultValue(resultado: string): string | number {
  // Remove common non-numeric indicators
  const cleaned = resultado.replace(/[<>≤≥]/g, '').trim()
  
  // Try to parse as number
  const numValue = parseFloat(cleaned)
  if (!isNaN(numValue)) {
    return numValue
  }
  
  return resultado
}

/**
 * Extracts sample type from context
 */
function extractSampleType(line: string, allLines: string[], lineIndex: number): string {
  const sampleTypes = ['SUERO', 'SANGRE TOTAL', 'ORINA', 'PLASMA']
  
  // Check current line and surrounding lines
  const contextLines = allLines.slice(Math.max(0, lineIndex - 2), lineIndex + 3)
  const context = contextLines.join(' ').toUpperCase()
  
  for (const sampleType of sampleTypes) {
    if (context.includes(sampleType)) {
      return sampleType
    }
  }
  
  return 'SUERO' // Default assumption for most lab tests
}

/**
 * Calculates confidence score for lab result extraction
 */
function calculateLabResultConfidence(
  examen: string,
  resultado: string,
  unidad: string,
  valorReferencia: string,
  marker: HealthMarkerMapping
): number {
  let confidence = 60 // Base confidence
  
  // Boost for having all required fields
  if (examen && resultado && unidad && valorReferencia) {
    confidence += 20
  }
  
  // Boost for matching known marker
  if (marker) {
    confidence += 15
  }
  
  // Boost for having expected unit
  if (marker.unit && unidad.toLowerCase().includes(marker.unit.toLowerCase())) {
    confidence += 10
  }
  
  // Boost for numeric result
  if (!isNaN(parseFloat(resultado))) {
    confidence += 10
  }
  
  // Boost for having reference range
  if (valorReferencia.includes('-') || valorReferencia.includes('<') || valorReferencia.includes('>')) {
    confidence += 10
  }
  
  return Math.min(100, confidence)
}

/**
 * Main function: Extract complete lab report data from PDF
 */
export async function extractCompleteLabReport(pdfBuffer: Buffer): Promise<CompleteLabExtractionResult> {
  try {
    // Extract text from PDF
    const textExtraction = await extractTextFromPDF(pdfBuffer)
    
    if (!textExtraction.success) {
      return {
        success: false,
        patient: null,
        labResults: [],
        metadata: {
          folio: null,
          fechaIngreso: null,
          tomaMuestra: null,
          fechaValidacion: null,
          profesionalSolicitante: null,
          procedencia: null,
          totalResults: 0,
          abnormalCount: 0,
          criticalCount: 0
        },
        confidence: 0,
        error: textExtraction.error || 'Error al extraer texto del PDF'
      }
    }
    
    const fullText = textExtraction.fullText
    const firstPageText = textExtraction.firstPageText
    
    // Extract patient information (using existing logic)
    const { extractPatientFromPDF } = await import('./patient-extraction')
    const patientResult = await extractPatientFromPDF(pdfBuffer)
    
    // Extract folio and dates
    const folio = extractFolio(firstPageText)
    const dates = extractDates(firstPageText)
    const healthcareContext = extractHealthcareContext(firstPageText)
    
    // Extract all lab results
    const labResults = extractLabResults(fullText)
    
    // Calculate metadata
    const abnormalCount = labResults.filter(r => r.isAbnormal).length
    const criticalCount = labResults.filter(r => r.priority === 'critical' && r.isAbnormal).length
    
    const metadata: LabReportMetadata = {
      folio,
      ...dates,
      ...healthcareContext,
      totalResults: labResults.length,
      abnormalCount,
      criticalCount
    }
    
    // Calculate overall confidence
    const avgLabConfidence = labResults.length > 0 
      ? labResults.reduce((sum, r) => sum + r.confidence, 0) / labResults.length 
      : 0
    const patientConfidence = patientResult.patient?.confidence || 0
    const overallConfidence = Math.round((avgLabConfidence + patientConfidence) / 2)
    
    return {
      success: true,
      patient: patientResult.patient,
      labResults,
      metadata,
      confidence: overallConfidence
    }
    
  } catch (error) {
    console.error('Error extracting complete lab report:', error)
    return {
      success: false,
      patient: null,
      labResults: [],
      metadata: {
        folio: null,
        fechaIngreso: null,
        tomaMuestra: null,
        fechaValidacion: null,
        profesionalSolicitante: null,
        procedencia: null,
        totalResults: 0,
        abnormalCount: 0,
        criticalCount: 0
      },
      confidence: 0,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar PDF'
    }
  }
}