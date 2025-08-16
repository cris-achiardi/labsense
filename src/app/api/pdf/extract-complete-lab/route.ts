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
import { extractAllLabResults } from '@/lib/pdf-parsing/comprehensive-lab-extractor'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { extractPatientFromPDF } from '@/lib/pdf-parsing/patient-extraction'

// Simple metadata extraction helpers
function extractFolioFromText(text: string): string | null {
  const folioMatch = text.match(/Folio\s*:?\s*(\d+)/i)
  return folioMatch ? folioMatch[1] : null
}

function extractDateFromText(text: string, type: string): string | null {
  const patterns = {
    ingreso: /Fecha\s+de\s+Ingreso\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2})/i,
    muestra: /Toma\s+de\s+Muestra\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2})/i,
    validacion: /Fecha\s+de\s+Validación\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2})/i
  }
  const pattern = patterns[type as keyof typeof patterns]
  if (!pattern) return null
  const match = text.match(pattern)
  return match ? match[1] : null
}

function extractProcedenciaFromText(text: string): string | null {
  const procedenciaMatch = text.match(/Procedencia\s*:?\s*([A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\s]+)/i)
  return procedenciaMatch ? procedenciaMatch[1].trim() : null
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

    // Extract complete lab report using comprehensive extractor
    console.log('🚀 Using comprehensive lab extractor for maximum coverage...')
    
    // First extract text from PDF
    const textExtraction = await extractTextFromPDF(pdfBuffer)
    if (!textExtraction.success) {
      return NextResponse.json(
        { 
          error: textExtraction.error || 'Error al extraer texto del PDF',
          success: false
        },
        { status: 400 }
      )
    }
    
    // Use only comprehensive extractor for lab results
    const comprehensiveResults = extractAllLabResults(textExtraction.fullText, textExtraction.pages)
    console.log(`🎯 Comprehensive extractor found ${comprehensiveResults.length} results`)
    
    // Extract patient info separately
    const patientExtraction = await extractPatientFromPDF(pdfBuffer)
    if (!patientExtraction.success) {
      console.warn('Patient extraction failed:', patientExtraction.error)
    }
    
    // Build result using only comprehensive extractor
    const finalResult = {
      patient: patientExtraction.patient,
      labResults: comprehensiveResults.map(cr => ({
        examen: cr.examen,
        resultado: cr.resultado,
        unidad: cr.unidad,
        valorReferencia: cr.valorReferencia,
        metodo: cr.metodo,
        tipoMuestra: cr.tipoMuestra,
        isAbnormal: cr.isAbnormal,
        abnormalIndicator: cr.abnormalIndicator,
        systemCode: cr.systemCode,
        category: cr.category,
        priority: cr.priority,
        confidence: cr.confidence,
        position: cr.position,
        context: cr.context
      })),
      metadata: {
        folio: extractFolioFromText(textExtraction.fullText),
        fechaIngreso: extractDateFromText(textExtraction.fullText, 'ingreso'),
        tomaMuestra: extractDateFromText(textExtraction.fullText, 'muestra'),
        fechaValidacion: extractDateFromText(textExtraction.fullText, 'validacion'),
        profesionalSolicitante: patientExtraction.patient?.doctor || 'Not found',
        procedencia: extractProcedenciaFromText(textExtraction.fullText),
        totalResults: comprehensiveResults.length,
        abnormalCount: comprehensiveResults.filter(r => r.isAbnormal).length,
        criticalCount: comprehensiveResults.filter(r => r.priority === 'crítico' && r.isAbnormal).length
      },
      confidence: patientExtraction.patient?.confidence || 95
    }
    
    console.log(`✅ Clean extraction: ${finalResult.labResults.length} total results (${finalResult.metadata.abnormalCount} abnormal, ${finalResult.metadata.criticalCount} critical)`)

    // Log successful extraction for audit
    console.log('Complete lab extraction by user:', session.user.email, {
      folio: finalResult.metadata.folio,
      patientRUT: finalResult.patient?.rut ? '***' : null, // Anonymized
      totalResults: finalResult.metadata.totalResults,
      abnormalCount: finalResult.metadata.abnormalCount,
      criticalCount: finalResult.metadata.criticalCount,
      confidence: finalResult.confidence,
      extractorUsed: 'comprehensive-only'
    })

    // Return complete extraction result
    return NextResponse.json({
      success: true,
      data: {
        // Patient information
        patient: finalResult.patient,
        
        // Complete lab results
        labResults: finalResult.labResults,
        
        // Lab report metadata
        metadata: finalResult.metadata,
        
        // Overall confidence
        confidence: finalResult.confidence,
        
        // Summary statistics
        summary: {
          totalResults: finalResult.metadata.totalResults,
          abnormalResults: finalResult.metadata.abnormalCount,
          criticalResults: finalResult.metadata.criticalCount,
          normalResults: finalResult.metadata.totalResults - finalResult.metadata.abnormalCount,
          
          // Results by category
          resultsByCategory: finalResult.labResults.reduce((acc, result) => {
            if (result.category) {
              acc[result.category] = (acc[result.category] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>),
          
          // Results by priority (ordered by severity)
          resultsByPriority: (() => {
            const priorityCounts = finalResult.labResults.reduce((acc, result) => {
              if (result.priority) {
                acc[result.priority] = (acc[result.priority] || 0) + 1
              }
              return acc
            }, {} as Record<string, number>)
            
            // Order by clinical severity
            const orderedPriorities = ['crítico', 'severo', 'moderado', 'leve', 'normal', 'desconocido']
            const ordered: Record<string, number> = {}
            orderedPriorities.forEach(priority => {
              if (priorityCounts[priority]) {
                ordered[priority] = priorityCounts[priority]
              }
            })
            return ordered
          })()
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