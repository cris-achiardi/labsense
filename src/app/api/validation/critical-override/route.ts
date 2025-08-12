import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { parseChileanRUTsFromText } from '@/lib/pdf-parsing/chilean-rut-parser'
import { extractSpanishHealthMarkers } from '@/lib/pdf-parsing/spanish-health-markers'
import { extractReferenceRanges } from '@/lib/pdf-parsing/reference-range-parser'
import { detectAbnormalValues } from '@/lib/pdf-parsing/abnormal-value-detector'
import { calculateOverallConfidence } from '@/lib/validation/confidence-scoring'
import { 
  evaluateCriticalValues, 
  CRITICAL_VALUE_THRESHOLDS,
  getCriticalThreshold 
} from '@/lib/validation/critical-value-override'

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

    // Evaluate critical values
    const criticalOverride = evaluateCriticalValues(
      abnormalDetection.results,
      confidenceResult
    )

    const totalProcessingTime = Date.now() - startTime

    // Log critical value evaluation for audit
    console.log('Critical value evaluation by user:', session.user.email,
                'Critical alerts:', criticalOverride.totalCriticalCount,
                'Life threatening:', criticalOverride.lifeThreatening,
                'Override recommendation:', criticalOverride.overrideRecommendation,
                'Bypass low confidence:', criticalOverride.bypassLowConfidence)

    return NextResponse.json({
      success: true,
      message: criticalOverride.hasCriticalValues 
        ? `${criticalOverride.totalCriticalCount} valores críticos detectados - procesamiento prioritario activado`
        : 'No se detectaron valores críticos - procesamiento estándar',
      data: {
        criticalOverride: {
          hasCriticalValues: criticalOverride.hasCriticalValues,
          totalCriticalCount: criticalOverride.totalCriticalCount,
          lifeThreatening: criticalOverride.lifeThreatening,
          requiresImmediateAction: criticalOverride.requiresImmediateAction,
          overrideRecommendation: criticalOverride.overrideRecommendation,
          escalationLevel: criticalOverride.escalationLevel,
          bypassLowConfidence: criticalOverride.bypassLowConfidence,
          criticalAlerts: criticalOverride.criticalAlerts.map(formatCriticalAlert)
        },
        originalAnalysis: {
          confidence: confidenceResult.overallScore,
          recommendation: confidenceResult.recommendation,
          abnormalities: abnormalDetection.totalAbnormalities,
          criticalAbnormalities: abnormalDetection.criticalAbnormalities.length
        },
        processing: {
          finalRecommendation: criticalOverride.bypassLowConfidence 
            ? 'critical_override_processing' 
            : confidenceResult.recommendation,
          priorityLevel: criticalOverride.requiresImmediateAction ? 'EMERGENCY' :
                        criticalOverride.escalationLevel === 'urgent' ? 'CRITICAL' :
                        'STANDARD',
          timeToAction: criticalOverride.requiresImmediateAction ? '< 1 hora' :
                       criticalOverride.escalationLevel === 'urgent' ? '< 4 horas' :
                       'Rutinario',
          escalationRequired: criticalOverride.criticalAlerts.some(a => a.escalationRequired)
        },
        performance: {
          totalProcessingTime,
          criticalEvaluationTime: totalProcessingTime // Would be separate in real implementation
        }
      }
    })

  } catch (error) {
    console.error('Critical value override API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Formats critical alert for API response
 */
function formatCriticalAlert(alert: any) {
  return {
    id: alert.id,
    markerName: alert.markerName,
    value: alert.value,
    unit: alert.unit,
    severity: alert.severity,
    urgency: alert.urgency,
    clinicalRisk: alert.clinicalRisk,
    timeToAction: alert.timeToAction,
    escalationRequired: alert.escalationRequired,
    recommendedActions: alert.recommendedActions,
    overrideReason: alert.overrideReason,
    originalConfidence: alert.originalConfidence,
    threshold: {
      criticalHigh: alert.threshold.criticalHigh,
      criticalLow: alert.threshold.criticalLow,
      category: alert.threshold.category,
      description: alert.threshold.description
    }
  }
}

/**
 * GET endpoint for testing critical value override with sample cases
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Test cases for critical value override validation
    const testCases = [
      {
        id: 'life_threatening_glucose',
        description: 'Life-threatening glucose level (>400)',
        mockAbnormalResults: [{
          healthMarker: { marker: { systemCode: 'glucose_fasting', spanishName: 'GLICEMIA EN AYUNO' } },
          labValue: { value: 450 },
          confidence: 45 // Low confidence but critical value
        }],
        mockConfidence: { overallScore: 45 },
        expectedCritical: true,
        expectedLifeThreatening: 1,
        expectedBypass: true,
        expectedEscalation: 'emergency'
      },
      {
        id: 'severe_anemia',
        description: 'Severe anemia requiring immediate attention',
        mockAbnormalResults: [{
          healthMarker: { marker: { systemCode: 'hemoglobin', spanishName: 'HEMOGLOBINA' } },
          labValue: { value: 4.5 },
          confidence: 60
        }],
        mockConfidence: { overallScore: 60 },
        expectedCritical: true,
        expectedLifeThreatening: 1,
        expectedBypass: true,
        expectedEscalation: 'emergency'
      },
      {
        id: 'critical_kidney_failure',
        description: 'Critical kidney failure',
        mockAbnormalResults: [{
          healthMarker: { marker: { systemCode: 'creatinine', spanishName: 'CREATININA' } },
          labValue: { value: 8.0 },
          confidence: 75
        }],
        mockConfidence: { overallScore: 75 },
        expectedCritical: true,
        expectedLifeThreatening: 0,
        expectedBypass: false, // High enough confidence
        expectedEscalation: 'urgent'
      },
      {
        id: 'multiple_critical_values',
        description: 'Multiple critical values - glucose + liver',
        mockAbnormalResults: [
          {
            healthMarker: { marker: { systemCode: 'glucose_fasting', spanishName: 'GLICEMIA EN AYUNO' } },
            labValue: { value: 420 },
            confidence: 50
          },
          {
            healthMarker: { marker: { systemCode: 'ast', spanishName: 'GOT (A.S.T)' } },
            labValue: { value: 1200 },
            confidence: 65
          }
        ],
        mockConfidence: { overallScore: 55 },
        expectedCritical: true,
        expectedLifeThreatening: 1,
        expectedBypass: true,
        expectedEscalation: 'emergency'
      },
      {
        id: 'high_confidence_normal',
        description: 'High confidence with normal values',
        mockAbnormalResults: [{
          healthMarker: { marker: { systemCode: 'glucose_fasting', spanishName: 'GLICEMIA EN AYUNO' } },
          labValue: { value: 95 },
          confidence: 90
        }],
        mockConfidence: { overallScore: 90 },
        expectedCritical: false,
        expectedLifeThreatening: 0,
        expectedBypass: false,
        expectedEscalation: 'routine'
      },
      {
        id: 'borderline_critical_tsh',
        description: 'Borderline critical TSH',
        mockAbnormalResults: [{
          healthMarker: { marker: { systemCode: 'tsh', spanishName: 'H. TIROESTIMULANTE (TSH)' } },
          labValue: { value: 45 },
          confidence: 80
        }],
        mockConfidence: { overallScore: 80 },
        expectedCritical: false, // Below 50 threshold
        expectedLifeThreatening: 0,
        expectedBypass: false,
        expectedEscalation: 'routine'
      }
    ]

    const results = []
    let passedTests = 0
    const totalTests = testCases.length

    // Run each test case
    for (const testCase of testCases) {
      const criticalOverride = evaluateCriticalValues(
        testCase.mockAbnormalResults as any,
        testCase.mockConfidence as any
      )

      // Check if test passed
      const criticalMatch = criticalOverride.hasCriticalValues === testCase.expectedCritical
      const lifeThreatMatch = criticalOverride.lifeThreatening === testCase.expectedLifeThreatening
      const bypassMatch = criticalOverride.bypassLowConfidence === testCase.expectedBypass
      const escalationMatch = criticalOverride.escalationLevel === testCase.expectedEscalation

      const passed = criticalMatch && lifeThreatMatch && bypassMatch && escalationMatch

      if (passed) {
        passedTests++
      }

      results.push({
        id: testCase.id,
        description: testCase.description,
        expected: {
          critical: testCase.expectedCritical,
          lifeThreatening: testCase.expectedLifeThreatening,
          bypass: testCase.expectedBypass,
          escalation: testCase.expectedEscalation
        },
        actual: {
          critical: criticalOverride.hasCriticalValues,
          lifeThreatening: criticalOverride.lifeThreatening,
          bypass: criticalOverride.bypassLowConfidence,
          escalation: criticalOverride.escalationLevel,
          totalAlerts: criticalOverride.totalCriticalCount,
          recommendation: criticalOverride.overrideRecommendation
        },
        criticalAlerts: criticalOverride.criticalAlerts.map(formatCriticalAlert),
        passed,
        details: {
          criticalMatch,
          lifeThreatMatch,
          bypassMatch,
          escalationMatch
        }
      })
    }

    const successRate = Math.round((passedTests / totalTests) * 100)

    // Log test results for debugging
    console.log('Critical value override tests by user:', session.user.email,
                'Passed:', passedTests, '/', totalTests,
                'Success rate:', successRate + '%')

    return NextResponse.json({
      success: true,
      message: `Pruebas de valores críticos completadas: ${passedTests}/${totalTests} exitosas (${successRate}%)`,
      data: {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results,
        thresholds: {
          total: CRITICAL_VALUE_THRESHOLDS.length,
          categories: Array.from(new Set(CRITICAL_VALUE_THRESHOLDS.map(t => t.category))),
          description: 'Umbrales críticos definidos para valores potencialmente mortales'
        },
        escalationLevels: {
          emergency: 'Valores potencialmente mortales - acción inmediata (<1 hora)',
          urgent: 'Valores críticos - acción urgente (<4 horas)',
          routine: 'Procesamiento estándar - seguimiento rutinario'
        }
      }
    })

  } catch (error) {
    console.error('Critical value override testing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}