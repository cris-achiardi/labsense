import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { 
  extractReferenceRanges, 
  analyzeReferenceRangeExtraction,
  isValueInRange,
  findReferenceRangeForMarker
} from '@/lib/pdf-parsing/reference-range-parser'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo PDF' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo demasiado grande. Máximo: ${Math.round(maxSize / (1024 * 1024))}MB` 
      }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const textExtraction = await extractTextFromPDF(buffer)

    if (!textExtraction.success) {
      return NextResponse.json({ 
        error: textExtraction.error || 'Error al extraer texto del PDF' 
      }, { status: 500 })
    }

    // Extract reference ranges from the text
    const rangeExtraction = extractReferenceRanges(textExtraction.fullText)
    
    // Analyze extraction quality
    const analysis = analyzeReferenceRangeExtraction(textExtraction.fullText)

    // Log reference range extraction for audit
    console.log('Reference range extraction by user:', session.user.email, 
                'Total ranges found:', rangeExtraction.totalRangesFound,
                'Average confidence:', analysis.averageConfidence,
                'Has abnormal markers:', analysis.hasAbnormalMarkers)

    return NextResponse.json({
      success: true,
      message: 'Rangos de referencia extraídos exitosamente del PDF',
      data: {
        extraction: {
          success: rangeExtraction.success,
          totalRangesFound: rangeExtraction.totalRangesFound,
          ranges: rangeExtraction.results.map(formatRangeResult)
        },
        analysis,
        textSample: textExtraction.fullText.substring(0, 500) + '...',
        recommendations: analysis.recommendations
      }
    })

  } catch (error) {
    console.error('Reference range extraction API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Formats range result for API response
 */
function formatRangeResult(result: any) {
  return {
    type: result.range?.type,
    minValue: result.range?.minValue,
    maxValue: result.range?.maxValue,
    operator: result.range?.operator,
    unit: result.range?.unit,
    gender: result.range?.gender,
    ageGroup: result.range?.ageGroup,
    originalText: result.originalText,
    confidence: result.confidence,
    position: result.position,
    contextSample: result.context?.substring(0, 100) || null
  }
}

/**
 * GET endpoint for testing reference range patterns
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for Chilean reference range extraction
    const testCases = [
      {
        id: 'standard_range_with_marker',
        description: 'Standard range with abnormal marker',
        text: 'GLICEMIA EN AYUNO (BASAL)    269    mg/dL    [ * ] 74 - 106',
        expectedType: 'range',
        expectedMin: 74,
        expectedMax: 106,
        expectedAbnormal: true
      },
      {
        id: 'upper_limit_cholesterol',
        description: 'Upper limit for cholesterol',
        text: 'COLESTEROL TOTAL    220    mg/dL    [ * ] < 200',
        expectedType: 'upper_limit',
        expectedMax: 200,
        expectedAbnormal: true
      },
      {
        id: 'hasta_pattern',
        description: 'Chilean "hasta" pattern',
        text: 'GOT (A.S.T)    45    U/L    [ * ] Hasta 34',
        expectedType: 'upper_limit',
        expectedMax: 34,
        expectedAbnormal: true
      },
      {
        id: 'decimal_range_tsh',
        description: 'Decimal range for TSH',
        text: 'H. TIROESTIMULANTE (TSH)    11.040    mUI/L    [ * ] 0.55 - 4.78',
        expectedType: 'range',
        expectedMin: 0.55,
        expectedMax: 4.78,
        expectedAbnormal: true
      },
      {
        id: 'percentage_range',
        description: 'Percentage range for HbA1c',
        text: 'HEMOGLOBINA GLICADA A1C    11.2    %    [ * ] 4.0 - 6.0',
        expectedType: 'range',
        expectedMin: 4.0,
        expectedMax: 6.0,
        expectedAbnormal: true
      },
      {
        id: 'normal_labeled_range',
        description: 'Normal labeled range',
        text: 'CREATININA    1.2    mg/dL    Normal: 0.7 - 1.3',
        expectedType: 'range',
        expectedMin: 0.7,
        expectedMax: 1.3,
        expectedAbnormal: false
      },
      {
        id: 'desirable_low_range',
        description: 'Desirable low range',
        text: 'COLESTEROL LDL    180    mg/dL    Bajo (deseable): < 100',
        expectedType: 'upper_limit',
        expectedMax: 100,
        expectedAbnormal: false
      },
      {
        id: 'multiple_ranges_table',
        description: 'Multiple ranges in table format',
        text: `EXAMEN                    RESULTADO    UNIDAD    VALOR DE REFERENCIA
GLICEMIA EN AYUNO (BASAL)    269         mg/dL     [ * ] 74 - 106
COLESTEROL TOTAL             220         mg/dL     [ * ] < 200
H. TIROESTIMULANTE (TSH)     11.040      mUI/L     [ * ] 0.55 - 4.78
TRIGLICÉRIDOS               180         mg/dL     [ * ] < 150`,
        expectedType: 'multiple',
        expectedCount: 4,
        expectedAbnormal: true
      },
      {
        id: 'gender_specific_range',
        description: 'Gender-specific range',
        text: 'HEMOGLOBINA    H: 13-17, M: 12-15    g/dL',
        expectedType: 'range',
        expectedGender: true,
        expectedAbnormal: false
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const extraction = extractReferenceRanges(testCase.text)
      const analysis = analyzeReferenceRangeExtraction(testCase.text)
      
      let passed = false
      
      if (testCase.expectedType === 'multiple') {
        // Test for multiple ranges
        passed = extraction.totalRangesFound >= (testCase.expectedCount || 0)
      } else {
        // Test for single range
        const firstRange = extraction.results[0]?.range
        
        if (firstRange) {
          const typeMatches = firstRange.type === testCase.expectedType
          const minMatches = testCase.expectedMin === undefined || 
                           Math.abs((firstRange.minValue || 0) - testCase.expectedMin) < 0.01
          const maxMatches = testCase.expectedMax === undefined || 
                           Math.abs((firstRange.maxValue || 0) - testCase.expectedMax) < 0.01
          const abnormalMatches = testCase.expectedAbnormal === analysis.hasAbnormalMarkers
          
          passed = typeMatches && minMatches && maxMatches && abnormalMatches
        }
      }
      
      if (passed) {
        passedTests++
      }
      
      results.push({
        id: testCase.id,
        description: testCase.description,
        text: testCase.text.substring(0, 150) + (testCase.text.length > 150 ? '...' : ''),
        expected: {
          type: testCase.expectedType,
          minValue: testCase.expectedMin,
          maxValue: testCase.expectedMax,
          hasAbnormal: testCase.expectedAbnormal,
          count: testCase.expectedCount
        },
        actual: {
          totalRanges: extraction.totalRangesFound,
          firstRange: extraction.results[0] ? formatRangeResult(extraction.results[0]) : null,
          hasAbnormal: analysis.hasAbnormalMarkers,
          averageConfidence: analysis.averageConfidence
        },
        passed,
        extraction: {
          success: extraction.success,
          ranges: extraction.results.map(formatRangeResult)
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Test value validation with sample ranges
    const validationTests = [
      {
        description: 'Normal glucose value',
        value: 90,
        range: { type: 'range' as const, minValue: 74, maxValue: 106, originalText: '74 - 106', confidence: 95 },
        expectedStatus: 'normal'
      },
      {
        description: 'High glucose value (diabetic)',
        value: 269,
        range: { type: 'range' as const, minValue: 74, maxValue: 106, originalText: '74 - 106', confidence: 95 },
        expectedStatus: 'high'
      },
      {
        description: 'High cholesterol',
        value: 220,
        range: { type: 'upper_limit' as const, maxValue: 200, operator: '<=' as const, originalText: '< 200', confidence: 92 },
        expectedStatus: 'high'
      },
      {
        description: 'Normal TSH',
        value: 2.5,
        range: { type: 'range' as const, minValue: 0.55, maxValue: 4.78, originalText: '0.55 - 4.78', confidence: 95 },
        expectedStatus: 'normal'
      }
    ]

    const validationResults = validationTests.map(test => {
      const validation = isValueInRange(test.value, test.range)
      return {
        description: test.description,
        value: test.value,
        range: test.range,
        expected: test.expectedStatus,
        actual: validation.status,
        severity: validation.severity,
        passed: validation.status === test.expectedStatus
      }
    })

    // Log test results for debugging
    console.log('Reference range tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de rangos de referencia completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        extractionTests: results,
        validationTests: validationResults,
        patterns: {
          total: 14,
          description: 'Comprehensive Chilean reference range patterns',
          types: ['range', 'upper_limit', 'lower_limit', 'exact', 'complex']
        }
      }
    })

  } catch (error) {
    console.error('Reference range testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}