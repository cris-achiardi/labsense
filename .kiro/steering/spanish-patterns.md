---
inclusion: fileMatch
fileMatchPattern: "**/pdf-parsing/**"
---

# Chilean Medical Parsing Patterns

## Health Marker Translations
```
Spanish Lab Name → System Code
GLICEMIA EN AYUNO (BASAL) → glucose_fasting
HEMOGLOBINA GLICADA A1C → hba1c
TRIGLICÉRIDOS → triglycerides
COLESTEROL TOTAL → cholesterol_total
COLESTEROL HDL → cholesterol_hdl
COLESTEROL LDL → cholesterol_ldl
H. TIROESTIMULANTE (TSH) → tsh
GOT (A.S.T) → ast
GPT (A.L.T) → alt
FOSF. ALCALINAS → alkaline_phosphatase
```

## Reference Range Patterns
```javascript
// Common patterns in Chilean lab PDFs:
const referencePatterns = [
  /\[\s*\*\s*\]\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/,  // [ * ] 74 - 106
  /Normal:\s*<\s*(\d+)/,                                    // Normal: < 150
  /Hasta\s+(\d+)/,                                         // Hasta 34
  /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/,                // 4 - 6
  /Menor\s+a\s+(\d+(?:\.\d+)?)/,                          // Menor a 30
  /Bajo.*<\s*(\d+)/,                                       // Bajo (deseable): < 200
]
```

## Abnormal Value Indicators
- `[ * ]` = Primary abnormal marker
- Bold text in results column
- Out-of-range values clearly flagged
- Reference ranges provided in same row

## Chilean RUT Patterns
```javascript
// RUT Format: XX.XXX.XXX-X
const rutPattern = /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/g

// Validation algorithm
function validateRUT(rut) {
  // Chilean RUT validation logic
  // Must validate check digit
}
```

## Spanish Date Formats
```javascript
const datePatterns = [
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // 15/10/2024
  /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i
]

const spanishMonths = {
  enero: 1, febrero: 2, marzo: 3, abril: 4,
  mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
}
```

## PDF Structure Expectations
- **5-column format**: Examen | Resultado | Unidad | Valor de Referencia | Método
- **Patient info on page 1**: Name, RUT, age, sex always on first page
- **Multi-page handling**: Parse patient data only from first page
- **Sample types**: SUERO, SANGRE TOTAL, ORINA clearly labeled

## Priority Scoring Logic
```javascript
const severityWeights = {
  severe: 10,   // glucose >250, HbA1c >10
  moderate: 5,  // cholesterol 200-240
  mild: 2,      // slightly elevated
  normal: 0
}

const criticalMarkers = {
  'GLICEMIA EN AYUNO': { weight: 1.5 }, // Diabetes priority
  'HEMOGLOBINA GLICADA A1C': { weight: 1.5 },
  'H. TIROESTIMULANTE (TSH)': { weight: 1.2 }
}
```
