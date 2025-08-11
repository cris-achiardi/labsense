import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { 
  detectAbnormalValues, 
  analyzeAbnormalValueDetection,
  getPatientPriorityLevel
} from '@/lib/pdf-parsing/abnormal-value-detector'

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

    // Detect abnormal values
    const abnormalDetection = detectAbnormalValues(textExtraction.fullText)
    
    // Analyze detection quality
    const analysis = analyzeAbnormalValueDetection(textExtraction.fullText)
    
    // Get patient priority level
    const priorityLevel = getPatientPriorityLevel(abnormalDetection.overallPriorityScore)

    // Log abnormal value detection for audit
    console.log('Abnormal value detection by user:', session.user.email, 
                'Total abnormalities:', abnormalDetection.totalAbnormalities,
                'Critical:', abnormalDetection.criticalAbnormalities.length,
                'Severe:', abnormalDetection.severeAbnormalities.length,
                'Priority score:', abnormalDetection.overallPriorityScore,
                'Priority level:', priorityLevel.level)

    return NextResponse.json({
      success: true,
      message: 'Detección de valores anormales completada exitosamente',
      data: {
        detection: {
          success: abnormalDetection.success,
          totalAbnormalities: abnormalDetection.totalAbnormalities,
          overallPriorityScore: abnormalDetection.overallPriorityScore,
          criticalAbnormalities: abnormalDetection.criticalAbnormalities.map(formatAbnormalResult),
          severeAbnormalities: abnormalDetection.severeAbnormalities.map(formatAbnormalResult),
          allResults: abnormalDetection.results.map(formatAbnormalResult)
        },
        priorityLevel,
        analysis,
        textSample: textExtraction.fullText.substring(0, 500) + '...',
        recommendations: analysis.recommendations
      }
    })

  } catch (error) {
    console.error('Abnormal value detection API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}/**
 
* Formats abnormal result for API response (removes sensitive context)
 */
function formatAbnormalResult(result: any) {
  return {
    healthMarker: {
      systemCode: result.healthMarker?.marker?.systemCode,
      spanishName: result.healthMarker?.marker?.spanishName,
      category: result.healthMarker?.marker?.category,
      priority: result.healthMarker?.marker?.priority,
      unit: result.healthMarker?.marker?.unit
    },
    labValue: result.labValue ? {
      value: result.labValue.value,
      unit: result.labValue.unit,
      hasAbnormalMarker: result.labValue.hasAbnormalMarker,
      confidence: result.labValue.confidence
    } : null,
    referenceRange: result.referenceRange ? {
      type: result.referenceRange.type,
      minValue: result.referenceRange.minValue,
      maxValue: result.referenceRange.maxValue,
      operator: result.referenceRange.operator,
      unit: result.referenceRange.unit
    } : null,
    isAbnormal: result.isAbnormal,
    abnormalitySource: result.abnormalitySource,
    severity: result.severity,
    status: result.status,
    priorityScore: result.priorityScore,
    confidence: result.confidence,
    contextSample: result.context?.substring(0, 150) || null
  }
}

/**
 * GET endpoint for testing abnormal value detection patterns
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for Chilean abnormal value detection
    const testCases = [
      {
        id: 'severe_diabetes',
        description: 'Severe diabetes case',
        text: `EXAMEN                    RESULTADO    UNIDAD    VALOR DE REFERENCIA
GLICEMIA EN AYUNO (BASAL)    269         mg/dL     [ * ] 74 - 106`,
        expectedAbnormal: true,
        expectedSeverity: 'severe',
        expectedPriority: 'HIGH',
        expectedSource: 'both'
      },
      {
        id: 'severe_hypothyroidism',
        description: 'Severe hypothyroidism case',
        text: `H. TIROESTIMULANTE (TSH)    11.040      mUI/L     [ * ] 0.55 - 4.78`,
        expectedAbnormal: true,
        expectedSeverity: 'severe',
        expectedPriority: 'HIGH',
        expectedSource: 'both'
      },
      {
        id: 'high_cholesterol',
        description: 'High cholesterol case',
        text: `COLESTEROL TOTAL             220         mg/dL     [ * ] < 200`,
        expectedAbnormal: true,
        expectedSeverity: 'mild',
        expectedPriority: 'MEDIUM',
        expectedSource: 'both'
      },
      {
        id: 'elevated_liver_enzymes',
        description: 'Elevated liver enzymes',
        text: `GOT (A.S.T)                 45          U/L       [ * ] Hasta 34
GPT (A.L.T)                 52          U/L       [ * ] Hasta 36`,
        expectedAbnormal: true,
        expectedSeverity: 'moderate',
        expectedPriority: 'MEDIUM',
        expectedSource: 'both'
      },
      {
        id: 'normal_values',
        description: 'Normal values case',
        text: `GLICEMIA EN AYUNO (BASAL)    90          mg/dL     74 - 106
COLESTEROL TOTAL             180         mg/dL     < 200
H. TIROESTIMULANTE (TSH)     2.5         mUI/L     0.55 - 4.78`,
        expectedAbnormal: false,
        expectedSeverity: 'normal',
        expectedPriority: 'NORMAL',
        expectedSource: 'none'
      },
      {
        id: 'critical_glucose',
        description: 'Critical glucose level',
        text: `GLICEMIA EN AYUNO (BASAL)    350         mg/dL     [ * ] 74 - 106`,
        expectedAbnormal: true,
        expectedSeverity: 'critical',
        expectedPriority: 'HIGH',
        expectedSource: 'both'
      },
      {
        id: 'multiple_abnormalities',
        description: 'Multiple abnormalities (real case)',
        text: `EXAMEN                    RESULTADO    UNIDAD    VALOR DE REFERENCIA
GLICEMIA EN AYUNO (BASAL)    269         mg/dL     [ * ] 74 - 106
HEMOGLOBINA GLICADA A1C      11.2        %         [ * ] 4.0 - 6.0
H. TIROESTIMULANTE (TSH)     11.040      mUI/L     [ * ] 0.55 - 4.78
COLESTEROL TOTAL             220         mg/dL     [ * ] < 200
TRIGLICÉRIDOS               180         mg/dL     [ * ] < 150`,
        expectedAbnormal: true,
        expectedSeverity: 'severe',
        expectedPriority: 'HIGH',
        expectedSource: 'both',
        expectedMultiple: true
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const detection = detectAbnormalValues(testCase.text)
      const analysis = analyzeAbnormalValueDetection(testCase.text)
      const priorityLevel = getPatientPriorityLevel(detection.overallPriorityScore)
      
      let passed = false
      
      if (testCase.expectedMultiple) {
        // Test for multiple abnormalities
        passed = detection.totalAbnormalities >= 3 && 
                priorityLevel.level === testCase.expectedPriority
      } else if (testCase.expectedAbnormal) {
        // Test for single abnormality
        const hasAbnormal = detection.totalAbnormalities > 0
        const correctPriority = priorityLevel.level === testCase.expectedPriority
        
        passed = hasAbnormal && correctPriority
      } else {
        // Test for normal case
        passed = detection.totalAbnormalities === 0 && 
                priorityLevel.level === 'NORMAL'
      }
      
      if (passed) {
        passedTests++
      }
      
      results.push({
        id: testCase.id,
        description: testCase.description,
        text: testCase.text.substring(0, 200) + (testCase.text.length > 200 ? '...' : ''),
        expected: {
          abnormal: testCase.expectedAbnormal,
          severity: testCase.expectedSeverity,
          priority: testCase.expectedPriority,
          source: testCase.expectedSource
        },
        actual: {
          totalAbnormalities: detection.totalAbnormalities,
          criticalCount: detection.criticalAbnormalities.length,
          severeCount: detection.severeAbnormalities.length,
          overallScore: detection.overallPriorityScore,
          priorityLevel: priorityLevel.level,
          averageConfidence: analysis.averageConfidence
        },
        passed,
        detection: {
          success: detection.success,
          results: detection.results.map(formatAbnormalResult)
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('Abnormal value detection tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de detección de valores anormales completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        priorityLevels: {
          HIGH: 'Requiere atención médica inmediata (>50 puntos)',
          MEDIUM: 'Requiere seguimiento médico urgente (20-50 puntos)',
          LOW: 'Monitoreo médico rutinario recomendado (1-20 puntos)',
          NORMAL: 'Valores dentro de rangos normales (0 puntos)'
        }
      }
    })

  } catch (error) {
    console.error('Abnormal value detection testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}