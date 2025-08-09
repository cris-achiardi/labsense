# Project Structure

## Root Directory
```
labsense/
├── .kiro/                    # Kiro configuration
├── src/                      # Source code
├── public/                   # Static assets
├── tests/                    # Test files
├── docs/                     # Documentation
└── package.json              # Dependencies
```

## Source Code Organization
```
src/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Patient prioritization dashboard
│   ├── upload/              # PDF upload interface
│   └── patient/[id]/        # Individual patient details
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── healthcare/          # Medical-specific components
│   └── forms/               # Form components
├── lib/
│   ├── pdf-parsing/         # Chilean lab PDF processing
│   ├── spanish-medical/     # Medical term patterns
│   ├── validation/          # Confidence scoring
│   └── database/            # Supabase client
├── types/
│   ├── chilean-healthcare.ts # Chilean medical types
│   ├── patient.ts           # Patient data types
│   └── lab-results.ts       # Lab result types
└── utils/
    ├── rut-validation.ts    # Chilean RUT utilities
    ├── date-helpers.ts      # Spanish date parsing
    └── security.ts          # Healthcare data protection
```

## Key Directories

### `/src/lib/pdf-parsing/`
Core PDF processing functionality for Chilean lab reports
- Text extraction from Spanish PDFs
- Patient identification parsing (RUT, name, age)
- Health marker extraction with confidence scoring

### `/src/lib/spanish-medical/`
Chilean medical terminology and patterns
- Health marker name translations
- Reference range parsing
- Abnormal value indicators (`[ * ]` patterns)

### `/src/components/healthcare/`
Medical-specific React components
- Patient priority displays (HIGH/MEDIUM/LOW)
- Lab result tables with Spanish labels
- RUT input validation components

### `/tests/pdfs/`
Chilean lab report samples for testing
- Anonymized real lab reports
- Edge case PDF formats
- Validation test cases

## Naming Conventions
- **Files**: kebab-case (`patient-dashboard.tsx`)
- **Components**: PascalCase (`PatientDashboard`)
- **Functions**: camelCase (`parseLabResults`)
- **Constants**: UPPER_SNAKE_CASE (`CRITICAL_GLUCOSE_THRESHOLD`)

## Import Patterns
```typescript
// Absolute imports from src root
import { parseChileanRUT } from '@/utils/rut-validation'
import { PatientCard } from '@/components/healthcare/patient-card'
import { LabResult } from '@/types/lab-results'
```

## Healthcare File Organization
- Patient data components in `/components/healthcare/`
- Chilean-specific utilities in dedicated files
- Security-sensitive code clearly marked
- Test files mirror source structure
