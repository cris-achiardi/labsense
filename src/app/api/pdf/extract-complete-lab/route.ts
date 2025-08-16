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
import { extractAllLabResults } from '@/lib/pdf-parsing/comprehensive-lab-extractor'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'

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
    
    // Use comprehensive extractor for maximum lab result coverage with page-aware cleaning
    const comprehensiveResults = extractAllLabResults(textExtraction.fullText, textExtraction.pages)
    console.log(`🎯 Comprehensive extractor found ${comprehensiveResults.length} results`)
    
    // Also get patient info and metadata from the original extractor
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
    
    // Merge comprehensive results with patient info and metadata
    const enhancedResult = {
      ...extractionResult,
      labResults: comprehensiveResults.length > extractionResult.labResults.length 
        ? comprehensiveResults.map(cr => ({
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
          }))
        : extractionResult.labResults,
      metadata: {
        ...extractionResult.metadata,
        totalResults: comprehensiveResults.length > extractionResult.labResults.length 
          ? comprehensiveResults.length 
          : extractionResult.metadata.totalResults,
        abnormalCount: comprehensiveResults.length > extractionResult.labResults.length
          ? comprehensiveResults.filter(r => r.isAbnormal).length
          : extractionResult.metadata.abnormalCount,
        criticalCount: comprehensiveResults.length > extractionResult.labResults.length
          ? comprehensiveResults.filter(r => r.priority === 'critical' && r.isAbnormal).length
          : extractionResult.metadata.criticalCount
      }
    }
    
    console.log(`✅ Enhanced extraction: ${enhancedResult.labResults.length} total results (${enhancedResult.metadata.abnormalCount} abnormal, ${enhancedResult.metadata.criticalCount} critical)`)
    
    const finalResult = enhancedResult

    // Log successful extraction for audit
    console.log('Complete lab extraction by user:', session.user.email, {
      folio: finalResult.metadata.folio,
      patientRUT: finalResult.patient?.rut ? '***' : null, // Anonymized
      totalResults: finalResult.metadata.totalResults,
      abnormalCount: finalResult.metadata.abnormalCount,
      criticalCount: finalResult.metadata.criticalCount,
      confidence: finalResult.confidence,
      extractorUsed: comprehensiveResults.length > extractionResult.labResults.length ? 'comprehensive' : 'standard'
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