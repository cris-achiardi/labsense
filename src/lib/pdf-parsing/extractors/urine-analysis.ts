/**
 * Extractor for complete urine analysis and sediment parameters.
 */

import { type HealthMarkerMapping } from '../spanish-health-markers';
export interface ComprehensiveLabResult {
	examen: string;
	resultado: string | number | null;
	unidad: string | null;
	valorReferencia: string | null;
	metodo: string | null;
	tipoMuestra: string;
	isAbnormal: boolean;
	abnormalIndicator: string;
	systemCode: string | null;
	category: string | null;
	priority: string | null;
	confidence: number;
	position: number;
	context: string;
	resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy';
}

/**
 * Extract complete urine analysis parameters
 */
export function extractCompleteUrineAnalysis(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for orina completa section
  const urineMatch = text.match(/ORINA COMPLETA[\s\S]*?(?=SEDIMENTO|HEMOGRAMA|$)/i)
  if (!urineMatch) return results
  
  const urineText = urineMatch[0]
  console.log('🚿 Parsing COMPLETE URINE section')
  
  const urineParams = [
    'COLOR',
    'ASPECTO', 
    'PH',
    'PROTEINAS',
    'GLUCOSA',
    'CETONAS',
    'SANGRE EN ORINA',
    'BILIRRUBINA',
    'NITRITOS',
    'LEUCOCITOS'  // urine version, different from blood
  ]
  
  for (const paramName of urineParams) {
    if (isAlreadyExtracted(results, paramName)) continue
    
    // Special handling for PH which has numeric values
    if (paramName === 'PH') {
      const phPatterns = [
        /\bPH\s+([\d,\.]+)/gi,
        /\bPH\s*:\s*([\d,\.]+)/gi,
        /\bPH\s{2,}([\d,\.]+)/gi,
        /\bPH\t+([\d,\.]+)/gi,
        /\bPH\s*\n\s*([\d,\.]+)/gi,
        /\bPH([\d,\.]+)/gi,  // Direct connection
        /pH\s+([\d,\.]+)/gi,  // Lowercase pH
        /p\.?H\.?\s*([\d,\.]+)/gi,  // With periods
      ]
      
      for (const pattern of phPatterns) {
        const match = pattern.exec(urineText)
        if (match) {
          const [, resultado, valorReferencia] = match
          
          results.push(createLabResult({
            examen: 'PH',
            resultado: parseFloat(resultado.replace(',', '.')),
            unidad: null,
            valorReferencia: valorReferencia?.trim() || '5-8',
            metodo: 'Colorimétrico',
            tipoMuestra: 'ORINA',
            isAbnormal: false,
            abnormalIndicator: '',
            resultType: 'numeric',
            confidence: 95,
            position: 0,
            context: match[0],
            healthMarkerLookup
          }))
          
          console.log(`✅ Urine PH: ${resultado}`)
          break
        }
      }
      continue
    }
    
    const patterns = [
      // Standard format: GLUCOSA ++ (mg/dL) 
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s+(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*(?:\\(([^)]+)\\))?\\s*([^\\n]*?)`, 'i'),
      
      // Embedded format: GLUCOSA++(mg/dL)
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)(?:\\(([^)]+)\\))?([^\\n]*?)`, 'i'),
      
      // With colon: GLUCOSA: ++
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*:\\s*(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*(?:\\(([^)]+)\\))?\\s*([^\\n]*?)`, 'i'),
      
      // Flexible spacing: GLUCOSA    ++
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s{2,5}(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*(?:\\(([^)]+)\\))?\\s*([^\\n]*?)`, 'i'),
      
      // Tab-separated: GLUCOSA\t++
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\t+(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*(?:\\(([^)]+)\\))?\\s*([^\\n]*?)`, 'i'),
      
      // Multi-line: GLUCOSA\n++
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*\\n\\s*(\\+{1,4}|Negativo|Positivo|Claro|Amarillo|Turbio|\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*(?:\\(([^)]+)\\))?\\s*([^\\n]*?)`, 'i')
    ]
    
    for (const pattern of patterns) {
      const match = pattern.exec(urineText)
      if (match) {
        const [, examen, resultado, unidad, valorReferencia] = match
        
        results.push(createLabResult({
          examen: examen.trim(),
          resultado: resultado.trim(),
          unidad: unidad?.trim() || null,
          valorReferencia: valorReferencia?.trim() || null,
          metodo: 'Colorimétrico',
          tipoMuestra: 'ORINA',
          isAbnormal: resultado.includes('+') && resultado !== 'Negativo',
          abnormalIndicator: resultado.includes('+') ? '+' : '',
          resultType: 'qualitative',
          confidence: 95,
          position: 0,
          context: match[0],
          healthMarkerLookup
        }))
        
        console.log(`✅ Urine: ${examen} = ${resultado}`)
        break
      }
    }
  }
  
  console.log(`🚿 Complete urine extracted: ${results.length}/12 parameters`)
  return results
}

/**
 * Extract urine sediment analysis parameters
 */
export function extractUrineSedimentAnalysis(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for sediment section with multiple possible names
  const sedimentMatch = text.match(/SEDIMENTO\s+(?:DE\s+)?(?:ORINA|URINARIO)[\s\S]*?(?=Fecha de Recepción|Método Analítico|$)/i)
  if (!sedimentMatch) {
    console.log('❌ No sediment section found')
    return results
  }
  
  const sedimentText = sedimentMatch[0]
  console.log('🔬 Parsing URINE SEDIMENT section')
  
  const sedimentParams = [
    'HEMATIES POR CAMPO',
    'LEUCOCITOS POR CAMPO', 
    'CELULAS EPITELIALES',
    'MUCUS',
    'CRISTALES',
    'CILINDROS',
    'BACTERIAS'
  ]
  
  for (const paramName of sedimentParams) {
    if (isAlreadyExtracted(results, paramName)) continue
    
    // Enhanced patterns for sediment parameters
    let patterns: RegExp[] = []
    
    if (paramName.includes('POR CAMPO')) {
      const baseParam = paramName.replace(' POR CAMPO', '')
      patterns = [
        // Exact PDF format: HEMATIES POR CAMPO    0 - 2
        new RegExp(`^(${baseParam})\\s+POR\\s+CAMPO\\s+(\\d+\\s*-\\s*\\d+|No se observan?)`, 'gmi'),
        // Standard: HEMATIES POR CAMPO 0-2
        new RegExp(`(${baseParam})\\s+POR\\s+CAMPO\\s+(\\d+\\s*-\\s*\\d+|No se observan?)`, 'i'),
        // Slash: HEMATIES/CAMPO 0-2  
        new RegExp(`(${baseParam})\\s*/\\s*CAMPO\\s+(\\d+\\s*-\\s*\\d+|No se observan?)`, 'i'),
        // Without POR: HEMATIES CAMPO 0-2
        new RegExp(`(${baseParam})\\s+CAMPO\\s+(\\d+\\s*-\\s*\\d+|No se observan?)`, 'i'),
        // Tab separated patterns from the actual PDF
        new RegExp(`(${baseParam})\\s+POR\\s+CAMPO\\s+(.+?)\\s*$`, 'gmi'),
      ]
      
      // Add extra aggressive patterns for LEUCOCITOS
      if (baseParam === 'LEUCOCITOS') {
        patterns.push(
          /LEUCOCITOS[^\n]*?CAMPO[^\n]*?(\d+\s*-\s*\d+|No se observan?)/gi,
          /CAMPO[^\n]*?LEUCOCITOS[^\n]*?(\d+\s*-\s*\d+|No se observan?)/gi,
          /LEUCOCITOS.*?(\d+\s*-\s*\d+)(?=\s|$)/gi
        )
      }
    } else {
      // Generic sediment patterns for MUCUS, CRISTALES, CILINDROS, BACTERIAS, CELULAS EPITELIALES
      const escapedParam = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      patterns = [
        // Standard: MUCUS Escasa cantidad
        new RegExp(`(${escapedParam})\\s+(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes|\\d+\\s*-\\s*\\d+)`, 'i'),
        // With colon: MUCUS: Escasa cantidad  
        new RegExp(`(${escapedParam})\\s*:\\s*(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes|\\d+\\s*-\\s*\\d+)`, 'i'),
        // Flexible spacing: MUCUS    Escasa cantidad
        new RegExp(`(${escapedParam})\\s{2,10}(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes|\\d+\\s*-\\s*\\d+)`, 'i'),
        // Tab separated: MUCUS\tEscasa cantidad
        new RegExp(`(${escapedParam})\\t+(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes|\\d+\\s*-\\s*\\d+)`, 'i'),
        // Connected directly: MUCUSEscasa
        new RegExp(`(${escapedParam})(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes)`, 'i'),
        // Multi-line: MUCUS on one line, result on next
        new RegExp(`(${escapedParam})\\s*\\n\\s*(No se observan?|Escasa cantidad|Moderada cantidad|Abundante|Algunas|Presentes|\\d+\\s*-\\s*\\d+)`, 'i')
      ]
    }
    
    for (const pattern of patterns) {
      const match = pattern.exec(sedimentText)
      if (match) {
        const resultado = match[2] || match[1]
        
        results.push(createLabResult({
          examen: paramName,
          resultado: resultado.trim(),
          unidad: null,
          valorReferencia: 'Variable',
          metodo: 'Microscopia',
          tipoMuestra: 'ORINA',
          isAbnormal: !/(No se observan?|0-0|0-1)/i.test(resultado),
          abnormalIndicator: !/(No se observan?|0-0|0-1)/i.test(resultado) ? '[*]' : '',
          resultType: 'microscopy',
          confidence: 85,
          position: 0,
          context: match[0],
          healthMarkerLookup
        }))
        
        console.log(`✅ Sediment: ${paramName} = ${resultado}`)
        break
      }
    }
  }
  
  console.log(`🔬 Sediment extracted: ${results.length}/7 parameters`)
  return results
}

// Helper functions
function isAlreadyExtracted(results: ComprehensiveLabResult[], paramName: string): boolean {
  return results.some(r => r.examen.toUpperCase() === paramName.toUpperCase())
}

function createLabResult(params: {
  examen: string;
  resultado: string | number | null;
  unidad: string | null;
  valorReferencia: string | null;
  metodo: string;
  tipoMuestra: string;
  isAbnormal: boolean;
  abnormalIndicator: string;
  resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy';
  confidence: number;
  position: number;
  context: string;
  healthMarkerLookup: Map<string, HealthMarkerMapping>;
}): ComprehensiveLabResult {
  const {
    examen,
    resultado,
    unidad,
    valorReferencia,
    metodo,
    tipoMuestra,
    isAbnormal,
    abnormalIndicator,
    confidence,
    position,
    context,
    resultType,
    healthMarkerLookup
  } = params

  const healthMarker = healthMarkerLookup.get(examen.toUpperCase())
  
  return {
    examen,
    resultado,
    unidad: unidad || healthMarker?.unit || null,
    valorReferencia: valorReferencia || null,
    metodo: metodo || null,
    tipoMuestra,
    isAbnormal,
    abnormalIndicator,
    systemCode: healthMarker?.systemCode || null,
    category: tipoMuestra === 'ORINA' ? 'urine' : 'other',
    priority: isAbnormal ? 'medium' : 'low',
    confidence,
    position,
    context,
    resultType
  }
}