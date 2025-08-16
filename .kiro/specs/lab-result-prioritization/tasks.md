# Implementation Tasks

## Phase 1: Project Setup & Design System

### Task 1.1: Radix UI Themes Integration (Strategic Design Decision)
**Rationale:** Adopt Radix UI as complete design system to achieve professional, accessible healthcare interface without custom CSS development. This ensures WCAG compliance, consistent design language, and rapid UI implementation.

- [x] Install Radix UI Themes and Colors packages
- [x] Configure Theme provider with mint accent color and full radius
- [x] Create layout.tsx with proper Theme wrapper
- [x] Remove Tailwind CSS dependencies (not needed with Radix)
- [x] Setup custom CSS using Radix design tokens
- [x] Create healthcare-specific priority color classes
- [x] Build demo homepage showcasing Radix components

**Benefits Achieved:**
- ✅ Accessibility compliance built-in (WCAG standards)
- ✅ Professional healthcare-appropriate interface
- ✅ Consistent design language across all screens
- ✅ Responsive design works on all devices
- ✅ Rapid development without custom CSS work

**AI Development Benefits:**
- ✅ Eliminated UI interpretation friction for Kiro
- ✅ Provided explicit component library and design tokens
- ✅ Enabled production-ready AI-generated components
- ✅ Allowed UI refinements without breaking design consistency
- ✅ Let AI focus on healthcare functionality rather than design patterns

## Phase 1: Project Setup & Authentication

### Task 1: Initial Project Configuration
- [x] Create package.json with yarn, Next.js 14+, TypeScript
- [x] Setup Next.js App Router structure with src/ directory
- [x] Install and configure Radix UI Themes with mint accent color and full radius
- [x] Remove Tailwind CSS (not needed with Radix UI Themes)
- [x] Create TypeScript configuration with path aliases
- [x] Setup project structure following healthcare conventions
- [x] Configure Supabase client and environment variables
- [x] Add Spanish language configuration with next-intl

### Task 2: Authentication System (Requirement 1)
- [x] Install and configure NextAuth with Google OAuth provider
- [x] Create user profile table with healthcare_worker/admin roles
- [x] Implement session management with 30-minute timeout
- [x] Add secure logout functionality with session cleanup
- [x] Create audit logging for login/logout events

## Phase 2: PDF Processing Core

### Task 3: PDF Upload System (Requirement 2)
- [x] Create PDF upload component with 10MB size validation
- [x] Implement file type validation (PDF only)
- [x] Add patient identification extraction from first page
- [x] Build manual RUT/name entry fallback form
- [x] Store PDFs securely in Supabase Storage

### Task 4: Chilean PDF Parsing (Requirement 3)
- [x] Create PDF text extraction using pdf-parse library
- [x] Implement Chilean RUT parser with validation algorithm
- [x] Build Spanish health marker extraction patterns
- [x] Add reference range parsing from PDF content
- [x] Create abnormal value detection with [ * ] markers

### Task 5: Validation System (Requirement 13)
- [x] Implement confidence scoring algorithm (0-100%)
- [x] Add auto-approval for high confidence (85%+)
- [x] Create manual review interface for low confidence (<70%)
- [x] Build side-by-side PDF comparison view
- [x] Add critical value override validation

## Phase 3: Database & Data Models

### Task 6: Database Schema
- [x] Create patients table with RUT unique constraint
- [x] Build lab_reports table with priority scoring
- [x] Implement health_markers table with Spanish terminology
- [x] Add normal_ranges table for reference values
- [x] Create audit_logs table for compliance tracking

### Task 7: Abnormal Value Detection (Requirement 4)
- [x] Implement severity classification (mild/moderate/severe)
- [x] Create priority scoring algorithm with weights
- [x] Add critical value thresholds (glucose >250, HbA1c >10)
- [x] Build abnormal flags storage system

## Phase 4: Dashboard & UI

### Task 8: Patient Dashboard (Requirement 5)
- [x] Create demo homepage with Radix UI Themes components
- [x] Implement priority display using Radix Badge components (HIGH/MEDIUM/LOW)
- [x] Add patient identification display (name, RUT) with proper typography
- [x] Build abnormal markers summary view with Radix Card components
- [x] Setup healthcare-specific CSS classes using Radix design tokens
- [x] Create functional prioritized patient list component
- [x] Connect to real data instead of demo data
- [x] Create "contacted" status update functionality

### Task 9: Patient Details View (Requirement 6) - SKIPPED
**Note:** Skipping this task to focus on core dashboard functionality. Individual patient details can be implemented in future iterations.
- [ ] ~~Build individual patient results page~~ (Skipped)
- [ ] ~~Implement historical lab results display~~ (Skipped)
- [ ] ~~Add trend indicators (improving/worsening/stable)~~ (Skipped)
- [ ] ~~Create detailed abnormal values highlighting~~ (Skipped)

### Task 10: Search & Filtering (Requirement 10)
- [x] Implement patient search by name and RUT
- [x] Add date range filtering for upload/test dates
- [x] Create health marker filtering options
- [x] Build priority level filtering

## Phase 5: MVP Core Features (Critical Implementation) 🚀

**Priority:** HIGHEST - This is the true MVP that makes the system functional
**Status:** Ready to implement after PDF processing breakthrough
**Goal:** Complete end-to-end lab processing with proper data integrity

### Task 11: Enhanced PDF Data Extraction (Critical MVP Feature)
**Priority:** CRITICAL - System currently only extracts patient info, needs complete lab data
- [ ] **11.1 Complete Lab Results Extraction**
  - Extract all health markers from PDF (not just patient info)
  - Parse resultado, unidad, valor de referencia, método for each test
  - Handle multiple test types: SUERO, SANGRE TOTAL, ORINA
  - Extract abnormal indicators ([ * ] markers) for each result
  - _Requirements: 3.1, 3.2, 4.1_

- [ ] **11.2 Folio-Based Duplicate Prevention**
  - Extract folio number from PDF as unique exam identifier
  - Prevent duplicate lab reports using folio + toma_muestra date
  - Allow same patient multiple exams with different folios
  - Update database schema to enforce folio uniqueness
  - _Requirements: 2.2, 6.1_

- [ ] **11.3 Complete Date Extraction**
  - Extract fecha_ingreso, toma_muestra, fecha_validacion
  - Use toma_muestra as primary date for medical timeline
  - Parse Chilean date format (DD/MM/YYYY) correctly
  - Store all dates for complete audit trail
  - _Requirements: 6.2_

- [ ] **11.4 Healthcare Context Extraction**
  - Extract profesional_solicitante (requesting doctor)
  - Extract procedencia (primary care center)
  - Extract tipo_muestra for each test (SUERO, SANGRE, ORINA)
  - Store complete healthcare workflow context
  - _Requirements: 8.1, 8.2_

### Task 12: Comprehensive Normal Ranges Database (Critical MVP Feature)
**Priority:** CRITICAL - Currently only 5 ranges, need complete Chilean lab standards
- [ ] **12.1 Extract All Normal Ranges from PDF Sample**
  - Parse all health markers from docs/pdf-sample
  - Extract reference ranges for each marker type
  - Handle multiple reference formats (numeric ranges, descriptive, categorical)
  - Map Spanish marker names to standardized codes
  - _Requirements: 7.1, 7.2_

- [ ] **12.2 Chilean Healthcare Standards Implementation**
  - Implement all markers from PDF analysis:
    - GLICEMIA EN AYUNO (74-106 mg/dL)
    - HEMOGLOBINA GLICADA A1C (4-6%)
    - H. TIROESTIMULANTE TSH (0.55-4.78 μUI/mL)
    - TRIGLICERIDOS (<150 mg/dL)
    - COLESTEROL TOTAL (<200 mg/dL deseable)
    - COLESTEROL HDL, LDL ranges
    - GOT (AST), GPT (ALT) liver enzymes
    - FOSF. ALCALINAS (46-116 U/L)
    - All other markers from PDF sample
  - _Requirements: 7.3, 4.2_

- [ ] **12.3 Reference Range Parser Enhancement**
  - Handle Chilean terminology: "Hasta", "Menor a", "Mayor a"
  - Parse categorical ranges: "Bajo (deseable): < 200"
  - Extract gender-specific ranges when present
  - Store age-specific ranges for pediatric/adult/elderly
  - _Requirements: 7.4_

### Task 13: Complete Lab Report Processing Pipeline (Critical MVP Feature)
**Priority:** CRITICAL - End-to-end processing from PDF to prioritized patient
- [ ] **13.1 Full Lab Report Storage**
  - Store complete lab report with all extracted health markers
  - Link all health markers to single lab report via folio
  - Store raw PDF text and parsed structured data
  - Maintain relationship between patient, lab_report, and health_markers
  - _Requirements: 6.3, 6.4_

- [ ] **13.2 Abnormal Value Detection for All Markers**
  - Run abnormal detection on ALL extracted health markers
  - Store abnormal flags for each marker with severity classification
  - Calculate comprehensive priority score using all abnormal values
  - Generate Spanish clinical reasoning for each abnormal flag
  - _Requirements: 4.3, 4.4, 5.1_

- [ ] **13.3 Patient Priority Calculation**
  - Calculate priority score using ALL abnormal markers (not just demo data)
  - Apply age factors, clinical significance weights
  - Update prioritized_patients table with real calculated scores
  - Ensure priority reflects actual medical urgency
  - _Requirements: 5.2, 5.3_

- [ ] **13.4 Complete Audit Trail**
  - Log every step of PDF processing pipeline
  - Track confidence scores for each extracted element
  - Store processing timestamps and user context
  - Enable full traceability for healthcare compliance
  - _Requirements: 8.3, 9.1_

### Task 14: Database Schema Fixes (Critical MVP Feature)
**Priority:** CRITICAL - Fix current database issues and relationships
- [ ] **14.1 Folio Uniqueness Constraint**
  - Add unique constraint on lab_reports.folio
  - Prevent duplicate exam processing
  - Handle folio extraction errors gracefully
  - Update existing duplicate records
  - _Requirements: 2.3_

- [ ] **14.2 Health Markers Table Population**
  - Define what goes in health_markers table (currently empty)
  - Store individual test results: marker_name, result_value, unit, reference_range
  - Link to lab_reports via folio foreign key
  - Enable querying by specific health markers
  - _Requirements: 6.5_

- [ ] **14.3 Remove Redundant Tables**
  - Evaluate if 'users' table is needed (currently empty)
  - Clean up prioritized_patients duplicates
  - Ensure proper foreign key relationships
  - Optimize database schema for performance
  - _Requirements: 6.6_

- [ ] **14.4 Data Integrity Enforcement**
  - Add proper foreign key constraints
  - Implement cascade deletes where appropriate
  - Add check constraints for valid priority levels
  - Ensure referential integrity across all tables
  - _Requirements: 6.7_

### Task 15: End-to-End MVP Validation (Critical MVP Feature)
**Priority:** CRITICAL - Validate complete system works as intended
- [ ] **15.1 Complete PDF Processing Test**
  - Upload PDF → Extract all data → Store in database → Calculate priority
  - Verify no data loss in processing pipeline
  - Test with multiple PDF samples
  - Validate duplicate prevention works
  - _Requirements: 13.1, 13.2_

- [ ] **15.2 Priority Scoring Validation**
  - Test with real patient case (Isabel Bolados Vega)
  - Verify HIGH priority for severe diabetes + hypothyroidism
  - Test edge cases and normal results
  - Validate Spanish clinical reasoning
  - _Requirements: 5.4, 4.5_

- [ ] **15.3 Dashboard Integration Test**
  - Verify dashboard shows real processed patients
  - Test search and filtering with real data
  - Validate priority sorting works correctly
  - Test contact status workflow
  - _Requirements: 10.1, 10.2_

## Phase 6: Healthcare Features (Nice to Have)

### Task 16: PDF Viewing (Requirement 12)
- [x] Create "View Original PDF" functionality
- [x] Implement PDF opening in new browser tab
- [x] Add PDF access logging to audit trail

### Task 17: Compliance & Security (Requirements 8, 9, 11)
- [ ] Implement comprehensive audit logging
- [ ] Add role-based access control (worker vs admin)
- [ ] Create data retention policy configuration
- [ ] Build admin interface for system settings

## Phase 7: Spanish Language & Chilean Specifics (Nice to Have)

### Task 18: Localization
- [ ] Create Spanish translations for all UI elements
- [ ] Implement Chilean date formatting
- [ ] Add Spanish error messages for healthcare workers
- [ ] Build RUT input validation components

### Task 19: Chilean Medical Patterns
- [x] Create Chilean RUT validation utilities with proper algorithm
- [x] Implement RUT formatting and extraction functions
- [x] Add RUT anonymization for secure logging
- [x] Build Chilean healthcare TypeScript types
- [ ] Implement Spanish health marker name mapping
- [ ] Add Chilean lab format recognition
- [ ] Build Spanish medical terminology validation

## Phase 8: Error Handling & Polish (Nice to Have)

### Task 20: Error Management
- [ ] Create user-friendly error messages in Spanish
- [ ] Implement PDF parsing failure handling
- [ ] Add database error recovery mechanisms
- [ ] Build authentication error handling

### Task 21: Testing & Deployment
- [ ] Create unit tests for PDF parsing functions
- [ ] Add integration tests for authentication flow
- [ ] Build E2E tests for critical patient workflows
- [x] Setup Vercel deployment configuration

## Validation Checkpoints
- [x] Test with real Chilean lab PDF samples (completed in analysis phase)
- [x] Validate RUT parsing accuracy (Chilean algorithm implemented)
- [x] Create Chilean healthcare TypeScript types
- [x] Setup Radix UI design system for healthcare interface
- [ ] Confirm Spanish medical terminology recognition
- [ ] Test priority scoring with edge cases
- [ ] Verify audit logging completeness
- [ ] Test Radix UI components with real patient data
