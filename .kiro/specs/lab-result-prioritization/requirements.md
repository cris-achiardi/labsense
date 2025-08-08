# Requirements Document

## Introduction

The Lab Result Prioritization System is a web application designed for Chile's public primary care centers to automate the review and prioritization of blood test results. The system addresses the critical issue where routine blood tests expire after 12 months, potentially leaving patients with abnormal values (high glucose, cholesterol, triglycerides, liver enzymes) untreated for extended periods. By automatically parsing PDF lab reports and flagging abnormal values, the system enables primary care workers to quickly identify and prioritize patients who need immediate follow-up care, reducing administrative burden and improving patient outcomes.

## Requirements

### Requirement 1

**User Story:** As a primary care worker, I want to securely access the lab result system using my Google account with proper session management and audit trails, so that I can quickly log in without managing additional passwords while ensuring patient data remains protected and access is properly tracked.

#### Acceptance Criteria

1. WHEN a primary care worker visits the application THEN the system SHALL display a Google OAuth login option
2. WHEN a user successfully authenticates with Google THEN the system SHALL create or retrieve their user profile and grant access to the dashboard
3. IF authentication fails THEN the system SHALL display an appropriate error message and allow retry
4. WHEN a user is authenticated THEN the system SHALL maintain their session securely using NextAuth with configurable timeout periods
5. WHEN a user is inactive for a predefined period (default 30 minutes) THEN the system SHALL automatically log them out for security
6. WHEN a user wants to log out THEN the system SHALL provide a clear logout option that terminates their session completely
7. WHEN any user logs in or out THEN the system SHALL record the event in an audit log with timestamp, user identity, and IP address
8. WHEN multiple users access the system from the same device THEN the system SHALL ensure proper session isolation and require fresh authentication
9. WHEN a session expires or user logs out THEN the system SHALL clear all cached patient data from the browser
10. WHEN administrators need to review access THEN the system SHALL provide audit logs showing who accessed the system and when

### Requirement 2

**User Story:** As a primary care worker, I want to upload PDF lab reports with patient identification, so that I can digitize patient lab results for automated analysis and ensure they are properly associated with the correct patient.

#### Acceptance Criteria

1. WHEN a primary care worker accesses the upload interface THEN the system SHALL provide a file upload component that accepts PDF files only
2. WHEN a user uploads a PDF lab report THEN the system SHALL validate the file format and size (max 10MB)
3. WHEN a valid PDF is uploaded THEN the system SHALL attempt to automatically extract patient identification data (name and RUT) from the PDF
4. IF patient identification is successfully extracted THEN the system SHALL display the extracted data for user confirmation
5. IF patient identification extraction fails or is incomplete THEN the system SHALL prompt the user to manually enter patient name and RUT
6. WHEN patient identification is confirmed THEN the system SHALL store the file securely and associate it with the patient record
7. IF an invalid file is uploaded THEN the system SHALL display an error message specifying the requirements
8. WHEN upload is successful THEN the system SHALL display a confirmation message and redirect to the processing status

### Requirement 3

**User Story:** As a primary care worker, I want the system to automatically parse uploaded lab reports and extract key health markers, so that I don't have to manually review every report for abnormal values.

#### Acceptance Criteria

1. WHEN a PDF lab report is uploaded THEN the system SHALL automatically extract text content from the PDF
2. WHEN text is extracted THEN the system SHALL parse and identify available health markers from a predefined list (starting with glucose, cholesterol, triglycerides, and liver enzymes for MVP)
3. WHEN health markers are identified THEN the system SHALL extract their numerical values and units
4. WHEN the system is expanded THEN it SHALL support additional health markers based on healthcare provider requirements and standard medical references
5. IF parsing fails or markers cannot be identified THEN the system SHALL flag the report for manual review
6. WHEN parsing is complete THEN the system SHALL store the extracted data in the database with reference to the original PDF

### Requirement 4

**User Story:** As a primary care worker, I want the system to automatically flag lab results with abnormal values (both above and below normal ranges), so that I can quickly identify patients who need immediate follow-up care.

#### Acceptance Criteria

1. WHEN health marker values are extracted THEN the system SHALL compare them against predefined normal ranges for each marker (both minimum and maximum thresholds)
2. WHEN a value falls outside normal ranges (either above maximum or below minimum) THEN the system SHALL flag it as "abnormal" with severity level (mild, moderate, severe)
3. WHEN normal ranges are defined THEN they SHALL be based on validated medical standards and healthcare provider protocols (to be researched and confirmed with healthcare professionals)
4. WHEN the system is configured THEN it SHALL allow healthcare administrators to update normal ranges based on updated medical guidelines
5. WHEN multiple abnormal values are detected THEN the system SHALL calculate an overall priority score for the patient
6. WHEN abnormal values are flagged THEN the system SHALL store the flags with timestamps and reasoning
7. WHEN flagging is complete THEN the system SHALL update the patient's priority status in the dashboard

### Requirement 5

**User Story:** As a primary care worker, I want to view a prioritized list of patients with abnormal lab results, so that I can efficiently schedule follow-up appointments for those who need immediate attention.

#### Acceptance Criteria

1. WHEN a primary care worker accesses the dashboard THEN the system SHALL display a list of patients sorted by priority score (highest first)
2. WHEN viewing the patient list THEN the system SHALL show patient name, RUT, upload date, abnormal markers, and priority level
3. WHEN displaying patient information THEN the system SHALL ensure patient name and RUT are clearly visible for proper identification
4. WHEN a user clicks on a patient entry THEN the system SHALL display detailed lab results with highlighted abnormal values
5. WHEN viewing detailed results THEN the system SHALL show both current and historical lab data if available
6. WHEN a user marks a patient as "contacted" THEN the system SHALL update the patient status and move them to a separate "processed" list

### Requirement 6

**User Story:** As a primary care worker, I want to view a patient's historical lab results, so that I can track trends in their health markers over time and make informed decisions about their care.

#### Acceptance Criteria

1. WHEN viewing a patient's detailed results THEN the system SHALL display all previous lab reports for that patient in chronological order
2. WHEN historical data exists THEN the system SHALL show trends for each health marker with visual indicators (improving, worsening, stable)
3. WHEN comparing results THEN the system SHALL highlight significant changes between consecutive tests
4. IF no historical data exists THEN the system SHALL display a message indicating this is the patient's first recorded lab result
5. WHEN viewing trends THEN the system SHALL allow filtering by specific health markers and date ranges

### Requirement 7

**User Story:** As a healthcare administrator, I want the system to be configurable with validated medical reference ranges, so that the abnormal value detection is accurate and based on current medical standards.

#### Acceptance Criteria

1. WHEN the system is initially configured THEN it SHALL include normal ranges for the MVP health markers based on validated medical references
2. WHEN normal ranges are defined THEN they SHALL be researched and validated with healthcare professionals from Chilean primary care centers
3. WHEN the system supports additional markers THEN each new marker SHALL have its normal ranges validated against standard medical references or Chilean healthcare protocols
4. WHEN normal ranges need updates THEN authorized healthcare administrators SHALL be able to modify them through a secure administrative interface
5. WHEN ranges are updated THEN the system SHALL re-evaluate existing lab results and update priority scores accordingly
6. WHEN displaying abnormal values THEN the system SHALL show the reference range used for comparison

### Requirement 8

**User Story:** As a healthcare administrator, I want comprehensive audit trails for all patient data interactions, so that I can ensure compliance with healthcare regulations and track who accessed or modified patient information.

#### Acceptance Criteria

1. WHEN a user uploads a PDF lab report THEN the system SHALL log the upload event with user identity, timestamp, patient RUT, and file metadata
2. WHEN a user views a patient's lab results THEN the system SHALL log the access event with user identity, timestamp, and patient RUT
3. WHEN a user marks a patient as "contacted" or changes patient status THEN the system SHALL log the status change with user identity, timestamp, and previous/new status
4. WHEN a user downloads or prints lab results THEN the system SHALL log the export event with user identity, timestamp, and patient RUT
5. WHEN an administrator views audit logs THEN the system SHALL display all logged events with filtering options by user, patient, date range, and action type
6. WHEN audit logs are accessed THEN the system SHALL ensure they cannot be modified or deleted by regular users
7. WHEN the system processes a PDF automatically THEN it SHALL log the processing results, including any parsing errors or abnormal values detected

### Requirement 9

**User Story:** As a healthcare administrator, I want the system to manage data retention appropriately, so that we comply with healthcare regulations while maintaining long-term patient health tracking capabilities.

#### Acceptance Criteria

1. WHEN PDF lab reports are uploaded THEN the system SHALL store them for a minimum of 12 months (subject to validation with healthcare regulations)
2. WHEN parsed lab result data is extracted THEN the system SHALL store it permanently for long-term patient health tracking
3. WHEN PDFs reach their retention limit THEN the system SHALL archive or delete them while preserving the parsed data
4. WHEN data retention policies are updated THEN the system SHALL allow administrators to configure retention periods
5. WHEN patient data needs to be removed THEN the system SHALL provide secure deletion capabilities while maintaining audit trail integrity

### Requirement 10

**User Story:** As a primary care worker, I want to search and filter patient lab results efficiently, so that I can quickly find specific patients or results when needed.

#### Acceptance Criteria

1. WHEN a primary care worker accesses the dashboard THEN the system SHALL provide search functionality for patient name and RUT
2. WHEN searching for patients THEN the system SHALL support partial matches and case-insensitive search
3. WHEN viewing the patient list THEN the system SHALL provide filters for date ranges (upload date, test date)
4. WHEN filtering results THEN the system SHALL allow filtering by specific health marker flags (glucose, cholesterol, etc.)
5. WHEN filters are applied THEN the system SHALL maintain the priority-based sorting within the filtered results
6. WHEN search or filter criteria are active THEN the system SHALL clearly indicate the active filters and provide easy clearing options

### Requirement 11

**User Story:** As a healthcare administrator, I want to manage user roles and permissions, so that I can control who has access to different system functions while maintaining appropriate security levels.

#### Acceptance Criteria

1. WHEN a new user authenticates for the first time THEN the system SHALL assign them a default "healthcare worker" role
2. WHEN creating user profiles THEN the system SHALL capture user name and role (nurse, administrative, medic, nutritionist, psychologist, social worker, etc.)
3. WHEN a user has "healthcare worker" role THEN they SHALL have access to upload PDFs, view patient results, search/filter, and mark patients as contacted
4. WHEN a user has "admin" role THEN they SHALL have all healthcare worker permissions plus access to audit logs, system configuration, and user management
5. WHEN system configuration changes are needed THEN only admin users SHALL be able to modify normal ranges, retention policies, and system settings
6. WHEN viewing user interfaces THEN the system SHALL display appropriate options based on the user's role permissions
7. WHEN unauthorized access is attempted THEN the system SHALL deny access and log the attempt

### Requirement 12

**User Story:** As a primary care worker, I want to view original PDF lab reports in a new browser tab, so that I can review the complete original document and use standard browser functions for printing or saving.

#### Acceptance Criteria

1. WHEN viewing a patient's lab results THEN the system SHALL provide a "View Original PDF" option for each lab report
2. WHEN a user clicks "View Original PDF" THEN the system SHALL open the PDF in a new browser tab
3. WHEN the PDF opens in a new tab THEN users SHALL be able to use standard browser functions (print, save, zoom, etc.)
4. WHEN a PDF is accessed for viewing THEN the system SHALL log the access event in the audit trail
5. WHEN PDFs are displayed THEN they SHALL maintain their original formatting and quality
6. IF a PDF cannot be displayed THEN the system SHALL show an appropriate error message and suggest contacting support

### Requirement 13

**User Story:** As a primary care worker, I want the system to handle errors gracefully and provide clear feedback, so that I can understand what went wrong and take appropriate action when issues occur.

#### Acceptance Criteria

1. WHEN any system error occurs THEN the system SHALL display user-friendly error messages without exposing technical details
2. WHEN PDF parsing fails THEN the system SHALL provide specific guidance on file requirements and suggest manual review
3. WHEN database operations fail THEN the system SHALL retry automatically and notify the user if the issue persists
4. WHEN authentication expires THEN the system SHALL prompt for re-authentication without losing unsaved work
5. WHEN the system is unavailable THEN the system SHALL display a maintenance message with expected resolution time