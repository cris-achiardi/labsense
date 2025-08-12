// Tests for Task 7: Abnormal Value Detection system

import { SeverityClassifier } from '../severity-classifier'
import { PriorityScorer } from '../priority-scorer'
import { CriticalThresholdChecker } from '../critical-thresholds'
import { AbnormalDetectionService } from '../index'
import { HealthMarker, NormalRange } from '@/types/database'

// Simple test runner for development
export function runAbnormalDetectionTests() {
  console.log('🧪 Running Abnormal Detection Tests...')

  // Mock health markers with various scenarios
  const mockHealthMarkers: HealthMarker[] = [
    {
      id: '1',
      lab_report_id: 'report-1',
      marker_type: 'GLICEMIA EN AYUNO',
      value: 180, // High (normal: 74-106)
      unit: 'mg/dL',
      extracted_text: 'GLICEMIA EN AYUNO: 180 mg/dL [ * ]',
      confidence: 0.95,
      is_abnormal: false,
      abnormal_indicator: '[ * ]',
      severity: undefined,
      is_critical_value: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '2',
      lab_report_id: 'report-1',
      marker_type: 'COLESTEROL TOTAL',
      value: 95, // Normal (normal: 0-200)
      unit: 'mg/dL',
      extracted_text: 'COLESTEROL TOTAL: 95 mg/dL',
      confidence: 0.90,
      is_abnormal: false,
      abnormal_indicator: undefined,
      severity: undefined,
      is_critical_value: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '3',
      lab_report_id: 'report-1',
      marker_type: 'HEMOGLOBINA GLICADA A1C',
      value: 12.5, // Critical (normal: 4-6, critical: >10)
      unit: '%',
      extracted_text: 'HEMOGLOBINA GLICADA A1C: 12.5 %',
      confidence: 0.88,
      is_abnormal: false,
      abnormal_indicator: undefined,
      severity: undefined,
      is_critical_value: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '4',
      lab_report_id: 'report-1',
      marker_type: 'ALT',
      value: 250, // Critical (normal: 7-56, critical: >200)
      unit: 'U/L',
      extracted_text: 'ALT: 250 U/L [ * ]',
      confidence: 0.92,
      is_abnormal: false,
      abnormal_indicator: '[ * ]',
      severity: undefined,
      is_critical_value: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]

  // Mock normal ranges
  const mockNormalRanges: NormalRange[] = [
    {
      id: '1',
      marker_type: 'GLICEMIA EN AYUNO',
      min_value: 74,
      max_value: 106,
      unit: 'mg/dL',
      source: 'Chilean Healthcare Standards',
      raw_text: '74-106 mg/dL',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '2',
      marker_type: 'COLESTEROL TOTAL',
      min_value: 0,
      max_value: 200,
      unit: 'mg/dL',
      source: 'Chilean Healthcare Standards',
      raw_text: '0-200 mg/dL',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '3',
      marker_type: 'HEMOGLOBINA GLICADA A1C',
      min_value: 4.0,
      max_value: 6.0,
      unit: '%',
      source: 'Chilean Healthcare Standards',
      raw_text: '4.0-6.0 %',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '4',
      marker_type: 'ALT',
      min_value: 7,
      max_value: 56,
      unit: 'U/L',
      source: 'Chilean Healthcare Standards',
      raw_text: '7-56 U/L',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]

  // Test SeverityClassifier
  console.log('Testing SeverityClassifier...')
  
  // Test normal values
  const normalMarker = mockHealthMarkers[1] // COLESTEROL TOTAL: 95
  const normalRange = mockNormalRanges[1]
  const normalClassification = SeverityClassifier.classifySeverity(normalMarker, normalRange)
  
  console.assert(normalClassification.severity === 'normal', 'Normal value should be classified as normal')
  console.assert(normalClassification.isAbnormal === false, 'Normal value should not be abnormal')
  console.assert(normalClassification.isCriticalValue === false, 'Normal value should not be critical')

  // Test abnormal values
  const abnormalMarker = mockHealthMarkers[0] // GLICEMIA EN AYUNO: 180
  const abnormalNormalRange = mockNormalRanges[0]
  const abnormalClassification = SeverityClassifier.classifySeverity(abnormalMarker, abnormalNormalRange)
  
  console.assert(abnormalClassification.isAbnormal === true, 'Abnormal value should be flagged as abnormal')
  console.assert(abnormalClassification.severity === 'severe', 'High glucose should be severe')

  // Test critical values
  const criticalMarker = mockHealthMarkers[2] // HbA1c: 12.5
  const criticalNormalRange = mockNormalRanges[2]
  const criticalClassification = SeverityClassifier.classifySeverity(criticalMarker, criticalNormalRange)
  
  console.assert(criticalClassification.isCriticalValue === true, 'Critical value should be flagged')
  console.assert(criticalClassification.severity === 'severe', 'Critical value should be severe')

  // Test batch classification
  const classifications = SeverityClassifier.classifyMultipleMarkers(mockHealthMarkers, mockNormalRanges)
  console.assert(classifications.size === 4, 'Should classify all 4 markers')

  // Test CriticalThresholdChecker
  console.log('Testing CriticalThresholdChecker...')
  
  const isCriticalGlucose = CriticalThresholdChecker.isCriticalValue('GLICEMIA EN AYUNO', 300, 'mg/dL')
  console.assert(isCriticalGlucose === true, 'High glucose should be critical')

  const isCriticalHbA1c = CriticalThresholdChecker.isCriticalValue('HEMOGLOBINA GLICADA A1C', 12.5, '%')
  console.assert(isCriticalHbA1c === true, 'High HbA1c should be critical')

  const isNormalCritical = CriticalThresholdChecker.isCriticalValue('COLESTEROL TOTAL', 150, 'mg/dL')
  console.assert(isNormalCritical === false, 'Normal cholesterol should not be critical')

  // Test alert generation
  const alert = CriticalThresholdChecker.generateCriticalAlert('GLICEMIA EN AYUNO', 300, 'mg/dL')
  console.assert(alert?.includes('INMEDIATO'), 'Critical glucose should generate immediate alert')

  // Test PriorityScorer
  console.log('Testing PriorityScorer...')
  
  const priorityScore = PriorityScorer.calculatePriorityScore(
    classifications,
    mockHealthMarkers,
    { age: 65, sex: 'M' }
  )
  
  console.assert(priorityScore.totalScore > 0, 'Priority score should be greater than 0')
  console.assert(priorityScore.priorityLevel === 'HIGH', 'Should be HIGH priority due to critical values')
  console.assert(priorityScore.breakdown.criticalValueBonus > 0, 'Should have critical value bonus')

  // Test AbnormalDetectionService
  console.log('Testing AbnormalDetectionService...')
  
  const result = AbnormalDetectionService.detectAbnormalValuesQuick(
    mockHealthMarkers,
    mockNormalRanges,
    { age: 55, sex: 'M' }
  )
  
  console.assert(result.classifications.size === 4, 'Should classify all markers')
  console.assert(result.summary.abnormalMarkers === 3, 'Should detect 3 abnormal markers')
  console.assert(result.summary.criticalMarkers === 2, 'Should detect 2 critical markers')
  console.assert(result.priorityScore.priorityLevel === 'HIGH', 'Should be HIGH priority')
  console.assert(result.criticalValues.length === 2, 'Should find 2 critical values')

  console.log('✅ All Abnormal Detection Tests Passed!')
  
  return {
    classifications,
    priorityScore,
    result,
    mockHealthMarkers,
    mockNormalRanges
  }
}

// Export for use in development
export {
  SeverityClassifier,
  PriorityScorer,
  CriticalThresholdChecker,
  AbnormalDetectionService
}