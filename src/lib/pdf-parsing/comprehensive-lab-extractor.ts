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
 * Extract ALL lab results from Chilean PDF text with group-aware 5-column parsing
 */
export function extractAllLabResults(text: string, pages?: string[]): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  console.log('🔍 Starting comprehensive lab extraction with group-aware parsing...')
  
  // Clean header/footer contamination first
  const cleanedText = cleanHeaderFooterContamination(text, pages)
  
  // New approach: Group-aware 5-column parsing
  const groupResults = extractLabsByGroupStructure(cleanedText, healthMarkerLookup)
  console.log(`📊 Group-aware parser found ${groupResults.length} results`)
  
  // Fallback: Legacy extraction strategies for any missed results
  const sections = cleanedText.split(/_{50,}/)
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex]
    const tipoMuestra = extractSampleType(section)
    
    const fallbackResults = [
      ...extractEmbeddedMultiResults(section, healthMarkerLookup, tipoMuestra),
      ...extractQualitativeResults(section, healthMarkerLookup, tipoMuestra)
    ]
    
    results.push(...fallbackResults)
  }
  
  // Combine group results with fallback results
  results.push(...groupResults)
  
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
    
    // Check if line starts with ALL-CAPS lab name (main pattern)
    const labMatch = line.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)\/\-]{3,50})\s+(.*)$/)
    if (labMatch && isAllCapsLabName(labMatch[1])) {
      const [, labName, restOfLine] = labMatch
      
      // Parse the 5-column structure: Result | Unit | Normal Range | Method
      const labResult = parse5ColumnStructure(labName.trim(), restOfLine, currentSampleType, healthMarkerLookup, i, line)
      
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
    
    // Compact: 269(mg/dL)[ * ] 74-106 Hexoquinasa  
    /^(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\s*(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s+([A-Za-z].{3,}))?$/,
    
    // Spaced: 269    (mg/dL)    [ * ] 74 - 106    Hexoquinasa
    /^(\d+(?:,\d+)?(?:\.\d+)?)\s+\(([^)]+)\)\s+(\[?\s?\*?\s?\]?)?\s*(.+?)(?:\s{2,}([A-Za-z].{3,}))?$/
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