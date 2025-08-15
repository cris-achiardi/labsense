/**
 * Chilean Lab Report PDF Text Extraction
 * Specialized for Chilean medical laboratory PDFs with Spanish terminology
 * Optimized for Vercel serverless deployment - NO WORKER VERSION
 */

// Comprehensive polyfills for serverless environment (must be at module level)
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() { }
    static fromMatrix() { return new (globalThis as any).DOMMatrix(); }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
  };
}

if (typeof globalThis.Path2D === 'undefined') {
  (globalThis as any).Path2D = class {
    constructor() { }
    moveTo() { return this; }
    lineTo() { return this; }
    closePath() { return this; }
  };
}

if (typeof globalThis.CanvasGradient === 'undefined') {
  (globalThis as any).CanvasGradient = class {
    addColorStop() { return this; }
  };
}

if (typeof globalThis.CanvasPattern === 'undefined') {
  (globalThis as any).CanvasPattern = class { };
}

if (typeof globalThis.ImageData === 'undefined') {
  (globalThis as any).ImageData = class {
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
}

// Import pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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
 * Extracts and processes text from Chilean lab report PDFs using pdfjs-dist
 * IMPORTANT: Esta versión desactiva el worker completamente para funcionar en Vercel
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  try {
    // SOLUCIÓN CLAVE: Usar worker válido para evitar errores
    // Intentar resolver el worker local, si no funciona usar data URL
    try {
      const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath
    } catch (e) {
      // Fallback: usar data URL con worker mínimo
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'data:application/javascript;base64,Ly8gTWluaW1hbCBQREYuanMgd29ya2VyIGZvciBzZXJ2ZXJsZXNzCnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZSkgewogIC8vIE1pbmltYWwgd29ya2VyIGltcGxlbWVudGF0aW9uCiAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ3JlYWR5JyB9KTsKfTs='
    }

    // Load PDF document with serverless-optimized settings
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      // Optimizaciones para serverless
      disableStream: true,
      disableAutoFetch: true,
      // Optimizaciones de memoria
      maxImageSize: 1024 * 1024, // 1MB max per image
      cMapPacked: true
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: any) => {
            // Handle text items with positioning
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        pages.push(pageText);
        fullText += pageText + '\n';

        // Note: page.cleanup() doesn't exist in this PDF.js version
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        // Continuar con las demás páginas si una falla
        pages.push('');
      }
    }

    // Extract first page (where patient info is typically located)
    const firstPageText = pages[0] || fullText.substring(0, 3000);

    // Clean and normalize text for better parsing
    const cleanedFullText = cleanChileanLabText(fullText.trim());
    const cleanedFirstPage = cleanChileanLabText(firstPageText);

    // Get metadata safely
    let metadata: any = {
      pageCount: pdf.numPages
    };

    try {
      const pdfMetadata = await pdf.getMetadata();
      if (pdfMetadata?.info) {
        metadata.title = (pdfMetadata.info as any)?.Title;
        metadata.author = (pdfMetadata.info as any)?.Author;
        metadata.creationDate = (pdfMetadata.info as any)?.CreationDate
          ? new Date((pdfMetadata.info as any).CreationDate)
          : undefined;
      }
    } catch (metadataError) {
      console.warn('Could not extract PDF metadata:', metadataError);
    }

    // Note: pdf.destroy() doesn't exist in this PDF.js version

    return {
      success: true,
      fullText: cleanedFullText,
      pages: pages.map(page => cleanChileanLabText(page)),
      firstPageText: cleanedFirstPage,
      metadata
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);

    // Mensaje de error más específico
    let errorMessage = 'Error desconocido al extraer texto del PDF';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Agregar información adicional para debugging
      if (error.message.includes('worker')) {
        errorMessage = 'Error de worker en Vercel. Contacte soporte si persiste.';
      } else if (error.message.includes('Invalid PDF')) {
        errorMessage = 'El archivo PDF parece estar corrupto o no es válido.';
      }
    }

    return {
      success: false,
      fullText: '',
      pages: [],
      firstPageText: '',
      error: errorMessage
    };
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