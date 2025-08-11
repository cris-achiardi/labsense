import { validateChileanRUT, formatChileanRUT } from '@/lib/utils/chilean-rut'

export interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  confidence: number
  rawText: string
}

export interface ExtractionResult {
  success: boolean
  patient: PatientInfo | null
  error?: string
}





/**
 * Extracts Chilean RUT patterns from text
 */
function extractRUT(text: string): string | null {
  // Chilean RUT patterns based on official format: XX.XXX.XXX-X
  const rutPatterns = [
    // Standard format with dots: 12.345.678-9
    /\b(\d{1,2}\.\d{3}\.\d{3}-[0-9K])\b/gi,
    // Format without dots: 12345678-9
    /\b(\d{7,8}-[0-9K])\b/gi,
    // RUT with spaces: 12 345 678-9
    /\b(\d{1,2}\s\d{3}\s\d{3}-[0-9K])\b/gi,
    // RUT in forms: RUT: 12.345.678-9
    /RUT\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    // Cedula patterns: C.I.: 12.345.678-9
    /C\.?I\.?\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    // Run patterns: RUN: 12.345.678-9
    /RUN\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi
  ]

  for (const pattern of rutPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Extract just the RUT part
        const rutMatch = match.match(/(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/i)
        if (rutMatch) {
          const rut = rutMatch[1].toUpperCase()
          if (validateChileanRUT(rut)) {
            return formatChileanRUT(rut)
          }
        }
      }
    }
  }

  return null
}

/**
 * Extracts patient name from text
 */
function extractPatientName(text: string): string | null {
  // Chilean patient name patterns in medical documents
  const namePatterns = [
    // Paciente: NOMBRE APELLIDO APELLIDO
    /PACIENTE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,48})/i,
    // Nombre: NOMBRE APELLIDO
    /NOMBRE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,48})/i,
    // Nombre del Paciente: NOMBRE APELLIDO
    /NOMBRE\s+DEL\s+PACIENTE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,48})/i,
    // After RUT, usually comes the name (Chilean format)
    /\d{1,2}\.?\d{3}\.?\d{3}-[0-9K]\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,48})/i,
    // Names in header sections (first line pattern)
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})/m,
    // Patient identification section
    /IDENTIFICACIÓN\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,48})/i
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      // Validate name (at least 2 words, reasonable length)
      if (name.split(/\s+/).length >= 2 && name.length >= 5 && name.length <= 50) {
        return name
      }
    }
  }

  return null
}

/**
 * Extracts patient age from text
 */
function extractAge(text: string): string | null {
  // Chilean age patterns in medical documents
  const agePatterns = [
    // Edad: 45 años
    /EDAD\s*:?\s*(\d{1,3})\s*años?/i,
    // 45a 2m 17d (Chilean format: years, months, days)
    /(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    // 45 años (standalone)
    /(\d{1,3})\s*años?/i,
    // Fecha de nacimiento calculation (if we find birth date)
    /NACIMIENTO\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    // Age in parentheses: (45 años)
    /\(\s*(\d{1,3})\s*años?\s*\)/i
  ]

  for (const pattern of agePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Extracts patient gender from text
 */
function extractGender(text: string): string | null {
  // Chilean gender patterns in medical documents
  const genderPatterns = [
    // Sexo: MASCULINO/FEMENINO
    /SEXO\s*:?\s*(MASCULINO|FEMENINO|M|F)/i,
    // Género: MASCULINO/FEMENINO
    /GÉNERO\s*:?\s*(MASCULINO|FEMENINO|M|F)/i,
    // Gender abbreviations
    /\b(MASC|FEM)\b/i,
    // In patient info sections
    /PACIENTE\s*:?.*?(MASCULINO|FEMENINO|M|F)/i
  ]

  for (const pattern of genderPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const gender = match[1].toUpperCase()
      return gender === 'M' || gender === 'MASCULINO' ? 'Masculino' : 'Femenino'
    }
  }

  return null
}

/**
 * Calculates confidence score based on extracted information
 */
function calculateConfidence(patient: PatientInfo): number {
  let confidence = 0

  // RUT is most important (40 points)
  if (patient.rut && validateChileanRUT(patient.rut)) {
    confidence += 40
  }

  // Name is very important (30 points)
  if (patient.name && patient.name.split(/\s+/).length >= 2) {
    confidence += 30
  }

  // Age adds confidence (20 points)
  if (patient.age) {
    confidence += 20
  }

  // Gender adds some confidence (10 points)
  if (patient.gender) {
    confidence += 10
  }

  return Math.min(confidence, 100)
}

/**
 * Extracts patient information from PDF buffer
 */
export async function extractPatientFromPDF(pdfBuffer: Buffer): Promise<ExtractionResult> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    
    // Parse PDF and extract text
    const pdfData = await pdfParse(pdfBuffer)
    const fullText = pdfData.text

    // Extract first page text (patient info is usually on first page)
    const pages = fullText.split(/\f|\n\s*\n\s*\n/) // Split by form feed or multiple newlines
    const firstPageText = pages[0] || fullText.substring(0, 2000) // First 2000 chars as fallback

    // Extract patient information
    const rut = extractRUT(firstPageText)
    const name = extractPatientName(firstPageText)
    const age = extractAge(firstPageText)
    const gender = extractGender(firstPageText)

    const patient: PatientInfo = {
      rut,
      name,
      age,
      gender,
      confidence: 0,
      rawText: firstPageText.substring(0, 500) // First 500 chars for debugging
    }

    // Calculate confidence score
    patient.confidence = calculateConfidence(patient)

    return {
      success: true,
      patient
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    return {
      success: false,
      patient: null,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar PDF'
    }
  }
}