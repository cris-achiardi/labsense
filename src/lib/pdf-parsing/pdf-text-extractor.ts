/**
 * Chilean Lab Report PDF Text Extraction
 * Specialized for Chilean medical laboratory PDFs with Spanish terminology
 * Uses pdf-parse for reliable serverless text extraction
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
 * Extracts and processes text from Chilean lab report PDFs using pdf-parse
 * Optimized for Vercel serverless - no worker dependencies
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  try {
    // Use pdf-parse for better serverless compatibility
    const pdfParse = (await import('pdf-parse')).default
    
    // Extract text using pdf-parse (no worker needed)
    // Use minimal configuration to avoid test file dependencies
    const data = await pdfParse(pdfBuffer)

    const fullText = data.text || ''
    const pages = fullText.split('\f').filter((page: string) => page.trim().length > 0) // Split by form feed
    const firstPageText = pages[0] || fullText.substring(0, 3000)

    // Clean and normalize text for better parsing
    const cleanedFullText = cleanChileanLabText(fullText.trim())
    const cleanedFirstPage = cleanChileanLabText(firstPageText)
    const cleanedPages = pages.map((page: string) => cleanChileanLabText(page))

    // Basic metadata from pdf-parse
    const metadata = {
      pageCount: data.numpages || pages.length,
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined
    }

    return {
      success: true,
      fullText: cleanedFullText,
      pages: cleanedPages,
      firstPageText: cleanedFirstPage,
      metadata
    }
  } catch (error) {
    console.error('PDF text extraction error:', error)

    // More specific error message
    let errorMessage = 'Error desconocido al extraer texto del PDF'
    if (error instanceof Error) {
      errorMessage = error.message

      // Add specific debugging info
      if (error.message.includes('Invalid PDF')) {
        errorMessage = 'El archivo PDF parece estar corrupto o no es válido.'
      } else if (error.message.includes('password')) {
        errorMessage = 'El PDF está protegido con contraseña.'
      }
    }

    return {
      success: false,
      fullText: '',
      pages: [],
      firstPageText: '',
      error: errorMessage
    }
  }
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
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ').replace(/Ã'/g, 'Ñ')
    // Normalize Chilean RUT separators
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2') // Fix spaced dots in RUTs
    .replace(/(\d)\s*-\s*([0-9K])/gi, '$1-$2') // Fix spaced hyphens in RUTs
    // Clean up common lab report formatting issues
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
    .replace(/\s+\n/g, '\n') // Remove trailing spaces on lines
    // Preserve important markers
    .replace(/\[\s*\*\s*\]/g, '[*]') // Normalize abnormal value markers
    .trim();
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
  };

  // Common section headers in Chilean lab reports
  const sectionPatterns = {
    patientInfo: /(?:DATOS\s+DEL\s+PACIENTE|INFORMACIÓN\s+DEL\s+PACIENTE|PACIENTE)/i,
    labResults: /(?:RESULTADOS|EXÁMENES|ANÁLISIS|LABORATORIO)/i,
    referenceRanges: /(?:VALORES\s+DE\s+REFERENCIA|RANGOS\s+NORMALES)/i,
    observations: /(?:OBSERVACIONES|COMENTARIOS|NOTAS)/i
  };

  // Split text into lines for section detection
  const lines = text.split('\n');
  let currentSection = 'patientInfo'; // Default to patient info

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) continue;

    // Check if line matches any section header
    let foundSection = false;
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmedLine)) {
        currentSection = sectionName as keyof typeof sections;
        foundSection = true;
        break;
      }
    }

    // Add line to current section (skip section headers)
    if (!foundSection) {
      sections[currentSection as keyof typeof sections] += trimmedLine + '\n';
    }
  }

  return sections;
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
  ];

  const foundHeaders: string[] = [];
  let hasTableStructure = false;

  // Check for table-like structure
  const lines = text.split('\n');
  for (const line of lines) {
    const upperLine = line.toUpperCase();

    // Count how many headers are found in this line
    const headersInLine = commonHeaders.filter(header => upperLine.includes(header));
    if (headersInLine.length >= 3) {
      hasTableStructure = true;
      foundHeaders.push(...headersInLine);
    }
  }

  // Determine format based on structure
  let format: 'table' | 'list' | 'mixed' | 'unknown' = 'unknown';
  if (hasTableStructure) {
    format = foundHeaders.length >= 4 ? 'table' : 'mixed';
  } else {
    // Look for list-like patterns
    const hasListPattern = /^\s*[-•]\s+/m.test(text) || /:\s*\d+/m.test(text);
    format = hasListPattern ? 'list' : 'unknown';
  }

  const confidence = Math.min(100, (foundHeaders.length / commonHeaders.length) * 100);

  return {
    format,
    hasColumns: hasTableStructure,
    columnHeaders: Array.from(new Set(foundHeaders)), // Remove duplicates
    confidence
  };
}