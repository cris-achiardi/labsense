import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

/**
 * Manual Review API for Chilean Lab Reports
 * Manages the queue and processing of lab reports requiring manual review
 */

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const riskLevel = searchParams.get('riskLevel')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock data for demonstration - in real app, this would query the database
    const mockReviews = [
      {
        id: '1',
        patientRUT: '12.345.678-9',
        patientName: 'María González',
        uploadDate: '2024-01-15T14:30:00Z',
        confidence: 65,
        riskLevel: 'high',
        status: 'pending',
        assignedTo: null,
        riskFactors: [
          '⚠️ ALTO: Múltiples RUTs detectados - posible confusión de pacientes',
          '⚠️ MEDIO: Pocos marcadores detectados - análisis limitado'
        ],
        components: [
          {
            component: 'rut',
            score: 75,
            issues: ['Multiple RUTs detected'],
            details: 'RUT: 12.345.678-9, Fuente: body, Confianza: 75%'
          },
          {
            component: 'health_markers',
            score: 60,
            issues: ['Few health markers detected'],
            details: '3 marcadores encontrados (1 críticos, 1 alta prioridad)'
          }
        ],
        abnormalities: [
          {
            marker: 'GLICEMIA EN AYUNO (BASAL)',
            value: '180 mg/dL',
            referenceRange: '74 - 106',
            severity: 'moderate',
            priority: 'critical'
          }
        ],
        recommendations: [
          '⚠️ Confianza insuficiente (65% < 70%) - requiere revisión manual',
          '🚨 2 valores anormales detectados'
        ],
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        patientRUT: null,
        patientName: null,
        uploadDate: '2024-01-15T15:45:00Z',
        confidence: 45,
        riskLevel: 'critical',
        status: 'pending',
        assignedTo: null,
        riskFactors: [
          '🚨 CRÍTICO: No se pudo identificar al paciente (RUT faltante)',
          '⚠️ MEDIO: Sin rangos de referencia - validación limitada'
        ],
        components: [
          {
            component: 'rut',
            score: 0,
            issues: ['No RUT found', 'Patient identification failed'],
            details: 'No se pudo extraer RUT del paciente'
          }
        ],
        abnormalities: [],
        recommendations: [
          '🚨 CRÍTICO: No se pudo identificar al paciente (RUT faltante)'
        ],
        createdAt: '2024-01-15T15:45:00Z',
        updatedAt: '2024-01-15T15:45:00Z'
      }
    ]

    // Filter by status and risk level
    let filteredReviews = mockReviews.filter(review => review.status === status)
    
    if (riskLevel && riskLevel !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.riskLevel === riskLevel)
    }

    // Apply pagination
    const total = filteredReviews.length
    const paginatedReviews = filteredReviews.slice(offset, offset + limit)

    // Log request for audit
    console.log('Manual review queue accessed by user:', session.user.email,
                'Status:', status, 'Risk level:', riskLevel,
                'Results:', paginatedReviews.length, '/', total)

    return NextResponse.json({
      success: true,
      message: 'Cola de revisión manual obtenida exitosamente',
      data: {
        reviews: paginatedReviews,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        summary: {
          pending: mockReviews.filter(r => r.status === 'pending').length,
          inReview: mockReviews.filter(r => r.status === 'in_review').length,
          completed: mockReviews.filter(r => r.status === 'completed').length,
          riskDistribution: {
            critical: mockReviews.filter(r => r.riskLevel === 'critical').length,
            high: mockReviews.filter(r => r.riskLevel === 'high').length,
            medium: mockReviews.filter(r => r.riskLevel === 'medium').length,
            low: mockReviews.filter(r => r.riskLevel === 'low').length
          }
        }
      }
    })

  } catch (error) {
    console.error('Manual review queue API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * POST endpoint for processing manual review decisions
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { reviewId, action, reason, notes, corrections } = await request.json()

    if (!reviewId || !action) {
      return NextResponse.json({ 
        error: 'ID de revisión y acción son requeridos' 
      }, { status: 400 })
    }

    if (!['approve', 'reject', 'request_info', 'correct'].includes(action)) {
      return NextResponse.json({ 
        error: 'Acción inválida' 
      }, { status: 400 })
    }

    // Validate required fields based on action
    if (action === 'reject' && !reason) {
      return NextResponse.json({ 
        error: 'Razón es requerida para rechazar' 
      }, { status: 400 })
    }

    // Mock processing - in real app, this would update the database
    const reviewDecision = {
      reviewId,
      action,
      reason: reason || null,
      notes: notes || null,
      corrections: corrections || null,
      reviewedBy: session.user.email,
      reviewedAt: new Date().toISOString(),
      status: action === 'approve' ? 'approved' : 
              action === 'reject' ? 'rejected' :
              action === 'request_info' ? 'info_requested' :
              'corrected'
    }

    // Log review decision for audit
    console.log('Manual review decision by user:', session.user.email,
                'Review ID:', reviewId, 'Action:', action,
                'Has reason:', !!reason, 'Has notes:', !!notes)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: `Revisión ${action === 'approve' ? 'aprobada' : 
                           action === 'reject' ? 'rechazada' :
                           action === 'request_info' ? 'información solicitada' :
                           'corregida'} exitosamente`,
      data: {
        decision: reviewDecision,
        nextActions: generateNextActions(action, reviewDecision)
      }
    })

  } catch (error) {
    console.error('Manual review decision API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * PUT endpoint for assigning reviews to healthcare workers
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { reviewId, assignTo } = await request.json()

    if (!reviewId) {
      return NextResponse.json({ 
        error: 'ID de revisión es requerido' 
      }, { status: 400 })
    }

    // Mock assignment - in real app, this would update the database
    const assignment = {
      reviewId,
      assignedTo: assignTo || session.user.email,
      assignedBy: session.user.email,
      assignedAt: new Date().toISOString(),
      status: 'in_review'
    }

    // Log assignment for audit
    console.log('Review assigned by user:', session.user.email,
                'Review ID:', reviewId, 'Assigned to:', assignment.assignedTo)

    return NextResponse.json({
      success: true,
      message: 'Revisión asignada exitosamente',
      data: { assignment }
    })

  } catch (error) {
    console.error('Review assignment API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

/**
 * Generates next actions based on review decision
 */
function generateNextActions(action: string, decision: any): string[] {
  const nextActions: string[] = []

  switch (action) {
    case 'approve':
      nextActions.push('Reporte procesado y agregado al sistema')
      nextActions.push('Paciente agregado a la cola de priorización')
      nextActions.push('Notificaciones enviadas según configuración')
      break

    case 'reject':
      nextActions.push('Reporte marcado como rechazado')
      nextActions.push('PDF original preservado para re-procesamiento')
      nextActions.push('Notificación enviada al equipo de calidad')
      break

    case 'request_info':
      nextActions.push('Solicitud de información enviada')
      nextActions.push('Reporte en espera de información adicional')
      nextActions.push('Seguimiento programado en 24 horas')
      break

    case 'correct':
      nextActions.push('Correcciones aplicadas al reporte')
      nextActions.push('Re-procesamiento automático iniciado')
      nextActions.push('Validación de correcciones programada')
      break
  }

  return nextActions
}