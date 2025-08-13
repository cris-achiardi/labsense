/**
 * Chilean Lab Report PDF Text Extraction
 * Specialized for Chilean medical laboratory PDFs with Spanish terminology
 */

export interface PDFExtractionResult {
  success: boolean
  fullText: string
  pages: string[]
  firstPageText: string
  metadata?: {
    pageCount: number
    title?: string
    author?: string
    creationDate?: Date
  }
  error?: string
}

/**
 * Extracts and processes text from Chilean lab report PDFs
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  // Temporarily disable debug mode to prevent pdf-parse from trying to read test files
  const originalNodeEnv = process.env.NODE_ENV
  
  try {
    process.env.NODE_ENV = 'production'
    
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    
    // Parse PDF with options optimized for Chilean lab reports
    const pdfData = await pdfParse(pdfBuffer)

    const fullText = pdfData.text
    
    // Split text into pages using common PDF page separators
    const pages = splitTextIntoPages(fullText)
    
    // Extract first page (where patient info is typically located)
    const firstPageText = pages[0] || fullText.substring(0, 3000)
    
    // Clean and normalize text for better parsing
    const cleanedFullText = cleanChileanLabText(fullText)
    const cleanedFirstPage = cleanChileanLabText(firstPageText)
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv
    
    return {
      success: true,
      fullText: cleanedFullText,
      pages: pages.map(page => cleanChileanLabText(page)),
      firstPageText: cleanedFirstPage,
      metadata: {
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        creationDate: pdfData.info?.CreationDate ? new Date(pdfData.info.CreationDate) : undefined
      }
    }
  } catch (error) {
    // Restore original NODE_ENV in case of error
    process.env.NODE_ENV = originalNodeEnv
    
    console.error('PDF text extraction error:', error)
    return {
      success: false,
      fullText: '',
      pages: [],
      firstPageText: '',
      error: error instanceof Error ? error.message : 'Error desconocido al extraer texto del PDF'
    }
  }
}

/**
 * Splits PDF text into individual pages
 */
function splitTextIntoPages(text: string): string[] {
  // Common page separators in PDF text extraction
  const pageSeparators = [
    /\f/g,                    // Form feed character
    /\n\s*\n\s*\n\s*\n/g,    // Multiple newlines
    /Página\s+\d+/gi,        // "Página X" indicators
    /Page\s+\d+/gi,          // "Page X" indicators
    /\n\s*-\s*\d+\s*-\s*\n/g // Page numbers like "- 1 -"
  ]
  
  let pages = [text]
  
  // Try each separator to split pages
  for (const separator of pageSeparators) {
    const newPages: string[] = []
    for (const page of pages) {
      const splits = page.split(separator)
      newPages.push(...splits.filter(split => split.trim().length > 50)) // Ignore very short splits
    }
    if (newPages.length > pages.length) {
      pages = newPages
      break // Use the first separator that successfully splits pages
    }
  }
  
  return pages.filter(page => page.trim().length > 0)
}

/**
 * Cleans and normalizes Chilean lab report text for better parsing
 */
function cleanChileanLabText(text: string): string {
  return text
    // Normalize whitespace but preserve structure
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Fix common OCR issues with Spanish characters
    .replace(/á/g, 'á').replace(/é/g, 'é').replace(/í/g, 'í').replace(/ó/g, 'ó').replace(/ú/g, 'ú')
    .replace(/ñ/g, 'ñ').replace(/Ñ/g, 'Ñ')
    // Normalize Chilean RUT separators
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2') // Fix spaced dots in RUTs
    .replace(/(\d)\s*-\s*([0-9K])/gi, '$1-$2') // Fix spaced hyphens in RUTs
    // Clean up common lab report formatting issues
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
    .replace(/\s+\n/g, '\n') // Remove trailing spaces on lines
    // Preserve important markers
    .replace(/\[\s*\*\s*\]/g, '[*]') // Normalize abnormal value markers
    .trim()
}

/**
 * Extracts specific sections from Chilean lab reports
 */
export function extractLabReportSections(text: string): {
  patientInfo: string
  labResults: string
  referenceRanges: string
  observations: string
} {
  const sections = {
    patientInfo: '',
    labResults: '',
    referenceRanges: '',
    observations: ''
  }
  
  // Common section headers in Chilean lab reports
  const sectionPatterns = {
    patientInfo: /(?:DATOS\s+DEL\s+PACIENTE|INFORMACIÓN\s+DEL\s+PACIENTE|PACIENTE)/i,
    labResults: /(?:RESULTADOS|EXÁMENES|ANÁLISIS|LABORATORIO)/i,
    referenceRanges: /(?:VALORES\s+DE\s+REFERENCIA|RANGOS\s+NORMALES)/i,
    observations: /(?:OBSERVACIONES|COMENTARIOS|NOTAS)/i
  }
  
  // Split text into lines for section detection
  const lines = text.split('\n')
  let currentSection = 'patientInfo' // Default to patient info
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.length === 0) continue
    
    // Check if line matches any section header
    let foundSection = false
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmedLine)) {
        currentSection = sectionName as keyof typeof sections
        foundSection = true
        break
      }
    }
    
    // Add line to current section (skip section headers)
    if (!foundSection) {
      sections[currentSection as keyof typeof sections] += trimmedLine + '\n'
    }
  }
  
  return sections
}

/**
 * Detects the structure format of Chilean lab reports
 */
export function detectLabReportFormat(text: string): {
  format: 'table' | 'list' | 'mixed' | 'unknown'
  hasColumns: boolean
  columnHeaders: string[]
  confidence: number
} {
  // Look for common Chilean lab report column headers
  const commonHeaders = [
    'EXAMEN', 'RESULTADO', 'UNIDAD', 'VALOR DE REFERENCIA', 'MÉTODO',
    'PRUEBA', 'VALOR', 'RANGO', 'NORMAL', 'REFERENCIA'
  ]
  
  const foundHeaders: string[] = []
  let hasTableStructure = false
  
  // Check for table-like structure
  const lines = text.split('\n')
  for (const line of lines) {
    const upperLine = line.toUpperCase()
    
    // Count how many headers are found in this line
    const headersInLine = commonHeaders.filter(header => upperLine.includes(header))
    if (headersInLine.length >= 3) {
      hasTableStructure = true
      foundHeaders.push(...headersInLine)
    }
  }
  
  // Determine format based on structure
  let format: 'table' | 'list' | 'mixed' | 'unknown' = 'unknown'
  if (hasTableStructure) {
    format = foundHeaders.length >= 4 ? 'table' : 'mixed'
  } else {
    // Look for list-like patterns
    const hasListPattern = /^\s*[-•]\s+/m.test(text) || /:\s*\d+/m.test(text)
    format = hasListPattern ? 'list' : 'unknown'
  }
  
  const confidence = Math.min(100, (foundHeaders.length / commonHeaders.length) * 100)
  
  return {
    format,
    hasColumns: hasTableStructure,
    columnHeaders: Array.from(new Set(foundHeaders)), // Remove duplicates
    confidence
  }
}