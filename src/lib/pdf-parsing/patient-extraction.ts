import * as pdfParse from 'pdf-parse'

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
 * Validates Chilean RUT format and check digit
 */
export function validateChileanRUT(rut: string): boolean {
  // Remove dots and hyphens, convert to uppercase
  const cleanRUT = rut.replace(/[.-]/g, '').toUpperCase()
  
  // Check format: 7-8 digits + 1 check digit (number or K)
  if (!/^\d{7,8}[0-9K]$/.test(cleanRUT)) {
    return false
  }
  
  const rutDigits = cleanRUT.slice(0, -1)
  const checkDigit = cleanRUT.slice(-1)
  
  // Calculate check digit
  let sum = 0
  let multiplier = 2
  
  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const remainder = sum % 11
  const calculatedCheckDigit = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString()
  
  return checkDigit === calculatedCheckDigit
}

/**
 * Formats Chilean RUT with dots and hyphen
 */
export function formatChileanRUT(rut: string): string {
  const cleanRUT = rut.replace(/[.-]/g, '')
  if (cleanRUT.length < 8) return rut
  
  const rutDigits = cleanRUT.slice(0, -1)
  const checkDigit = cleanRUT.slice(-1)
  
  // Add dots every 3 digits from right to left
  const formattedDigits = rutDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${formattedDigits}-${checkDigit}`
}

/**
 * Extracts Chilean RUT patterns from text
 */
function extractRUT(text: string): string | null {
  // Common RUT patterns in Chilean documents
  const rutPatterns = [
    // Standard format: 12.345.678-9 or 12345678-9
    /\b(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])\b/gi,
    // RUT with spaces: 12 345 678-9
    /\b(\d{1,2}\s\d{3}\s\d{3}-[0-9K])\b/gi,
    // RUT in forms: RUT: 12.345.678-9
    /RUT\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi,
    // Cedula patterns
    /C\.?I\.?\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-[0-9K])/gi
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
  // Common patterns for patient names in Chilean lab reports
  const namePatterns = [
    // Paciente: NOMBRE APELLIDO
    /PACIENTE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Nombre: NOMBRE APELLIDO
    /NOMBRE\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // After RUT, usually comes the name
    /\d{1,2}\.?\d{3}\.?\d{3}-[0-9K]\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
    // Names in header sections
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ]+)/m
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
  // Age patterns in Chilean format
  const agePatterns = [
    // Edad: 45 años
    /EDAD\s*:?\s*(\d{1,3})\s*años?/i,
    // 45a 2m 17d (years, months, days)
    /(\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d)/i,
    // 45 años
    /(\d{1,3})\s*años?/i
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
  // Gender patterns
  const genderPatterns = [
    /SEXO\s*:?\s*(MASCULINO|FEMENINO|M|F)/i,
    /GÉNERO\s*:?\s*(MASCULINO|FEMENINO|M|F)/i
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