/**
 * Reference Range Parser for Chilean Lab Reports
 * Extracts and parses reference ranges from the "VALOR DE REFERENCIA" column
 * Critical for determining abnormal values in Chilean public healthcare
 */

export interface ReferenceRange {
  type: 'range' | 'upper_limit' | 'lower_limit' | 'exact' | 'complex'
  minValue?: number
  maxValue?: number
  operator?: '<' | '>' | '<=' | '>=' | '='
  unit?: string
  originalText: string
  confidence: number
  gender?: 'M' | 'F' | 'both'
  ageGroup?: string
}

export interface ReferenceRangeResult {
  success: boolean
  range: ReferenceRange | null
  originalText: string
  confidence: number
  position: number
  context: string
  error?: string
}

export interface ReferenceRangeExtractionResult {
  success: boolean
  results: ReferenceRangeResult[]
  totalRangesFound: number
  error?: string
}

/**
 * Comprehensive Chilean reference range patterns
 * Based on real Chilean lab reports from Corporación Municipal
 */
const CHILEAN_REFERENCE_PATTERNS = [
  // Standard range with [ * ]: [ * ] 74 - 106
  {
    pattern: /\[\s*\*\s*\]\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g,
    type: 'range' as const,
    confidence: 98,
    description: 'Standard range with abnormal marker'
  },
  
  // Range without marker: 74 - 106
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\b/g,
    type: 'range' as const,
    confidence: 85,
    description: 'Simple numeric range'
  },
  
  // Upper limit with <: < 200, Menor a 200
  {
    pattern: /(?:<|menor\s+a|hasta)\s*(\d+(?:\.\d+)?)/gi,
    type: 'upper_limit' as const,
    confidence: 92,
    description: 'Upper limit with less than'
  },
  
  // Lower limit with >: > 50, Mayor a 50
  {
    pattern: /(?:>|mayor\s+a|desde)\s*(\d+(?:\.\d+)?)/gi,
    type: 'lower_limit' as const,
    confidence: 90,
    description: 'Lower limit with greater than'
  },
  
  // Exact value: = 5.0
  {
    pattern: /=\s*(\d+(?:\.\d+)?)/g,
    type: 'exact' as const,
    confidence: 88,
    description: 'Exact reference value'
  },
  
  // Chilean specific patterns: "Hasta 34", "Menor que 150"
  {
    pattern: /hasta\s+(\d+(?:\.\d+)?)/gi,
    type: 'upper_limit' as const,
    confidence: 95,
    description: 'Chilean "hasta" pattern'
  },
  
  // Desirable ranges: "Bajo (deseable): < 200"
  {
    pattern: /bajo\s*\([^)]*\)\s*:\s*<\s*(\d+(?:\.\d+)?)/gi,
    type: 'upper_limit' as const,
    confidence: 93,
    description: 'Desirable low level'
  },
  
  // Normal ranges: "Normal: 4.0 - 6.0"
  {
    pattern: /normal\s*:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/gi,
    type: 'range' as const,
    confidence: 96,
    description: 'Labeled normal range'
  },
  
  // Reference with units: "74 - 106 mg/dL"
  {
    pattern: /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*([a-zA-Z\/]+)/g,
    type: 'range' as const,
    confidence: 90,
    description: 'Range with units'
  },
  
  // Percentage ranges: "4.0 - 6.0 %"
  {
    pattern: /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/g,
    type: 'range' as const,
    confidence: 92,
    description: 'Percentage range'
  },
  
  // Decimal ranges: "0.55 - 4.78"
  {
    pattern: /(\d+\.\d+)\s*-\s*(\d+\.\d+)/g,
    type: 'range' as const,
    confidence: 88,
    description: 'Decimal range'
  },
  
  // Gender-specific ranges: "H: 13-17, M: 12-15"
  {
    pattern: /[HM]\s*:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g,
    type: 'range' as const,
    confidence: 94,
    description: 'Gender-specific range'
  },
  
  // Age-specific ranges: "Adultos: 74 - 106"
  {
    pattern: /adultos?\s*:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/gi,
    type: 'range' as const,
    confidence: 91,
    description: 'Age-specific range'
  },
  
  // Complex ranges with multiple conditions
  {
    pattern: /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\([^)]+\)/g,
    type: 'complex' as const,
    confidence: 85,
    description: 'Complex range with conditions'
  }
]

/**
 * Normalizes reference range text for better parsing
 */
function normalizeReferenceText(text: string): string {
  return text
    // Normalize Spanish characters
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    // Normalize separators
    .replace(/[-–—]/g, '-')
    .replace(/\s+/g, ' ')
    // Clean up common OCR errors
    .replace(/[oO]/g, '0')
    .replace(/[lI]/g, '1')
    .trim()
}

/**
 * Extracts context around a reference range for validation
 */
function extractReferenceContext(text: string, position: number, rangeLength: number): string {
  const start = Math.max(0, position - 150)
  const end = Math.min(text.length, position + rangeLength + 150)
  return text.substring(start, end).trim()
}

/**
 * Determines gender from reference range context
 */
function determineGender(text: string): 'M' | 'F' | 'both' {
  const textLower = text.toLowerCase()
  
  if (textLower.includes('hombre') || textLower.includes('masculino') || /\bh\s*:/i.test(text)) {
    return 'M'
  }
  if (textLower.includes('mujer') || textLower.includes('femenino') || /\bm\s*:/i.test(text)) {
    return 'F'
  }
  
  return 'both'
}

/**
 * Determines age group from reference range context
 */
function determineAgeGroup(text: string): string | undefined {
  const textLower = text.toLowerCase()
  
  if (textLower.includes('adulto')) return 'adult'
  if (textLower.includes('niño') || textLower.includes('pediatr')) return 'pediatric'
  if (textLower.includes('anciano') || textLower.includes('mayor')) return 'elderly'
  
  return undefined
}

/**
 * Extracts unit from reference range context
 */
function extractUnit(text: string, context: string): string | undefined {
  // Common Chilean lab units
  const unitPatterns = [
    /mg\/dL/gi,
    /g\/dL/gi,
    /mUI\/L/gi,
    /U\/L/gi,
    /ng\/dL/gi,
    /pg\/mL/gi,
    /ng\/mL/gi,
    /mg\/L/gi,
    /mill\/mm³/gi,
    /\/mm³/gi,
    /%/g,
    /mmol\/L/gi
  ]
  
  for (const pattern of unitPatterns) {
    const match = context.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  return undefined
}

/**
 * Calculates confidence score for a reference range match
 */
function calculateReferenceConfidence(
  range: ReferenceRange,
  context: string,
  patternConfidence: number
): number {
  let confidence = patternConfidence
  
  // Boost confidence if found in table structure
  if (context.includes('|') || /\s{3,}/.test(context)) {
    confidence += 10
  }
  
  // Boost confidence if found with health marker names
  const contextLower = context.toLowerCase()
  if (contextLower.includes('glicemia') || contextLower.includes('colesterol') || 
      contextLower.includes('tsh') || contextLower.includes('hemoglobina')) {
    confidence += 15
  }
  
  // Boost confidence if found with units
  if (range.unit) {
    confidence += 12
  }
  
  // Boost confidence if found with reference indicators
  if (contextLower.includes('referencia') || contextLower.includes('normal') || 
      contextLower.includes('valor')) {
    confidence += 10
  }
  
  // Boost confidence for abnormal markers
  if (context.includes('[ * ]') || context.includes('[*]')) {
    confidence += 20
  }
  
  // Penalize if values seem unrealistic
  if (range.type === 'range' && range.minValue && range.maxValue) {
    if (range.minValue >= range.maxValue) {
      confidence -= 30
    }
    if (range.maxValue > 10000) { // Unrealistically high values
      confidence -= 20
    }
  }
  
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Parses a reference range from matched text
 */
function parseReferenceRange(
  match: RegExpMatchArray,
  pattern: any,
  originalText: string,
  context: string
): ReferenceRange {
  const range: ReferenceRange = {
    type: pattern.type,
    originalText: match[0],
    confidence: 0,
    gender: determineGender(context),
    ageGroup: determineAgeGroup(context)
  }
  
  // Extract unit from context
  range.unit = extractUnit(match[0], context)
  
  // Parse values based on pattern type
  switch (pattern.type) {
    case 'range':
      range.minValue = parseFloat(match[1])
      range.maxValue = parseFloat(match[2])
      break
      
    case 'upper_limit':
      range.maxValue = parseFloat(match[1])
      range.operator = '<='
      break
      
    case 'lower_limit':
      range.minValue = parseFloat(match[1])
      range.operator = '>='
      break
      
    case 'exact':
      range.minValue = range.maxValue = parseFloat(match[1])
      range.operator = '='
      break
      
    case 'complex':
      range.minValue = parseFloat(match[1])
      range.maxValue = parseFloat(match[2])
      break
  }
  
  // Calculate confidence
  range.confidence = calculateReferenceConfidence(range, context, pattern.confidence)
  
  return range
}

/**
 * Extracts reference ranges from Chilean lab report text
 */
export function extractReferenceRanges(text: string): ReferenceRangeExtractionResult {
  const results: ReferenceRangeResult[] = []
  
  try {
    // Normalize text for better parsing
    const normalizedText = normalizeReferenceText(text)
    
    // Apply each pattern to find reference ranges
    for (const pattern of CHILEAN_REFERENCE_PATTERNS) {
      let match
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags)
      
      while ((match = regex.exec(normalizedText)) !== null) {
        const position = match.index
        const context = extractReferenceContext(text, position, match[0].length)
        
        // Parse the reference range
        const range = parseReferenceRange(match, pattern, text, context)
        
        // Skip if confidence is too low
        if (range.confidence < 50) {
          continue
        }
        
        const result: ReferenceRangeResult = {
          success: true,
          range,
          originalText: match[0],
          confidence: range.confidence,
          position,
          context: context.substring(0, 200) // Limit context length
        }
        
        results.push(result)
      }
    }
    
    // Remove duplicates (same range found by different patterns)
    const uniqueResults = results.filter((result, index, array) => {
      return array.findIndex(r => 
        Math.abs(r.position - result.position) < 20 &&
        r.range?.minValue === result.range?.minValue &&
        r.range?.maxValue === result.range?.maxValue
      ) === index
    })
    
    // Sort by confidence (highest first), then by position
    uniqueResults.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      return a.position - b.position
    })
    
    return {
      success: uniqueResults.length > 0,
      results: uniqueResults,
      totalRangesFound: uniqueResults.length
    }
    
  } catch (error) {
    console.error('Error extracting reference ranges:', error)
    return {
      success: false,
      results: [],
      totalRangesFound: 0,
      error: error instanceof Error ? error.message : 'Error desconocido al extraer rangos de referencia'
    }
  }
}

/**
 * Finds the best reference range for a specific health marker
 */
export function findReferenceRangeForMarker(
  text: string, 
  markerName: string, 
  markerPosition: number
): ReferenceRangeResult | null {
  const extraction = extractReferenceRanges(text)
  
  if (!extraction.success || extraction.results.length === 0) {
    return null
  }
  
  // Find ranges near the marker position (within 200 characters)
  const nearbyRanges = extraction.results.filter(result => 
    Math.abs(result.position - markerPosition) < 200
  )
  
  if (nearbyRanges.length === 0) {
    return extraction.results[0] // Return highest confidence range as fallback
  }
  
  // Return the closest high-confidence range
  return nearbyRanges.sort((a, b) => {
    const distanceA = Math.abs(a.position - markerPosition)
    const distanceB = Math.abs(b.position - markerPosition)
    
    // Prioritize confidence, then distance
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence
    }
    return distanceA - distanceB
  })[0]
}

/**
 * Validates if a value is within a reference range
 */
export function isValueInRange(value: number, range: ReferenceRange): {
  inRange: boolean
  status: 'normal' | 'low' | 'high' | 'unknown'
  severity: 'mild' | 'moderate' | 'severe' | 'normal'
} {
  if (!range) {
    return { inRange: false, status: 'unknown', severity: 'normal' }
  }
  
  let inRange = false
  let status: 'normal' | 'low' | 'high' | 'unknown' = 'unknown'
  
  switch (range.type) {
    case 'range':
      if (range.minValue !== undefined && range.maxValue !== undefined) {
        inRange = value >= range.minValue && value <= range.maxValue
        if (!inRange) {
          status = value < range.minValue ? 'low' : 'high'
        } else {
          status = 'normal'
        }
      }
      break
      
    case 'upper_limit':
      if (range.maxValue !== undefined) {
        inRange = value <= range.maxValue
        status = inRange ? 'normal' : 'high'
      }
      break
      
    case 'lower_limit':
      if (range.minValue !== undefined) {
        inRange = value >= range.minValue
        status = inRange ? 'normal' : 'low'
      }
      break
      
    case 'exact':
      if (range.minValue !== undefined) {
        inRange = Math.abs(value - range.minValue) < 0.01
        status = inRange ? 'normal' : (value < range.minValue ? 'low' : 'high')
      }
      break
  }
  
  // Determine severity based on how far outside the range
  let severity: 'mild' | 'moderate' | 'severe' | 'normal' = 'normal'
  
  if (!inRange && range.type === 'range' && range.minValue !== undefined && range.maxValue !== undefined) {
    const rangeSize = range.maxValue - range.minValue
    const deviation = status === 'low' 
      ? (range.minValue - value) / rangeSize
      : (value - range.maxValue) / rangeSize
    
    if (deviation > 2) {
      severity = 'severe'
    } else if (deviation > 1) {
      severity = 'moderate'
    } else {
      severity = 'mild'
    }
  }
  
  return { inRange, status, severity }
}

/**
 * Analyzes reference range extraction quality for debugging
 */
export function analyzeReferenceRangeExtraction(text: string): {
  totalRanges: number
  rangeTypes: Record<string, number>
  averageConfidence: number
  hasAbnormalMarkers: boolean
  recommendations: string[]
} {
  const extraction = extractReferenceRanges(text)
  const results = extraction.results
  
  const analysis = {
    totalRanges: results.length,
    rangeTypes: {} as Record<string, number>,
    averageConfidence: 0,
    hasAbnormalMarkers: false,
    recommendations: [] as string[]
  }
  
  // Count range types
  for (const result of results) {
    const type = result.range?.type || 'unknown'
    analysis.rangeTypes[type] = (analysis.rangeTypes[type] || 0) + 1
  }
  
  // Calculate average confidence
  if (results.length > 0) {
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
    analysis.averageConfidence = Math.round(totalConfidence / results.length)
  }
  
  // Check for abnormal markers
  analysis.hasAbnormalMarkers = results.some(r => 
    r.context.includes('[ * ]') || r.context.includes('[*]')
  )
  
  // Generate recommendations
  if (analysis.totalRanges === 0) {
    analysis.recommendations.push('⚠️ No se encontraron rangos de referencia. Verificar formato del PDF.')
  } else {
    analysis.recommendations.push(`✅ Se encontraron ${analysis.totalRanges} rangos de referencia`)
  }
  
  if (analysis.hasAbnormalMarkers) {
    analysis.recommendations.push('🚨 Marcadores anormales [ * ] detectados en el PDF')
  }
  
  if (analysis.averageConfidence < 70) {
    analysis.recommendations.push('⚠️ Confianza promedio baja en rangos. Revisar manualmente.')
  } else if (analysis.averageConfidence > 90) {
    analysis.recommendations.push('✅ Alta confianza en la extracción de rangos de referencia')
  }
  
  return analysis
}