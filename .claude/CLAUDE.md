# LabSense Development Guidelines

This directory contains development guidelines and patterns for the LabSense healthcare application. These files provide context for consistent development practices.

## Core Guidelines

### 📋 [Product Overview](./product.md)
Understand the business context, target users, and success metrics for LabSense - a Chilean healthcare lab result prioritization system.

### 🏗️ [Project Structure](./structure.md)
Learn the codebase organization, naming conventions, and import patterns specific to this healthcare application.

### ⚙️ [Technology Stack](./tech.md)
Reference the approved technologies: Next.js 14+, TypeScript, Radix UI, Supabase, and healthcare-specific libraries.

### 🎨 [Code Conventions](./code-conventions.md)
Follow these mandatory coding standards including React patterns, naming conventions, and healthcare-specific rules.

### 🔒 [Security Policies](./security-policies.md)
**CRITICAL**: Healthcare data protection requirements, Chilean compliance standards, and patient privacy rules.

### 🇨🇱 [Spanish Medical Patterns](./spanish-patterns.md)
Chilean-specific parsing patterns for RUT validation, medical terminology, and PDF processing logic.

## Key Development Rules

### Package Management
- **Always use `yarn`** - never npm
- Commit `yarn.lock`, never `package-lock.json`

### Healthcare Security
- **Never log RUT numbers** in plain text
- **Anonymize patient data** in development
- **Validate all medical inputs**
- **Session timeouts** at 30 minutes

### Chilean Medical Standards
- Use Spanish medical terminology with English type annotations
- Follow Chilean RUT validation patterns
- Implement proper reference range parsing
- Support Spanish date formats

### Code Quality
- No inline ternary operators
- Always destructure props
- Named exports preferred
- Maximum 50 lines per function
- Maximum 7 props per component

## Testing Requirements
- Unit tests for PDF parsing functions
- E2E tests for critical healthcare workflows
- Anonymized test data only
- Validation confidence scoring tests

## Project Specifications

### 📋 [Lab Result Prioritization Specs](../specs/lab-result-prioritization/)
Core project specifications including:
- **[Requirements](../specs/lab-result-prioritization/requirements.md)**: Functional and technical requirements
- **[Design](../specs/lab-result-prioritization/design.md)**: System architecture and design decisions
- **[PDF Analysis](../specs/lab-result-prioritization/pdf-analysis.md)**: PDF parsing and extraction specifications
- **[Tasks](../specs/lab-result-prioritization/tasks.md)**: Development task breakdown and implementation plan

These specification documents define the project foundation and should be referenced when implementing new features or understanding system requirements.

## Development Context Documents

### 📊 [Project Status](./project-status.md)
Current implementation status, completed features, pending tasks, and development progress tracking.

### 🏆 [Kiro Hackathon](./kiro-hackaton.md)
Hackathon documentation, objectives, timeline, and competition-specific requirements for the LabSense project.

These documents are actively maintained to provide ongoing context during development sessions and ensure continuity across development iterations.

## Compliance Notes
- All patient data access must be audited
- Data retention: PDFs 12+ months, parsed data permanent
- Multi-factor authentication for admin accounts
- Regular access reviews quarterly