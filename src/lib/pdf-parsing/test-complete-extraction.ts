/**
 * Test utility for complete lab extraction
 * Task 11.1: Validate complete lab results extraction
 * 
 * This tests the new complete extraction against the real Chilean PDF sample
 */

import { extractCompleteLabReport } from './lab-results-extractor'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function testCompleteLabExtraction() {
  try {
    console.log('🧪 Testing Complete Lab Extraction...')
    console.log('=====================================')
    
    // Load the real Chilean PDF sample
    const pdfPath = join(process.cwd(), 'docs/pdf-sample/labsense_lab-sample(real patient).pdf')
    
    console.log(`📄 Loading PDF: ${pdfPath}`)
    
    const pdfBuffer = readFileSync(pdfPath)
    console.log(`📊 PDF Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    
    // Extract complete lab report
    console.log('\n🔍 Extracting complete lab report...')
    const startTime = Date.now()
    
    const result = await extractCompleteLabReport(pdfBuffer)
    
    const processingTime = Date.now() - startTime
    console.log(`⏱️  Processing Time: ${processingTime}ms`)
    
    if (!result.success) {
      console.error('❌ Extraction failed:', result.error)
      return false
    }
    
    console.log('\n✅ Extraction successful!')
    console.log(`🎯 Overall Confidence: ${result.confidence}%`)
    
    // Display patient information
    console.log('\n👤 PATIENT INFORMATION:')
    console.log('========================')
    if (result.patient) {
      console.log(`RUT: ${result.patient.rut}`)
      console.log(`Name: ${result.patient.name}`)
      console.log(`Age: ${result.patient.age}`)
      console.log(`Gender: ${result.patient.gender}`)
    } else {
      console.log('❌ No patient information extracted')
    }
    
    // Display lab report metadata
    console.log('\n📋 LAB REPORT METADATA:')
    console.log('========================')
    console.log(`Folio: ${result.metadata.folio}`)
    console.log(`Fecha Ingreso: ${result.metadata.fechaIngreso}`)
    console.log(`Toma Muestra: ${result.metadata.tomaMuestra}`)
    console.log(`Fecha Validación: ${result.metadata.fechaValidacion}`)
    console.log(`Profesional Solicitante: ${result.metadata.profesionalSolicitante}`)
    console.log(`Procedencia: ${result.metadata.procedencia}`)
    console.log(`Total Results: ${result.metadata.totalResults}`)
    console.log(`Abnormal Count: ${result.metadata.abnormalCount}`)
    console.log(`Critical Count: ${result.metadata.criticalCount}`)
    
    // Display lab results
    console.log('\n🧪 LAB RESULTS:')
    console.log('================')
    
    if (result.labResults.length === 0) {
      console.log('❌ No lab results extracted')
      return false
    }
    
    result.labResults.forEach((labResult, index) => {
      console.log(`\n${index + 1}. ${labResult.examen}`)
      console.log(`   Resultado: ${labResult.resultado}`)
      console.log(`   Unidad: ${labResult.unidad}`)
      console.log(`   Valor Referencia: ${labResult.valorReferencia}`)
      console.log(`   Método: ${labResult.metodo}`)
      console.log(`   Tipo Muestra: ${labResult.tipoMuestra}`)
      console.log(`   Abnormal: ${labResult.isAbnormal ? '⚠️  YES' : '✅ NO'} ${labResult.abnormalIndicator}`)
      console.log(`   System Code: ${labResult.systemCode}`)
      console.log(`   Category: ${labResult.category}`)
      console.log(`   Priority: ${labResult.priority}`)
      console.log(`   Confidence: ${labResult.confidence}%`)
    })
    
    // Display summary statistics
    console.log('\n📊 SUMMARY STATISTICS:')
    console.log('=======================')
    console.log(`Total Lab Results: ${result.labResults.length}`)
    console.log(`Normal Results: ${result.labResults.filter(r => !r.isAbnormal).length}`)
    console.log(`Abnormal Results: ${result.labResults.filter(r => r.isAbnormal).length}`)
    console.log(`Critical Results: ${result.labResults.filter(r => r.priority === 'critical' && r.isAbnormal).length}`)
    
    // Results by category
    const byCategory = result.labResults.reduce((acc, r) => {
      if (r.category) {
        acc[r.category] = (acc[r.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    console.log('\nResults by Category:')
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`)
    })
    
    // Results by priority
    const byPriority = result.labResults.reduce((acc, r) => {
      if (r.priority) {
        acc[r.priority] = (acc[r.priority] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    console.log('\nResults by Priority:')
    Object.entries(byPriority).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`)
    })
    
    // Validate expected results from PDF analysis
    console.log('\n🎯 VALIDATION AGAINST EXPECTED RESULTS:')
    console.log('========================================')
    
    const expectedResults = [
      { name: 'GLICEMIA EN AYUNO', value: 269, unit: 'mg/dL', abnormal: true },
      { name: 'HEMOGLOBINA GLICADA A1C', value: 11.8, unit: '%', abnormal: true },
      { name: 'H. TIROESTIMULANTE (TSH)', value: 11.040, unit: 'μUI/mL', abnormal: true },
      { name: 'TRIGLICERIDOS', value: 136, unit: 'mg/dL', abnormal: false },
      { name: 'COLESTEROL TOTAL', value: 213, unit: 'mg/dL', abnormal: true }
    ]
    
    let validationScore = 0
    expectedResults.forEach(expected => {
      const found = result.labResults.find(r => 
        r.examen.toUpperCase().includes(expected.name.toUpperCase())
      )
      
      if (found) {
        console.log(`✅ Found: ${expected.name}`)
        console.log(`   Expected: ${expected.value} ${expected.unit}, Abnormal: ${expected.abnormal}`)
        console.log(`   Extracted: ${found.resultado} ${found.unidad}, Abnormal: ${found.isAbnormal}`)
        validationScore++
      } else {
        console.log(`❌ Missing: ${expected.name}`)
      }
    })
    
    const validationPercentage = Math.round((validationScore / expectedResults.length) * 100)
    console.log(`\n🎯 Validation Score: ${validationScore}/${expectedResults.length} (${validationPercentage}%)`)
    
    if (validationPercentage >= 80) {
      console.log('✅ VALIDATION PASSED - Complete lab extraction working correctly!')
      return true
    } else {
      console.log('❌ VALIDATION FAILED - Need to improve extraction patterns')
      return false
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Export for use in other modules
export default testCompleteLabExtraction

// Uncomment to run test directly
// testCompleteLabExtraction()
//   .then(success => {
//     console.log(success ? '\n🎉 Test completed successfully!' : '\n💥 Test failed!')
//     process.exit(success ? 0 : 1)
//   })
//   .catch(error => {
//     console.error('Test error:', error)
//     process.exit(1)
//   })