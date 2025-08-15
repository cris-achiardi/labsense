/**
 * Test utility for PDF parsing functionality
 * Use this to test PDF extraction locally before deployment
 */

import { extractTextFromPDF } from './pdf-text-extractor'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function testPDFExtraction(pdfPath: string) {
  try {
    console.log('🔍 Testing PDF extraction...')
    console.log(`📄 File: ${pdfPath}`)
    
    // Read PDF file
    const pdfBuffer = readFileSync(pdfPath)
    console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Extract text
    const startTime = Date.now()
    const result = await extractTextFromPDF(pdfBuffer)
    const duration = Date.now() - startTime
    
    console.log(`⏱️  Extraction time: ${duration}ms`)
    
    if (result.success) {
      console.log('✅ Extraction successful!')
      console.log(`📑 Pages: ${result.metadata?.pageCount || 0}`)
      console.log(`📝 Total text length: ${result.fullText.length} characters`)
      console.log(`📄 First page length: ${result.firstPageText.length} characters`)
      
      // Show first 500 characters of extracted text
      console.log('\n📋 First 500 characters:')
      console.log('─'.repeat(50))
      console.log(result.firstPageText.substring(0, 500))
      console.log('─'.repeat(50))
      
      return result
    } else {
      console.error('❌ Extraction failed:', result.error)
      return null
    }
    
  } catch (error) {
    console.error('💥 Test error:', error)
    return null
  }
}

// Example usage (uncomment to test with a real PDF):
// testPDFExtraction('./test-lab-report.pdf')
//   .then(result => {
//     if (result) {
//       console.log('🎉 Test completed successfully!')
//     }
//   })
//   .catch(console.error)