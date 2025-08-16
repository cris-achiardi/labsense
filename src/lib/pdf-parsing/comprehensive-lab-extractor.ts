/**
 * Comprehensive Lab Results Extraction for Chilean Lab Reports
 * Handles ALL 68+ health markers including qualitative results
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
    category: 'vitamins',
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
      new RegExp(`(${escapedLabName})\\s+(\\d+(?:,\\d+)?(?:\\.\\d+)?)`, 'g'),
      
      // Pattern 2: Exact lab name connected to number: GLICEMIA EN AYUNO (BASAL)269
      new RegExp(`(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)`, 'g'),
      
      // Pattern 3: Exact lab name with unit in parentheses: HEMOGLOBINA14,2(g/dL)
      new RegExp(`(${escapedLabName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\([^)]+\\)`, 'g'),
      
      // Pattern 4: Qualitative results for exact lab names
      new RegExp(`(${escapedLabName})\\s+(No reactivo|Negativo|Positivo|Reactivo|Claro|Amarillo|Turbio|No se observan|Escasa cantidad|Abundante|Moderada cantidad)`, 'g')
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
    tipoMuestra: 'SUERO', // Default, will be updated by sample type detection
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
 * Extract ALL lab results from Chilean PDF text with group-aware 5-column parsing
 */
export function extractAllLabResults(text: string, pages?: string[]): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  console.log('🔍 Starting comprehensive lab extraction with group-aware parsing...')
  
  // Clean header/footer contamination first
  const cleanedText = cleanHeaderFooterContamination(text, pages)
  
  // Primary approach: EXACT LAB NAME + RESULT extraction
  const exactResults = extractLabNamesAndResults(cleanedText, healthMarkerLookup)
  console.log(`🎯 EXACT parser found ${exactResults.length} results`)
  
  // Clean contaminated fields BEFORE secondary parsing
  const decontaminatedText = cleanContaminatedNormalRanges(cleanedText)
  
  // Secondary approach: Group-aware 5-column parsing for remaining labs
  const groupResults = extractLabsByGroupStructure(decontaminatedText, healthMarkerLookup)
  console.log(`📊 Group-aware parser found ${groupResults.length} additional results`)
  
  // Fallback: Legacy extraction strategies for any missed results
  console.log(`🔄 Running fallback extractors to catch missed labs...`)
  const sections = cleanedText.split(/_{50,}/)
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex]
    const tipoMuestra = extractSampleType(section)
    
    const fallbackResults = [
      ...extractNumericResults(section, healthMarkerLookup, tipoMuestra),
      ...extractEmbeddedMultiResults(section, healthMarkerLookup, tipoMuestra),
      ...extractQualitativeResults(section, healthMarkerLookup, tipoMuestra),
      ...extractCalculatedResults(section, healthMarkerLookup, tipoMuestra),
      ...extractMicroscopyResults(section, healthMarkerLookup, tipoMuestra),
      ...extractTabularResults(section, healthMarkerLookup, tipoMuestra)
    ]
    
    results.push(...fallbackResults)
  }
  console.log(`📊 Fallback extractors found ${results.length} additional results`)
  
  // Combine all extraction approaches
  results.push(...exactResults)
  results.push(...groupResults)
  console.log(`🎯 Total before deduplication: ${results.length} results (${exactResults.length} exact + ${groupResults.length} group + ${results.length - exactResults.length - groupResults.length} fallback)`)
  
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
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{5,50})\s{2,}(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s+(.+)/gm,
    
    // Enhanced embedded patterns for missing results
    /(COLESTEROL TOTAL|COLESTEROL HDL|COLESTEROL LDL|HEMOGLOBINA|HEMATOCRITO|VCM|HCM|CHCM|PLAQUETAS|LEUCOCITOS|NEUTROFILOS|LINFOCITOS|MONOCITOS|EOSINOFILOS|BASOFILOS|HEMOGLOBINA GLICOSILADA|HBA1C)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-Z]*)/gi,
    
    // Blood count embedded: RECUENTO GLOBULOS ROJOS4,6(x10^6/uL) HEMATOCRITO42,0(%)
    /(RECUENTO GLOBULOS [A-Z]+|HEMATOCRITO|V\.C\.M|H\.C\.M|C\.H\.C\.M|RECUENTO PLAQUETAS|RECUENTO GLOBULOS BLANCOS)(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-Z]*)/gi,
    
    // Electrolytes embedded: SODIO (Na) EN SANGRE136,7(mEq/L) POTASIO (K)
    /(SODIO|POTASIO|CLORO|BICARBONATO)\s*(?:\([^)]+\))?\s*(?:EN SANGRE)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-Z]*)/gi,
    
    // Liver enzymes: ALT, AST variations
    /(ALT|AST|GGT|LDH|BILIRRUBINA DIRECTA|BILIRRUBINA INDIRECTA|PROTEINAS TOTALES|ALBUMINA)\s*(?:\([^)]+\))?\s*(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)([^A-Z]*)/gi
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
  
  // Common header/footer patterns to remove
  const contaminationPatterns = [
    // Patient info repeated on every page
    /RUT\s*:\s*7\.236\.426-0\s+Folio\s*:\s*394499\s+Profesional Solicitante:\s*:\s*STEVENSON JEAN SIMON\s+Nombre\s*:\s*ISABEL DEL ROSARIO BOLADOS VEGA\s+Sexo\s*:\s*Femenino\s+Edad\s*:\s*73a 3m 17d\s+Fecha de Ingreso\s*:\s*15\/10\/2024 8:29:49\s+Toma de Muestra\s*:\s*15\/10\/2024 8:29:49\s+Fecha de Validación\s*:\s*[^\s]+\s+Procedencia\s*:\s*CESFAM QUEBRADA VERDE/g,
    
    // Lab address repeated on every page
    /LABORATORIO CLÍNICO CORPORACIÓN MUNICIPAL VALPARAISO\s+Calle Washington #32, tercer piso, Valparaiso/g,
    
    // Reception date repeated multiple times
    /Fecha de Recepción en el Laboratorio:\s*15\/10\/2024\s+[\d:]+/g,
    
    // Generic patient info pattern (for any patient)
    /RUT\s*:\s*[\d\.-]+\s+Folio\s*:\s*\d+\s+Profesional Solicitante:\s*:\s*[^F]+Fecha de Ingreso[^P]+Procedencia\s*:\s*[A-ZÁÉÍÓÚÑ\s]+/g,
    
    // Generic lab address
    /LABORATORIO CLÍNICO CORPORACIÓN MUNICIPAL[^F]*?Valparaiso/g
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