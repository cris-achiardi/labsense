import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF, extractLabReportSections, detectLabReportFormat } from '@/lib/pdf-parsing/pdf-text-extractor'

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const extractionResult = await extractTextFromPDF(buffer)

    if (!extractionResult.success) {
      return NextResponse.json({ 
        error: extractionResult.error || 'Error al extraer texto del PDF' 
      }, { status: 500 })
    }

    // Extract sections from the text
    const sections = extractLabReportSections(extractionResult.fullText)
    
    // Detect report format
    const formatInfo = detectLabReportFormat(extractionResult.fullText)

    // Log extraction for audit (with file info only)
    console.log('PDF text extracted by user:', session.user.email, 
                'Pages:', extractionResult.metadata?.pageCount,
                'Format detected:', formatInfo.format)

    return NextResponse.json({
      success: true,
      message: 'Texto extraído exitosamente del PDF',
      data: {
        extraction: {
          pageCount: extractionResult.metadata?.pageCount,
          title: extractionResult.metadata?.title,
          author: extractionResult.metadata?.author,
          creationDate: extractionResult.metadata?.creationDate
        },
        sections,
        format: formatInfo,
        // Include text samples for debugging (first 500 chars of each)
        textSamples: {
          fullText: extractionResult.fullText.substring(0, 500) + '...',
          firstPage: extractionResult.firstPageText.substring(0, 500) + '...',
          patientInfo: sections.patientInfo.substring(0, 300) + '...',
          labResults: sections.labResults.substring(0, 500) + '...'
        }
      }
    })

  } catch (error) {
    console.error('PDF text extraction API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}