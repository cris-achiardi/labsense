# Abnormal Value Detection System - Task 7 Implementation

## Overview

The Abnormal Value Detection System is a comprehensive solution for automatically identifying, classifying, and prioritizing abnormal lab values in Chilean healthcare settings. This system implements Task 7 requirements including severity classification, priority scoring, critical value detection, and abnormal flags storage.

## Key Components

### 1. Severity Classifier
Classifies health marker values into severity levels based on deviation from normal ranges.

### 2. Priority Scorer
Calculates patient priority scores using weighted algorithms considering clinical significance, age factors, and multiple abnormal values.

### 3. Critical Threshold Checker
Detects critical values that require immediate medical attention based on Chilean healthcare standards.

### 4. Abnormal Flag Storage
Manages database storage of abnormal flags with audit trails and priority score updates.

## Usage Examples

### Basic Abnormal Detection

```typescript
import { AbnormalDetectionService } from '@/lib/abnormal-detection'

// Quick detection without database operations
const result = AbnormalDetectionService.detectAbnormalValuesQuick(
  healthMarkers,
  normalRanges,
  { age: 65, sex: 'M' }
)

console.log(`Priority Level: ${result.priorityScore.priorityLevel}`)
console.log(`Abnormal Markers: ${result.summary.abnormalMarkers}`)
console.log(`Critical Values: ${result.summary.criticalMarkers}`)
console.log(`Recommendation: ${result.summary.recommendedAction}`)
```

### Complete Detection with Database Storage

```typescript
// Full detection with flag creation and priority updates
const result = await AbnormalDetectionService.detectAbnormalValues(
  labReportId,
  patientId,
  healthMarkers,
  normalRanges,
  {
    createFlags: true,
    updatePriority: true,
    userId: 'user-123',
    userEmail: 'doctor@hospital.cl',
    patientContext: { age: 55, sex: 'F' }
  }
)

if (result.flagCreationResult?.success) {
  console.log(`Created ${result.flagCreationResult.flagsCreated} abnormal flags`)
  console.log(`Detected ${result.flagCreationResult.criticalValuesDetected} critical values`)
}
```

### Individual Component Usage

#### Severity Classification

```typescript
import { SeverityClassifier } from '@/lib/abnormal-detection'

const classification = SeverityClassifier.classifySeverity(healthMarker, normalRange)

console.log(`Severity: ${classification.severity}`)
console.log(`Is Abnormal: ${classification.isAbnormal}`)
console.log(`Is Critical: ${classification.isCriticalValue}`)
console.log(`Reasoning: ${classification.reasoning}`)
```

#### Critical Value Detection

```typescript
import { CriticalThresholdChecker } from '@/lib/abnormal-detection'

const isCritical = CriticalThresholdChecker.isCriticalValue(
  'GLICEMIA EN AYUNO',
  300,
  'mg/dL'
)

if (isCritical) {
  const alert = CriticalThresholdChecker.generateCriticalAlert(
    'GLICEMIA EN AYUNO',
    300,
    'mg/dL'
  )
  console.log(alert) // "🚨 INMEDIATO: Glicemia en ayuno crítica - 300 mg/dL..."
}
```

#### Priority Scoring

```typescript
import { PriorityScorer } from '@/lib/abnormal-detection'

const priorityScore = PriorityScorer.calculatePriorityScore(
  classifications,
  healthMarkers,
  { age: 70, sex: 'M' }
)

console.log(`Total Score: ${priorityScore.totalScore}`)
console.log(`Priority Level: ${priorityScore.priorityLevel}`)
console.log(`Breakdown:`, priorityScore.breakdown)
console.log(`Reasoning:`, priorityScore.reasoning)
```

#### Flag Storage Operations

```typescript
import { AbnormalFlagStorage } from '@/lib/abnormal-detection'

// Create flags for a lab report
const result = await AbnormalFlagStorage.processAndCreateFlags(
  labReportId,
  patientId,
  healthMarkers,
  normalRanges,
  userId,
  userEmail
)

// Get patient flags
const patientFlags = await AbnormalFlagStorage.getPatientFlags(patientId)

// Get flag summary
const summary = await AbnormalFlagStorage.getFlagSummary(patientId)
console.log(`Total flags: ${summary.totalFlags}`)
console.log(`Severe flags: ${summary.bySeverity.severe}`)
```

## Severity Classification Levels

### Normal
- Value within normal range
- Priority weight: 0
- No action required

### Mild
- Slight deviation from normal range (0-50% deviation)
- Priority weight: 1
- Routine follow-up recommended

### Moderate
- Moderate deviation from normal range (50-99% deviation)
- Priority weight: 3
- Priority follow-up within 3-5 days

### Severe
- Significant deviation from normal range (100%+ deviation)
- Priority weight: 5
- Urgent follow-up within 24 hours

## Critical Value Thresholds (Chilean Standards)

### Immediate Attention Required
- **Glucose**: ≥250 mg/dL or ≤50 mg/dL
- Risk of diabetic or hypoglycemic coma

### Urgent Attention Required
- **HbA1c**: ≥10.0%
- **Triglycerides**: ≥500 mg/dL (pancreatitis risk)
- **Liver Enzymes (ALT/AST)**: ≥200 U/L
- **TSH**: ≥20.0 μUI/mL or ≤0.1 μUI/mL

### Priority Attention Required
- **Total Cholesterol**: ≥300 mg/dL

## Priority Scoring Algorithm

### Base Scores
- Severe: 50 points
- Moderate: 25 points
- Mild: 10 points
- Normal: 0 points

### Bonuses
- **Critical Value**: +30 points
- **Multiple Abnormals**: +5 points per additional abnormal (max +20)
- **Age Factor**: 
  - 41-65 years: +20% of base score
  - 66-80 years: +40% of base score
  - 81+ years: +60% of base score

### Marker Type Weights
- **Diabetes markers** (HbA1c, Glucose): 1.8x - 1.5x
- **Cardiovascular markers** (Cholesterol, Triglycerides): 1.3x - 1.2x
- **Liver enzymes**: 1.1x
- **Thyroid markers**: 1.0x

### Priority Levels
- **HIGH**: ≥80 points
- **MEDIUM**: 30-79 points
- **LOW**: 1-29 points

## Integration with Database

The system automatically:
1. Updates `health_markers` table with abnormal status and severity
2. Creates records in `abnormal_flags` table
3. Calculates and updates patient priority scores
4. Logs all actions in audit trail
5. Triggers priority score recalculation when flags change

## Error Handling

The system includes comprehensive error handling:
- Graceful degradation when normal ranges are missing
- Validation of input data
- Detailed error messages in Spanish
- Audit logging of all operations
- Rollback capabilities for failed operations

## Performance Considerations

- Batch processing capabilities for multiple patients
- Efficient database queries with proper indexing
- Caching of normal ranges and critical thresholds
- Optimized classification algorithms

## Testing

Comprehensive test suite includes:
- Unit tests for each component
- Integration tests for complete workflows
- Edge case testing (missing data, extreme values)
- Performance testing with large datasets

## Monitoring and Analytics

The system provides:
- Detection statistics and trends
- Priority distribution analysis
- Critical value frequency tracking
- Performance metrics and timing

## Future Enhancements

Planned improvements:
- Machine learning-based severity prediction
- Historical trend analysis for improved scoring
- Integration with external medical databases
- Real-time alerting for critical values
- Mobile notifications for healthcare workers

## Compliance

The system ensures:
- ✅ Chilean healthcare standards compliance
- ✅ Comprehensive audit trails
- ✅ Patient data protection
- ✅ Medical terminology in Spanish
- ✅ Healthcare worker workflow optimization