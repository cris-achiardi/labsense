#!/usr/bin/env tsx

/**
 * Direct test of lab extraction without using pdf-text-extractor
 */

import { readFileSync } from 'fs'
import { extractLabResultsSimple } from './src/lib/pdf-parsing/simple-lab-extractor'

async function testDirectExtraction() {
  try {
    console.log('🔍 Testing direct lab extraction on sample PDF...')
    
    // Read PDF file
    const pdfPath = 'docs/pdf-sample/labsense_lab-sample(real patient).pdf'
    const pdfBuffer = readFileSync(pdfPath)
    console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Use pdf-parse directly
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(pdfBuffer)
    
    console.log(`📑 Pages: ${data.numpages}`)
    console.log(`📝 Total text length: ${data.text.length} characters`)
    
    // Test simple extraction
    const startTime = Date.now()
    const labResults = extractLabResultsSimple(data.text)
    const duration = Date.now() - startTime
    
    console.log(`⏱️  Extraction time: ${duration}ms`)
    console.log(`🧪 Lab results found: ${labResults.length}`)
    
    console.log('\n📊 Extracted Lab Results:')
    console.log('─'.repeat(80))
    
    labResults.forEach((lab, index) => {
      const abnormalFlag = lab.isAbnormal ? ' [*]' : ''
      console.log(`${index + 1}. ${lab.examen}: ${lab.resultado} ${lab.unidad}${abnormalFlag}`)
      console.log(`   Reference: ${lab.valorReferencia}`)
      console.log(`   Method: ${lab.metodo || 'N/A'}`)
      console.log(`   Confidence: ${lab.confidence}%`)
      console.log('')
    })
    
    console.log('─'.repeat(80))
    console.log(`📈 Coverage: ${labResults.length}/68 (${(labResults.length/68*100).toFixed(1)}%)`)
    
    // Show first 1000 characters of text to understand the format
    console.log('\n📋 First 1000 characters of extracted text:')
    console.log('─'.repeat(50))
    console.log(data.text.substring(0, 1000))
    console.log('─'.repeat(50))
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testDirectExtraction()