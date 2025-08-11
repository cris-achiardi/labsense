import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'
import { parseChileanRUTsFromText, analyzeRUTExtraction } from '@/lib/pdf-parsing/chilean-rut-parser'

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
    const textExtraction = await extractTextFromPDF(buffer)

    if (!textExtraction.success) {
      return NextResponse.json({ 
        error: textExtraction.error || 'Error al extraer texto del PDF' 
      }, { status: 500 })
    }

    // Parse RUTs from the text
    const rutExtraction = parseChileanRUTsFromText(textExtraction.firstPageText)
    
    // Analyze extraction quality
    const analysis = analyzeRUTExtraction(textExtraction.firstPageText)

    // Log RUT parsing for audit (with anonymized data)
    console.log('RUT parsing by user:', session.user.email, 
                'RUTs found:', rutExtraction.results.length,
                'Valid RUTs:', analysis.validRuts,
                'Best match confidence:', rutExtraction.bestMatch?.confidence || 0)

    return NextResponse.json({
      success: true,
      message: 'RUTs parseados exitosamente del PDF',
      data: {
        extraction: rutExtraction,
        analysis,
        textSample: textExtraction.firstPageText.substring(0, 500) + '...',
        recommendations: analysis.recommendations
      }
    })

  } catch (error) {
    console.error('RUT parsing API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}