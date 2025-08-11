/**
 * Spanish Health Marker Extraction for Chilean Lab Reports
 * Specialized for extracting and mapping Spanish medical terminology to standardized codes
 * Critical for Chilean public primary care facilities
 */

export interface HealthMarkerMapping {
  spanishName: string
  systemCode: string
  category: 'glucose' | 'lipids' | 'liver' | 'thyroid' | 'kidney' | 'blood' | 'other'
  priority: 'critical' | 'high' | 'medium' | 'low'
  unit?: string
  description: string
}

/**
 * Comprehensive Chilean health marker mappings
 * Based on real Chilean lab reports and medical terminology
 */
export const CHILEAN_HEALTH_MARKERS: HealthMarkerMapping[] = [
  // GLUCOSE MARKERS (Critical for diabetes detection)
  {
    spanishName: 'GLICEMIA EN AYUNO (BASAL)',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - critical for diabetes diagnosis'
  },
  {
    spanishName: 'GLICEMIA EN AYUNAS',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - alternative spelling'
  },
  {
    spanishName: 'GLUCOSA EN AYUNO',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - alternative term'
  },
  {
    spanishName: 'HEMOGLOBINA GLICADA A1C',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - long-term glucose control indicator'
  },
  {
    spanishName: 'HEMOGLOBINA GLICOSILADA',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - alternative term'
  },
  {
    spanishName: 'HBA1C',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - abbreviated form'
  },

  // LIPID PROFILE (High priority for cardiovascular risk)
  {
    spanishName: 'COLESTEROL TOTAL',
    systemCode: 'cholesterol_total',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Total cholesterol'
  },
  {
    spanishName: 'COLESTEROL HDL',
    systemCode: 'cholesterol_hdl',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'HDL cholesterol - good cholesterol'
  },
  {
    spanishName: 'COLESTEROL LDL',
    systemCode: 'cholesterol_ldl',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'LDL cholesterol - bad cholesterol'
  },
  {
    spanishName: 'TRIGLICÉRIDOS',
    systemCode: 'triglycerides',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Triglycerides'
  },
  {
    spanishName: 'TRIGLICERIDOS',
    systemCode: 'triglycerides',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Triglycerides - without accent'
  },

  // LIVER FUNCTION (High priority for liver disease detection)
  {
    spanishName: 'GOT (A.S.T)',
    systemCode: 'ast',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'AST - liver enzyme'
  },
  {
    spanishName: 'GPT (A.L.T)',
    systemCode: 'alt',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'ALT - liver enzyme'
  },
  {
    spanishName: 'TRANSAMINASA GOT',
    systemCode: 'ast',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'AST - alternative term'
  },
  {
    spanishName: 'TRANSAMINASA GPT',
    systemCode: 'alt',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'ALT - alternative term'
  },
  {
    spanishName: 'FOSF. ALCALINAS',
    systemCode: 'alkaline_phosphatase',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Alkaline phosphatase'
  },
  {
    spanishName: 'FOSFATASA ALCALINA',
    systemCode: 'alkaline_phosphatase',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Alkaline phosphatase - full term'
  },
  {
    spanishName: 'BILIRRUBINA TOTAL',
    systemCode: 'bilirubin_total',
    category: 'liver',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Total bilirubin'
  },

  // THYROID FUNCTION (Critical for thyroid disorders)
  {
    spanishName: 'H. TIROESTIMULANTE (TSH)',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - thyroid stimulating hormone'
  },
  {
    spanishName: 'TSH',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - abbreviated form'
  },
  {
    spanishName: 'TIROTROPINA',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - alternative term'
  },
  {
    spanishName: 'T4 LIBRE',
    systemCode: 't4_free',
    category: 'thyroid',
    priority: 'high',
    unit: 'ng/dL',
    description: 'Free T4 - thyroid hormone'
  },
  {
    spanishName: 'T3 LIBRE',
    systemCode: 't3_free',
    category: 'thyroid',
    priority: 'high',
    unit: 'pg/mL',
    description: 'Free T3 - thyroid hormone'
  },

  // KIDNEY FUNCTION (High priority for kidney disease)
  {
    spanishName: 'CREATININA',
    systemCode: 'creatinine',
    category: 'kidney',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Creatinine - kidney function marker'
  },
  {
    spanishName: 'UREA',
    systemCode: 'urea',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Urea - kidney function marker'
  },
  {
    spanishName: 'ÁCIDO ÚRICO',
    systemCode: 'uric_acid',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Uric acid'
  },
  {
    spanishName: 'ACIDO URICO',
    systemCode: 'uric_acid',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Uric acid - without accent'
  },

  // BLOOD COUNT (Medium priority for general health)
  {
    spanishName: 'HEMOGLOBINA',
    systemCode: 'hemoglobin',
    category: 'blood',
    priority: 'medium',
    unit: 'g/dL',
    description: 'Hemoglobin'
  },
  {
    spanishName: 'HEMATOCRITO',
    systemCode: 'hematocrit',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Hematocrit'
  },
  {
    spanishName: 'GLÓBULOS ROJOS',
    systemCode: 'rbc',
    category: 'blood',
    priority: 'medium',
    unit: 'mill/mm³',
    description: 'Red blood cells'
  },
  {
    spanishName: 'GLOBULOS ROJOS',
    systemCode: 'rbc',
    category: 'blood',
    priority: 'medium',
    unit: 'mill/mm³',
    description: 'Red blood cells - without accent'
  },
  {
    spanishName: 'GLÓBULOS BLANCOS',
    systemCode: 'wbc',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'White blood cells'
  },
  {
    spanishName: 'GLOBULOS BLANCOS',
    systemCode: 'wbc',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'White blood cells - without accent'
  },
  {
    spanishName: 'PLAQUETAS',
    systemCode: 'platelets',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'Platelets'
  },

  // OTHER IMPORTANT MARKERS
  {
    spanishName: 'PROTEÍNA C REACTIVA',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - inflammation marker'
  },
  {
    spanishName: 'PROTEINA C REACTIVA',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - without accent'
  },
  {
    spanishName: 'PCR',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - abbreviated'
  },
  {
    spanishName: 'VITAMINA D',
    systemCode: 'vitamin_d',
    category: 'other',
    priority: 'low',
    unit: 'ng/mL',
    description: 'Vitamin D'
  },
  {
    spanishName: 'VITAMINA B12',
    systemCode: 'vitamin_b12',
    category: 'other',
    priority: 'low',
    unit: 'pg/mL',
    description: 'Vitamin B12'
  },
  {
    spanishName: 'FERRITINA',
    systemCode: 'ferritin',
    category: 'other',
    priority: 'medium',
    unit: 'ng/mL',
    description: 'Ferritin - iron storage marker'
  }
]

/**
 * Creates a lookup map for fast health marker identification
 */
export function createHealthMarkerLookup(): Map<string, HealthMarkerMapping> {
  const lookup = new Map<string, HealthMarkerMapping>()
  
  for (const marker of CHILEAN_HEALTH_MARKERS) {
    // Add exact match
    lookup.set(marker.spanishName.toUpperCase(), marker)
    
    // Add normalized versions (remove accents, punctuation)
    const normalized = marker.spanishName
      .toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (normalized !== marker.spanishName.toUpperCase()) {
      lookup.set(normalized, marker)
    }
    
    // Add version without parentheses content
    const withoutParens = marker.spanishName
      .toUpperCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (withoutParens !== marker.spanishName.toUpperCase()) {
      lookup.set(withoutParens, marker)
    }
  }
  
  return lookup
}

/**
 * Health marker extraction result
 */
export interface HealthMarkerResult {
  success: boolean
  marker: HealthMarkerMapping | null
  originalText: string
  confidence: number
  position: number
  context: string
}

/**
 * Comprehensive health marker extraction result
 */
export interface HealthMarkerExtractionResult {
  success: boolean
  results: HealthMarkerResult[]
  criticalMarkers: HealthMarkerResult[]
  highPriorityMarkers: HealthMarkerResult[]
  totalMarkersFound: number
  error?: string
}

/**
 * Extracts health markers from Chilean lab report text
 */
export function extractSpanishHealthMarkers(text: string): HealthMarkerExtractionResult {
  const results: HealthMarkerResult[] = []
  const lookup = createHealthMarkerLookup()
  
  try {
    // Normalize text for better matching
    const normalizedText = text.toUpperCase()
    
    // Search for each health marker
    lookup.forEach((marker, searchTerm) => {
      const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi')
      let match
      
      while ((match = regex.exec(normalizedText)) !== null) {
        const position = match.index
        const context = extractHealthMarkerContext(text, position, searchTerm.length)
        
        // Calculate confidence based on context and marker priority
        const confidence = calculateHealthMarkerConfidence(marker, context, searchTerm)
        
        const result: HealthMarkerResult = {
          success: true,
          marker,
          originalText: match[0],
          confidence,
          position,
          context
        }
        
        results.push(result)
      }
    })
    
    // Remove duplicates (same marker found multiple times)
    const uniqueResults = results.filter((result, index, array) => {
      return array.findIndex(r => 
        r.marker?.systemCode === result.marker?.systemCode && 
        Math.abs(r.position - result.position) < 50
      ) === index
    })
    
    // Sort by position in document
    uniqueResults.sort((a, b) => a.position - b.position)
    
    // Categorize by priority
    const criticalMarkers = uniqueResults.filter(r => r.marker?.priority === 'critical')
    const highPriorityMarkers = uniqueResults.filter(r => r.marker?.priority === 'high')
    
    return {
      success: uniqueResults.length > 0,
      results: uniqueResults,
      criticalMarkers,
      highPriorityMarkers,
      totalMarkersFound: uniqueResults.length
    }
    
  } catch (error) {
    console.error('Error extracting health markers:', error)
    return {
      success: false,
      results: [],
      criticalMarkers: [],
      highPriorityMarkers: [],
      totalMarkersFound: 0,
      error: error instanceof Error ? error.message : 'Error desconocido al extraer marcadores de salud'
    }
  }
}

/**
 * Extracts context around a health marker for validation
 */
function extractHealthMarkerContext(text: string, position: number, markerLength: number): string {
  const start = Math.max(0, position - 100)
  const end = Math.min(text.length, position + markerLength + 100)
  return text.substring(start, end).trim()
}

/**
 * Calculates confidence score for a health marker match
 */
function calculateHealthMarkerConfidence(
  marker: HealthMarkerMapping,
  context: string,
  searchTerm: string
): number {
  let confidence = 80 // Base confidence
  
  // Boost confidence based on priority
  switch (marker.priority) {
    case 'critical':
      confidence += 15
      break
    case 'high':
      confidence += 10
      break
    case 'medium':
      confidence += 5
      break
    case 'low':
      confidence += 0
      break
  }
  
  // Boost confidence if found in table-like structure
  if (context.includes('|') || /\s{3,}/.test(context)) {
    confidence += 10
  }
  
  // Boost confidence if found with units
  const contextLower = context.toLowerCase()
  if (marker.unit && contextLower.includes(marker.unit.toLowerCase())) {
    confidence += 15
  }
  
  // Boost confidence if found with result indicators
  if (contextLower.includes('resultado') || contextLower.includes('valor')) {
    confidence += 8
  }
  
  // Boost confidence for exact matches
  if (searchTerm === marker.spanishName.toUpperCase()) {
    confidence += 10
  }
  
  // Penalize if found in headers or titles (less likely to be actual results)
  if (contextLower.includes('laboratorio') || contextLower.includes('examen') || 
      contextLower.includes('informe')) {
    confidence -= 5
  }
  
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Gets health markers by category
 */
export function getHealthMarkersByCategory(category: string): HealthMarkerMapping[] {
  return CHILEAN_HEALTH_MARKERS.filter(marker => marker.category === category)
}

/**
 * Gets critical health markers for priority scoring
 */
export function getCriticalHealthMarkers(): HealthMarkerMapping[] {
  return CHILEAN_HEALTH_MARKERS.filter(marker => marker.priority === 'critical')
}

/**
 * Finds health marker by system code
 */
export function findHealthMarkerByCode(systemCode: string): HealthMarkerMapping | null {
  return CHILEAN_HEALTH_MARKERS.find(marker => marker.systemCode === systemCode) || null
}