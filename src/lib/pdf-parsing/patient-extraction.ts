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
  // Chilean lab format: field name on one line, value on next line
  const namePatterns = [
    // Nombre :\n ISABEL DEL ROSARIO BOLADOS VEGA
    /Nombre\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // NOMBRE :\n ISABEL DEL ROSARIO BOLADOS VEGA  
    /NOMBRE\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Paciente :\n ISABEL DEL ROSARIO BOLADOS VEGA
    /Paciente\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // PACIENTE :\n ISABEL DEL ROSARIO BOLADOS VEGA
    /PACIENTE\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Fallback: same line patterns
    /Nombre\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Sexo|RUT|Edad|Folio))/i,
    /NOMBRE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Sexo|RUT|Edad|Folio))/i
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim()
      
      // Clean up any trailing content that might be captured
      name = name.replace(/\s*(?:Sexo|RUT|Edad|Folio|Fecha).*$/i, '').trim()
      
      // Validate Chilean name structure (2-4 components: 1-2 names + 2 lastnames)
      const nameComponents = name.split(/\s+/)
      if (nameComponents.length >= 2 && nameComponents.length <= 6 && name.length >= 5 && name.length <= 80) {
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
  // Chilean lab format: field name on one line, value on next line
  const agePatterns = [
    // Edad :\n 73a 3m 17d
    /Edad\s*:?\s*\n\s*(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    // EDAD :\n 73a 3m 17d
    /EDAD\s*:?\s*\n\s*(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    // Edad :\n 45 años
    /Edad\s*:?\s*\n\s*(\d{1,3})\s*años?/i,
    // EDAD :\n 45 años
    /EDAD\s*:?\s*\n\s*(\d{1,3})\s*años?/i,
    // Edad :\n 45
    /Edad\s*:?\s*\n\s*(\d{1,3})/i,
    // EDAD :\n 45
    /EDAD\s*:?\s*\n\s*(\d{1,3})/i,
    // Fallback: same line patterns
    /Edad\s*:?\s*(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    /EDAD\s*:?\s*(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    /Edad\s*:?\s*(\d{1,3})\s*años?/i,
    /EDAD\s*:?\s*(\d{1,3})\s*años?/i
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
  // Chilean lab format: field name on one line, value on next line
  const genderPatterns = [
    // Sexo :\n Femenino
    /Sexo\s*:?\s*\n\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i,
    // SEXO :\n Femenino
    /SEXO\s*:?\s*\n\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i,
    // Género :\n Femenino
    /Género\s*:?\s*\n\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i,
    // GÉNERO :\n Femenino
    /GÉNERO\s*:?\s*\n\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i,
    // Fallback: same line patterns
    /Sexo\s*:?\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i,
    /SEXO\s*:?\s*(MASCULINO|FEMENINO|Masculino|Femenino|M|F)/i
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
  // Chilean lab format: field name on one line, value on next line
  // Note: some PDFs have "Profesional Solicitante: :" with double colon
  const doctorPatterns = [
    // Profesional Solicitante: :\n STEVENSON JEAN SIMON
    /Profesional\s+Solicitante\s*:?\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // PROFESIONAL SOLICITANTE: :\n STEVENSON JEAN SIMON
    /PROFESIONAL\s+SOLICITANTE\s*:?\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Médico :\n STEVENSON JEAN SIMON
    /Médico\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // MEDICO :\n STEVENSON JEAN SIMON
    /MEDICO\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Doctor :\n STEVENSON JEAN SIMON
    /Doctor\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // DOCTOR :\n STEVENSON JEAN SIMON
    /DOCTOR\s*:?\s*\n\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Fallback: same line patterns
    /Profesional\s+Solicitante\s*:?\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Nombre|Folio|Fecha))/i,
    /PROFESIONAL\s+SOLICITANTE\s*:?\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Nombre|Folio|Fecha))/i
  ]

  for (const pattern of doctorPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let doctor = match[1].trim()
      
      // Clean up any trailing content that might be captured
      doctor = doctor.replace(/\s*(?:Nombre|Folio|Fecha|Sexo|RUT|Edad).*$/i, '').trim()
      
      // Validate doctor name structure (2-4 components like patient names)
      const nameComponents = doctor.split(/\s+/)
      if (nameComponents.length >= 2 && nameComponents.length <= 6 && doctor.length >= 5 && doctor.length <= 80) {
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