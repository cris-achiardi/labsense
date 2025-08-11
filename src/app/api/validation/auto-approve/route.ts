import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { parseChileanRUTsFromText } from '@/lib/pdf-parsing/chilean-rut-parser'
import { extractSpanishHealthMarkers } from '@/lib/pdf-parsing/spanish-health-markers'
import { extractReferenceRanges } from '@/lib/pdf-parsing/reference-range-parser'
import { detectAbnormalValues } from '@/lib/pdf-parsing/abnormal-value-detector'
import { calculateOverallConfidence } from '@/lib/validation/confidence-scoring'
import { 
  evaluateAutoApproval, 
  processAutoApprovedReport 
} from '@/lib/validation/auto-approval'

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

    const startTime = Date.now()

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

    // Evaluate auto-approval
    const autoApprovalDecision = evaluateAutoApproval(
      confidenceResult,
      abnormalDetection,
      rutExtraction
    )

    // Process if auto-approved
    let processedResult = null
    if (autoApprovalDecision.approved) {
      processedResult = processAutoApprovedReport(
        confidenceResult,
        abnormalDetection,
        rutExtraction,
        autoApprovalDecision
      )
    }

    const totalProcessingTime = Date.now() - startTime

    // Log auto-approval decision for audit
    console.log('Auto-approval decision by user:', session.user.email,
                'Approved:', autoApprovalDecision.approved,
                'Confidence:', autoApprovalDecision.confidence,
                'Risk level:', autoApprovalDecision.riskLevel,
                'Processing time:', totalProcessingTime + 'ms')

    return NextResponse.json({
      success: true,
      message: autoApprovalDecision.approved 
        ? 'Reporte aprobado automáticamente y procesado'
        : 'Reporte requiere revisión manual',
      data: {
        autoApproval: {
          approved: autoApprovalDecision.approved,
          reason: autoApprovalDecision.reason,
          confidence: autoApprovalDecision.confidence,
          riskLevel: autoApprovalDecision.riskLevel,
          requiresReview: autoApprovalDecision.requiresReview,
          processingRecommendation: autoApprovalDecision.processingRecommendation,
          safeguards: autoApprovalDecision.safeguards,
          decisionCriteria: autoApprovalDecision.auditInfo.decisionCriteria,
          overrides: autoApprovalDecision.auditInfo.overrides
        },
        processed: processedResult ? {
          patientRUT: processedResult.patientRUT,
          priorityLevel: processedResult.priorityLevel,
          priorityScore: processedResult.priorityScore,
          abnormalitiesFound: processedResult.abnormalitiesFound,
          criticalAbnormalities: processedResult.criticalAbnormalities,
          qualityScore: processedResult.qualityScore,
          recommendations: processedResult.recommendations,
          nextActions: processedResult.nextActions,
          processingTime: processedResult.processingTime
        } : null,
        confidence: {
          overallScore: confidenceResult.overallScore,
          recommendation: confidenceResult.recommendation,
          components: confidenceResult.components.map(formatComponentResult),
          qualityMetrics: confidenceResult.qualityMetrics,
          riskFactors: confidenceResult.riskFactors
        },
        performance: {
          totalProcessingTime,
          extractionTime: 0, // PDF extraction time not tracked separately
          analysisTime: totalProcessingTime
        }
      }
    })

  } catch (error) {
    console.error('Auto-approval API error:', error)
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
    weight: Math.round(component.weight * 100),
    details: component.details,
    issues: component.issues,
    status: component.score >= 85 ? 'excellent' : 
            component.score >= 70 ? 'good' : 
            component.score >= 50 ? 'fair' : 'poor'
  }
}/**

 * GET endpoint for testing auto-approval with sample cases
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for auto-approval validation
    const testCases = [
      {
        id: 'high_confidence_auto_approve',
        description: 'High confidence case - should auto-approve',
        mockData: {
          confidence: {
            overallScore: 92,
            recommendation: 'auto_approve',
            components: [
              { component: 'rut', score: 95, weight: 0.2, issues: [] },
              { component: 'health_markers', score: 90, weight: 0.3, issues: [] },
              { component: 'reference_ranges', score: 88, weight: 0.25, issues: [] },
              { component: 'abnormal_values', score: 94, weight: 0.25, issues: [] }
            ],
            qualityMetrics: { completeness: 85, accuracy: 90, consistency: 88 },
            riskFactors: []
          },
          abnormal: {
            success: true,
            totalAbnormalities: 1,
            criticalAbnormalities: [],
            severeAbnormalities: [],
            overallPriorityScore: 15
          },
          rut: {
            success: true,
            bestMatch: { confidence: 95, success: true, formattedRut: '12.345.678-9' }
          }
        },
        expectedApproved: true,
        expectedRisk: 'low'
      },
      {
        id: 'medium_confidence_manual_review',
        description: 'Medium confidence case - should require manual review',
        mockData: {
          confidence: {
            overallScore: 78,
            recommendation: 'manual_review',
            components: [
              { component: 'rut', score: 85, weight: 0.2, issues: [] },
              { component: 'health_markers', score: 75, weight: 0.3, issues: ['Few health markers detected'] },
              { component: 'reference_ranges', score: 70, weight: 0.25, issues: [] },
              { component: 'abnormal_values', score: 80, weight: 0.25, issues: [] }
            ],
            qualityMetrics: { completeness: 75, accuracy: 78, consistency: 70 },
            riskFactors: ['⚠️ MEDIO: Pocos marcadores detectados - análisis limitado']
          },
          abnormal: {
            success: true,
            totalAbnormalities: 2,
            criticalAbnormalities: [],
            severeAbnormalities: [{}],
            overallPriorityScore: 25
          },
          rut: {
            success: true,
            bestMatch: { confidence: 85, success: true, formattedRut: '12.345.678-9' }
          }
        },
        expectedApproved: false,
        expectedRisk: 'medium'
      },
      {
        id: 'critical_abnormalities_override',
        description: 'High confidence but critical abnormalities - should override to manual review',
        mockData: {
          confidence: {
            overallScore: 88,
            recommendation: 'auto_approve',
            components: [
              { component: 'rut', score: 90, weight: 0.2, issues: [] },
              { component: 'health_markers', score: 88, weight: 0.3, issues: [] },
              { component: 'reference_ranges', score: 85, weight: 0.25, issues: [] },
              { component: 'abnormal_values', score: 90, weight: 0.25, issues: [] }
            ],
            qualityMetrics: { completeness: 90, accuracy: 88, consistency: 85 },
            riskFactors: []
          },
          abnormal: {
            success: true,
            totalAbnormalities: 5,
            criticalAbnormalities: [{}, {}, {}, {}], // 4 critical abnormalities
            severeAbnormalities: [{}],
            overallPriorityScore: 75
          },
          rut: {
            success: true,
            bestMatch: { confidence: 90, success: true, formattedRut: '12.345.678-9' }
          }
        },
        expectedApproved: false, // Should be overridden due to too many critical abnormalities
        expectedRisk: 'critical'
      },
      {
        id: 'low_rut_confidence_override',
        description: 'High overall confidence but low RUT confidence - should override',
        mockData: {
          confidence: {
            overallScore: 86,
            recommendation: 'auto_approve',
            components: [
              { component: 'rut', score: 65, weight: 0.2, issues: ['RUT format invalid'] }, // Low RUT confidence
              { component: 'health_markers', score: 95, weight: 0.3, issues: [] },
              { component: 'reference_ranges', score: 90, weight: 0.25, issues: [] },
              { component: 'abnormal_values', score: 92, weight: 0.25, issues: [] }
            ],
            qualityMetrics: { completeness: 85, accuracy: 86, consistency: 80 },
            riskFactors: ['⚠️ ALTO: RUT con formato inválido - verificar identidad del paciente']
          },
          abnormal: {
            success: true,
            totalAbnormalities: 1,
            criticalAbnormalities: [],
            severeAbnormalities: [],
            overallPriorityScore: 10
          },
          rut: {
            success: false, // Invalid RUT
            bestMatch: { confidence: 65, success: false, formattedRut: null }
          }
        },
        expectedApproved: false, // Should be overridden due to low RUT confidence
        expectedRisk: 'high'
      },
      {
        id: 'normal_values_auto_approve',
        description: 'High confidence with normal values - should auto-approve',
        mockData: {
          confidence: {
            overallScore: 89,
            recommendation: 'auto_approve',
            components: [
              { component: 'rut', score: 92, weight: 0.2, issues: [] },
              { component: 'health_markers', score: 88, weight: 0.3, issues: [] },
              { component: 'reference_ranges', score: 85, weight: 0.25, issues: [] },
              { component: 'abnormal_values', score: 90, weight: 0.25, issues: [] }
            ],
            qualityMetrics: { completeness: 88, accuracy: 89, consistency: 85 },
            riskFactors: []
          },
          abnormal: {
            success: true,
            totalAbnormalities: 0, // No abnormalities
            criticalAbnormalities: [],
            severeAbnormalities: [],
            overallPriorityScore: 0
          },
          rut: {
            success: true,
            bestMatch: { confidence: 92, success: true, formattedRut: '12.345.678-9' }
          }
        },
        expectedApproved: true,
        expectedRisk: 'low'
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const autoApprovalDecision = evaluateAutoApproval(
        testCase.mockData.confidence as any,
        testCase.mockData.abnormal as any,
        testCase.mockData.rut as any
      )

      let processedResult = null
      if (autoApprovalDecision.approved) {
        processedResult = processAutoApprovedReport(
          testCase.mockData.confidence as any,
          testCase.mockData.abnormal as any,
          testCase.mockData.rut as any,
          autoApprovalDecision
        )
      }

      // Check if test passed
      const approvalMatch = autoApprovalDecision.approved === testCase.expectedApproved
      const riskMatch = autoApprovalDecision.riskLevel === testCase.expectedRisk
      const passed = approvalMatch && riskMatch

      if (passed) {
        passedTests++
      }

      results.push({
        id: testCase.id,
        description: testCase.description,
        expected: {
          approved: testCase.expectedApproved,
          riskLevel: testCase.expectedRisk
        },
        actual: {
          approved: autoApprovalDecision.approved,
          riskLevel: autoApprovalDecision.riskLevel,
          confidence: autoApprovalDecision.confidence,
          reason: autoApprovalDecision.reason,
          processingRecommendation: autoApprovalDecision.processingRecommendation,
          safeguards: autoApprovalDecision.safeguards.length,
          overrides: autoApprovalDecision.auditInfo.overrides.length
        },
        processed: processedResult ? {
          priorityLevel: processedResult.priorityLevel,
          priorityScore: processedResult.priorityScore,
          abnormalitiesFound: processedResult.abnormalitiesFound,
          recommendations: processedResult.recommendations.length,
          nextActions: processedResult.nextActions.length
        } : null,
        passed,
        details: {
          approvalMatch,
          riskMatch,
          decisionCriteria: autoApprovalDecision.auditInfo.decisionCriteria
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('Auto-approval tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de aprobación automática completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        configuration: {
          minConfidence: 85,
          minRutConfidence: 80,
          minMarkerConfidence: 75,
          maxCriticalAbnormalities: 3,
          maxRiskFactors: 2,
          minCompleteness: 70,
          minAccuracy: 80
        },
        processingRecommendations: {
          auto_process: 'Procesamiento automático - alta confianza y bajo riesgo',
          manual_review: 'Revisión manual requerida - confianza media o riesgo elevado',
          escalate: 'Escalar a especialista - casos críticos o complejos',
          reject: 'Rechazar - confianza insuficiente para procesamiento'
        }
      }
    })

  } catch (error) {
    console.error('Auto-approval testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}