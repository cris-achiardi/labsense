import { validateChileanRUT, formatChileanRUT } from '@/lib/utils/chilean-rut'
import { extractTextFromPDF } from './pdf-text-extractor'
import { parseChileanRUTsFromText, extractBestChileanRUT } from './chilean-rut-parser'

export interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  doctor: string | null
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
  // Use enhanced Chilean RUT parser
  return extractBestChileanRUT(text)
}

/**
 * Extracts patient name from text
 */
function extractPatientName(text: string): string | null {
  // Field separators used in Chilean medical documents
  const fieldSeparators = 'Nombre|RUT|Edad|Sexo|Profesional\\s+Solicitante|Folio|Fecha\\s+de\\s+Ingreso|Toma\\s+de\\s+Muestra|Fecha\\s+de\\s+Validación|Procedencia'
  
  // Chilean patient name patterns with field separators
  const namePatterns = [
    // Paciente: NOMBRE APELLIDO - stop at any field separator
    new RegExp(`PACIENTE\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators}))`, 'i'),
    // Nombre: NOMBRE APELLIDO - stop at any field separator  
    new RegExp(`NOMBRE\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators}))`, 'i'),
    // Nombre del Paciente: NOMBRE APELLIDO - stop at any field separator
    new RegExp(`NOMBRE\\s+DEL\\s+PACIENTE\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators}))`, 'i'),
    // After RUT: 11.111.111-K NOMBRE APELLIDO - stop at any field separator
    new RegExp(`\\d{1,2}\\.?\\d{3}\\.?\\d{3}-[0-9K]\\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators}))`, 'i'),
    // Patient identification section - stop at any field separator
    new RegExp(`IDENTIFICACIÓN\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators}))`, 'i')
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      // Validate Chilean name structure (2-4 components: 1-2 names + 2 lastnames)
      const nameComponents = name.split(/\s+/)
      if (nameComponents.length >= 2 && nameComponents.length <= 4 && name.length >= 5 && name.length <= 60) {
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
  // Field separators used in Chilean medical documents
  const fieldSeparators = 'Nombre|RUT|Edad|Sexo|Profesional\\s+Solicitante|Folio|Fecha\\s+de\\s+Ingreso|Toma\\s+de\\s+Muestra|Fecha\\s+de\\s+Validación|Procedencia'
  
  // Chilean age patterns with field separators
  const agePatterns = [
    // Edad: 73a 3m 17d (Chilean format: years, months, days) - stop at field separator
    new RegExp(`EDAD\\s*:?\\s*(\\d{1,3}a\\s*\\d{1,2}m\\s*\\d{1,2}d)(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Edad: 45 años - stop at field separator
    new RegExp(`EDAD\\s*:?\\s*(\\d{1,3})\\s*años?(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Edad: 45 - stop at field separator
    new RegExp(`EDAD\\s*:?\\s*(\\d{1,3})(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Fecha de nacimiento calculation (if we find birth date) - stop at field separator
    new RegExp(`NACIMIENTO\\s*:?\\s*(\\d{1,2}\\/\\d{1,2}\\/\\d{4})(?=\\s+(?:${fieldSeparators})|$)`, 'i')
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
  // Field separators used in Chilean medical documents
  const fieldSeparators = 'Nombre|RUT|Edad|Sexo|Profesional\\s+Solicitante|Folio|Fecha\\s+de\\s+Ingreso|Toma\\s+de\\s+Muestra|Fecha\\s+de\\s+Validación|Procedencia'
  
  // Chilean gender patterns with field separators
  const genderPatterns = [
    // Sexo: MASCULINO/FEMENINO - stop at field separator
    new RegExp(`SEXO\\s*:?\\s*(MASCULINO|FEMENINO|M|F)(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Género: MASCULINO/FEMENINO - stop at field separator
    new RegExp(`GÉNERO\\s*:?\\s*(MASCULINO|FEMENINO|M|F)(?=\\s+(?:${fieldSeparators})|$)`, 'i')
  ]

  for (const pattern of genderPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const gender = match[1].toUpperCase()
      return gender === 'M' || gender === 'MASCULINO' || gender === 'MASC' ? 'Masculino' : 'Femenino'
    }
  }

  return null
}

/**
 * Extracts doctor name from "Profesional Solicitante" field
 */
function extractDoctorName(text: string): string | null {
  // Field separators used in Chilean medical documents
  const fieldSeparators = 'Nombre|RUT|Edad|Sexo|Profesional\\s+Solicitante|Folio|Fecha\\s+de\\s+Ingreso|Toma\\s+de\\s+Muestra|Fecha\\s+de\\s+Validación|Procedencia'
  
  // Chilean doctor name patterns (format: madre apellido, padre apellido, nombre)
  const doctorPatterns = [
    // Profesional Solicitante: APELLIDO APELLIDO, NOMBRE - stop at field separator
    new RegExp(`PROFESIONAL\\s+SOLICITANTE\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Medico: APELLIDO APELLIDO, NOMBRE - stop at field separator
    new RegExp(`MEDICO\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators})|$)`, 'i'),
    // Doctor: APELLIDO APELLIDO, NOMBRE - stop at field separator
    new RegExp(`DOCTOR\\s*:?\\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+(?:\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+){1,3})(?=\\s+(?:${fieldSeparators})|$)`, 'i')
  ]

  for (const pattern of doctorPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const doctor = match[1].trim()
      // Validate doctor name structure (2-4 components like patient names)
      const nameComponents = doctor.split(/\s+/)
      if (nameComponents.length >= 2 && nameComponents.length <= 4 && doctor.length >= 5 && doctor.length <= 60) {
        return doctor
      }
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

  // Doctor adds some confidence (5 points)
  if (patient.doctor) {
    confidence += 5
  }

  return Math.min(confidence, 100)
}

/**
 * Extracts patient information from PDF buffer
 */
export async function extractPatientFromPDF(pdfBuffer: Buffer): Promise<ExtractionResult> {
  try {
    // Use enhanced PDF text extraction
    const textExtraction = await extractTextFromPDF(pdfBuffer)
    
    if (!textExtraction.success) {
      return {
        success: false,
        patient: null,
        error: textExtraction.error || 'Error al extraer texto del PDF'
      }
    }
    
    // Use first page text for patient extraction (more reliable)
    const firstPageText = textExtraction.firstPageText

    // Extract patient information
    const rut = extractRUT(firstPageText)
    const name = extractPatientName(firstPageText)
    const age = extractAge(firstPageText)
    const gender = extractGender(firstPageText)
    const doctor = extractDoctorName(firstPageText)

    const patient: PatientInfo = {
      rut,
      name,
      age,
      gender,
      doctor,
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