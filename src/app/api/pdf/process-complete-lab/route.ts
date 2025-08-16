/**
 * Complete Lab Processing API
 * Task 11.1: Process and store complete lab extraction results
 * 
 * This endpoint:
 * 1. Extracts complete lab data from PDF
 * 2. Stores all data in database with proper relationships
 * 3. Prevents duplicate processing using folio
 * 4. Calculates priority scores
 * 5. Creates audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { extractCompleteLabReport } from '@/lib/pdf-parsing/lab-results-extractor'
import { supabase } from '@/lib/database/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get PDF file from form data
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      )
    }

    // Validate file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo PDF es demasiado grande (máximo 10MB)' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // Extract complete lab report
    const extractionResult = await extractCompleteLabReport(pdfBuffer)

    if (!extractionResult.success) {
      return NextResponse.json(
        { 
          error: extractionResult.error || 'Error al procesar el PDF',
          success: false
        },
        { status: 400 }
      )
    }

    // Check if we have minimum required data
    if (!extractionResult.patient?.rut) {
      return NextResponse.json(
        { 
          error: 'No se pudo extraer el RUT del paciente del PDF',
          success: false
        },
        { status: 400 }
      )
    }

    if (extractionResult.labResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'No se encontraron resultados de laboratorio en el PDF',
          success: false
        },
        { status: 400 }
      )
    }

    // Check for duplicate folio if present
    if (extractionResult.metadata.folio) {
      const { data: existingReport } = await supabase
        .from('lab_reports')
        .select('id, folio')
        .eq('folio', extractionResult.metadata.folio)
        .single()

      if (existingReport) {
        return NextResponse.json(
          { 
            error: `Ya existe un examen con folio ${extractionResult.metadata.folio}`,
            success: false,
            duplicate: true,
            existingReportId: existingReport.id
          },
          { status: 409 }
        )
      }
    }

    // Store complete lab extraction using database function
    const { data: labReportId, error: storeError } = await supabase
      .rpc('store_complete_lab_extraction', {
        p_patient_data: {
          rut: extractionResult.patient.rut,
          name: extractionResult.patient.name,
          age: extractionResult.patient.age,
          gender: extractionResult.patient.gender
        },
        p_lab_results: extractionResult.labResults.map(result => ({
          examen: result.examen,
          resultado: result.resultado.toString(),
          unidad: result.unidad,
          valorReferencia: result.valorReferencia,
          metodo: result.metodo,
          tipoMuestra: result.tipoMuestra,
          systemCode: result.systemCode,
          category: result.category,
          priority: result.priority,
          isAbnormal: result.isAbnormal,
          abnormalIndicator: result.abnormalIndicator,
          confidence: result.confidence,
          context: result.context
        })),
        p_metadata: {
          folio: extractionResult.metadata.folio,
          fechaIngreso: extractionResult.metadata.fechaIngreso,
          tomaMuestra: extractionResult.metadata.tomaMuestra,
          fechaValidacion: extractionResult.metadata.fechaValidacion,
          profesionalSolicitante: extractionResult.metadata.profesionalSolicitante,
          procedencia: extractionResult.metadata.procedencia,
          confidence: extractionResult.confidence
        },
        p_uploaded_by: session.user.email,
        p_file_name: file.name,
        p_file_path: `lab-pdfs/${Date.now()}-${file.name}`, // Placeholder path
        p_file_size: file.size
      })

    if (storeError) {
      console.error('Database storage error:', storeError)
      return NextResponse.json(
        { 
          error: 'Error al almacenar los datos en la base de datos',
          success: false,
          details: storeError.message
        },
        { status: 500 }
      )
    }

    // Get the complete stored data for response
    const { data: storedReport, error: fetchError } = await supabase
      .from('complete_lab_reports')
      .select('*')
      .eq('lab_report_id', labReportId)
      .single()

    if (fetchError) {
      console.error('Error fetching stored report:', fetchError)
    }

    // Log successful processing
    console.log('Complete lab processing successful:', {
      user: session.user.email,
      folio: extractionResult.metadata.folio,
      patientRUT: extractionResult.patient.rut ? '***' : null, // Anonymized
      totalResults: extractionResult.metadata.totalResults,
      abnormalCount: extractionResult.metadata.abnormalCount,
      criticalCount: extractionResult.metadata.criticalCount,
      labReportId
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Examen de laboratorio procesado exitosamente',
      data: {
        labReportId,
        folio: extractionResult.metadata.folio,
        patient: {
          rut: extractionResult.patient.rut,
          name: extractionResult.patient.name
        },
        summary: {
          totalResults: extractionResult.metadata.totalResults,
          abnormalResults: extractionResult.metadata.abnormalCount,
          criticalResults: extractionResult.metadata.criticalCount,
          confidence: extractionResult.confidence
        },
        storedReport: storedReport || null
      }
    })

  } catch (error) {
    console.error('Complete lab processing API error:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        success: false,
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Complete Lab Processing API', 
    description: 'Processes and stores complete lab extraction results with duplicate prevention',
    method: 'POST',
    status: 'available'
  })
}