import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { parseChileanRUTsFromText, analyzeRUTExtraction } from '@/lib/pdf-parsing/chilean-rut-parser'
import { validateChileanRUT, formatChileanRUT } from '@/lib/utils/chilean-rut'

/**
 * Test cases for Chilean RUT parsing validation
 */
const RUT_TEST_CASES = [
  {
    id: 'standard_format',
    description: 'Standard format with dots',
    text: 'RUT: 12.345.678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 95
  },
  {
    id: 'no_dots_format',
    description: 'Format without dots',
    text: 'RUT: 12345678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 90
  },
  {
    id: 'spaced_format',
    description: 'Format with spaces',
    text: 'RUT: 12 345 678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 85
  },
  {
    id: 'cedula_format',
    description: 'Cedula format',
    text: 'C.I.: 12.345.678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 95
  },
  {
    id: 'run_format',
    description: 'RUN format',
    text: 'RUN: 12.345.678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 95
  },
  {
    id: 'patient_format',
    description: 'Patient format',
    text: 'PACIENTE: 12.345.678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 92
  },
  {
    id: 'loose_format',
    description: 'Loose format with spaces',
    text: 'Paciente: 12.345.678 - 9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 75
  },
  {
    id: 'very_loose_format',
    description: 'Very loose format (OCR error)',
    text: 'RUT 12345678 9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 70
  },
  {
    id: 'medical_form',
    description: 'Medical form with name and RUT',
    text: 'NOMBRE: MARIA GONZALEZ RUT: 12.345.678-9',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 96
  },
  {
    id: 'table_format',
    description: 'Table format',
    text: '| 12.345.678-9 | MARIA GONZALEZ |',
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 80
  },
  {
    id: 'multiple_ruts',
    description: 'Multiple RUTs in text',
    text: 'Paciente RUT: 12.345.678-9, Médico RUT: 98.765.432-1',
    expectedRut: '12.345.678-9', // Should pick first one
    expectedValid: true,
    minConfidence: 90
  },
  {
    id: 'invalid_rut',
    description: 'Invalid RUT (wrong check digit)',
    text: 'RUT: 12.345.678-0',
    expectedRut: null,
    expectedValid: false,
    minConfidence: 0
  },
  {
    id: 'real_chilean_lab',
    description: 'Real Chilean lab report format',
    text: `CORPORACIÓN MUNICIPAL VALPARAÍSO
    LABORATORIO CLÍNICO
    
    PACIENTE: MARIA ELENA GONZALEZ RODRIGUEZ
    RUT: 12.345.678-9
    EDAD: 73 AÑOS
    SEXO: FEMENINO
    
    EXAMEN          RESULTADO    UNIDAD    VALOR DE REFERENCIA`,
    expectedRut: '12.345.678-9',
    expectedValid: true,
    minConfidence: 95
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const results = []
    let passedTests = 0
    let totalTests = RUT_TEST_CASES.length

    // Run each test case
    for (const testCase of RUT_TEST_CASES) {
      const extraction = parseChileanRUTsFromText(testCase.text)
      const analysis = analyzeRUTExtraction(testCase.text)
      
      const bestRut = extraction.bestMatch
      const actualRut = bestRut?.formattedRut || null
      const actualValid = bestRut?.success || false
      const actualConfidence = bestRut?.confidence || 0
      
      // Check if test passed
      const rutMatches = actualRut === testCase.expectedRut
      const validityMatches = actualValid === testCase.expectedValid
      const confidenceOk = actualConfidence >= testCase.minConfidence
      
      const passed = rutMatches && validityMatches && (testCase.expectedValid ? confidenceOk : true)
      
      if (passed) {
        passedTests++
      }
      
      results.push({
        id: testCase.id,
        description: testCase.description,
        text: testCase.text.substring(0, 100) + (testCase.text.length > 100 ? '...' : ''),
        expected: {
          rut: testCase.expectedRut,
          valid: testCase.expectedValid,
          minConfidence: testCase.minConfidence
        },
        actual: {
          rut: actualRut,
          valid: actualValid,
          confidence: actualConfidence,
          source: bestRut?.source || null,
          context: bestRut?.context?.substring(0, 50) || null
        },
        checks: {
          rutMatches,
          validityMatches,
          confidenceOk
        },
        passed,
        analysis: {
          totalMatches: analysis.totalMatches,
          validRuts: analysis.validRuts,
          highConfidenceMatches: analysis.highConfidenceMatches
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('RUT parser tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de parser RUT completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        recommendations: generateTestRecommendations(results)
      }
    })

  } catch (error) {
    console.error('RUT testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Generates recommendations based on test results
 */
function generateTestRecommendations(results: any[]): string[] {
  const recommendations: string[] = []
  const failedTests = results.filter(r => !r.passed)
  
  if (failedTests.length === 0) {
    recommendations.push('✅ Todos los tests pasaron exitosamente')
    return recommendations
  }
  
  // Analyze failure patterns
  const rutMismatchCount = failedTests.filter(r => !r.checks.rutMatches).length
  const validityMismatchCount = failedTests.filter(r => !r.checks.validityMatches).length
  const confidenceIssueCount = failedTests.filter(r => !r.checks.confidenceOk).length
  
  if (rutMismatchCount > 0) {
    recommendations.push(`⚠️ ${rutMismatchCount} tests fallaron en extracción de RUT`)
  }
  
  if (validityMismatchCount > 0) {
    recommendations.push(`⚠️ ${validityMismatchCount} tests fallaron en validación`)
  }
  
  if (confidenceIssueCount > 0) {
    recommendations.push(`⚠️ ${confidenceIssueCount} tests tienen baja confianza`)
  }
  
  // Specific recommendations
  const veryLooseFailures = failedTests.filter(r => r.id === 'very_loose_format')
  if (veryLooseFailures.length > 0) {
    recommendations.push('🔧 Mejorar detección de formatos OCR con errores')
  }
  
  const multipleRutFailures = failedTests.filter(r => r.id === 'multiple_ruts')
  if (multipleRutFailures.length > 0) {
    recommendations.push('🔧 Mejorar priorización cuando hay múltiples RUTs')
  }
  
  return recommendations
}

/**
 * POST endpoint for testing custom text
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({ 
        error: 'Se requiere texto para analizar' 
      }, { status: 400 })
    }

    // Parse RUTs from custom text
    const extraction = parseChileanRUTsFromText(text)
    const analysis = analyzeRUTExtraction(text)

    // Log custom test for debugging
    console.log('Custom RUT test by user:', session.user.email,
                'RUTs found:', extraction.results.length,
                'Best match confidence:', extraction.bestMatch?.confidence || 0)

    return NextResponse.json({
      success: true,
      message: 'Análisis de texto personalizado completado',
      data: {
        extraction,
        analysis,
        textSample: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        recommendations: analysis.recommendations
      }
    })

  } catch (error) {
    console.error('Custom RUT test API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}