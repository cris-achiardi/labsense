import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { parseChileanRUTsFromText } from '@/lib/pdf-parsing/chilean-rut-parser'
import { extractSpanishHealthMarkers } from '@/lib/pdf-parsing/spanish-health-markers'
import { extractReferenceRanges } from '@/lib/pdf-parsing/reference-range-parser'
import { detectAbnormalValues } from '@/lib/pdf-parsing/abnormal-value-detector'
import { 
  calculateOverallConfidence, 
  getConfidenceLevelDescription 
} from '@/lib/validation/confidence-scoring'

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

    // Run all parsing components
    const rutExtraction = parseChileanRUTsFromText(textExtraction.firstPageText)
    const markerExtraction = extractSpanishHealthMarkers(textExtraction.fullText)
    const rangeExtraction = extractReferenceRanges(textExtraction.fullText)
    const abnormalDetection = detectAbnormalValues(textExtraction.fullText)

    // Calculate overall confidence
    const confidenceResult = calculateOverallConfidence(
      rutExtraction,
      markerExtraction,
      rangeExtraction,
      abnormalDetection
    )

    // Get confidence level description
    const confidenceLevel = getConfidenceLevelDescription(confidenceResult.overallScore)

    // Log confidence scoring for audit
    console.log('Confidence scoring by user:', session.user.email,
                'Overall score:', confidenceResult.overallScore,
                'Recommendation:', confidenceResult.recommendation,
                'Risk factors:', confidenceResult.riskFactors.length)

    return NextResponse.json({
      success: true,
      message: 'Análisis de confianza completado exitosamente',
      data: {
        confidence: {
          overallScore: confidenceResult.overallScore,
          recommendation: confidenceResult.recommendation,
          level: confidenceLevel,
          components: confidenceResult.components.map(formatComponentResult),
          qualityMetrics: confidenceResult.qualityMetrics,
          riskFactors: confidenceResult.riskFactors,
          approvalThresholds: confidenceResult.approvalThresholds
        },
        parsing: {
          rut: {
            success: rutExtraction.success,
            bestMatch: rutExtraction.bestMatch ? {
              rut: rutExtraction.bestMatch.formattedRut || rutExtraction.bestMatch.rut,
              confidence: rutExtraction.bestMatch.confidence,
              source: rutExtraction.bestMatch.source
            } : null
          },
          healthMarkers: {
            success: markerExtraction.success,
            totalFound: markerExtraction.totalMarkersFound,
            criticalCount: markerExtraction.criticalMarkers.length,
            highPriorityCount: markerExtraction.highPriorityMarkers.length
          },
          referenceRanges: {
            success: rangeExtraction.success,
            totalFound: rangeExtraction.totalRangesFound
          },
          abnormalValues: {
            success: abnormalDetection.success,
            totalAbnormalities: abnormalDetection.totalAbnormalities,
            criticalCount: abnormalDetection.criticalAbnormalities.length,
            severeCount: abnormalDetection.severeAbnormalities.length,
            overallPriorityScore: abnormalDetection.overallPriorityScore
          }
        },
        textSample: textExtraction.fullText.substring(0, 300) + '...'
      }
    })

  } catch (error) {
    console.error('Confidence scoring API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Formats component result for API response
 */
function formatComponentResult(component: any) {
  return {
    component: component.component,
    score: component.score,
    weight: Math.round(component.weight * 100), // Convert to percentage
    details: component.details,
    issues: component.issues,
    status: component.score >= 85 ? 'excellent' : 
            component.score >= 70 ? 'good' : 
            component.score >= 50 ? 'fair' : 'poor'
  }
}/**
 *
 GET endpoint for testing confidence scoring with sample cases
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for confidence scoring validation
    const testCases = [
      {
        id: 'high_confidence_case',
        description: 'High confidence case - complete lab report',
        mockData: {
          rut: { success: true, bestMatch: { confidence: 95, success: true, source: 'form' }, results: [{}] },
          markers: { success: true, totalMarkersFound: 8, criticalMarkers: [1, 2], highPriorityMarkers: [1, 2, 3], results: Array(8).fill({ confidence: 90 }) },
          ranges: { success: true, totalRangesFound: 6, results: Array(6).fill({ confidence: 88 }) },
          abnormal: { success: true, results: Array(8).fill({ confidence: 85, labValue: {} }), totalAbnormalities: 2, criticalAbnormalities: [1], severeAbnormalities: [] }
        },
        expectedScore: 85, // Should be auto-approved
        expectedRecommendation: 'auto_approve'
      },
      {
        id: 'medium_confidence_case',
        description: 'Medium confidence case - some missing data',
        mockData: {
          rut: { success: true, bestMatch: { confidence: 85, success: true, source: 'body' }, results: [{}] },
          markers: { success: true, totalMarkersFound: 4, criticalMarkers: [1], highPriorityMarkers: [1], results: Array(4).fill({ confidence: 75 }) },
          ranges: { success: true, totalRangesFound: 2, results: Array(2).fill({ confidence: 70 }) },
          abnormal: { success: true, results: Array(4).fill({ confidence: 70, labValue: {} }), totalAbnormalities: 1, criticalAbnormalities: [], severeAbnormalities: [1] }
        },
        expectedScore: 75, // Should require manual review
        expectedRecommendation: 'manual_review'
      },
      {
        id: 'low_confidence_case',
        description: 'Low confidence case - significant parsing issues',
        mockData: {
          rut: { success: false, bestMatch: null, results: [] },
          markers: { success: true, totalMarkersFound: 2, criticalMarkers: [], highPriorityMarkers: [], results: Array(2).fill({ confidence: 60 }) },
          ranges: { success: false, totalRangesFound: 0, results: [] },
          abnormal: { success: true, results: Array(2).fill({ confidence: 50, labValue: null }), totalAbnormalities: 0, criticalAbnormalities: [], severeAbnormalities: [] }
        },
        expectedScore: 45, // Should be rejected
        expectedRecommendation: 'reject'
      },
      {
        id: 'critical_case',
        description: 'Critical case - multiple severe abnormalities',
        mockData: {
          rut: { success: true, bestMatch: { confidence: 98, success: true, source: 'form' }, results: [{}] },
          markers: { success: true, totalMarkersFound: 10, criticalMarkers: [1, 2, 3], highPriorityMarkers: [1, 2, 3, 4], results: Array(10).fill({ confidence: 92 }) },
          ranges: { success: true, totalRangesFound: 8, results: Array(8).fill({ confidence: 90 }) },
          abnormal: { success: true, results: Array(10).fill({ confidence: 88, labValue: {} }), totalAbnormalities: 5, criticalAbnormalities: [1, 2], severeAbnormalities: [1, 2, 3] }
        },
        expectedScore: 90, // Should be auto-approved with high priority
        expectedRecommendation: 'auto_approve'
      },
      {
        id: 'incomplete_extraction',
        description: 'Incomplete extraction - partial data',
        mockData: {
          rut: { success: true, bestMatch: { confidence: 80, success: true, source: 'table' }, results: [{}] },
          markers: { success: true, totalMarkersFound: 6, criticalMarkers: [1], highPriorityMarkers: [1, 2], results: Array(6).fill({ confidence: 78 }) },
          ranges: { success: true, totalRangesFound: 3, results: Array(3).fill({ confidence: 75 }) },
          abnormal: { success: true, results: Array(6).fill({ confidence: 65, labValue: {} }), totalAbnormalities: 1, criticalAbnormalities: [], severeAbnormalities: [] }
        },
        expectedScore: 72, // Should require manual review
        expectedRecommendation: 'manual_review'
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const confidenceResult = calculateOverallConfidence(
        testCase.mockData.rut as any,
        testCase.mockData.markers as any,
        testCase.mockData.ranges as any,
        testCase.mockData.abnormal as any
      )

      const confidenceLevel = getConfidenceLevelDescription(confidenceResult.overallScore)

      // Check if test passed (within 10 points of expected score)
      const scoreMatch = Math.abs(confidenceResult.overallScore - testCase.expectedScore) <= 10
      const recommendationMatch = confidenceResult.recommendation === testCase.expectedRecommendation
      const passed = scoreMatch && recommendationMatch

      if (passed) {
        passedTests++
      }

      results.push({
        id: testCase.id,
        description: testCase.description,
        expected: {
          score: testCase.expectedScore,
          recommendation: testCase.expectedRecommendation
        },
        actual: {
          score: confidenceResult.overallScore,
          recommendation: confidenceResult.recommendation,
          level: confidenceLevel.level,
          riskFactors: confidenceResult.riskFactors.length
        },
        components: confidenceResult.components.map(formatComponentResult),
        qualityMetrics: confidenceResult.qualityMetrics,
        passed,
        details: {
          scoreMatch,
          recommendationMatch,
          scoreDifference: Math.abs(confidenceResult.overallScore - testCase.expectedScore)
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('Confidence scoring tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de puntuación de confianza completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        thresholds: {
          autoApprove: 85,
          manualReview: 70,
          reject: 50,
          description: 'Umbrales de confianza para toma de decisiones'
        },
        components: {
          rut: { weight: '20%', description: 'Identificación del paciente' },
          health_markers: { weight: '30%', description: 'Datos médicos principales' },
          reference_ranges: { weight: '25%', description: 'Rangos de referencia' },
          abnormal_values: { weight: '25%', description: 'Detección de valores anormales' }
        }
      }
    })

  } catch (error) {
    console.error('Confidence scoring testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}