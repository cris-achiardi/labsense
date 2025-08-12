// Tests for Task 7: Abnormal Value Detection system

import { describe, it, expect, beforeEach } from '@jest/globals'
import { SeverityClassifier } from '../severity-classifier'
import { PriorityScorer } from '../priority-scorer'
import { CriticalThresholdChecker } from '../critical-thresholds'
import { AbnormalDetectionService } from '../index'
import { HealthMarker, NormalRange } from '@/types/database'

describe('Abnormal Value Detection System', () => {
  let mockHealthMarkers: HealthMarker[]
  let mockNormalRanges: NormalRange[]

  beforeEach(() => {
    // Mock health markers with various scenarios
    mockHealthMarkers = [
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
        severity: null,
        is_critical_value: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        abnormal_indicator: null,
        severity: null,
        is_critical_value: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        abnormal_indicator: null,
        severity: null,
        is_critical_value: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        severity: null,
        is_critical_value: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Mock normal ranges
    mockNormalRanges = [
      {
        id: '1',
        marker_type: 'GLICEMIA EN AYUNO',
        min_value: 74,
        max_value: 106,
        unit: 'mg/dL',
        source: 'Chilean Healthcare Standards',
        raw_text: '74-106 mg/dL',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  })

  describe('SeverityClassifier', () => {
    it('should classify normal values correctly', () => {
      const marker = mockHealthMarkers[1] // COLESTEROL TOTAL: 95
      const normalRange = mockNormalRanges[1]
      
      const classification = SeverityClassifier.classifySeverity(marker, normalRange)
      
      expect(classification.severity).toBe('normal')
      expect(classification.isAbnormal).toBe(false)
      expect(classification.isCriticalValue).toBe(false)
      expect(classification.priorityWeight).toBe(0)
    })

    it('should classify mild abnormal values correctly', () => {
      const marker = mockHealthMarkers[0] // GLICEMIA EN AYUNO: 180 (normal: 74-106)
      const normalRange = mockNormalRanges[0]
      
      const classification = SeverityClassifier.classifySeverity(marker, normalRange)
      
      expect(classification.severity).toBe('severe') // 180 is way above 106
      expect(classification.isAbnormal).toBe(true)
      expect(classification.isCriticalValue).toBe(false) // Not critical threshold yet
      expect(classification.priorityWeight).toBe(5)
    })

    it('should classify critical values correctly', () => {
      const marker = mockHealthMarkers[2] // HbA1c: 12.5 (critical: >10)
      const normalRange = mockNormalRanges[2]
      
      const classification = SeverityClassifier.classifySeverity(marker, normalRange)
      
      expect(classification.severity).toBe('severe')
      expect(classification.isAbnormal).toBe(true)
      expect(classification.isCriticalValue).toBe(true)
      expect(classification.priorityWeight).toBe(5)
    })

    it('should batch classify multiple markers', () => {
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        mockHealthMarkers,
        mockNormalRanges
      )
      
      expect(classifications.size).toBe(4)
      
      // Check normal cholesterol
      const cholesterolClassification = classifications.get('2')
      expect(cholesterolClassification?.severity).toBe('normal')
      
      // Check abnormal glucose
      const glucoseClassification = classifications.get('1')
      expect(glucoseClassification?.isAbnormal).toBe(true)
      
      // Check critical HbA1c
      const hba1cClassification = classifications.get('3')
      expect(hba1cClassification?.isCriticalValue).toBe(true)
    })
  })

  describe('CriticalThresholdChecker', () => {
    it('should detect critical glucose values', () => {
      const isCritical = CriticalThresholdChecker.isCriticalValue(
        'GLICEMIA EN AYUNO',
        300, // Above critical threshold of 250
        'mg/dL'
      )
      
      expect(isCritical).toBe(true)
    })

    it('should detect critical HbA1c values', () => {
      const isCritical = CriticalThresholdChecker.isCriticalValue(
        'HEMOGLOBINA GLICADA A1C',
        12.5, // Above critical threshold of 10
        '%'
      )
      
      expect(isCritical).toBe(true)
    })

    it('should not flag normal values as critical', () => {
      const isCritical = CriticalThresholdChecker.isCriticalValue(
        'COLESTEROL TOTAL',
        150, // Normal value
        'mg/dL'
      )
      
      expect(isCritical).toBe(false)
    })

    it('should generate critical alerts', () => {
      const alert = CriticalThresholdChecker.generateCriticalAlert(
        'GLICEMIA EN AYUNO',
        300,
        'mg/dL'
      )
      
      expect(alert).toContain('INMEDIATO')
      expect(alert).toContain('300 mg/dL')
      expect(alert).toContain('coma diabético')
    })

    it('should find critical values in batch', () => {
      const criticalValues = CriticalThresholdChecker.findCriticalValues([
        { markerType: 'GLICEMIA EN AYUNO', value: 300, unit: 'mg/dL', id: '1' },
        { markerType: 'COLESTEROL TOTAL', value: 150, unit: 'mg/dL', id: '2' },
        { markerType: 'HEMOGLOBINA GLICADA A1C', value: 12.5, unit: '%', id: '3' }
      ])
      
      expect(criticalValues).toHaveLength(2) // Glucose and HbA1c
      expect(criticalValues[0].markerId).toBe('1')
      expect(criticalValues[1].markerId).toBe('3')
    })
  })

  describe('PriorityScorer', () => {
    it('should calculate priority scores correctly', () => {
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        mockHealthMarkers,
        mockNormalRanges
      )
      
      const priorityScore = PriorityScorer.calculatePriorityScore(
        classifications,
        mockHealthMarkers,
        { age: 65, sex: 'M' }
      )
      
      expect(priorityScore.totalScore).toBeGreaterThan(0)
      expect(priorityScore.priorityLevel).toBe('HIGH') // Should be high due to critical values
      expect(priorityScore.breakdown.criticalValueBonus).toBeGreaterThan(0)
      expect(priorityScore.breakdown.ageFactorBonus).toBeGreaterThan(0)
    })

    it('should apply age factors correctly', () => {
      const classifications = new Map()
      classifications.set('1', {
        severity: 'moderate' as const,
        isAbnormal: true,
        isCriticalValue: false,
        deviationPercent: 50,
        reasoning: 'Test',
        priorityWeight: 3
      })
      
      const youngPatientScore = PriorityScorer.calculatePriorityScore(
        classifications,
        [mockHealthMarkers[0]],
        { age: 30 }
      )
      
      const elderlyPatientScore = PriorityScorer.calculatePriorityScore(
        classifications,
        [mockHealthMarkers[0]],
        { age: 85 }
      )
      
      expect(elderlyPatientScore.totalScore).toBeGreaterThan(youngPatientScore.totalScore)
      expect(elderlyPatientScore.breakdown.ageFactorBonus).toBeGreaterThan(0)
    })

    it('should determine priority levels correctly', () => {
      // Test HIGH priority (critical values)
      const highClassifications = new Map()
      highClassifications.set('1', {
        severity: 'severe' as const,
        isAbnormal: true,
        isCriticalValue: true,
        deviationPercent: 100,
        reasoning: 'Critical',
        priorityWeight: 5
      })
      
      const highScore = PriorityScorer.calculatePriorityScore(
        highClassifications,
        [mockHealthMarkers[2]]
      )
      
      expect(highScore.priorityLevel).toBe('HIGH')
      
      // Test LOW priority (mild abnormal)
      const lowClassifications = new Map()
      lowClassifications.set('1', {
        severity: 'mild' as const,
        isAbnormal: true,
        isCriticalValue: false,
        deviationPercent: 10,
        reasoning: 'Mild',
        priorityWeight: 1
      })
      
      const lowScore = PriorityScorer.calculatePriorityScore(
        lowClassifications,
        [mockHealthMarkers[0]]
      )
      
      expect(lowScore.priorityLevel).toBe('LOW')
    })
  })

  describe('AbnormalDetectionService', () => {
    it('should perform comprehensive abnormal detection', async () => {
      const result = AbnormalDetectionService.detectAbnormalValuesQuick(
        mockHealthMarkers,
        mockNormalRanges,
        { age: 55, sex: 'M' }
      )
      
      expect(result.classifications.size).toBe(4)
      expect(result.summary.totalMarkers).toBe(4)
      expect(result.summary.abnormalMarkers).toBe(3) // Glucose, HbA1c, ALT
      expect(result.summary.criticalMarkers).toBe(2) // HbA1c, ALT
      expect(result.priorityScore.priorityLevel).toBe('HIGH')
      expect(result.criticalValues).toHaveLength(2)
    })

    it('should generate appropriate recommendations', async () => {
      const result = AbnormalDetectionService.detectAbnormalValuesQuick(
        mockHealthMarkers,
        mockNormalRanges
      )
      
      expect(result.summary.recommendedAction).toContain('inmediatamente')
      expect(result.summary.recommendedAction).toContain('críticos')
    })

    it('should handle normal results correctly', async () => {
      const normalMarkers = [mockHealthMarkers[1]] // Only normal cholesterol
      const result = AbnormalDetectionService.detectAbnormalValuesQuick(
        normalMarkers,
        mockNormalRanges
      )
      
      expect(result.summary.abnormalMarkers).toBe(0)
      expect(result.summary.criticalMarkers).toBe(0)
      expect(result.priorityScore.priorityLevel).toBe('LOW')
      expect(result.summary.recommendedAction).toContain('normal')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete workflow from markers to flags', async () => {
      // This would require database mocking for full integration test
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        mockHealthMarkers,
        mockNormalRanges
      )
      
      const priorityScore = PriorityScorer.calculatePriorityScore(
        classifications,
        mockHealthMarkers,
        { age: 60 }
      )
      
      const flags = PriorityScorer.createAbnormalFlags(classifications, mockHealthMarkers)
      
      expect(classifications.size).toBe(4)
      expect(priorityScore.totalScore).toBeGreaterThan(0)
      expect(flags.length).toBe(3) // 3 abnormal markers
      
      // Verify flag properties
      const severeFlags = flags.filter(f => f.severity === 'severe')
      expect(severeFlags.length).toBeGreaterThan(0)
    })

    it('should maintain consistency across all components', () => {
      const classifications = SeverityClassifier.classifyMultipleMarkers(
        mockHealthMarkers,
        mockNormalRanges
      )
      
      const criticalValues = CriticalThresholdChecker.findCriticalValues(
        mockHealthMarkers.map(m => ({
          markerType: m.marker_type,
          value: m.value,
          unit: m.unit,
          id: m.id
        }))
      )
      
      // Critical values should match severe classifications with critical flag
      const criticalClassifications = Array.from(classifications.values())
        .filter(c => c.isCriticalValue)
      
      expect(criticalValues.length).toBe(criticalClassifications.length)
    })
  })
})