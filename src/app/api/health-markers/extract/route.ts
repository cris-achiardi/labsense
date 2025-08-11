import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { extractSpanishHealthMarkers, getCriticalHealthMarkers } from '@/lib/pdf-parsing/spanish-health-markers'

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

    // Extract health markers from the text
    const healthMarkerExtraction = extractSpanishHealthMarkers(textExtraction.fullText)
    
    // Analyze extraction quality
    const analysis = analyzeHealthMarkerExtraction(healthMarkerExtraction)

    // Log health marker extraction for audit (without sensitive data)
    console.log('Health marker extraction by user:', session.user.email, 
                'Total markers found:', healthMarkerExtraction.totalMarkersFound,
                'Critical markers:', healthMarkerExtraction.criticalMarkers.length,
                'High priority markers:', healthMarkerExtraction.highPriorityMarkers.length)

    return NextResponse.json({
      success: true,
      message: 'Marcadores de salud extraídos exitosamente del PDF',
      data: {
        extraction: {
          success: healthMarkerExtraction.success,
          totalMarkersFound: healthMarkerExtraction.totalMarkersFound,
          criticalMarkers: healthMarkerExtraction.criticalMarkers.map(formatMarkerResult),
          highPriorityMarkers: healthMarkerExtraction.highPriorityMarkers.map(formatMarkerResult),
          allMarkers: healthMarkerExtraction.results.map(formatMarkerResult)
        },
        analysis,
        textSample: textExtraction.fullText.substring(0, 500) + '...',
        recommendations: analysis.recommendations
      }
    })

  } catch (error) {
    console.error('Health marker extraction API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Formats marker result for API response (removes sensitive context)
 */
function formatMarkerResult(result: any) {
  return {
    systemCode: result.marker?.systemCode,
    spanishName: result.marker?.spanishName,
    category: result.marker?.category,
    priority: result.marker?.priority,
    unit: result.marker?.unit,
    confidence: result.confidence,
    position: result.position,
    contextSample: result.context?.substring(0, 100) || null
  }
}

/**
 * Analyzes health marker extraction quality
 */
function analyzeHealthMarkerExtraction(extraction: any): {
  totalMarkers: number
  criticalMarkers: number
  highPriorityMarkers: number
  categoryBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
  averageConfidence: number
  recommendations: string[]
} {
  const results = extraction.results || []
  
  const analysis = {
    totalMarkers: results.length,
    criticalMarkers: results.filter((r: any) => r.marker?.priority === 'critical').length,
    highPriorityMarkers: results.filter((r: any) => r.marker?.priority === 'high').length,
    categoryBreakdown: {} as Record<string, number>,
    priorityBreakdown: {} as Record<string, number>,
    averageConfidence: 0,
    recommendations: [] as string[]
  }
  
  // Calculate category and priority breakdowns
  for (const result of results) {
    const category = result.marker?.category || 'unknown'
    const priority = result.marker?.priority || 'unknown'
    
    analysis.categoryBreakdown[category] = (analysis.categoryBreakdown[category] || 0) + 1
    analysis.priorityBreakdown[priority] = (analysis.priorityBreakdown[priority] || 0) + 1
  }
  
  // Calculate average confidence
  if (results.length > 0) {
    const totalConfidence = results.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0)
    analysis.averageConfidence = Math.round(totalConfidence / results.length)
  }
  
  // Generate recommendations
  if (analysis.totalMarkers === 0) {
    analysis.recommendations.push('⚠️ No se encontraron marcadores de salud. Verificar formato del PDF.')
  } else {
    analysis.recommendations.push(`✅ Se encontraron ${analysis.totalMarkers} marcadores de salud`)
  }
  
  if (analysis.criticalMarkers > 0) {
    analysis.recommendations.push(`🚨 ${analysis.criticalMarkers} marcadores críticos detectados (glucosa, HbA1c, TSH)`)
  }
  
  if (analysis.highPriorityMarkers > 0) {
    analysis.recommendations.push(`⚡ ${analysis.highPriorityMarkers} marcadores de alta prioridad detectados`)
  }
  
  if (analysis.averageConfidence < 70) {
    analysis.recommendations.push('⚠️ Confianza promedio baja. Revisar manualmente los resultados.')
  } else if (analysis.averageConfidence > 90) {
    analysis.recommendations.push('✅ Alta confianza en la extracción de marcadores')
  }
  
  // Category-specific recommendations
  if (analysis.categoryBreakdown.glucose > 0) {
    analysis.recommendations.push('🩺 Marcadores de glucosa detectados - revisar para diabetes')
  }
  
  if (analysis.categoryBreakdown.thyroid > 0) {
    analysis.recommendations.push('🩺 Marcadores tiroideos detectados - revisar función tiroidea')
  }
  
  if (analysis.categoryBreakdown.liver > 0) {
    analysis.recommendations.push('🩺 Marcadores hepáticos detectados - revisar función hepática')
  }
  
  return analysis
}

/**
 * GET endpoint for testing health marker patterns
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for Spanish health marker extraction
    const testCases = [
      {
        id: 'glucose_fasting',
        description: 'Fasting glucose detection',
        text: 'GLICEMIA EN AYUNO (BASAL)    269    mg/dL    [ * ] 74 - 106',
        expectedMarkers: ['glucose_fasting'],
        expectedCategory: 'glucose',
        expectedPriority: 'critical'
      },
      {
        id: 'hba1c',
        description: 'HbA1c detection',
        text: 'HEMOGLOBINA GLICADA A1C    11.2    %    [ * ] 4.0 - 6.0',
        expectedMarkers: ['hba1c'],
        expectedCategory: 'glucose',
        expectedPriority: 'critical'
      },
      {
        id: 'tsh',
        description: 'TSH detection',
        text: 'H. TIROESTIMULANTE (TSH)    11.040    mUI/L    [ * ] 0.55 - 4.78',
        expectedMarkers: ['tsh'],
        expectedCategory: 'thyroid',
        expectedPriority: 'critical'
      },
      {
        id: 'cholesterol_total',
        description: 'Total cholesterol detection',
        text: 'COLESTEROL TOTAL    220    mg/dL    [ * ] < 200',
        expectedMarkers: ['cholesterol_total'],
        expectedCategory: 'lipids',
        expectedPriority: 'high'
      },
      {
        id: 'liver_enzymes',
        description: 'Liver enzymes detection',
        text: 'GOT (A.S.T)    45    U/L    [ * ] Hasta 34\nGPT (A.L.T)    52    U/L    [ * ] Hasta 36',
        expectedMarkers: ['ast', 'alt'],
        expectedCategory: 'liver',
        expectedPriority: 'high'
      },
      {
        id: 'multiple_markers',
        description: 'Multiple markers in lab report',
        text: `EXAMEN                    RESULTADO    UNIDAD    VALOR DE REFERENCIA
GLICEMIA EN AYUNO (BASAL)    269         mg/dL     [ * ] 74 - 106
COLESTEROL TOTAL             220         mg/dL     [ * ] < 200
H. TIROESTIMULANTE (TSH)     11.040      mUI/L     [ * ] 0.55 - 4.78
TRIGLICÉRIDOS               180         mg/dL     [ * ] < 150`,
        expectedMarkers: ['glucose_fasting', 'cholesterol_total', 'tsh', 'triglycerides'],
        expectedCategory: 'mixed',
        expectedPriority: 'mixed'
      },
      {
        id: 'accented_markers',
        description: 'Markers with Spanish accents',
        text: 'TRIGLICÉRIDOS    180    mg/dL    [ * ] < 150\nÁCIDO ÚRICO    7.2    mg/dL    [ * ] 3.5 - 7.0',
        expectedMarkers: ['triglycerides', 'uric_acid'],
        expectedCategory: 'mixed',
        expectedPriority: 'mixed'
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const extraction = extractSpanishHealthMarkers(testCase.text)
      
      const foundMarkers = extraction.results.map(r => r.marker?.systemCode).filter(Boolean)
      const expectedFound = testCase.expectedMarkers.every(expected => 
        foundMarkers.includes(expected)
      )
      
      const passed = expectedFound && extraction.success
      
      if (passed) {
        passedTests++
      }
      
      results.push({
        id: testCase.id,
        description: testCase.description,
        text: testCase.text.substring(0, 100) + (testCase.text.length > 100 ? '...' : ''),
        expected: {
          markers: testCase.expectedMarkers,
          category: testCase.expectedCategory,
          priority: testCase.expectedPriority
        },
        actual: {
          markers: foundMarkers,
          totalFound: extraction.totalMarkersFound,
          criticalCount: extraction.criticalMarkers.length,
          highPriorityCount: extraction.highPriorityMarkers.length
        },
        passed,
        extraction: {
          success: extraction.success,
          results: extraction.results.map(formatMarkerResult)
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('Health marker tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de marcadores de salud completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        criticalMarkers: getCriticalHealthMarkers().map(marker => ({
          systemCode: marker.systemCode,
          spanishName: marker.spanishName,
          category: marker.category,
          priority: marker.priority,
          unit: marker.unit
        }))
      }
    })

  } catch (error) {
    console.error('Health marker testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}