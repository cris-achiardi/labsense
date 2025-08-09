# Technology Stack

## Frontend Framework
- **Next.js 14+** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **Radix UI Themes** with mint accent color and full radius for complete design system
- **Custom CSS** using Radix design tokens for healthcare-specific styling
- **React Hook Form** for form handling and validation

## Authentication & Authorization
- **NextAuth.js** with Google OAuth for healthcare worker login
- **Session management** with secure HTTP-only cookies
- **Role-based access control**: healthcare_worker vs admin roles

## Backend & APIs
- **Next.js API Routes** for server-side functionality
- **PDF Processing**: pdf-parse library for Chilean lab reports
- **Text Processing**: Custom regex patterns for Spanish medical terminology
- **Validation**: Confidence scoring algorithms for parse accuracy

## Database & Storage
- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Supabase Storage** for secure PDF file storage
- **Real-time subscriptions** for dashboard updates

## Language & Localization
- **Primary Language**: Spanish (Chilean medical terminology)
- **Fallback**: English for technical error messages
- **next-intl** for internationalization framework

## Deployment & Infrastructure
- **Vercel** for hosting and automatic deployments
- **Environment-based configuration** for dev/staging/production
- **Continuous Integration** with automated testing

## Healthcare-Specific Libraries
- **Chilean RUT validation** algorithm
- **Spanish medical term parsing** patterns
- **HIPAA-style audit logging** for compliance
- **Healthcare data encryption** standards

## Package Management
- **Yarn** as primary package manager (not npm)
- Lock file: yarn.lock committed to repo
- Scripts: yarn dev, yarn build, yarn test

## Development Tools
- **ESLint** with healthcare-specific rules + no-inline-conditionals
- **Prettier** for consistent code formatting
- **TypeScript** strict mode enabled
- **Jest** for unit testing PDF parsing functions
- **Playwright** for E2E testing critical healthcare workflows
- **Husky** for git hooks integration

## Security Considerations
- **Data encryption** at rest and in transit
- **Patient data anonymization** in development/testing
- **Secure session timeouts** for shared devices
- **Input sanitization** for Chilean RUT and patient data
