import { NextRequest, NextResponse } from 'next/server'
import { extractPatientFromPDF } from '@/lib/pdf-parsing/patient-extraction'

// Use Node.js runtime for PDF processing
export const runtime = 'nodejs'
// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // No authentication required for demo

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

    // Log extraction for audit (demo mode)
    console.log('Demo PDF processed - Patient RUT:', result.patient?.rut || 'No RUT found')

    return NextResponse.json({
      success: true,
      patient: result.patient,
      message: 'Información del paciente extraída exitosamente'
    })

  } catch (error) {
    console.error('Demo PDF extraction API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Add a GET handler for debugging
export async function GET() {
  return NextResponse.json({ 
    message: 'Demo PDF Patient Extraction API', 
    method: 'POST',
    status: 'available',
    note: 'No authentication required for demo'
  })
}