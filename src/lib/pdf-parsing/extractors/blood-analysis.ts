/**
 * Extractor for blood analysis parameters (hemogram and lipid profile).
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
 * Extract missing hemogram parameters including V.H.S.
 */
export function extractMissingHemogramParams(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for hemogram section with broader pattern
  const hemogramMatch = text.match(/(?:HEMOGRAMA|HEMATOLOGIA|BIOMETRIA)[\s\S]*?(?=ORINA|ELECTROLITOS|PERFIL|$)/i)
  if (!hemogramMatch) {
    console.log('🩸 No hemogram section found, searching globally for V.H.S.')
    // Search for V.H.S. globally if no hemogram section found
    return extractVHSGlobally(text, healthMarkerLookup)
  }
  
  const hemogramText = hemogramMatch[0]
  console.log('🩸 Extracting MISSING hemogram parameters')
  
  const missingParams = [
    'HEMATOCRITO',
    'HEMOGLOBINA', 
    'V.H.S.'
  ]
  
  for (const paramName of missingParams) {
    if (isAlreadyExtracted(results, paramName)) continue
    
    let patterns: RegExp[]
    
    if (paramName === 'V.H.S.') {
      // Enhanced V.H.S. patterns to handle various formats and "No procesado" cases
      patterns = [
        // Standard format: V.H.S. No procesado por falta de insumos
        /V\.H\.S\.\s+(No procesado por falta de insumos|No se procesó|No procesado[^\n]*|\d+(?:,\d+)?(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*([^\n]*?)/i,
        
        // With colon: V.H.S.: No procesado
        /V\.H\.S\.\s*:\s*(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*([^\n]*?)/i,
        
        // Flexible spacing: V.H.S.    No procesado
        /V\.H\.S\.\s{1,5}(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*([^\n]*?)/i,
        
        // Without periods: VHS No procesado
        /VHS\s+(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*([^\n]*?)/i,
        
        // Multi-line: V.H.S.\n No procesado
        /V\.H\.S\.\s*\n\s*(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*([^\n]*?)/i
      ]
    } else {
      // Standard hemogram parameters
      patterns = [
        new RegExp(`(${paramName})\\s+(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*\\(([^)]+)\\)\\s*([^\\n]*?)`, 'i'),
        new RegExp(`(${paramName})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\(([^)]+)\\)([^\\n]*?)`, 'i')
      ]
    }
    
    for (const pattern of patterns) {
      const match = pattern.exec(hemogramText)
      if (match) {
        const [, examen, resultado, unidad, valorReferencia] = match
        
        // Handle V.H.S. special case
        let cleanResultado: string | number = resultado.trim()
        if (paramName === 'V.H.S.' && resultado.includes('No procesado')) {
          cleanResultado = 'No procesado por falta de insumos'
        } else if (!isNaN(parseFloat(resultado.replace(',', '.')))) {
          cleanResultado = parseFloat(resultado.replace(',', '.'))
        }
        
        results.push(createLabResult({
          examen: examen || paramName,
          resultado: cleanResultado,
          unidad: unidad?.trim() || null,
          valorReferencia: valorReferencia?.trim() || null,
          metodo: paramName === 'V.H.S.' ? 'Colorimetria' : 'Citometría de flujo',
          tipoMuestra: 'SANGRE TOTAL + E.D.T.A.',
          isAbnormal: false,
          abnormalIndicator: '',
          resultType: typeof cleanResultado === 'number' ? 'numeric' : 'qualitative',
          confidence: 95,
          position: 0,
          context: match[0],
          healthMarkerLookup
        }))
        
        console.log(`✅ Missing Hemogram: ${examen || paramName} = ${cleanResultado}`)
        break
      }
    }
  }
  
  return results
}

/**
 * Extract missing lipid parameters
 */
export function extractMissingLipidParam(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Look for lipid/perfil section
  const lipidMatch = text.match(/(?:PERFIL\s+LIPIDICO|LIPIDOS|COLESTEROL)[\s\S]*?(?=ORINA|HEMOGRAMA|$)/i)
  if (!lipidMatch) return results
  
  const lipidText = lipidMatch[0]
  console.log('💊 Extracting MISSING lipid parameters')
  
  // The missing lipid parameter
  const missingParams = [
    'COLESTEROL VLDL (CALCULO)'
  ]
  
  for (const paramName of missingParams) {
    if (isAlreadyExtracted(results, paramName)) continue
    
    const patterns = [
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s+(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*\\(([^)]+)\\)\\s*([^\\n]*?)`, 'i'),
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\(([^)]+)\\)([^\\n]*?)`, 'i'),
      new RegExp(`(${paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*:\\s*(\\d+(?:,\\d+)?(?:\\.\\d+)?)\\s*\\(([^)]+)\\)\\s*([^\\n]*?)`, 'i')
    ]
    
    for (const pattern of patterns) {
      const match = pattern.exec(lipidText)
      if (match) {
        const [, examen, resultado, unidad, valorReferencia] = match
        
        results.push(createLabResult({
          examen: examen.trim(),
          resultado: parseFloat(resultado.replace(',', '.')),
          unidad: unidad?.trim() || 'mg/dL',
          valorReferencia: valorReferencia?.trim() || null,
          metodo: 'Cálculo',
          tipoMuestra: 'SUERO',
          isAbnormal: false,
          abnormalIndicator: '',
          resultType: 'numeric',
          confidence: 95,
          position: 0,
          context: match[0],
          healthMarkerLookup
        }))
        
        console.log(`✅ Missing Lipid: ${examen} = ${resultado}`)
        break
      }
    }
  }
  
  return results
}

/**
 * Extract V.H.S. globally when not found in hemogram section
 */
function extractVHSGlobally(
  text: string, 
  healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
  const results: ComprehensiveLabResult[] = []
  
  // Global V.H.S. patterns
  const vhsPatterns = [
    /V\.H\.S\.\s+(No procesado por falta de insumos|No se procesó|No procesado[^\n]*|\d+(?:,\d+)?(?:\.\d+)?)/i,
    /V\.H\.S\.\s*:\s*(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)/i,
    /VHS\s+(No procesado[^\n]*|No se procesó|\d+(?:,\d+)?(?:\.\d+)?)/i
  ]
  
  for (const pattern of vhsPatterns) {
    const match = pattern.exec(text)
    if (match) {
      const resultado = match[1].trim()
      
      let cleanResultado: string | number = resultado
      if (!resultado.includes('No procesado') && !isNaN(parseFloat(resultado.replace(',', '.')))) {
        cleanResultado = parseFloat(resultado.replace(',', '.'))
      }
      
      results.push(createLabResult({
        examen: 'V.H.S.',
        resultado: cleanResultado,
        unidad: typeof cleanResultado === 'number' ? 'mm/hr' : null,
        valorReferencia: '0-20',
        metodo: 'Colorimetria',
        tipoMuestra: 'SANGRE TOTAL + E.D.T.A.',
        isAbnormal: false,
        abnormalIndicator: '',
        resultType: typeof cleanResultado === 'number' ? 'numeric' : 'qualitative',
        confidence: 85,
        position: 0,
        context: match[0],
        healthMarkerLookup
      }))
      
      console.log(`✅ Global V.H.S.: ${cleanResultado}`)
      break
    }
  }
  
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
    category: tipoMuestra.includes('SANGRE') ? 'blood' : 'other',
    priority: isAbnormal ? 'medium' : 'low',
    confidence: confidence / 100,
    position,
    context,
    resultType
  }
}