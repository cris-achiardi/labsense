import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { extractPatientFromPDF } from '@/lib/pdf-parsing/patient-extraction'

// Use Node.js runtime for NextAuth compatibility
export const runtime = 'nodejs'
// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
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

    // Extract patient information
    const result = await extractPatientFromPDF(buffer)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Error al procesar el PDF' 
      }, { status: 500 })
    }

    // Log extraction for audit
    console.log('PDF processed by user:', session.user.email, 'Patient RUT:', result.patient?.rut || 'No RUT found')

    return NextResponse.json({
      success: true,
      patient: result.patient,
      message: 'Información del paciente extraída exitosamente'
    })

  } catch (error) {
    console.error('PDF extraction API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Add a GET handler for debugging
export async function GET() {
  return NextResponse.json({ 
    message: 'PDF Patient Extraction API', 
    method: 'POST',
    status: 'available' 
  })
}