/**
 * Simple and reliable lab results extraction
 * Direct pattern matching for Chilean lab reports
 */

import { CHILEAN_HEALTH_MARKERS, createHealthMarkerLookup, type HealthMarkerMapping } from './spanish-health-markers'

export interface SimpleLabResult {
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
 * Extract lab results using direct pattern matching
 */
export function extractLabResultsSimple(text: string): SimpleLabResult[] {
  const results: SimpleLabResult[] = []
  const healthMarkerLookup = createHealthMarkerLookup()
  
  
  // Define comprehensive patterns for ALL lab results we want to extract
  const knownPatterns = [
    // GLUCOSE MARKERS
    // GLICEMIA EN AYUNO (BASAL)269(mg/dL)[*] 74-106
    {
      pattern: /GLICEMIA EN AYUNO \(BASAL\)(\d+(?:,\d+)?)\(mg\/dL\)\[?\*?\]?\s*(\d+-\d+)/,
      examen: 'GLICEMIA EN AYUNO (BASAL)',
      systemCode: 'glucose_fasting',
      category: 'glucose',
      priority: 'critical',
      unidad: 'mg/dL'
    },
    
    // HEMOGLOBINA GLICADA A1C11,8(%)[*] 4-6
    {
      pattern: /HEMOGLOBINA GLICADA A1C(\d+(?:,\d+)?)\(%\)\[?\*?\]?\s*(\d+-\d+)/,
      examen: 'HEMOGLOBINA GLICADA A1C',
      systemCode: 'hba1c',
      category: 'glucose',
      priority: 'critical',
      unidad: '%'
    },
    
    // THYROID MARKERS
    // H. TIROESTIMULANTE (TSH)11,040(μUI/mL)[*] 0,55-4,78
    {
      pattern: /H\. TIROESTIMULANTE \(TSH\)(\d+(?:,\d+)?)\(μUI\/mL\)\[?\*?\]?\s*([\d,]+-[\d,]+)/,
      examen: 'H. TIROESTIMULANTE (TSH)',
      systemCode: 'tsh',
      category: 'thyroid',
      priority: 'critical',
      unidad: 'μUI/mL'
    },
    
    // H. TIROXINA LIBRE (T4)1.0(ng/dL) 0.89-1.76
    {
      pattern: /H\. TIROXINA LIBRE \(T4\)(\d+(?:,\d+)?(?:\.\d+)?)\(ng\/dL\)\[?\*?\]?\s*([\d,.]+-[\d,.]+)/,
      examen: 'H. TIROXINA LIBRE (T4)',
      systemCode: 't4_free',
      category: 'thyroid',
      priority: 'high',
      unidad: 'ng/dL'
    },
    
    // LIPID PROFILE
    // TRIGLICERIDOS136(mg/dL)Normal: < 150
    {
      pattern: /TRIGLICERIDOS(\d+(?:,\d+)?)\(mg\/dL\)Normal:\s*<\s*(\d+)/,
      examen: 'TRIGLICERIDOS',
      systemCode: 'triglycerides',
      category: 'lipids',
      priority: 'high',
      unidad: 'mg/dL'
    },
    
    // COLESTEROL TOTAL213(mg/dL)Bajo (deseable): < 200
    {
      pattern: /COLESTEROL TOTAL(\d+(?:,\d+)?)\(mg\/dL\)Bajo \(deseable\):\s*<\s*(\d+)/,
      examen: 'COLESTEROL TOTAL',
      systemCode: 'cholesterol_total',
      category: 'lipids',
      priority: 'high',
      unidad: 'mg/dL'
    },
    
    // COLESTEROL HDL53(mg/dL) H: > 40, M: > 50
    {
      pattern: /COLESTEROL HDL(\d+(?:,\d+)?)\(mg\/dL\)\s*H:\s*>\s*\d+,\s*M:\s*>\s*(\d+)/,
      examen: 'COLESTEROL HDL',
      systemCode: 'cholesterol_hdl',
      category: 'lipids',
      priority: 'high',
      unidad: 'mg/dL'
    },
    
    // COLESTEROL LDL132.8(mg/dL)Bajo (deseable): < 100
    {
      pattern: /COLESTEROL LDL(\d+(?:,\d+)?(?:\.\d+)?)\(mg\/dL\)Bajo \(deseable\):\s*<\s*(\d+)/,
      examen: 'COLESTEROL LDL',
      systemCode: 'cholesterol_ldl',
      category: 'lipids',
      priority: 'high',
      unidad: 'mg/dL'
    },
    
    // LIVER FUNCTION
    // FOSF. ALCALINAS (ALP)125(U/L)[*] 46-116
    {
      pattern: /FOSF\. ALCALINAS \(ALP\)(\d+(?:,\d+)?)\(U\/L\)\[?\*?\]?\s*(\d+-\d+)/,
      examen: 'FOSF. ALCALINAS (ALP)',
      systemCode: 'alkaline_phosphatase',
      category: 'liver',
      priority: 'medium',
      unidad: 'U/L'
    },
    
    // GOT (A.S.T)17(U/L) Hasta 34
    {
      pattern: /GOT \(A\.S\.T\)(\d+(?:,\d+)?)\(U\/L\)\s*Hasta\s*(\d+)/,
      examen: 'GOT (A.S.T)',
      systemCode: 'ast',
      category: 'liver',
      priority: 'high',
      unidad: 'U/L'
    },
    
    // GPT (A.L.T)16(U/L) 10-49
    {
      pattern: /GPT \(A\.L\.T\)(\d+(?:,\d+)?)\(U\/L\)\s*(\d+-\d+)/,
      examen: 'GPT (A.L.T)',
      systemCode: 'alt',
      category: 'liver',
      priority: 'high',
      unidad: 'U/L'
    },
    
    // BILIRRUBINA TOTAL0.63(mg/dL) 0.3-1.2
    {
      pattern: /BILIRRUBINA TOTAL(\d+(?:,\d+)?(?:\.\d+)?)\(mg\/dL\)\[?\*?\]?\s*([\d,.]+-[\d,.]+)/,
      examen: 'BILIRRUBINA TOTAL',
      systemCode: 'bilirubin_total',
      category: 'liver',
      priority: 'medium',
      unidad: 'mg/dL'
    },
    
    // BILIRRUBINA DIRECTA0.21(mg/dL)Normal: < 0.30
    {
      pattern: /BILIRRUBINA DIRECTA(\d+(?:,\d+)?(?:\.\d+)?)\(mg\/dL\)Normal:\s*<\s*([\d,.]+)/,
      examen: 'BILIRRUBINA DIRECTA',
      systemCode: 'bilirubin_direct',
      category: 'liver',
      priority: 'medium',
      unidad: 'mg/dL'
    },
    
    // KIDNEY FUNCTION
    // CREATININA0.91(mg/dL) 0.55-1.02
    {
      pattern: /CREATININA(\d+(?:,\d+)?(?:\.\d+)?)\(mg\/dL\)\[?\*?\]?\s*([\d,.]+-[\d,.]+)/,
      examen: 'CREATININA',
      systemCode: 'creatinine',
      category: 'kidney',
      priority: 'high',
      unidad: 'mg/dL'
    },
    
    // ÁCIDO ÚRICO3.70(mg/dL) 3.1-7.8
    {
      pattern: /ÁCIDO ÚRICO(\d+(?:,\d+)?(?:\.\d+)?)\(mg\/dL\)\[?\*?\]?\s*([\d,.]+-[\d,.]+)/,
      examen: 'ÁCIDO ÚRICO',
      systemCode: 'uric_acid',
      category: 'kidney',
      priority: 'medium',
      unidad: 'mg/dL'
    },
    
    // BLOOD COUNT
    // HEMOGLOBINA14.2(g/dL) H: 13-17, M: 12-15
    {
      pattern: /HEMOGLOBINA(\d+(?:,\d+)?(?:\.\d+)?)\(g\/dL\)\[?\*?\]?\s*H:\s*(\d+-\d+),\s*M:\s*(\d+-\d+)/,
      examen: 'HEMOGLOBINA',
      systemCode: 'hemoglobin',
      category: 'blood',
      priority: 'medium',
      unidad: 'g/dL'
    },
    
    // HEMATOCRITO42.5(%) H: 40-50, M: 36-46
    {
      pattern: /HEMATOCRITO(\d+(?:,\d+)?(?:\.\d+)?)\(%\)\[?\*?\]?\s*H:\s*(\d+-\d+),\s*M:\s*(\d+-\d+)/,
      examen: 'HEMATOCRITO',
      systemCode: 'hematocrit',
      category: 'blood',
      priority: 'medium',
      unidad: '%'
    },
    
    // VITAMINS
    // VITAMINA B12407(pg/mL) 211-911
    {
      pattern: /VITAMINA B12(\d+(?:,\d+)?)\(pg\/mL\)\[?\*?\]?\s*(\d+-\d+)/,
      examen: 'VITAMINA B12',
      systemCode: 'vitamin_b12',
      category: 'other',
      priority: 'low',
      unidad: 'pg/mL'
    },
    
    // Alternative patterns for more flexible matching
    // Generic pattern for any lab with value(unit) reference
    {
      pattern: /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.\(\)]{10,50})(\d+(?:,\d+)?(?:\.\d+)?)\(([^)]+)\)\[?\*?\]?\s*([\d,.\s<>-]+)/,
      examen: 'GENERIC_PATTERN',
      systemCode: null,
      category: 'other',
      priority: 'low',
      unidad: 'auto'
    }
  ]
  
  // Try each known pattern
  for (const patternDef of knownPatterns) {
    const match = text.match(patternDef.pattern)
    
    if (match) {
      // Handle special generic pattern
      if (patternDef.examen === 'GENERIC_PATTERN') {
        // For generic pattern, extract exam name from match
        const examenFound = match[1].trim()
        const resultado = parseFloat(match[2].replace(',', '.'))
        const unidadFound = match[3]
        const valorReferencia = match[4]
        
        // Skip if we already extracted this exam with a specific pattern
        const alreadyExtracted = results.some(r => r.examen.includes(examenFound) || examenFound.includes(r.examen))
        if (alreadyExtracted) {
          continue
        }
        
        
        // Try to map generic exam to known health marker
        let systemCode: string | null = null
        let category: string = 'other'
        let priority: string = 'low'
        
        const upperExamen = examenFound.toUpperCase()
        const markerEntries = Array.from(healthMarkerLookup.entries())
        for (const [searchTerm, marker] of markerEntries) {
          if (upperExamen.includes(searchTerm) || searchTerm.includes(upperExamen)) {
            systemCode = marker.systemCode
            category = marker.category
            priority = marker.priority
            break
          }
        }
        
        // Check if abnormal (look for [*] in the original text around this match)
        const matchIndex = text.indexOf(match[0])
        const contextStart = Math.max(0, matchIndex - 50)
        const contextEnd = Math.min(text.length, matchIndex + match[0].length + 50)
        const context = text.substring(contextStart, contextEnd)
        
        const isAbnormal = context.includes('[*]') || context.includes('[ * ]')
        const abnormalIndicator = isAbnormal ? '[*]' : ''
        
        const labResult: SimpleLabResult = {
          examen: examenFound,
          resultado,
          unidad: unidadFound,
          valorReferencia,
          metodo: '',
          tipoMuestra: 'SUERO',
          isAbnormal,
          abnormalIndicator,
          systemCode,
          category,
          priority,
          confidence: systemCode ? 85 : 75, // Higher confidence if we found a known marker
          position: matchIndex,
          context: context.substring(0, 100)
        }
        
        results.push(labResult)
      } else {
        // Handle specific patterns
        
        const resultado = parseFloat(match[1].replace(',', '.'))
        let valorReferencia = match[2]
        
        // Handle special cases for reference ranges
        if (patternDef.examen.includes('HEMOGLOBINA') && match[3]) {
          // For blood count items with H: X-Y, M: A-B format
          valorReferencia = `H: ${match[2]}, M: ${match[3]}`
        } else if (patternDef.examen.includes('HDL') && match[2]) {
          // For HDL with H: > 40, M: > 50 format
          valorReferencia = `H: > 40, M: > ${match[2]}`
        }
        
        // Check if abnormal (look for [*] in the original text around this match)
        const matchIndex = text.indexOf(match[0])
        const contextStart = Math.max(0, matchIndex - 50)
        const contextEnd = Math.min(text.length, matchIndex + match[0].length + 50)
        const context = text.substring(contextStart, contextEnd)
        
        const isAbnormal = context.includes('[*]') || context.includes('[ * ]')
        const abnormalIndicator = isAbnormal ? '[*]' : ''
        
        const labResult: SimpleLabResult = {
          examen: patternDef.examen,
          resultado,
          unidad: patternDef.unidad,
          valorReferencia,
          metodo: '', // We'll extract this later if needed
          tipoMuestra: 'SUERO',
          isAbnormal,
          abnormalIndicator,
          systemCode: patternDef.systemCode,
          category: patternDef.category,
          priority: patternDef.priority,
          confidence: 95, // High confidence for direct pattern matches
          position: matchIndex,
          context: context.substring(0, 100)
        }
        
        results.push(labResult)
      }
    } else if (patternDef.examen !== 'GENERIC_PATTERN') {
    }
  }
  
  return results
}