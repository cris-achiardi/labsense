/**
 * Vercel-optimized PDF text extraction API route
 * Handles Chilean lab report PDF processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf-parsing/pdf-text-extractor'

export async function POST(request: NextRequest) {
  try {
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
        { error: 'El archivo debe ser un PDF válido' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit for Vercel)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text using our optimized function
    const result = await extractTextFromPDF(buffer)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Error al procesar el PDF',
          details: result.error 
        },
        { status: 500 }
      )
    }

    // Return extraction results
    return NextResponse.json({
      success: true,
      data: {
        fullText: result.fullText,
        firstPageText: result.firstPageText,
        pageCount: result.metadata?.pageCount || 0,
        extractedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('PDF extraction API error:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Configure route for larger payloads
export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds timeout for PDF processing