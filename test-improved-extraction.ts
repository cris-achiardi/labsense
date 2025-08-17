#!/usr/bin/env tsx

/**
 * Test improved comprehensive lab extraction on the sample PDF
 */

import { extractCompleteLabReport } from './src/lib/pdf-parsing/lab-results-extractor'
import { readFileSync } from 'fs'

async function testImprovedExtraction() {
  try {
    console.log('🔍 Testing improved comprehensive lab extraction...')
    
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
      
      console.log('\n📊 Results by Category:')
      const categories = result.labResults.reduce((acc, lab) => {
        const cat = lab.category || 'other'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`)
        })
      
      console.log('\n📊 Results by Priority:')
      const priorities = result.labResults.reduce((acc, lab) => {
        const pri = lab.priority || 'low'
        acc[pri] = (acc[pri] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(priorities)
        .sort((a, b) => b[1] - a[1])
        .forEach(([priority, count]) => {
          console.log(`  ${priority}: ${count}`)
        })
      
      console.log('\n📈 Coverage Analysis:')
      console.log(`Target: 68 lab results`)
      console.log(`Extracted: ${result.labResults.length} lab results`)
      console.log(`Coverage: ${(result.labResults.length/68*100).toFixed(1)}%`)
      
      if (result.labResults.length >= 68) {
        console.log('🎯 SUCCESS: Achieved 100% coverage!')
      } else {
        console.log(`⚠️  Missing: ${68 - result.labResults.length} lab results`)
      }
      
      console.log('\n📋 Sample of extracted results:')
      console.log('─'.repeat(80))
      
      result.labResults.slice(0, 10).forEach((lab, index) => {
        const abnormalFlag = lab.isAbnormal ? ' [*]' : ''
        console.log(`${index + 1}. ${lab.examen}: ${lab.resultado} ${lab.unidad}${abnormalFlag}`)
        console.log(`   Reference: ${lab.valorReferencia}`)
        console.log(`   Category: ${lab.category}, Priority: ${lab.priority}`)
        console.log(`   Confidence: ${lab.confidence}%`)
        console.log('')
      })
      
      if (result.labResults.length > 10) {
        console.log(`... and ${result.labResults.length - 10} more results`)
      }
      
    } else {
      console.error('❌ Extraction failed:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testImprovedExtraction()