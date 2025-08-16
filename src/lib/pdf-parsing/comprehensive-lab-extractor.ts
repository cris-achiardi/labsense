/**
 * Comprehensive Lab Results Extraction for Chilean Lab Reports
 * Handles ALL 68+ health markers including qualitative results
 * 
 * ✅ Current Implementation: Text-based extraction with sample type segmentation
 * - Uses "Tipo de Muestra" blocks to prevent contamination
 * - Enhanced stopword filtering for metadata
 * - Normalization pipeline for data quality
 * 
 * 🔮 Future Consideration: Coordinate-based PDF extraction
 * For even more robust extraction, consider switching to layout-aware parsing:
 * 
 * Benefits:
 * - Spatial understanding prevents accidental text concatenation
 * - Can separate table regions from header/footer metadata
 * - Groups text by line positions and coordinates
 * 
 * Implementation approach:
 * 1. Use pdfplumber (Python) or pdf.js + coordinates (Node/TS)
 * 2. Extract text with x/y coordinates preserved
 * 3. Group text by line positions
 * 4. Apply existing regex patterns to spatially-isolated text blocks
 * 
 * Trade-offs:
 * - Requires complete rewrite of extraction engine
 * - May break existing PDF.js workflows
 * - Adds complexity but significantly reduces contamination
 * 
 * Recommendation: Implement for v2.0 if current approach reaches limits
 * 
 * 📋 TODO: Fuzzy Matching Enhancement
 * For even better accuracy, consider adding fuzzy string matching:
 * 
 * Implementation:
 * - Install rapidfuzz or string-similarity library
 * - Add fuzzy matching function for lab name variations
 * - Match extracted names against CANONICAL_LAB_ALIASES with similarity threshold
 * 
 * Example:
 * const fuzzyMatch = (input: string, candidates: string[], threshold = 0.8) => {
 *   return candidates.find(candidate => 
 *     similarity(input.toLowerCase(), candidate.toLowerCase()) >= threshold
 *   )
 * }
 * 
 * Benefits:
 * - Handles OCR errors and variations not in canonical mapping
 * - More robust to typos and formatting differences
 * - Could increase extraction rate from 51 to closer to 62 results
 */

import { CHILEAN_HEALTH_MARKERS, createHealthMarkerLookup, type HealthMarkerMapping } from './spanish-health-markers'

/**
 * Chilean Lab Format Specifications
 * Each lab has standardized format, units, methods, and expected values
 */
interface ChileanLabFormat {
  unit: string | null
  method: string | null
  normalRange: string | null
  type: 'numeric' | 'observation' | 'qualitative' | 'calculated'
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  expectedValues?: string[]
  pattern?: RegExp
}

const CHILEAN_LAB_FORMATS: Record<string, ChileanLabFormat> = {
  // ================================
  // CRITICAL GLUCOSE LABS
  // ================================
  'GLICEMIA EN AYUNO (BASAL)': {
    unit: 'mg/dL',
    method: 'Hexoquinasa',
    normalRange: '74-106',
    type: 'numeric',
    category: 'glucose',
    priority: 'critical'
  },
  
  'HEMOGLOBINA GLICADA A1C': {
    unit: '%',
    method: 'Cromatografía liquida de alta eficiencia (HPLC)',
    normalRange: '4-6',
    type: 'numeric',
    category: 'glucose',
    priority: 'critical'
  },
  
  // ================================
  // CRITICAL THYROID LABS
  // ================================
  'H. TIROESTIMULANTE (TSH)': {
    unit: 'μUI/mL',
    method: 'Quimioluminiscencia',
    normalRange: '0,55-4,78',
    type: 'numeric',
    category: 'thyroid',
    priority: 'critical'
  },
  
  'H. TIROXINA LIBRE (T4 LIBRE)': {
    unit: 'ng/dL',
    method: 'Quimioluminiscencia',
    normalRange: '0,89-1,76',
    type: 'numeric',
    category: 'thyroid',
    priority: 'high'
  },
  
  // ================================
  // LIVER FUNCTION PANEL
  // ================================
  'BILIRRUBINA TOTAL': {
    unit: 'mg/dL',
    method: 'Oxidación Vanadato',
    normalRange: '0,3-1,2',
    type: 'numeric',
    category: 'liver',
    priority: 'medium'
  },
  
  'BILIRRUBINA DIRECTA': {
    unit: 'mg/dL',
    method: 'Oxidación Vanadato',
    normalRange: 'Menor a 0.30',
    type: 'numeric',
    category: 'liver',
    priority: 'medium'
  },
  
  'GOT (A.S.T)': {
    unit: 'U/L',
    method: 'I.F.C.C/con piridoxal fosfato',
    normalRange: 'Hasta 34',
    type: 'numeric',
    category: 'liver',
    priority: 'high'
  },
  
  'GPT (A.L.T)': {
    unit: 'U/L',
    method: 'I.F.C.C/con piridoxal fosfato',
    normalRange: '10-49',
    type: 'numeric',
    category: 'liver',
    priority: 'high'
  },
  
  'FOSF. ALCALINAS (ALP)': {
    unit: 'U/L',
    method: 'I.F.C.C/con piridoxal fosfato',
    normalRange: '46-116',
    type: 'numeric',
    category: 'liver',
    priority: 'medium'
  },
  
  'G.G.T.': {
    unit: 'U/L',
    method: 'G-glutamil-carboxi-nitroanilida',
    normalRange: 'Menor a 38',
    type: 'numeric',
    category: 'liver',
    priority: 'medium'
  },
  
  'ALBÚMINA': {
    unit: 'g/dL',
    method: 'Verde bromocresol',
    normalRange: '3,2-4,8',
    type: 'numeric',
    category: 'liver',
    priority: 'medium'
  },
  
  // ================================
  // KIDNEY FUNCTION PANEL
  // ================================
  'CREATININA': {
    unit: 'mg/dL',
    method: 'Jaffé cinético',
    normalRange: '0,55-1,02',
    type: 'numeric',
    category: 'kidney',
    priority: 'high'
  },
  
  'VFG': {
    unit: 'mL/min/1.73 mt²',
    method: 'Cálculo',
    normalRange: 'Mayor a 60',
    type: 'calculated',
    category: 'kidney',
    priority: 'high'
  },
  
  'NITROGENO UREICO (BUN)': {
    unit: 'mg/dL',
    method: 'Ureasa con GLDH',
    normalRange: '9-23',
    type: 'numeric',
    category: 'kidney',
    priority: 'medium'
  },
  
  'UREMIA (CALCULO)': {
    unit: 'mg/dL',
    method: 'Cálculo',
    normalRange: '15,4-37,4',
    type: 'calculated',
    category: 'kidney',
    priority: 'medium'
  },
  
  'ÁCIDO URICO (URICEMIA)': {
    unit: 'mg/dL',
    method: 'Uricasa-peroxidasa',
    normalRange: '3,1-7,8',
    type: 'numeric',
    category: 'kidney',
    priority: 'medium'
  },
  
  'MICROALBUMINURIA AISLADA': {
    unit: 'mg/L',
    method: 'Cálculo',
    normalRange: 'Menor a 30',
    type: 'numeric',
    category: 'kidney',
    priority: 'medium'
  },
  
  'CREATINURIA AISLADA': {
    unit: 'mg/dL',
    method: 'Cálculo',
    normalRange: null,
    type: 'numeric',
    category: 'kidney',
    priority: 'low'
  },
  
  'MAU-RAC (calculo)': {
    unit: 'mg/gr',
    method: 'Cálculo',
    normalRange: 'Menor a 30',
    type: 'calculated',
    category: 'kidney',
    priority: 'medium'
  },
  
  // ================================
  // ELECTROLYTES PANEL
  // ================================
  'SODIO (Na) EN SANGRE': {
    unit: 'mEq/L',
    method: 'ISE Indirecto',
    normalRange: '136-145',
    type: 'numeric',
    category: 'electrolytes',
    priority: 'medium'
  },
  
  'POTASIO (K) EN SANGRE': {
    unit: 'mEq/L',
    method: 'ISE Indirecto',
    normalRange: '3,5-5,1',
    type: 'numeric',
    category: 'electrolytes',
    priority: 'medium'
  },
  
  'CLORO (Cl) EN SANGRE': {
    unit: 'mEq/L',
    method: 'ISE Indirecto',
    normalRange: '98-107',
    type: 'numeric',
    category: 'electrolytes',
    priority: 'medium'
  },
  
  // ================================
  // LIPID PROFILE PANEL
  // ================================
  'TRIGLICERIDOS': {
    unit: 'mg/dL',
    method: 'Enzimático, Punto Final',
    normalRange: 'Normal: < 150',
    type: 'numeric',
    category: 'lipids',
    priority: 'high'
  },
  
  'COLESTEROL TOTAL': {
    unit: 'mg/dL',
    method: 'Enzimático',
    normalRange: 'Bajo (deseable): < 200',
    type: 'numeric',
    category: 'lipids',
    priority: 'high'
  },
  
  'COLESTEROL HDL': {
    unit: 'mg/dL',
    method: 'Medición Directa, Izawa y Cols',
    normalRange: 'Bajo (alto riesgo): < 40',
    type: 'numeric',
    category: 'lipids',
    priority: 'high'
  },
  
  'COLESTEROL LDL (CALCULO)': {
    unit: 'mg/dL',
    method: 'Cálculo',
    normalRange: '1-150',
    type: 'calculated',
    category: 'lipids',
    priority: 'high'
  },
  
  'COLESTEROL VLDL (CALCULO)': {
    unit: 'mg/dL',
    method: 'Cálculo',
    normalRange: 'Hasta 36',
    type: 'calculated',
    category: 'lipids',
    priority: 'medium'
  },
  
  'CALCULO TOTAL/HDL': {
    unit: null,
    method: 'Cálculo',
    normalRange: null,
    type: 'calculated',
    category: 'lipids',
    priority: 'medium'
  },
  
  // ================================
  // VITAMINS & MINERALS
  // ================================
  'VITAMINA B12': {
    unit: 'pg/mL',
    method: 'Quimioluminiscencia',
    normalRange: '211-911',
    type: 'numeric',
    category: 'other',
    priority: 'low'
  },
  
  // ================================
  // HEMOGRAMA - BLOOD COUNT
  // ================================
  'HEMOGLOBINA': {
    unit: 'g/dL',
    method: 'Colorimetria',
    normalRange: '12,3-15,3',
    type: 'numeric',
    category: 'blood',
    priority: 'medium'
  },
  
  'HEMATOCRITO': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '35-47',
    type: 'numeric',
    category: 'blood',
    priority: 'medium'
  },
  
  'RECUENTO GLOBULOS ROJOS': {
    unit: 'x10^6/uL',
    method: 'Citometría de flujo',
    normalRange: '4,1-5,1',
    type: 'numeric',
    category: 'blood',
    priority: 'medium'
  },
  
  'RECUENTO GLOBULOS BLANCOS': {
    unit: 'x10^3/uL',
    method: 'Citometría de flujo',
    normalRange: '4,5-11',
    type: 'numeric',
    category: 'blood',
    priority: 'medium'
  },
  
  'RECUENTO PLAQUETAS': {
    unit: 'x10^3/uL',
    method: 'Citometría de flujo',
    normalRange: '150-400',
    type: 'numeric',
    category: 'blood',
    priority: 'medium'
  },
  
  'V.C.M': {
    unit: 'fL',
    method: 'Citometría de flujo',
    normalRange: '80-99',
    type: 'numeric',
    category: 'blood',
    priority: 'low'
  },
  
  'H.C.M': {
    unit: 'pg',
    method: 'Citometría de flujo',
    normalRange: '26,6-32',
    type: 'numeric',
    category: 'blood',
    priority: 'low'
  },
  
  'C.H.C.M': {
    unit: 'gr/dL',
    method: 'Citometría de flujo',
    normalRange: '32-35',
    type: 'numeric',
    category: 'blood',
    priority: 'low'
  },
  
  // Blood Differential
  'EOSINOFILOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '2-4',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'BASOFILOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-1',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'LINFOCITOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '25-40',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'MONOCITOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '2-8',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'NEUTROFILOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '50-70',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'BACILIFORMES': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-0',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'JUVENILES': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-0',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'MIELOCITOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-0',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'PROMIELOCITOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-0',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'BLASTOS': {
    unit: '%',
    method: 'Citometría de flujo',
    normalRange: '0-0',
    type: 'numeric',
    category: 'blood_differential',
    priority: 'low'
  },
  
  'V.H.S.': {
    unit: 'mm/hr',
    method: 'Colorimetria',
    normalRange: '0-15',
    type: 'observation',
    category: 'blood',
    priority: 'low',
    expectedValues: ['No procesado por falta de insumos', 'Normal', 'Elevado']
  },
  
  // ================================
  // ORINA COMPLETA - COMPLETE URINE
  // ================================
  'COLOR': {
    unit: null,
    method: null,
    normalRange: 'Amarillo',
    type: 'observation',
    category: 'urine',
    priority: 'low',
    expectedValues: ['Amarillo', 'Amarillo claro', 'Rojizo', 'Verde', 'Amarillo pálido']
  },
  
  'ASPECTO': {
    unit: null,
    method: null,
    normalRange: 'Claro',
    type: 'observation',
    category: 'urine',
    priority: 'low',
    expectedValues: ['Claro', 'Turbio', 'Opaco', 'Ligeramente turbio']
  },
  
  'PH': {
    unit: null,
    method: null,
    normalRange: '5-8',
    type: 'numeric',
    category: 'urine',
    priority: 'low'
  },
  
  'DENSIDAD': {
    unit: null,
    method: null,
    normalRange: '1,01-1,03',
    type: 'numeric',
    category: 'urine',
    priority: 'low'
  },
  
  'PROTEINAS': {
    unit: 'mg/dL',
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', 'Positivo', '+', '++', '+++', 'Trazas']
  },
  
  'GLUCOSA': {
    unit: 'mg/dL',
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', '+', '++', '+++', '++++', 'Trazas']
  },
  
  'CETONAS': {
    unit: 'mg/dL',
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', 'Positivo', '+', '++', '+++', 'Trazas']
  },
  
  'SANGRE EN ORINA': {
    unit: 'Eri/uL',
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', 'Positivo', '+', '++', '+++', 'Trazas']
  },
  
  'UROBILINOGENO': {
    unit: 'mg/dL',
    method: 'Colorimétrico',
    normalRange: 'Normal',
    type: 'numeric',
    category: 'urine',
    priority: 'low'
  },
  
  'BILIRRUBINA': {
    unit: null,
    method: null,
    normalRange: 'Negativa',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativa', 'Positiva', '+', '++', '+++']
  },
  
  'NITRITOS': {
    unit: null,
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', 'Positivo']
  },
  
  'LEUCOCITOS': {
    unit: '/µL',
    method: null,
    normalRange: 'Negativo',
    type: 'qualitative',
    category: 'urine',
    priority: 'medium',
    expectedValues: ['Negativo', 'Positivo', '+', '++', '+++']
  },
  
  // ================================
  // SEDIMENTO DE ORINA - URINE SEDIMENT
  // ================================
  'HEMATIES POR CAMPO': {
    unit: null,
    method: 'Microscopía',
    normalRange: '0-2',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low'
  },
  
  'LEUCOCITOS POR CAMPO': {
    unit: null,
    method: 'Microscopía',
    normalRange: '0-2',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low'
  },
  
  'CELULAS EPITELIALES': {
    unit: null,
    method: 'Microscopía',
    normalRange: 'No se observan',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low',
    expectedValues: ['No se observan', 'Escasa cantidad', 'Moderada cantidad', 'Abundante', 'Algunas']
  },
  
  'MUCUS': {
    unit: null,
    method: 'Microscopía',
    normalRange: 'No se observa',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low',
    expectedValues: ['No se observa', 'Escasa cantidad', 'Moderada cantidad', 'Abundante']
  },
  
  'CRISTALES': {
    unit: null,
    method: 'Microscopía',
    normalRange: 'No se observan',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low',
    expectedValues: ['No se observan', 'Escasa cantidad', 'Moderada cantidad', 'Abundante', 'Uratos amorfos']
  },
  
  'CILINDROS': {
    unit: null,
    method: 'Microscopía',
    normalRange: 'No se observan',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'low',
    expectedValues: ['No se observan', 'Escasa cantidad', 'Hialinos', 'Granulosos']
  },
  
  'BACTERIAS': {
    unit: null,
    method: 'Microscopía',
    normalRange: 'No se observan',
    type: 'observation',
    category: 'urine_sediment',
    priority: 'medium',
    expectedValues: ['No se observan', 'Escasa cantidad', 'Moderada cantidad', 'Abundante']
  },
  
  // ================================
  // SEROLOGY
  // ================================
  'R.P.R.': {
    unit: null,
    method: 'Aglutinación En Látex',
    normalRange: 'No reactivo',
    type: 'qualitative',
    category: 'serology',
    priority: 'medium',
    expectedValues: ['No reactivo', 'Reactivo', 'Positivo', 'Negativo']
  }
}

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
 * EXACT LAB NAME + RESULT extraction using standardized database
 * Only extracts lab names that match exactly with CHILEAN_LAB_FORMATS
 * Ensures 100% accuracy in lab name identification
 */
function extractLabNamesAndResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  console.log('🎯 Starting EXACT LAB NAME + RESULT extraction...')
  
  // Get all exact lab names from our standardized database
  const exactLabNames = Object.keys(CHILEAN_LAB_FORMATS)
  console.log(`📋 Searching for ${exactLabNames.length} exact lab names`)
  
  // For each exact lab name, find it in the text and extract the result
  for (const exactLabName of exactLabNames) {
    const escapedLabName = exactLabName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Patterns to find EXACT lab name followed by result
    const exactPatterns = [
      // Pattern 1: Exact lab name with space and number: GLICEMIA EN AYUNO (BASAL) 269
      new RegExp(`\\b(${escapedLabName})\\s+(\\d+(?:,\\d+)?(?:\\.\\d+)?)`, 'g'),
      
      // Pattern 2: Exact lab name connected to number: GLICEMIA EN AYUNO (BASAL)269
      new RegExp(`\\b(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)`, 'g'),
      
      // Pattern 3: Exact lab name with unit in parentheses: HEMOGLOBINA14,2(g/dL)
      new RegExp(`\\b(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\([^)]+\\)`, 'g'),
      
      // Pattern 4: Qualitative results for exact lab names
      new RegExp(`\\b(${escapedLabName})\\s+(No reactivo|Negativo|Positivo|Reactivo|Claro|Amarillo|Turbio|No se observan|Escasa cantidad|Abundante|Moderada cantidad)`, 'g')
    ]
    
    // Try each pattern for this exact lab name
    for (let patternIndex = 0; patternIndex < exactPatterns.length; patternIndex++) {
      const pattern = exactPatterns[patternIndex]
      let match
      
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, examen, resultado] = match
        
        // Skip if already extracted
        if (isAlreadyExtracted(results, examen)) continue
        
        // Create lab result with exact database match
        const labResult = createExactLabResult(
          examen.trim(),
          resultado.trim(),
          healthMarkerLookup,
          patternIndex,
          fullMatch,
          text.indexOf(fullMatch)
        )
        
        if (labResult) {
          console.log(`✅ EXACT match: ${labResult.examen} = ${labResult.resultado}`)
          results.push(labResult)
        }
        
        break // Only take the first match for this exact lab name
      }
    }
  }
  
  console.log(`🎯 EXACT extraction found ${results.length} LAB NAME + RESULT pairs`)
  return results
}

/**
 * Check if a lab name is valid
 */
function isValidLabName(name: string): boolean {
  const cleanName = name.trim().toUpperCase()
  
  // Must be at least 3 characters
  if (cleanName.length < 3) return false
  
  // Skip common non-lab words
  const skipWords = [
    'FECHA', 'FOLIO', 'NOMBRE', 'EDAD', 'SEXO', 'RUT', 'LABORATORIO',
    'TIPO', 'MUESTRA', 'METODO', 'EXAMEN', 'RESULTADO', 'UNIDAD',
    'VALOR', 'REFERENCIA', 'PROFESIONAL', 'PROCEDENCIA', 'VALIDACION'
  ]
  
  for (const skipWord of skipWords) {
    if (cleanName.includes(skipWord)) return false
  }
  
  // Must contain mostly uppercase letters (Chilean lab names are ALL-CAPS)
  const letters = cleanName.replace(/[\s\.\(\)\/\-\d]/g, '')
  if (letters.length < 3) return false
  
  const uppercaseCount = (letters.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length
  return (uppercaseCount / letters.length) >= 0.7 // At least 70% uppercase
}

/**
 * Create exact lab result with database lookup for metadata
 * Uses EXACT match from CHILEAN_LAB_FORMATS for 100% accuracy
 */
function createExactLabResult(
  examen: string,
  resultado: string,
  healthMarkerLookup: Map<string, HealthMarkerMapping>,
  _patternIndex: number,
  context: string,
  position: number
): ComprehensiveLabResult | null {
  
  // Parse result value
  let parsedResultado: string | number = resultado
  if (/^\d+(?:,\d+)?(?:\.\d+)?$/.test(resultado)) {
    parsedResultado = parseFloat(resultado.replace(',', '.'))
  }
  
  // EXACT lookup from comprehensive database
  const format = CHILEAN_LAB_FORMATS[examen]
  if (!format) {
    console.warn(`⚠️  No exact format found for: ${examen}`)
    return null
  }
  
  // Get system code using exact lab name mapping
  const systemCode = getExactSystemCode(examen)
  
  // Determine confidence - 100% for exact matches
  const confidence = 100
  
  return {
    examen,
    resultado: parsedResultado,
    unidad: format.unit,
    valorReferencia: format.normalRange,
    metodo: format.method,
    tipoMuestra: detectSampleTypeForResult(examen, context), // Improved sample type detection
    isAbnormal: false, // Will be determined later by abnormal detection
    abnormalIndicator: '',
    systemCode,
    category: format.category,
    priority: format.priority,
    confidence,
    position,
    context: context.substring(0, 100),
    resultType: format.type as any
  }
}

/**
 * Get exact system code for lab name using precise mapping
 */
function getExactSystemCode(labName: string): string | null {
  const exactMapping: Record<string, string> = {
    // Glucose
    'GLICEMIA EN AYUNO (BASAL)': 'glucose_fasting',
    'HEMOGLOBINA GLICADA A1C': 'hba1c',
    
    // Thyroid
    'H. TIROESTIMULANTE (TSH)': 'tsh',
    'H. TIROXINA LIBRE (T4 LIBRE)': 't4_free',
    
    // Liver
    'BILIRRUBINA TOTAL': 'bilirubin_total',
    'BILIRRUBINA DIRECTA': 'bilirubin_direct',
    'GOT (A.S.T)': 'ast',
    'GPT (A.L.T)': 'alt',
    'FOSF. ALCALINAS (ALP)': 'alkaline_phosphatase',
    'G.G.T.': 'ggt',
    'ALBÚMINA': 'albumin',
    
    // Kidney
    'CREATININA': 'creatinine',
    'VFG': 'egfr',
    'NITROGENO UREICO (BUN)': 'bun',
    'UREMIA (CALCULO)': 'urea_calculated',
    'ÁCIDO URICO (URICEMIA)': 'uric_acid',
    'MICROALBUMINURIA AISLADA': 'microalbumin',
    'CREATINURIA AISLADA': 'creatinine_urine',
    'MAU-RAC (calculo)': 'albumin_creatinine_ratio',
    
    // Electrolytes
    'SODIO (Na) EN SANGRE': 'sodium',
    'POTASIO (K) EN SANGRE': 'potassium',
    'CLORO (Cl) EN SANGRE': 'chloride',
    
    // Lipids
    'TRIGLICERIDOS': 'triglycerides',
    'COLESTEROL TOTAL': 'cholesterol_total',
    'COLESTEROL HDL': 'cholesterol_hdl',
    'COLESTEROL LDL (CALCULO)': 'cholesterol_ldl',
    'COLESTEROL VLDL (CALCULO)': 'cholesterol_vldl',
    'CALCULO TOTAL/HDL': 'cholesterol_ratio',
    
    // Vitamins
    'VITAMINA B12': 'vitamin_b12',
    
    // Blood Count - CORRECTED MAPPING
    'HEMOGLOBINA': 'hemoglobin',
    'HEMATOCRITO': 'hematocrit',
    'RECUENTO GLOBULOS ROJOS': 'rbc',
    'RECUENTO GLOBULOS BLANCOS': 'wbc',
    'RECUENTO PLAQUETAS': 'platelets',
    'V.C.M': 'mcv',
    'H.C.M': 'mch',
    'C.H.C.M': 'mchc',
    
    // Blood Differential
    'EOSINOFILOS': 'eosinophils',
    'BASOFILOS': 'basophils',
    'LINFOCITOS': 'lymphocytes',
    'MONOCITOS': 'monocytes',
    'NEUTROFILOS': 'neutrophils',
    'BACILIFORMES': 'bands',
    'JUVENILES': 'juvenile',
    'MIELOCITOS': 'myelocytes',
    'PROMIELOCITOS': 'promyelocytes',
    'BLASTOS': 'blasts',
    'V.H.S.': 'esr',
    
    // Urine Complete
    'COLOR': 'urine_color',
    'ASPECTO': 'urine_appearance',
    'PH': 'urine_ph',
    'DENSIDAD': 'urine_density',
    'PROTEINAS': 'urine_protein',
    'GLUCOSA': 'urine_glucose',
    'CETONAS': 'urine_ketones',
    'SANGRE EN ORINA': 'urine_blood',
    'UROBILINOGENO': 'urine_urobilinogen',
    'BILIRRUBINA': 'urine_bilirubin',
    'NITRITOS': 'urine_nitrites',
    'LEUCOCITOS': 'urine_leukocytes',
    
    // Urine Sediment
    'HEMATIES POR CAMPO': 'urine_rbc',
    'LEUCOCITOS POR CAMPO': 'urine_wbc',
    'CELULAS EPITELIALES': 'urine_epithelial_cells',
    'MUCUS': 'urine_mucus',
    'CRISTALES': 'urine_crystals',
    'CILINDROS': 'urine_casts',
    'BACTERIAS': 'urine_bacteria',
    
    // Serology
    'R.P.R.': 'rpr'
  }
  
  return exactMapping[labName] || null
}

/**
 * Dedicated parser for LIPID PROFILE section
 * Handles the complex multi-line format with embedded results
 */
function parseLipidProfile(text: string, healthMarkerLookup: Map<string, HealthMarkerMapping>): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for lipid profile section
  const lipidSectionMatch = text.match(/TRIGLICERIDOS[\s\S]*?(?=(?:HEMOGRAMA|ELECTROLITOS|FUNCION|$))/i)
  if (!lipidSectionMatch) return results
  
  const lipidSection = lipidSectionMatch[0]
  console.log('🔬 Parsing LIPID PROFILE section')
  
  // Define expected lipid labs in order
  const lipidLabs = [
    'TRIGLICERIDOS',
    'COLESTEROL TOTAL', 
    'COLESTEROL HDL',
    'COLESTEROL LDL (CALCULO)',
    'COLESTEROL VLDL (CALCULO)',
    'CALCULO TOTAL/HDL'
  ]
  
  for (const labName of lipidLabs) {
    // Skip if already extracted
    if (isAlreadyExtracted(results, labName)) continue
    
    // Constrained pattern for this specific lab - stops at next lab or end
    const escapedLabName = labName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\(([^)]+)\\)([^A-ZÁÉÍÓÚÑ]*?)(?=COLESTEROL|CALCULO|$)`, 'g')
    
    const match = pattern.exec(lipidSection)
    if (match) {
      const [, examen, resultado, unidad, rangeData] = match
      
      // Extract clean reference range - stop at method or next lab
      let cleanRange = rangeData
        .replace(/Normal:?\s*/g, '')
        .replace(/Bajo.*?(?=:|$)/g, '')
        .replace(/Moderado.*?(?=:|$)/g, '')
        .replace(/Alto.*?(?=:|$)/g, '')
        .replace(/Muy alto.*?(?=:|$)/g, '')
        .replace(/Enzimático.*$/g, '')
        .replace(/Medición Directa.*$/g, '')
        .replace(/Cálculo.*$/g, '')
        .trim()
      
      // Clean range to just the numeric part
      const rangeMatch = cleanRange.match(/[<>]?\s*\d+(?:[,.-]\d+)?/)
      cleanRange = rangeMatch ? rangeMatch[0] : ''
      
      const labResult = createExactLabResult(
        examen.trim(),
        resultado.trim(),
        healthMarkerLookup,
        0,
        match[0],
        0
      )
      
      if (labResult) {
        labResult.valorReferencia = cleanRange || labResult.valorReferencia
        labResult.tipoMuestra = 'SUERO'
        console.log(`✅ Lipid profile: ${labResult.examen} = ${labResult.resultado}`)
        results.push(labResult)
      }
    }
  }
  
  return results
}

/**
 * Dedicated parser for HEMOGRAM section
 * Handles blood count with embedded differential
 */
function parseHemogramPanel(text: string, healthMarkerLookup: Map<string, HealthMarkerMapping>): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for hemogram section
  const hemogramSectionMatch = text.match(/RECUENTO GLOBULOS ROJOS[\s\S]*?(?=(?:ORINA|ELECTROLITOS|PERFIL|$))/i)
  if (!hemogramSectionMatch) return results
  
  const hemogramSection = hemogramSectionMatch[0]
  console.log('🔬 Parsing HEMOGRAM section')
  
  // Define expected hemogram labs in order
  const hemogramLabs = [
    'RECUENTO GLOBULOS ROJOS',
    'HEMATOCRITO', 
    'HEMOGLOBINA',
    'V.C.M',
    'H.C.M',
    'C.H.C.M',
    'RECUENTO PLAQUETAS',
    'RECUENTO GLOBULOS BLANCOS',
    'EOSINOFILOS',
    'BASOFILOS',
    'LINFOCITOS',
    'MONOCITOS',
    'NEUTROFILOS'
  ]
  
  for (const labName of hemogramLabs) {
    // Skip if already extracted
    if (isAlreadyExtracted(results, labName)) continue
    
    // Constrained pattern for this specific lab
    const escapedLabName = labName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\(([^)]+)\\)([^A-ZÁÉÍÓÚÑ]*?)(?=[A-ZÁÉÍÓÚÑ]{3,}|$)`, 'g')
    
    const match = pattern.exec(hemogramSection)
    if (match) {
      const [, examen, resultado, unidad, rangeData] = match
      
      // Extract just the numeric range
      let cleanRange = rangeData
        .replace(/Citometría de flujo.*$/g, '')
        .replace(/Colorimetria.*$/g, '')
        .trim()
      
      const rangeMatch = cleanRange.match(/\d+(?:[,.-]\d+)?/)
      cleanRange = rangeMatch ? rangeMatch[0] : ''
      
      const labResult = createExactLabResult(
        examen.trim(),
        resultado.trim(),
        healthMarkerLookup,
        0,
        match[0],
        0
      )
      
      if (labResult) {
        labResult.valorReferencia = cleanRange || labResult.valorReferencia
        labResult.tipoMuestra = 'SANGRE TOTAL + E.D.T.A.'
        console.log(`✅ Hemogram: ${labResult.examen} = ${labResult.resultado}`)
        results.push(labResult)
      }
    }
  }
  
  return results
}

/**
 * ✅ ChatGPT Strategy: Segment PDF text by "Tipo de Muestra" blocks
 * This prevents contamination between different sample types
 */
interface SampleTypeBlock {
  sampleType: string
  content: string
}

function segmentBySampleType(text: string): SampleTypeBlock[] {
  const blocks: SampleTypeBlock[] = []
  
  // Split by "Tipo de Muestra" declarations
  const segments = text.split(/Tipo de Muestra\s*:\s*([A-ZÁÉÍÓÚÑ\s\.\+]+)/g)
  
  console.log(`🔍 Found ${Math.floor(segments.length / 2)} "Tipo de Muestra" segments`)
  
  // Process segments in pairs: [content before type, type name, content after type]
  for (let i = 1; i < segments.length; i += 2) {
    const sampleType = segments[i].trim()
    const content = segments[i + 1] || ''
    
    if (content.length > 50) { // Only include substantial blocks
      // Clean up sample type name
      const cleanSampleType = sampleType
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\.\+\-]/g, '')
        .trim()
      
      blocks.push({
        sampleType: cleanSampleType,
        content: content.trim()
      })
      
      console.log(`🧪 Sample block: ${cleanSampleType} (${content.length} chars)`)
    }
  }
  
  // If no blocks found, create a default SUERO block
  if (blocks.length === 0) {
    console.log('⚠️ No "Tipo de Muestra" blocks found, using entire text as SUERO')
    blocks.push({
      sampleType: 'SUERO',
      content: text
    })
  }
  
  return blocks
}

/**
 * ✅ Enhanced stopword filtering for metadata contamination
 */
function filterMetadataContamination(text: string): string {
  const stopwords = [
    'RUT', 'Folio', 'Nombre', 'Fecha de Ingreso', 'Fecha de Validación', 
    'Procedencia', 'Profesional Solicitante', 'Toma de Muestra',
    'LABORATORIO CLÍNICO', 'CORPORACIÓN MUNICIPAL', 'Calle Washington',
    'Fecha de Recepción', 'Método Analítico'
  ]
  
  let cleanedText = text
  
  // Remove lines that are primarily metadata
  const lines = text.split('\n')
  const filteredLines = lines.filter(line => {
    const hasStopwords = stopwords.some(stopword => line.includes(stopword))
    const hasLabData = /[A-ZÁÉÍÓÚÑ\s]{3,}\s*\d+.*\(.*\)/.test(line)
    
    // Keep line if it has lab data, even if it has some metadata
    return !hasStopwords || hasLabData
  })
  
  cleanedText = filteredLines.join('\n')
  
  console.log(`🧹 Filtered ${lines.length - filteredLines.length} metadata lines`)
  return cleanedText
}

/**
 * 🔧 Canonical mapping for duplicate/alias lab names
 * Handles variations like VITAMINA B vs VITAMINA B12, PLAQUETAS vs RECUENTO PLAQUETAS
 */
const CANONICAL_LAB_ALIASES: Record<string, string> = {
  // Vitamin variations
  'VITAMINA B': 'VITAMINA B12',
  'VITAMINA B 12': 'VITAMINA B12', 
  'VIT B12': 'VITAMINA B12',
  'COBALAMINA': 'VITAMINA B12',
  
  // Platelet variations
  'PLAQUETAS': 'RECUENTO PLAQUETAS',
  'RECUENTO DE PLAQUETAS': 'RECUENTO PLAQUETAS',
  'PLT': 'RECUENTO PLAQUETAS',
  
  // Alkaline phosphatase variations
  'ALCALINAS (ALP)': 'FOSF. ALCALINAS (ALP)',
  'FOSFATASA ALCALINA': 'FOSF. ALCALINAS (ALP)',
  'ALP': 'FOSF. ALCALINAS (ALP)',
  
  // Blood count variations
  'GLOBULOS ROJOS': 'RECUENTO GLOBULOS ROJOS',
  'ERITROCITOS': 'RECUENTO GLOBULOS ROJOS',
  'RBC': 'RECUENTO GLOBULOS ROJOS',
  'GLOBULOS BLANCOS': 'RECUENTO GLOBULOS BLANCOS',
  'LEUCOCITOS': 'RECUENTO GLOBULOS BLANCOS',
  'WBC': 'RECUENTO GLOBULOS BLANCOS',
  
  // Hemoglobin variations
  'HB': 'HEMOGLOBINA',
  'HGB': 'HEMOGLOBINA',
  
  // Hematocrit variations
  'HCT': 'HEMATOCRITO',
  'HCTO': 'HEMATOCRITO',
  
  // Glucose variations
  'GLICEMIA': 'GLICEMIA EN AYUNO (BASAL)',
  'GLUCOSA': 'GLICEMIA EN AYUNO (BASAL)',
  'GLICEMIA BASAL': 'GLICEMIA EN AYUNO (BASAL)',
  'GLUCOSE': 'GLICEMIA EN AYUNO (BASAL)',
  
  // HbA1c variations
  'HBA1C': 'HEMOGLOBINA GLICADA A1C',
  'HEMOGLOBINA GLICOSILADA': 'HEMOGLOBINA GLICADA A1C',
  'A1C': 'HEMOGLOBINA GLICADA A1C',
  
  // Thyroid variations
  'TSH': 'H. TIROESTIMULANTE (TSH)',
  'TIROTROPINA': 'H. TIROESTIMULANTE (TSH)',
  'T4 LIBRE': 'H. TIROXINA LIBRE (T4 LIBRE)',
  'FT4': 'H. TIROXINA LIBRE (T4 LIBRE)',
  
  // Creatinine variations
  'CREAT': 'CREATININA',
  'CREA': 'CREATININA',
  
  // Cholesterol variations
  'HDL': 'COLESTEROL HDL',
  'LDL': 'COLESTEROL LDL (CALCULO)',
  'COL TOTAL': 'COLESTEROL TOTAL',
  'CHOL': 'COLESTEROL TOTAL'
}

/**
 * ✅ ChatGPT Strategy: Normalization pipeline for better data quality
 */
function normalizeLabResult(result: ComprehensiveLabResult): ComprehensiveLabResult {
  // Normalize numeric results - convert commas to dots
  if (typeof result.resultado === 'string' && /^\d+,\d+$/.test(result.resultado)) {
    result.resultado = parseFloat(result.resultado.replace(',', '.'))
  }
  
  // Normalize units - standardize common variations
  if (result.unidad) {
    result.unidad = result.unidad
      .replace(/mgl?\/dl/gi, 'mg/dL')
      .replace(/ul?\/l/gi, 'U/L')
      .replace(/μui\/ml/gi, 'μUI/mL')
      .replace(/ng\/dl/gi, 'ng/dL')
      .replace(/pg\/ml/gi, 'pg/mL')
      .replace(/meq\/l/gi, 'mEq/L')
      .replace(/x10\^?(\d)/gi, 'x10^$1')
      .trim()
  }
  
  // Apply canonical aliases for exam names
  const upperExamen = result.examen.toUpperCase().trim()
  if (CANONICAL_LAB_ALIASES[upperExamen]) {
    result.examen = CANONICAL_LAB_ALIASES[upperExamen]
  } else {
    // Normalize exam names - handle common variations
    result.examen = result.examen
      .replace(/\s+/g, ' ')
      .replace(/GLICEMIA\s+EN\s+AYUNAS?/gi, 'GLICEMIA EN AYUNO (BASAL)')
      .replace(/GLUCOSA\s+EN\s+AYUNO/gi, 'GLICEMIA EN AYUNO (BASAL)')
      .replace(/HBA1C/gi, 'HEMOGLOBINA GLICADA A1C')
      .replace(/TSH/gi, 'H. TIROESTIMULANTE (TSH)')
      .replace(/T4\s+LIBRE/gi, 'H. TIROXINA LIBRE (T4 LIBRE)')
      .trim()
  }
  
  // Clean reference ranges - remove extra spaces and normalize format
  if (result.valorReferencia) {
    result.valorReferencia = result.valorReferencia
      .replace(/\s+/g, ' ')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1-$2')
      .replace(/menor\s+a\s*/gi, 'Menor a ')
      .replace(/mayor\s+a\s*/gi, 'Mayor a ')
      .replace(/hasta\s*/gi, 'Hasta ')
      .trim()
  }
  
  // Clean method descriptions
  if (result.metodo) {
    result.metodo = result.metodo
      .replace(/\s+/g, ' ')
      .replace(/i\.f\.c\.c/gi, 'I.F.C.C')
      .trim()
  }
  
  return result
}

/**
 * 🔧 Reference stitching - attach orphaned reference ranges to previous results
 * Scans for standalone ranges like "74-106" or "Menor a 30" and attaches them
 */
function stitchReferenceRanges(results: ComprehensiveLabResult[], originalText: string): ComprehensiveLabResult[] {
  console.log('🔧 Starting reference stitching...')
  
  // Find results missing reference ranges
  const resultsNeedingRanges = results.filter(r => !r.valorReferencia || r.valorReferencia.trim() === '')
  console.log(`📋 Found ${resultsNeedingRanges.length} results missing reference ranges`)
  
  if (resultsNeedingRanges.length === 0) return results
  
  // Common reference range patterns
  const rangePatterns = [
    // Numeric ranges: 74-106, 0,55-4,78, <150, >60
    /(?:^|\s)([<>]?\s*\d+(?:[,.]\d+)?\s*-\s*\d+(?:[,.]\d+)?)\s*(?:\s|$)/g,
    
    // Descriptive ranges: Menor a 30, Mayor a 60, Hasta 116
    /(?:^|\s)((?:Menor a|Mayor a|Hasta)\s+\d+(?:[,.]\d+)?)\s*(?:\s|$)/gi,
    
    // Normal indicators: Normal: < 150, Bajo: < 40
    /(?:^|\s)(Normal:?\s*[<>]?\s*\d+(?:[,.]\d+)?)\s*(?:\s|$)/gi,
    
    // Simple numeric only: just numbers that could be ranges
    /(?:^|\s)(\d+(?:[,.]\d+)?)\s*(?:\s|$)/g
  ]
  
  const lines = originalText.split('\n')
  let attachedCount = 0
  
  for (const result of resultsNeedingRanges) {
    // Find the line containing this result
    let resultLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(result.examen) && lines[i].includes(String(result.resultado))) {
        resultLineIndex = i
        break
      }
    }
    
    if (resultLineIndex === -1) continue
    
    // Look in the next 3 lines for a reference range
    for (let offset = 0; offset <= 3; offset++) {
      const lineIndex = resultLineIndex + offset
      if (lineIndex >= lines.length) break
      
      const line = lines[lineIndex]
      
      // Try each pattern
      for (const pattern of rangePatterns) {
        pattern.lastIndex = 0 // Reset regex
        let match
        const matches: RegExpExecArray[] = []
        while ((match = pattern.exec(line)) !== null) {
          matches.push(match)
        }
        
        for (const match of matches) {
          const potentialRange = match[1].trim()
          
          // Skip if it looks like a result value (has parentheses with units)
          if (line.includes(`${potentialRange}(`)) continue
          
          // Skip if it's probably a result (appears with lab name)
          if (/[A-ZÁÉÍÓÚÑ]{3,}.*\d+/.test(match[0])) continue
          
          // This looks like a standalone range
          if (potentialRange.length > 1 && !result.valorReferencia) {
            result.valorReferencia = potentialRange
            attachedCount++
            console.log(`🔗 Attached range "${potentialRange}" to ${result.examen}`)
            break
          }
        }
        if (result.valorReferencia) break
      }
      if (result.valorReferencia) break
    }
  }
  
  console.log(`🔗 Successfully attached ${attachedCount} reference ranges`)
  return results
}

/**
 * 🔧 Noise filtering - remove incomplete/invalid results
 * Drops results like "EN SANGRE" or "LIBRE)" that lack proper data
 */
function filterNoiseResults(results: ComprehensiveLabResult[]): ComprehensiveLabResult[] {
  console.log('🧹 Starting noise filtering...')
  
  const initialCount = results.length
  
  const filteredResults = results.filter(result => {
    // Must have a valid exam name (not just fragments)
    if (!result.examen || result.examen.length < 3) {
      console.log(`❌ Dropped short exam name: "${result.examen}"`)
      return false
    }
    
    // Must have a result value
    if (result.resultado === null || result.resultado === undefined || result.resultado === '') {
      console.log(`❌ Dropped result without value: "${result.examen}"`)
      return false
    }
    
    // For numeric results, must have plausible numeric value
    if (result.resultType === 'numeric') {
      const numericValue = typeof result.resultado === 'number' ? result.resultado : parseFloat(String(result.resultado))
      if (isNaN(numericValue)) {
        console.log(`❌ Dropped non-numeric result: "${result.examen}" = "${result.resultado}"`)
        return false
      }
    }
    
    // Should have a unit for numeric results (unless it's a ratio/percentage)
    if (result.resultType === 'numeric' && !result.unidad) {
      // Allow unitless results for ratios and percentages
      const allowedUnitless = [
        'CALCULO TOTAL/HDL', 'VFG', 'DENSIDAD', 'PH',
        'EOSINOFILOS', 'BASOFILOS', 'LINFOCITOS', 'MONOCITOS', 'NEUTROFILOS'
      ]
      
      if (!allowedUnitless.some(allowed => result.examen.includes(allowed))) {
        console.log(`❌ Dropped numeric result without unit: "${result.examen}" = ${result.resultado}`)
        return false
      }
    }
    
    // Filter obvious noise patterns
    const noisePatterns = [
      /^(EN SANGRE|LIBRE\)|SANGRE|TOTAL|CALCULO)$/i,
      /^[A-Z]{1,2}$/,  // Single/double letters
      /^\d+$/,         // Just numbers
      /^[\(\)\[\]]+$/  // Just brackets
    ]
    
    for (const pattern of noisePatterns) {
      if (pattern.test(result.examen)) {
        console.log(`❌ Dropped noise pattern: "${result.examen}"`)
        return false
      }
    }
    
    // Must have reasonable confidence
    if (result.confidence < 50) {
      console.log(`❌ Dropped low confidence result: "${result.examen}" (${result.confidence}%)`)
      return false
    }
    
    return true
  })
  
  console.log(`🧹 Noise filtering: ${initialCount} → ${filteredResults.length} (removed ${initialCount - filteredResults.length})`)
  return filteredResults
}

/**
 * Extract ALL lab results from Chilean PDF text with sample type segmentation
 */
export function extractAllLabResults(text: string, pages?: string[]): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  console.log('🔍 Starting comprehensive lab extraction with sample type segmentation...')
  
  // Clean header/footer contamination first
  const cleanedText = cleanHeaderFooterContamination(text, pages)
  
  // ✅ ChatGPT Strategy: Segment by "Tipo de Muestra" blocks
  const sampleTypeBlocks = segmentBySampleType(cleanedText)
  console.log(`🧪 Found ${sampleTypeBlocks.length} sample type blocks`)
  
  for (const block of sampleTypeBlocks) {
    console.log(`\n🔬 Processing ${block.sampleType} block (${block.content.length} chars)`)
    
    // Filter metadata contamination from this block
    const filteredContent = filterMetadataContamination(block.content)
    
    // Clean contaminated fields within this block
    const decontaminatedBlock = cleanContaminatedNormalRanges(filteredContent)
    
    // Apply all extraction strategies to this isolated block
    const blockResults = [
      // Primary: EXACT LAB NAME + RESULT extraction
      ...extractLabNamesAndResults(decontaminatedBlock, healthMarkerLookup),
      
      // Secondary: Dedicated parsers for complex sections
      ...parseLipidProfile(decontaminatedBlock, healthMarkerLookup),
      ...parseHemogramPanel(decontaminatedBlock, healthMarkerLookup),
      
      // Tertiary: Group-aware 5-column parsing
      ...extractLabsByGroupStructure(decontaminatedBlock, healthMarkerLookup),
      
      // Fallback: Legacy extraction strategies
      ...extractNumericResults(decontaminatedBlock, healthMarkerLookup, block.sampleType),
      ...extractEmbeddedMultiResults(decontaminatedBlock, healthMarkerLookup, block.sampleType),
      ...extractQualitativeResults(decontaminatedBlock, healthMarkerLookup, block.sampleType),
      ...extractCalculatedResults(decontaminatedBlock, healthMarkerLookup, block.sampleType),
      ...extractMicroscopyResults(decontaminatedBlock, healthMarkerLookup, block.sampleType),
      ...extractTabularResults(decontaminatedBlock, healthMarkerLookup, block.sampleType)
    ]
    
    // Set correct sample type for all results from this block
    blockResults.forEach(result => {
      if (result.tipoMuestra === 'SUERO' || !result.tipoMuestra) {
        result.tipoMuestra = block.sampleType
      }
    })
    
    console.log(`✅ Block ${block.sampleType}: ${blockResults.length} results`)
    results.push(...blockResults)
  }
  
  console.log(`🎯 Total before deduplication: ${results.length} results`)
  
  // Apply normalization pipeline to all results
  const normalizedResults = results.map(result => normalizeLabResult(result))
  console.log(`🔧 Applied normalization pipeline`)
  
  // Apply reference stitching to attach orphaned ranges
  const stitchedResults = stitchReferenceRanges(normalizedResults, cleanedText)
  console.log(`🔗 Applied reference stitching`)
  
  // Filter out noise and incomplete results
  const cleanResults = filterNoiseResults(stitchedResults)
  console.log(`🧹 Applied noise filtering`)
  
  // Remove duplicates with sample type context
  const uniqueResults = removeDuplicateResults(cleanResults)
  
  console.log(`🎯 Enhanced extraction pipeline completed: ${uniqueResults.length} high-quality results`)
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
  
  // CONSTRAINED patterns for standard numeric results - prevent greedy capture
  const valorReferenciaPattern = "(?:(?:Menor a|Mayor a|Hasta)\\s*[\\d.,<>\\s]+|[\\d.,]+(?:\\s*-\\s*[\\d.,]+)|Normal:?\\s*[\\s<>\\d.,]+|[\\d.,]+-[\\d.,]+)"
  
  const numericPatterns = [
    // Constrained standard pattern: GLICEMIA EN AYUNO (BASAL) 269 (mg/dL) [ * ] 74-106
    new RegExp(`^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s\\.()\\/-]{5,50})\\s+([\\d,]+(?:\\.\\d+)?)\\s+\\(([^)]+)\\)\\s*(\\[?\\s?\\*?\\s?\\]?)?\\s*(${valorReferenciaPattern})`, 'gm'),
    
    // Compact pattern with constrained reference: CREATININA0,91(mg/dL) 0,55-1,02
    new RegExp(`([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s\\.()\\/-]{5,40})([\\d,]+(?:\\.\\d+)?)\\(([^)]+)\\)\\s*(\\[?\\s?\\*?\\s?\\]?)?\\s*(${valorReferenciaPattern})`, 'g'),
    
    // Spaced pattern with constrained range: HEMOGLOBINA    14.2    (g/dL)    12.3-15.3
    new RegExp(`^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s\\.()\\/-]{5,50})\\s{2,}([\\d,]+(?:\\.\\d+)?)\\s+\\(([^)]+)\\)\\s+(${valorReferenciaPattern})`, 'gm'),
    
    // Enhanced embedded patterns - stop at next ALL-CAPS lab name
    /(COLESTEROL TOTAL|COLESTEROL HDL|COLESTEROL LDL|HEMOGLOBINA|HEMATOCRITO|VCM|HCM|CHCM|PLAQUETAS|LEUCOCITOS|NEUTROFILOS|LINFOCITOS|MONOCITOS|EOSINOFILOS|BASOFILOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-ZÁÉÍÓÚÑ]*?)(?=[A-ZÁÉÍÓÚÑ]{3,}|$)/gi,
    
    // Blood count embedded - stop before next lab
    /(RECUENTO GLOBULOS [A-Z]+|HEMATOCRITO|V\.C\.M|H\.C\.M|C\.H\.C\.M|RECUENTO PLAQUETAS|RECUENTO GLOBULOS BLANCOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-ZÁÉÍÓÚÑ]*?)(?=[A-ZÁÉÍÓÚÑ]{3,}|$)/gi,
    
    // Electrolytes embedded - constrained to not capture next lab
    /(SODIO|POTASIO|CLORO|BICARBONATO)\s*(?:\([^)]+\))?\s*(?:EN SANGRE)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-ZÁÉÍÓÚÑ]*?)(?=[A-ZÁÉÍÓÚÑ]{3,}|$)/gi
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
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,40})\s+(No se observan|Escasa cantidad|Abundante|Moderada cantidad|Presentes|Ausentes)\s*$/gm,
    
    // Enhanced patterns for missing qualitative results
    /([A-ZÁÉÍÓÚÑ\s]{3,40})\s+(No procesado|No procesado por falta de insumos|Procesado|Normal|Anormal)\s*([^\n]*)/gm,
    
    // Color and microscopy patterns
    /([A-ZÁÉÍÓÚÑ\s]{3,40})\s+(Amarillo claro|Amarillo|Transparente|Opaco|Cristalino)\s*([^\n]*)/gm
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
 * Extract labs using Chilean-specific format specifications
 * Uses exact lab name matching with expected formats
 */
function extractLabsWithSpecificFormats(text: string): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  const lines = text.split('\n')
  
  // Process each line looking for specific lab formats
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.length < 3) continue
    
    // Check each known Chilean lab format
    for (const [labName, format] of Object.entries(CHILEAN_LAB_FORMATS)) {
      if (line.includes(labName)) {
        console.log(`🎯 Found specific lab: ${labName}`)
        
        // Extract result based on lab-specific format
        const labResult = extractSpecificLabFormat(line, labName, format, i, lines)
        if (labResult) {
          console.log(`✅ Extracted specific: ${labResult.examen} = ${labResult.resultado}`)
          results.push(labResult)
        }
        break // Only match one lab per line
      }
    }
  }
  
  return results
}

/**
 * Extract a specific lab using its known format
 */
function extractSpecificLabFormat(
  line: string,
  labName: string,
  format: ChileanLabFormat,
  lineIndex: number,
  allLines: string[]
): ComprehensiveLabResult | null {
  
  // Different extraction patterns based on lab type
  switch (format.type) {
    case 'numeric':
      return extractNumericLabFormat(line, labName, format, lineIndex, allLines)
    case 'observation':
      return extractObservationLabFormat(line, labName, format, lineIndex, allLines)
    case 'qualitative':
      return extractQualitativeLabFormat(line, labName, format, lineIndex, allLines)
    case 'calculated':
      return extractCalculatedLabFormat(line, labName, format, lineIndex, allLines)
    default:
      return null
  }
}

/**
 * Extract numeric lab format: LABNAME RESULT (UNIT) RANGE METHOD
 */
function extractNumericLabFormat(
  line: string,
  labName: string,
  format: ChileanLabFormat,
  lineIndex: number,
  allLines: string[]
): ComprehensiveLabResult | null {
  
  // Look for the result after the lab name
  const afterLabName = line.substring(line.indexOf(labName) + labName.length)
  
  // Patterns for numeric results
  const patterns = [
    // Standard: 269 (mg/dL) [ * ] 74-106 Method
    /(\d+(?:,\d+)?(?:\.\d+)?)\s*\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s+([A-Za-z].{5,}))?$/,
    
    // Connected: 269(mg/dL)[ * ]74-106 Method
    /(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)$/,
    
    // Multi-line (check next lines for continuation)
    /(\d+(?:,\d+)?(?:\.\d+)?)\s*\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?(.*)$/
  ]
  
  for (const pattern of patterns) {
    const match = afterLabName.match(pattern)
    if (match) {
      let [, resultado, unidad, abnormalMarker = '', valorReferencia, metodo = ''] = match
      
      // Handle multi-line methods (check next lines)
      if (!metodo && format.method && lineIndex + 1 < allLines.length) {
        const nextLine = allLines[lineIndex + 1].trim()
        if (nextLine.includes(format.method.split(' ')[0])) {
          metodo = nextLine
        }
      }
      
      // Use expected values from format if missing
      if (!metodo && format.method) metodo = format.method
      if (!unidad && format.unit) unidad = format.unit
      
      return {
        examen: labName,
        resultado: parseFloat(resultado.replace(',', '.')),
        unidad: unidad.trim(),
        valorReferencia: valorReferencia.trim() || format.normalRange || '',
        metodo: metodo.trim() || format.method || '',
        tipoMuestra: detectSampleType(allLines, lineIndex),
        isAbnormal: abnormalMarker.includes('*'),
        abnormalIndicator: abnormalMarker.trim(),
        systemCode: mapToSystemCode(labName),
        category: format.category,
        priority: format.priority,
        confidence: 98, // High confidence for specific format matching
        position: lineIndex,
        context: line,
        resultType: 'numeric'
      }
    }
  }
  
  return null
}

/**
 * Extract observation lab format: LABNAME OBSERVATION
 */
function extractObservationLabFormat(
  line: string,
  labName: string,
  format: ChileanLabFormat,
  lineIndex: number,
  allLines: string[]
): ComprehensiveLabResult | null {
  
  const afterLabName = line.substring(line.indexOf(labName) + labName.length).trim()
  
  // Look for expected observation values
  if (format.expectedValues) {
    for (const expectedValue of format.expectedValues) {
      if (afterLabName.includes(expectedValue)) {
        return {
          examen: labName,
          resultado: expectedValue,
          unidad: null,
          valorReferencia: format.normalRange || '',
          metodo: format.method || '',
          tipoMuestra: detectSampleType(allLines, lineIndex),
          isAbnormal: false, // Observations are usually not marked as abnormal
          abnormalIndicator: '',
          systemCode: mapToSystemCode(labName),
          category: format.category,
          priority: format.priority,
          confidence: 98,
          position: lineIndex,
          context: line,
          resultType: 'qualitative'
        }
      }
    }
  }
  
  // Fallback: extract first word after lab name
  const words = afterLabName.split(/\s+/)
  if (words.length > 0 && words[0].length > 2) {
    return {
      examen: labName,
      resultado: words[0],
      unidad: null,
      valorReferencia: format.normalRange || '',
      metodo: format.method || '',
      tipoMuestra: detectSampleType(allLines, lineIndex),
      isAbnormal: false,
      abnormalIndicator: '',
      systemCode: mapToSystemCode(labName),
      category: format.category,
      priority: format.priority,
      confidence: 95,
      position: lineIndex,
      context: line,
      resultType: 'qualitative'
    }
  }
  
  return null
}

/**
 * Extract qualitative lab format: LABNAME RESULT (UNIT) where result is text
 */
function extractQualitativeLabFormat(
  line: string,
  labName: string,
  format: ChileanLabFormat,
  lineIndex: number,
  allLines: string[]
): ComprehensiveLabResult | null {
  
  const afterLabName = line.substring(line.indexOf(labName) + labName.length).trim()
  
  // Look for expected qualitative values
  if (format.expectedValues) {
    for (const expectedValue of format.expectedValues) {
      if (afterLabName.includes(expectedValue)) {
        return {
          examen: labName,
          resultado: expectedValue,
          unidad: format.unit || null,
          valorReferencia: format.normalRange || '',
          metodo: format.method || '',
          tipoMuestra: detectSampleType(allLines, lineIndex),
          isAbnormal: expectedValue !== 'Negativo' && expectedValue !== 'No reactivo',
          abnormalIndicator: expectedValue !== 'Negativo' && expectedValue !== 'No reactivo' ? '[*]' : '',
          systemCode: mapToSystemCode(labName),
          category: format.category,
          priority: format.priority,
          confidence: 98,
          position: lineIndex,
          context: line,
          resultType: 'qualitative'
        }
      }
    }
  }
  
  return null
}

/**
 * Extract calculated lab format: LABNAME RESULT
 */
function extractCalculatedLabFormat(
  line: string,
  labName: string,
  format: ChileanLabFormat,
  lineIndex: number,
  allLines: string[]
): ComprehensiveLabResult | null {
  
  const afterLabName = line.substring(line.indexOf(labName) + labName.length).trim()
  
  // Look for numeric result
  const numericMatch = afterLabName.match(/(\d+(?:,\d+)?(?:\.\d+)?)/)
  if (numericMatch) {
    return {
      examen: labName,
      resultado: parseFloat(numericMatch[1].replace(',', '.')),
      unidad: format.unit || null,
      valorReferencia: format.normalRange || '',
      metodo: format.method || '',
      tipoMuestra: detectSampleType(allLines, lineIndex),
      isAbnormal: false, // Calculated values need specific logic
      abnormalIndicator: '',
      systemCode: mapToSystemCode(labName),
      category: format.category,
      priority: format.priority,
      confidence: 98,
      position: lineIndex,
      context: line,
      resultType: 'calculated'
    }
  }
  
  return null
}

/**
 * Detect sample type from surrounding context
 */
function detectSampleType(allLines: string[], lineIndex: number): string {
  // Look backwards for sample type indicators
  for (let i = Math.max(0, lineIndex - 5); i < lineIndex; i++) {
    const line = allLines[i]
    if (line.includes('Tipo de Muestra : SUERO')) return 'SUERO'
    if (line.includes('Tipo de Muestra : SANGRE TOTAL')) return 'SANGRE TOTAL + E.D.T.A.'
    if (line.includes('Tipo de Muestra : ORINA')) return 'ORINA'
  }
  return 'SUERO' // Default
}

/**
 * Map lab name to system code
 */
function mapToSystemCode(labName: string): string | null {
  const mapping: Record<string, string> = {
    // Glucose
    'GLICEMIA EN AYUNO (BASAL)': 'glucose_fasting',
    'HEMOGLOBINA GLICADA A1C': 'hba1c',
    
    // Thyroid
    'H. TIROESTIMULANTE (TSH)': 'tsh',
    'H. TIROXINA LIBRE (T4 LIBRE)': 't4_free',
    
    // Liver
    'BILIRRUBINA TOTAL': 'bilirubin_total',
    'BILIRRUBINA DIRECTA': 'bilirubin_direct',
    'GOT (A.S.T)': 'ast',
    'GPT (A.L.T)': 'alt',
    'FOSF. ALCALINAS (ALP)': 'alkaline_phosphatase',
    'G.G.T.': 'ggt',
    'ALBÚMINA': 'albumin',
    
    // Kidney
    'CREATININA': 'creatinine',
    'VFG': 'egfr',
    'NITROGENO UREICO (BUN)': 'bun',
    'UREMIA (CALCULO)': 'urea_calculated',
    'ÁCIDO URICO (URICEMIA)': 'uric_acid',
    'MICROALBUMINURIA AISLADA': 'microalbumin',
    'CREATINURIA AISLADA': 'creatinine_urine',
    'MAU-RAC (calculo)': 'albumin_creatinine_ratio',
    
    // Electrolytes
    'SODIO (Na) EN SANGRE': 'sodium',
    'POTASIO (K) EN SANGRE': 'potassium',
    'CLORO (Cl) EN SANGRE': 'chloride',
    
    // Lipids
    'TRIGLICERIDOS': 'triglycerides',
    'COLESTEROL TOTAL': 'cholesterol_total',
    'COLESTEROL HDL': 'cholesterol_hdl',
    'COLESTEROL LDL (CALCULO)': 'cholesterol_ldl',
    'COLESTEROL VLDL (CALCULO)': 'cholesterol_vldl',
    'CALCULO TOTAL/HDL': 'cholesterol_ratio',
    
    // Vitamins
    'VITAMINA B12': 'vitamin_b12',
    
    // Blood Count
    'HEMOGLOBINA': 'hemoglobin',
    'HEMATOCRITO': 'hematocrit',
    'RECUENTO GLOBULOS ROJOS': 'rbc',
    'RECUENTO GLOBULOS BLANCOS': 'wbc',
    'RECUENTO PLAQUETAS': 'platelets',
    'V.C.M': 'mcv',
    'H.C.M': 'mch',
    'C.H.C.M': 'mchc',
    
    // Blood Differential
    'EOSINOFILOS': 'eosinophils',
    'BASOFILOS': 'basophils',
    'LINFOCITOS': 'lymphocytes',
    'MONOCITOS': 'monocytes',
    'NEUTROFILOS': 'neutrophils',
    'BACILIFORMES': 'bands',
    'JUVENILES': 'juvenile',
    'MIELOCITOS': 'myelocytes',
    'PROMIELOCITOS': 'promyelocytes',
    'BLASTOS': 'blasts',
    'V.H.S.': 'esr',
    
    // Urine Complete
    'COLOR': 'urine_color',
    'ASPECTO': 'urine_appearance',
    'PH': 'urine_ph',
    'DENSIDAD': 'urine_density',
    'PROTEINAS': 'urine_protein',
    'GLUCOSA': 'urine_glucose',
    'CETONAS': 'urine_ketones',
    'SANGRE EN ORINA': 'urine_blood',
    'UROBILINOGENO': 'urine_urobilinogen',
    'BILIRRUBINA': 'urine_bilirubin',
    'NITRITOS': 'urine_nitrites',
    'LEUCOCITOS': 'urine_leukocytes',
    
    // Urine Sediment
    'HEMATIES POR CAMPO': 'urine_rbc',
    'LEUCOCITOS POR CAMPO': 'urine_wbc',
    'CELULAS EPITELIALES': 'urine_epithelial_cells',
    'MUCUS': 'urine_mucus',
    'CRISTALES': 'urine_crystals',
    'CILINDROS': 'urine_casts',
    'BACTERIAS': 'urine_bacteria',
    
    // Serology
    'R.P.R.': 'rpr'
  }
  return mapping[labName] || null
}

/**
 * Extract labs using Chilean 5-column group structure
 * LAB NAME | Result | Unit | Normal Range | Method
 */
function extractLabsByGroupStructure(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Known lab group headers in Chilean reports
  const labGroups = [
    'ELECTROLITOS PLASMATICOS',
    'PERFIL LIPIDICO', 
    'HEMOGRAMA - VHS',
    'ORINA COMPLETA',
    'SEDIMENTO DE ORINA',
    'PERFIL BIOQUIMICO',
    'FUNCION HEPATICA',
    'FUNCION RENAL',
    'PERFIL TIROIDEO'
  ]
  
  // Split text into lines for processing
  const lines = text.split('\n')
  let currentSampleType = 'SUERO' // Default
  let currentGroup = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.length < 3) continue
    
    // Check for sample type
    const sampleMatch = line.match(/Tipo de Muestra\s*:\s*([A-Z\s\.+]+)/)
    if (sampleMatch) {
      currentSampleType = sampleMatch[1].trim()
      console.log(`📋 Found sample type: ${currentSampleType}`)
      continue
    }
    
    // Check for lab group headers
    const groupMatch = labGroups.find(group => line.includes(group))
    if (groupMatch) {
      currentGroup = groupMatch
      console.log(`📊 Found lab group: ${currentGroup}`)
      continue
    }
    
    // Check if line starts with ALL-CAPS lab name (handle connected words)
    // Pattern 1: Normal spacing - GLICEMIA EN AYUNO (BASAL) 269 (mg/dL)
    const normalMatch = line.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{3,50})\s+(.*)$/)
    
    // Pattern 2: Connected words - GLICEMIA EN AYUNO (BASAL)269(mg/dL) 
    const connectedMatch = line.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{3,50})(\d+(?:,\d+)?(?:\.\d+)?.*)$/)
    
    let labMatch = null
    let labName = ''
    let restOfLine = ''
    
    if (normalMatch && isAllCapsLabName(normalMatch[1])) {
      labMatch = normalMatch
      labName = normalMatch[1].trim()
      restOfLine = normalMatch[2]
    } else if (connectedMatch && isAllCapsLabName(connectedMatch[1])) {
      labMatch = connectedMatch
      labName = connectedMatch[1].trim()
      restOfLine = connectedMatch[2] // This starts with the number
      console.log(`🔗 Found connected words: "${labName}" + "${restOfLine}"`)
    }
    
    if (labMatch) {
      // Parse the 5-column structure: Result | Unit | Normal Range | Method
      const labResult = parse5ColumnStructure(labName, restOfLine, currentSampleType, healthMarkerLookup, i, line)
      
      if (labResult) {
        console.log(`✅ Extracted 5-column: ${labResult.examen} = ${labResult.resultado}`)
        results.push(labResult)
      }
    }
    
    // Also look for embedded labs in normal range fields (like TRIGLICERIDOS example)
    if (line.includes('(mg/dL)') || line.includes('(%)') || line.includes('(U/L)')) {
      const embeddedResults = extractEmbeddedFromLine(line, currentSampleType, healthMarkerLookup, i)
      results.push(...embeddedResults)
    }
  }
  
  return results
}

/**
 * Check if text is an ALL-CAPS lab name
 */
function isAllCapsLabName(text: string): boolean {
  // Must be mostly uppercase letters, can have spaces, dots, parentheses, hyphens
  const cleanText = text.replace(/[\s\.\(\)\/\-]/g, '')
  if (cleanText.length < 3) return false
  
  const uppercaseCount = (cleanText.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length
  const totalLetters = (cleanText.match(/[A-ZÁÉÍÓÚÑa-záéíóúñ]/g) || []).length
  
  // At least 80% uppercase letters
  return totalLetters > 0 && (uppercaseCount / totalLetters) >= 0.8
}

/**
 * Parse Chilean 5-column lab structure: Result | Unit | Normal Range | Method
 */
function parse5ColumnStructure(
  labName: string,
  restOfLine: string,
  sampleType: string,
  healthMarkerLookup: Map<string, HealthMarkerMapping>,
  lineIndex: number,
  fullLine: string
): ComprehensiveLabResult | null {
  
  // Pattern to match: RESULT (UNIT) [*] NORMAL_RANGE METHOD
  const patterns = [
    // Standard: 269 (mg/dL) [ * ] 74 - 106 Hexoquinasa
    /^(\d+(?:,\d+)?(?:\.\d+)?)\s*\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s+([A-Za-z].{3,}))?$/,
    
    // Compact connected: 269(mg/dL)[ * ] 74-106 Hexoquinasa  
    /^(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s+([A-Za-z].{3,}))?$/,
    
    // Spaced: 269    (mg/dL)    [ * ] 74 - 106    Hexoquinasa
    /^(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s+(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s{2,}([A-Za-z].{3,}))?$/,
    
    // Connected start - handles when restOfLine starts directly with number: 269(mg/dL)[*]74-106 Hexoquinasa
    /^(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(\[?\s?\*?\s?\]?)(.+?)$/
  ]
  
  for (const pattern of patterns) {
    const match = restOfLine.match(pattern)
    if (match) {
      const [, resultado, unidad, abnormalMarker = '', valorReferencia, metodo = ''] = match
      
      // Clean values
      const cleanResultado = parseFloat(resultado.replace(',', '.'))
      const cleanUnidad = unidad.trim()
      const cleanReferencia = valorReferencia.trim()
      const cleanMetodo = metodo.trim()
      const isAbnormal = abnormalMarker.includes('*')
      
      return createLabResult({
        examen: labName,
        resultado: cleanResultado,
        unidad: cleanUnidad,
        valorReferencia: cleanReferencia || null,
        metodo: cleanMetodo || null,
        tipoMuestra: sampleType,
        isAbnormal,
        abnormalIndicator: abnormalMarker.trim(),
        resultType: 'numeric',
        confidence: 95,
        position: lineIndex,
        context: fullLine,
        healthMarkerLookup
      })
    }
  }
  
  return null
}

/**
 * Extract embedded labs from a single line (like the TRIGLICERIDOS example)
 */
function extractEmbeddedFromLine(
  line: string,
  sampleType: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>,
  lineIndex: number
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Pattern for embedded results: COLESTEROL TOTAL213(mg/dL)
  const embeddedPattern = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\(\)]{5,40})(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)/g
  
  let match
  while ((match = embeddedPattern.exec(line)) !== null) {
    const [fullMatch, examen, resultado, unidad] = match
    
    const labResult = createLabResult({
      examen: examen.trim(),
      resultado: parseFloat(resultado.replace(',', '.')),
      unidad: unidad.trim(),
      valorReferencia: null,
      metodo: null,
      tipoMuestra: sampleType,
      isAbnormal: line.includes('[*]') || line.includes('[ * ]'),
      abnormalIndicator: line.includes('[*]') ? '[*]' : '',
      resultType: 'numeric',
      confidence: 90,
      position: lineIndex,
      context: fullMatch,
      healthMarkerLookup
    })
    
    results.push(labResult)
  }
  
  return results
}

/**
 * Extract embedded multi-results from complex text blocks
 * Handles cases like: COLESTEROL TOTAL213(mg/dL)Normal: < 200 COLESTEROL HDL53(mg/dL)Bajo
 */
function extractEmbeddedMultiResults(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>, 
  tipoMuestra: string
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Pattern to extract multiple embedded results from complex blocks
  const embeddedPatterns = [
    // Blood count embedded results: HEMATOCRITO42,0(%) 35-47 HEMOGLOBINA14,2(g/dL) 12,3-15,3
    /(HEMATOCRITO|HEMOGLOBINA|V\.C\.M|H\.C\.M|C\.H\.C\.M|RECUENTO PLAQUETAS|RECUENTO GLOBULOS [A-Z]+)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*([0-9\-\.,\s<>]+)?/gi,
    
    // Enhanced lipid panel with cleaner extraction: COLESTEROL TOTAL213(mg/dL)Bajo (deseable): < 200
    /(COLESTEROL TOTAL|COLESTEROL HDL|COLESTEROL LDL \(CALCULO\)|COLESTEROL VLDL \(CALCULO\))(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^C]*?)(?=COLESTEROL|$)/gi,
    
    // Cholesterol calculation ratio: CALCULO TOTAL/HDL4,02
    /(CALCULO TOTAL\/HDL)(\d+(?:,\d+)?(?:\.\d+)?)(?:\s|$)/gi,
    
    // Blood differential: EOSINOFILOS3(%) 2-4 BASOFILOS1(%) 0-1 LINFOCITOS32(%)
    /(EOSINOFILOS|BASOFILOS|LINFOCITOS|MONOCITOS|NEUTROFILOS|BACILIFORMES|JUVENILES|MIELOCITOS|PROMIELOCITOS|BLASTOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*([0-9\-\s]*)?/gi,
    
    // Electrolytes: SODIO (Na) EN SANGRE136,7(mEq/L) 136-145 POTASIO (K) EN SANGRE5,0(mEq/L)
    /(SODIO|POTASIO|CLORO)\s*(?:\([^)]+\))?\s*EN SANGRE(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*([0-9\-\s,\.]*)?/gi,
    
    // Kidney function: VFG64,4(mL/min/1.73 mt²) Mayor a 60 UREMIA (CALCULO)38,5(mg/dL)
    /(VFG|UREMIA \(CALCULO\)|CREATINURIA [A-Z]+|MAU-RAC \(calculo\))(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*([^A-Z]*)?/gi,
    
    // HbA1c and glycated hemoglobin patterns (critical for diabetes!)
    /(HEMOGLOBINA GLICOSILADA|HBA1C|Hb A1c)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-Z]*)/gi
  ]
  
  for (const pattern of embeddedPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, examen, resultado, unidad, valorReferencia = ''] = match
      
      if (isAlreadyExtracted(results, examen)) continue
      
      // Clean and parse values
      const cleanExamen = examen.replace(/\(CALCULO\)/, '').trim()
      let cleanResultado: number | string = parseFloat(resultado.replace(',', '.'))
      let cleanUnidad = unidad ? unidad.trim() : ''
      let cleanReferencia = valorReferencia ? valorReferencia.trim() : ''
      
      // Special handling for CALCULO TOTAL/HDL pattern (no unit in parentheses)
      if (examen.includes('CALCULO TOTAL/HDL')) {
        cleanResultado = parseFloat(resultado.replace(',', '.'))
        cleanUnidad = 'ratio'
        cleanReferencia = ''
      }
      
      const labResult = createLabResult({
        examen: cleanExamen,
        resultado: cleanResultado,
        unidad: cleanUnidad,
        valorReferencia: cleanReferencia || null,
        metodo: null,
        tipoMuestra,
        isAbnormal: text.includes('[*]') || text.includes('[ * ]'),
        abnormalIndicator: text.includes('[*]') ? '[*]' : '',
        resultType: 'numeric',
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
 * Clean contaminated normal range fields that contain embedded lab results
 * Example: TRIGLICERIDOS136(mg/dL)Normal: < 150Enzimático, Punto Final COLESTEROL TOTAL213(mg/dL)
 * Should be cleaned to extract individual labs without contamination
 */
function cleanContaminatedNormalRanges(text: string): string {
  let cleanedText = text
  
  console.log('🧹 Cleaning contaminated normal range fields...')
  
  // Pattern for contaminated fields with embedded results
  // TRIGLICERIDOS136(mg/dL)Normal: < 150Enzimático, Punto Final Límite alto: 150–199 Alto: 200-499 Muy alto: > 500 COLESTEROL TOTAL213(mg/dL)
  const contaminatedPatterns = [
    // Lipid panel contamination - extract individual results and clean ranges
    /(TRIGLICERIDOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=COLESTEROL TOTAL|$)/g,
    /(COLESTEROL TOTAL)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=COLESTEROL HDL|$)/g,
    /(COLESTEROL HDL)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=COLESTEROL LDL|$)/g,
    /(COLESTEROL LDL \(CALCULO\))(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=COLESTEROL VLDL|$)/g,
    /(COLESTEROL VLDL \(CALCULO\))(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=CALCULO TOTAL|$)/g,
    
    // Blood count contamination - clean ranges with embedded patient info
    /(RECUENTO GLOBULOS ROJOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=HEMATOCRITO|$)/g,
    /(HEMATOCRITO)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=HEMOGLOBINA|$)/g,
    /(HEMOGLOBINA)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=V\.C\.M|RECUENTO|$)/g,
    
    // Electrolytes contamination - clean ranges with patient info
    /(SODIO.{0,20}EN SANGRE)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=POTASIO|$)/g,
    /(POTASIO.{0,20}EN SANGRE)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=CLORO|$)/g,
    
    // Kidney function contamination
    /(UREMIA \(CALCULO\))(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=RUT|Fecha|$)/g,
    /(CREATININA)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)(.*?)(?=VFG|RUT|$)/g
  ]
  
  for (const pattern of contaminatedPatterns) {
    cleanedText = cleanedText.replace(pattern, (match, labName, result, unit, contamination) => {
      // Extract only the clean normal range, remove patient info and other embedded data
      let cleanRange = ''
      
      // Extract just the normal range part, exclude patient info
      const rangePart = contamination.match(/^([^R]*?)(?=RUT|Fecha|Método|$)/)
      if (rangePart) {
        cleanRange = rangePart[1]
          .replace(/Enzimático.*?$/g, '') // Remove method descriptions
          .replace(/Límite alto:.*?$/g, '') // Remove extended ranges
          .replace(/Alto:.*?$/g, '') // Remove risk categories
          .replace(/Muy alto:.*?$/g, '') // Remove risk categories
          .replace(/Bajo.*?$/g, '') // Remove risk categories
          .replace(/Moderado.*?$/g, '') // Remove risk categories
          .replace(/Normal:?\s*/g, '') // Clean "Normal:" prefix
          .replace(/\s{2,}/g, ' ') // Normalize spaces
          .trim()
      }
      
      // Return clean format: LAB NAME RESULT (UNIT) CLEAN_RANGE
      return `${labName} ${result} (${unit}) ${cleanRange}`.trim()
    })
  }
  
  console.log(`🧹 Cleaned contaminated normal ranges`)
  return cleanedText
}

/**
 * Clean header/footer contamination from multi-page PDFs
 */
function cleanHeaderFooterContamination(text: string, pages?: string[]): string {
  let cleanedText = text
  
  // Generic header/footer patterns to remove (works for any patient)
  const contaminationPatterns = [
    // Generic patient info block - matches any patient data
    /RUT\s*:\s*[\d.Kk-]+\s+Folio\s*:\s*\d+\s+Profesional Solicitante:\s*:\s*[^F]*?Fecha de Ingreso[^P]*?Procedencia\s*:\s*[A-ZÁÉÍÓÚÑ\s]+/g,
    
    // Generic lab address (any municipal lab)
    /LABORATORIO CLÍNICO CORPORACIÓN MUNICIPAL[^F]*?Valparaiso/g,
    
    // Generic reception date pattern
    /Fecha de Recepción en el Laboratorio:\s*[\d\/]+\s+[\d:]+/g,
    
    // Generic validation date embedded in results
    /Fecha de Validación\s*:\s*[\d\/]+\s+[\d:]+/g,
    
    // Generic page headers with timestamps
    /RUT\s*:\s*[\d.Kk-]+[\s\S]*?Procedencia\s*:\s*[A-ZÁÉÍÓÚÑ\s]+/g,
    
    // Method analytical contamination 
    /Método Analítico\s*:\s*[A-Za-z\s,]+\s+RUT/g,
    
    // Remove standalone institution names
    /CORPORACIÓN MUNICIPAL VALPARAISO/g
  ]
  
  // Remove contamination patterns
  for (const pattern of contaminationPatterns) {
    cleanedText = cleanedText.replace(pattern, ' ')
  }
  
  // Clean up multiple spaces and normalize
  cleanedText = cleanedText.replace(/\s{3,}/g, ' ').trim()
  
  console.log(`🧹 Cleaned ${text.length - cleanedText.length} characters of header/footer contamination`)
  
  return cleanedText
}

/**
 * Extract sample type from section text with improved detection
 */
function extractSampleType(text: string): string {
  const sampleTypes = [
    'SANGRE TOTAL + E.D.T.A.',
    'SANGRE TOTAL',
    'SUERO',
    'ORINA',
    'Suero y plasma (heparina de litio)'
  ]
  
  // Look for explicit sample type declarations
  for (const sampleType of sampleTypes) {
    if (text.includes(`Tipo de Muestra : ${sampleType}`) || 
        text.includes(`Tipo Muestra : ${sampleType}`) ||
        text.includes(`Muestra : ${sampleType}`)) {
      return sampleType
    }
  }
  
  // Infer sample type based on lab context
  if (text.includes('HEMOGRAMA') || 
      text.includes('RECUENTO GLOBULOS') || 
      text.includes('HEMATOCRITO') ||
      text.includes('LEUCOCITOS') ||
      text.includes('NEUTROFILOS') ||
      text.includes('LINFOCITOS')) {
    return 'SANGRE TOTAL + E.D.T.A.'
  }
  
  if (text.includes('ORINA') || 
      text.includes('DENSIDAD') ||
      text.includes('HEMATIES POR CAMPO') ||
      text.includes('LEUCOCITOS POR CAMPO')) {
    return 'ORINA'
  }
  
  return 'SUERO' // Default for biochemistry
}

/**
 * Improved sample type detection for lab results
 */
function detectSampleTypeForResult(labName: string, context: string): string {
  // Blood count markers always use SANGRE TOTAL + E.D.T.A.
  const bloodCountMarkers = [
    'HEMOGLOBINA', 'HEMATOCRITO', 'RECUENTO GLOBULOS', 'V.C.M', 'H.C.M', 'C.H.C.M',
    'EOSINOFILOS', 'BASOFILOS', 'LINFOCITOS', 'MONOCITOS', 'NEUTROFILOS',
    'BACILIFORMES', 'JUVENILES', 'MIELOCITOS', 'PROMIELOCITOS', 'BLASTOS'
  ]
  
  if (bloodCountMarkers.some(marker => labName.includes(marker))) {
    return 'SANGRE TOTAL + E.D.T.A.'
  }
  
  // Urine markers
  const urineMarkers = [
    'COLOR', 'ASPECTO', 'DENSIDAD', 'PROTEINAS', 'GLUCOSA', 'CETONAS', 
    'HEMATIES POR CAMPO', 'LEUCOCITOS POR CAMPO', 'MICROALBUMINURIA',
    'UROBILINOGENO', 'CRISTALES', 'CILINDROS', 'BACTERIAS'
  ]
  
  if (urineMarkers.some(marker => labName.includes(marker))) {
    return 'ORINA'
  }
  
  // Extract from context if available
  return extractSampleType(context)
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
 * 🔧 Remove duplicate results with sample type context
 * Keeps results separate by (exam + sample_type) to avoid inappropriate deduplication
 * Example: "Creatinina" in SUERO vs ORINA should be kept separately
 */
function removeDuplicateResults(results: ComprehensiveLabResult[]): ComprehensiveLabResult[] {
  const uniqueResults: ComprehensiveLabResult[] = []
  const seenExamenes = new Set<string>()
  
  // Sort by confidence (highest first)
  results.sort((a, b) => b.confidence - a.confidence)
  
  for (const result of results) {
    // Create composite key: exam + sample type
    const compositeKey = `${result.examen.toUpperCase().trim()}|${result.tipoMuestra || 'UNKNOWN'}`
    
    if (!seenExamenes.has(compositeKey)) {
      seenExamenes.add(compositeKey)
      uniqueResults.push(result)
    } else {
      console.log(`🔄 Skipped duplicate: ${result.examen} (${result.tipoMuestra})`)
    }
  }
  
  console.log(`🔧 Deduplication: ${results.length} → ${uniqueResults.length} results`)
  return uniqueResults
}