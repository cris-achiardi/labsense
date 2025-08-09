// Chilean RUT validation utilities

/**
 * Validates a Chilean RUT (Rol Único Tributario)
 * Format: XX.XXX.XXX-X where X is the check digit
 */
export function validateChileanRUT(rut: string): boolean {
  if (!rut || typeof rut !== 'string') {
    return false
  }

  // Remove dots and hyphens, convert to uppercase
  const cleanRUT = rut.replace(/[.-]/g, '').toUpperCase()
  
  // Check format: 7-8 digits + 1 check digit
  if (!/^\d{7,8}[0-9K]$/.test(cleanRUT)) {
    return false
  }

  const body = cleanRUT.slice(0, -1)
  const checkDigit = cleanRUT.slice(-1)

  // Calculate check digit using Chilean algorithm
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const calculatedCheckDigit = remainder < 2 ? remainder.toString() : 'K'

  return checkDigit === calculatedCheckDigit
}

/**
 * Formats a Chilean RUT with dots and hyphen
 * Input: "72364260" or "7236426-0"
 * Output: "7.236.426-0"
 */
export function formatChileanRUT(rut: string): string {
  if (!rut) return ''

  // Remove existing formatting
  const cleanRUT = rut.replace(/[.-]/g, '')
  
  if (cleanRUT.length < 8) return rut

  const body = cleanRUT.slice(0, -1)
  const checkDigit = cleanRUT.slice(-1)

  // Add dots every 3 digits from right to left
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${formattedBody}-${checkDigit}`
}

/**
 * Extracts RUT from text using Chilean format patterns
 */
export function extractRUTFromText(text: string): string | null {
  const rutPattern = /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/gi
  const match = text.match(rutPattern)
  
  if (match && match.length > 0) {
    const rut = match[0].toUpperCase()
    return validateChileanRUT(rut) ? rut : null
  }

  return null
}

/**
 * Anonymizes RUT for logging (keeps format but replaces digits)
 * Input: "7.236.426-0"
 * Output: "X.XXX.XXX-X"
 */
export function anonymizeRUT(rut: string): string {
  if (!rut) return ''
  
  return rut.replace(/\d/g, 'X')
}