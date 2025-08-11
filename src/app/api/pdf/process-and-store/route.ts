import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractPatientFromPDF } from '@/lib/pdf-parsing/patient-extraction'
import { storePDFWithPatient } from '@/lib/services/pdf-storage'

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
    const patientDataStr = formData.get('patientData') as string
    
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

    // Parse patient data if provided (from manual entry)
    let patientInfo = null
    if (patientDataStr) {
      try {
        patientInfo = JSON.parse(patientDataStr)
      } catch (error) {
        return NextResponse.json({ 
          error: 'Datos del paciente inválidos' 
        }, { status: 400 })
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract patient information if not provided
    if (!patientInfo) {
      const extractionResult = await extractPatientFromPDF(buffer)
      
      if (!extractionResult.success || !extractionResult.patient) {
        return NextResponse.json({ 
          error: extractionResult.error || 'No se pudo extraer información del paciente' 
        }, { status: 500 })
      }

      patientInfo = extractionResult.patient
    }

    // Validate that we have minimum required information
    if (!patientInfo.rut || !patientInfo.name) {
      return NextResponse.json({ 
        error: 'Información del paciente incompleta. RUT y nombre son obligatorios.' 
      }, { status: 400 })
    }

    // Store PDF with patient information
    const storageResult = await storePDFWithPatient(
      buffer,
      file.name,
      file.size,
      patientInfo,
      session.user.email
    )

    if (!storageResult.success) {
      return NextResponse.json({ 
        error: storageResult.error || 'Error al almacenar el PDF' 
      }, { status: 500 })
    }

    // Log successful processing for audit
    console.log('PDF processed and stored by user:', session.user.email, 
                'Patient ID:', storageResult.patientId,
                'Lab Report ID:', storageResult.labReportId)

    return NextResponse.json({
      success: true,
      message: 'PDF procesado y almacenado exitosamente',
      data: {
        patientId: storageResult.patientId,
        labReportId: storageResult.labReportId,
        patient: {
          rut: patientInfo.rut,
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          confidence: patientInfo.confidence
        }
      }
    })

  } catch (error) {
    console.error('PDF processing and storage API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}