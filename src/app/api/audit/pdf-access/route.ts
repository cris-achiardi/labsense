import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/database'

interface PDFAccessRequest {
  labReportId: string
  patientRut: string
  patientName: string
  action: 'view_pdf'
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: PDFAccessRequest = await request.json()
    const { labReportId, patientRut, patientName, action } = body

    // Validate required fields
    if (!labReportId || !patientRut || !action) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: labReportId, patientRut, action' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the PDF access event
    await db.logAuditEvent(
      session.user.userId || session.user.id,
      session.user.email || '',
      'VIEW_PDF',
      'lab_report',
      labReportId,
      patientRut,
      {
        action: action,
        patientName: patientName,
        accessedAt: new Date().toISOString(),
        ipAddress: clientIP,
        userAgent: userAgent
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Acceso a PDF registrado correctamente',
      timestamp: new Date().toISOString(),
      user: session.user.email
    })

  } catch (error) {
    console.error('Error logging PDF access:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor al registrar acceso' },
      { status: 500 }
    )
  }
}