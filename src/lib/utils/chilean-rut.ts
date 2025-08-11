/**
 * Chilean RUT validation and formatting utilities
 */

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
  
  // Calculate check digit using Chilean algorithm
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
 * Anonymizes Chilean RUT for logging (keeps format but hides digits)
 */
export function anonymizeChileanRUT(rut: string): string {
  if (!rut || !validateChileanRUT(rut)) {
    return '**.***.**-*'
  }
  
  const cleanRUT = rut.replace(/[.-]/g, '')
  const checkDigit = cleanRUT.slice(-1)
  
  // Keep first digit, hide middle digits, keep check digit
  const firstDigit = cleanRUT.charAt(0)
  const hiddenMiddle = '*'.repeat(cleanRUT.length - 2)
  
  return formatChileanRUT(firstDigit + hiddenMiddle + checkDigit)
}