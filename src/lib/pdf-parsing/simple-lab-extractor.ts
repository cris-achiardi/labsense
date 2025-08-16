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
  
  console.log('🔍 Starting simple lab extraction...')
  
  // Define the specific patterns we know exist in the PDF
  const knownPatterns = [
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
    
    // H. TIROESTIMULANTE (TSH)11,040(μUI/mL)[*] 0,55-4,78
    {
      pattern: /H\. TIROESTIMULANTE \(TSH\)(\d+(?:,\d+)?)\(μUI\/mL\)\[?\*?\]?\s*([\d,]+-[\d,]+)/,
      examen: 'H. TIROESTIMULANTE (TSH)',
      systemCode: 'tsh',
      category: 'thyroid',
      priority: 'critical',
      unidad: 'μUI/mL'
    },
    
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
    }
  ]
  
  // Try each known pattern
  for (const patternDef of knownPatterns) {
    const match = text.match(patternDef.pattern)
    
    if (match) {
      console.log(`✅ Found ${patternDef.examen}: ${match[1]} ${patternDef.unidad}`)
      
      const resultado = parseFloat(match[1].replace(',', '.'))
      const valorReferencia = match[2]
      
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
    } else {
      console.log(`❌ Pattern not found for ${patternDef.examen}`)
    }
  }
  
  console.log(`🎯 Simple extraction found ${results.length} results`)
  return results
}