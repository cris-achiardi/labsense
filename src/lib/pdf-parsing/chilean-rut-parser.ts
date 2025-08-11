/**
 * Chilean RUT Parser for Lab Report PDFs
 * Specialized for extracting and validating Chilean RUTs from medical documents
 */

import { validateChileanRUT, formatChileanRUT } from '@/lib/utils/chilean-rut'

/**
 * Normalizes text for better RUT detection by fixing common OCR errors
 */
function normalizeRUTText(text: string): string {
  return text
    // Fix common OCR character errors
    .replace(/[oO]/g, '0') // O -> 0
    .replace(/[lI]/g, '1') // l,I -> 1
    .replace(/[S]/g, '5')  // S -> 5
    .replace(/[Z]/g, '2')  // Z -> 2
    .replace(/[G]/g, '6')  // G -> 6
    // Normalize separators
    .replace(/[.,]/g, '.') // Comma to dot
    .replace(/[-–—]/g, '-') // Various dashes to hyphen
    // Fix spacing issues
    .replace(/\s+/g, ' ')
    .replace(/\.\s+/g, '.') // Remove spaces after dots
    .replace(/\s+-\s+/g, '-') // Remove spaces around hyphens
    .trim()
}

/**
 * Checks if text contains RUT-like patterns
 */
function isLikelyChileanRUT(text: string): boolean {
  const rutLikePatterns = [
    /\d{1,2}[.\\s]?\d{3}[.\\s]?\d{3}[-\\s][0-9K]/i,
    /RUT\\s*:?\\s*\d/i,
    /C\\.?I\\.?\\s*:?\\s*\d/i,
    /RUN\\s*:?\\s*\d/i,
    /PACIENTE.*\d{7,8}/i
  ]
  
  return rutLikePatterns.some(pattern => pattern.test(text))
}

export interface RUTParseResult {
  success: boolean
  rut: string | null
  formattedRut: string | null
  confidence: number
  source: 'header' | 'form' | 'table' | 'body' | 'unknown'
  position: number
  context: string
  error?: string
}

export interface RUTExtractionResult {
  success: boolean
  results: RUTParseResult[]
  bestMatch: RUTParseResult | null
  error?: string
}

/**
 * Comprehensive Chilean RUT patterns for medical documents
 * Enhanced with OCR error correction and Chilean medical document specifics
 */
const CHILEAN_RUT_PATTERNS = [
  // Standard format with dots: 12.345.678-9 (highest confidence)
  {
    pattern: /\b(\d{1,2}\.\d{3}\.\d{3}-[0-9K])\b/gi,
    source: 'standard' as const,
    confidence: 95,
    description: 'Standard format with dots'
  },
  // Format without dots: 12345678-9
  {
    pattern: /\b(\d{7,8}-[0-9K])\b/gi,
    source: 'nodots' as const,
    confidence: 90,
    description: 'Format without dots'
  },
  // RUT with spaces: 12 345 678-9
  {
    pattern: /\b(\d{1,2}\s\d{3}\s\d{3}-[0-9K])\b/gi,
    source: 'spaced' as const,
    confidence: 85,
    description: 'Format with spaces'
  },
  // Form field patterns: RUT: 12.345.678-9 (very high confidence)
  {
    pattern: /(?:RUT|R\.U\.T\.?)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'form' as const,
    confidence: 98,
    description: 'RUT with label'
  },
  // Cedula patterns: C.I.: 12.345.678-9
  {
    pattern: /(?:C\.?I\.?|CEDULA|CÉDULA)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'cedula' as const,
    confidence: 95,
    description: 'Cedula with label'
  },
  // RUN patterns: RUN: 12.345.678-9
  {
    pattern: /(?:RUN|R\.U\.N\.?)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'run' as const,
    confidence: 95,
    description: 'RUN with label'
  },
  // Patient identification: PACIENTE: 12.345.678-9
  {
    pattern: /(?:PACIENTE|PATIENT)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'patient' as const,
    confidence: 92,
    description: 'Patient with label'
  },
  // Identification section: IDENTIFICACIÓN: 12.345.678-9
  {
    pattern: /(?:IDENTIFICACI[OÓ]N|IDENTIFICATION)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'identification' as const,
    confidence: 90,
    description: 'Identification with label'
  },
  // Document patterns: DOC: 12.345.678-9
  {
    pattern: /(?:DOC|DOCUMENTO)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'document' as const,
    confidence: 88,
    description: 'Document with label'
  },
  // Loose pattern for OCR errors: 12.345.678 - 9 (with extra spaces)
  {
    pattern: /\b(\d{1,2}\.?\d{3}\.?\d{3}\s*-\s*[0-9K])\b/gi,
    source: 'loose' as const,
    confidence: 75,
    description: 'Loose format with spaces'
  },
  // Very loose format for OCR errors: 12345678 9 (missing hyphen)
  {
    pattern: /\b(\d{7,8}\s+[0-9K])\b/gi,
    source: 'very_loose' as const,
    confidence: 70,
    description: 'Very loose format (OCR error)'
  },
  // Chilean medical form patterns: Nombre: [name] RUT: 12.345.678-9
  {
    pattern: /(?:NOMBRE|NAME).*?(?:RUT|R\.U\.T\.?)\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    source: 'medical_form' as const,
    confidence: 96,
    description: 'Medical form with name and RUT'
  },
  // Table format: | 12.345.678-9 | (common in Chilean lab reports)
  {
    pattern: /\|\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])\s*\|/gi,
    source: 'table' as const,
    confidence: 80,
    description: 'Table format'
  }
]

/**
 * Determines the context/source of a RUT based on surrounding text
 */
function determineRUTSource(text: string, position: number): 'header' | 'form' | 'table' | 'body' {
  const contextBefore = text.substring(Math.max(0, position - 100), position).toLowerCase()
  const contextAfter = text.substring(position, Math.min(text.length, position + 100)).toLowerCase()
  const fullContext = contextBefore + contextAfter
  
  // Check for header indicators
  if (fullContext.includes('paciente') || fullContext.includes('patient') || 
      fullContext.includes('datos') || fullContext.includes('información')) {
    return 'header'
  }
  
  // Check for form indicators
  if (fullContext.includes(':') || fullContext.includes('rut') || 
      fullContext.includes('cedula') || fullContext.includes('run')) {
    return 'form'
  }
  
  // Check for table indicators
  if (fullContext.includes('|') || fullContext.includes('\t') || 
      /\s{3,}/.test(fullContext)) {
    return 'table'
  }
  
  return 'body'
}

/**
 * Extracts context around a RUT for validation
 */
function extractRUTContext(text: string, position: number, rutLength: number): string {
  const start = Math.max(0, position - 50)
  const end = Math.min(text.length, position + rutLength + 50)
  return text.substring(start, end).trim()
}

/**
 * Calculates confidence score for a RUT match
 */
function calculateRUTConfidence(
  rut: string, 
  patternConfidence: number, 
  source: 'header' | 'form' | 'table' | 'body',
  context: string
): number {
  let confidence = patternConfidence
  
  // Boost confidence based on source
  switch (source) {
    case 'header':
      confidence += 10
      break
    case 'form':
      confidence += 15
      break
    case 'table':
      confidence += 5
      break
    case 'body':
      confidence -= 5
      break
  }
  
  // Boost confidence if RUT is valid
  if (validateChileanRUT(rut)) {
    confidence += 20
  } else {
    confidence -= 30
  }
  
  // Boost confidence based on context keywords
  const contextLower = context.toLowerCase()
  if (contextLower.includes('paciente') || contextLower.includes('patient')) {
    confidence += 10
  }
  if (contextLower.includes('rut') || contextLower.includes('cedula')) {
    confidence += 8
  }
  if (contextLower.includes('identificaci')) {
    confidence += 5
  }
  
  // Penalize if context seems unrelated
  if (contextLower.includes('teléfono') || contextLower.includes('dirección') || 
      contextLower.includes('fecha') || contextLower.includes('hora')) {
    confidence -= 10
  }
  
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Parses and extracts Chilean RUTs from lab report text
 */
export function parseChileanRUTsFromText(text: string): RUTExtractionResult {
  const results: RUTParseResult[] = []
  
  try {
    // Normalize text for better RUT detection
    const normalizedText = normalizeRUTText(text)
    
    // Quick check if text likely contains RUTs
    if (!isLikelyChileanRUT(normalizedText)) {
      return {
        success: false,
        results: [],
        bestMatch: null,
        error: 'No se detectaron patrones de RUT en el texto'
      }
    }
    
    // Apply each pattern to find RUTs
    for (const { pattern, source, confidence: patternConfidence } of CHILEAN_RUT_PATTERNS) {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      
      while ((match = regex.exec(normalizedText)) !== null) {
        const rawRut = match[1]
        const position = match.index
        
        // Clean and normalize the RUT
        let cleanRut = rawRut.replace(/\s+/g, '').replace(/\.+/g, '.').toUpperCase()
        
        // Handle very loose format (missing hyphen)
        if (source === 'very_loose' && !cleanRut.includes('-')) {
          // Add hyphen before last character
          cleanRut = cleanRut.slice(0, -1) + '-' + cleanRut.slice(-1)
        }
        
        // Skip if RUT is too short or too long
        const rutWithoutSeparators = cleanRut.replace(/[.-]/g, '')
        if (rutWithoutSeparators.length < 8 || rutWithoutSeparators.length > 9) {
          continue
        }
        
        // Determine source and extract context
        const rutSource = determineRUTSource(normalizedText, position)
        const context = extractRUTContext(normalizedText, position, rawRut.length)
        
        // Calculate confidence
        const confidence = calculateRUTConfidence(cleanRut, patternConfidence, rutSource, context)
        
        // Format RUT if valid
        let formattedRut = null
        const isValid = validateChileanRUT(cleanRut)
        if (isValid) {
          formattedRut = formatChileanRUT(cleanRut)
        }
        
        const result: RUTParseResult = {
          success: isValid,
          rut: cleanRut,
          formattedRut,
          confidence,
          source: rutSource,
          position,
          context,
        }
        
        results.push(result)
      }
    }
    
    // Remove duplicates (same RUT found by different patterns)
    const uniqueResults = results.filter((result, index, array) => {
      return array.findIndex(r => r.rut === result.rut) === index
    })
    
    // Sort by confidence (highest first), then by position (earlier first)
    uniqueResults.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      return a.position - b.position
    })
    
    // Find best match (highest confidence valid RUT with confidence > 70)
    const bestMatch = uniqueResults.find(result => result.success && result.confidence > 70) || 
                     uniqueResults.find(result => result.success) || // Any valid RUT
                     uniqueResults[0] || null // Fallback to highest confidence invalid RUT
    
    return {
      success: uniqueResults.length > 0,
      results: uniqueResults,
      bestMatch,
    }
    
  } catch (error) {
    console.error('Error parsing RUTs from text:', error)
    return {
      success: false,
      results: [],
      bestMatch: null,
      error: error instanceof Error ? error.message : 'Error desconocido al parsear RUTs'
    }
  }
}

/**
 * Extracts the best Chilean RUT from lab report text
 */
export function extractBestChileanRUT(text: string): string | null {
  const extraction = parseChileanRUTsFromText(text)
  
  if (!extraction.success || !extraction.bestMatch) {
    return null
  }
  
  return extraction.bestMatch.formattedRut || extraction.bestMatch.rut
}

/**
 * Validates multiple RUT candidates and returns the best one
 */
export function validateRUTCandidates(candidates: string[]): {
  validRuts: string[]
  bestRut: string | null
  confidence: number
} {
  const validRuts: string[] = []
  
  for (const candidate of candidates) {
    if (validateChileanRUT(candidate)) {
      validRuts.push(formatChileanRUT(candidate))
    }
  }
  
  // Return the first valid RUT (assuming it's the most likely)
  const bestRut = validRuts[0] || null
  const confidence = bestRut ? 95 : 0
  
  return {
    validRuts,
    bestRut,
    confidence
  }
}

/**
 * Analyzes RUT extraction quality for debugging
 */
export function analyzeRUTExtraction(text: string): {
  totalMatches: number
  validRuts: number
  invalidRuts: number
  highConfidenceMatches: number
  patternBreakdown: Record<string, number>
  recommendations: string[]
} {
  const extraction = parseChileanRUTsFromText(text)
  const results = extraction.results
  
  const analysis = {
    totalMatches: results.length,
    validRuts: results.filter(r => r.success).length,
    invalidRuts: results.filter(r => !r.success).length,
    highConfidenceMatches: results.filter(r => r.confidence > 80).length,
    patternBreakdown: {} as Record<string, number>,
    recommendations: [] as string[]
  }
  
  // Count patterns
  for (const result of results) {
    const key = `${result.source}-confidence`
    analysis.patternBreakdown[key] = (analysis.patternBreakdown[key] || 0) + 1
  }
  
  // Generate recommendations
  if (analysis.validRuts === 0) {
    analysis.recommendations.push('No se encontraron RUTs válidos. Verificar formato del PDF.')
  }
  if (analysis.highConfidenceMatches === 0 && analysis.validRuts > 0) {
    analysis.recommendations.push('RUTs encontrados con baja confianza. Revisar manualmente.')
  }
  if (analysis.totalMatches > 5) {
    analysis.recommendations.push('Múltiples RUTs detectados. Verificar que sea el RUT del paciente.')
  }
  
  return analysis
}