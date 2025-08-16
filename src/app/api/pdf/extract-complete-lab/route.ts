/**
 * Complete Lab Report Extraction API
 * Task 11.1: Extract ALL lab data from Chilean PDFs
 * 
 * This endpoint extracts:
 * - Patient information (RUT, name, age, gender)
 * - Complete lab results (examen, resultado, unidad, valor referencia, método)
 * - Lab report metadata (folio, dates, healthcare context)
 * - Abnormal indicators and priority classification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { extractCompleteLabReport } from '@/lib/pdf-parsing/lab-results-extractor'

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

    // Get PDF file from form data
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
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

    // Log successful extraction for audit
    console.log('Complete lab extraction by user:', session.user.email, {
      folio: extractionResult.metadata.folio,
      patientRUT: extractionResult.patient?.rut ? '***' : null, // Anonymized
      totalResults: extractionResult.metadata.totalResults,
      abnormalCount: extractionResult.metadata.abnormalCount,
      criticalCount: extractionResult.metadata.criticalCount,
      confidence: extractionResult.confidence
    })

    // Return complete extraction result
    return NextResponse.json({
      success: true,
      data: {
        // Patient information
        patient: extractionResult.patient,
        
        // Complete lab results
        labResults: extractionResult.labResults,
        
        // Lab report metadata
        metadata: extractionResult.metadata,
        
        // Overall confidence
        confidence: extractionResult.confidence,
        
        // Summary statistics
        summary: {
          totalResults: extractionResult.metadata.totalResults,
          abnormalResults: extractionResult.metadata.abnormalCount,
          criticalResults: extractionResult.metadata.criticalCount,
          normalResults: extractionResult.metadata.totalResults - extractionResult.metadata.abnormalCount,
          
          // Results by category
          resultsByCategory: extractionResult.labResults.reduce((acc, result) => {
            if (result.category) {
              acc[result.category] = (acc[result.category] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>),
          
          // Results by priority
          resultsByPriority: extractionResult.labResults.reduce((acc, result) => {
            if (result.priority) {
              acc[result.priority] = (acc[result.priority] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>)
        }
      }
    })

  } catch (error) {
    console.error('Complete lab extraction API error:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Complete Lab Report Extraction API', 
    description: 'Extracts patient info, lab results, and metadata from Chilean PDFs',
    method: 'POST',
    status: 'available'
  })
}