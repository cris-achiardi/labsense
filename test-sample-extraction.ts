#!/usr/bin/env tsx

/**
 * Test complete lab extraction on the sample PDF
 */

import { extractCompleteLabReport } from './src/lib/pdf-parsing/lab-results-extractor'
import { readFileSync } from 'fs'

async function testSampleExtraction() {
  try {
    console.log('🔍 Testing complete lab extraction on sample PDF...')
    
    // Read PDF file
    const pdfPath = 'docs/pdf-sample/labsense_lab-sample(real patient).pdf'
    const pdfBuffer = readFileSync(pdfPath)
    console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Extract complete lab report
    const startTime = Date.now()
    const result = await extractCompleteLabReport(pdfBuffer)
    const duration = Date.now() - startTime
    
    console.log(`⏱️  Extraction time: ${duration}ms`)
    
    if (result.success) {
      console.log('✅ Extraction successful!')
      console.log(`👤 Patient: ${result.patient?.name || 'N/A'}`)
      console.log(`🆔 RUT: ${result.patient?.rut || 'N/A'}`)
      console.log(`📋 Folio: ${result.metadata.folio || 'N/A'}`)
      console.log(`📅 Sample Date: ${result.metadata.tomaMuestra || 'N/A'}`)
      
      console.log('\n🧪 Lab Results Extracted:')
      console.log(`Total results: ${result.labResults.length}`)
      console.log(`Abnormal results: ${result.metadata.abnormalCount}`)
      console.log(`Critical results: ${result.metadata.criticalCount}`)
      console.log(`Overall confidence: ${result.confidence}%`)
      
      console.log('\n📊 Extracted Lab Results:')
      console.log('─'.repeat(80))
      
      result.labResults.forEach((lab, index) => {
        const abnormalFlag = lab.isAbnormal ? ' [*]' : ''
        console.log(`${index + 1}. ${lab.examen}: ${lab.resultado} ${lab.unidad}${abnormalFlag}`)
        console.log(`   Reference: ${lab.valorReferencia}`)
        console.log(`   Method: ${lab.metodo || 'N/A'}`)
        console.log(`   Confidence: ${lab.confidence}%`)
        console.log('')
      })
      
      console.log('─'.repeat(80))
      console.log(`📈 Coverage: ${result.labResults.length}/68 (${(result.labResults.length/68*100).toFixed(1)}%)`)
      
    } else {
      console.error('❌ Extraction failed:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testSampleExtraction()