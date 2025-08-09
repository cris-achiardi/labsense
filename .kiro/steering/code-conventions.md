---
inclusion: always
---

# Code Conventions

## Package Management
- **Always use yarn** instead of npm
- Commit yarn.lock, never package-lock.json
- `yarn add` for dependencies, `yarn add -D` for dev dependencies

## JavaScript/TypeScript Style
- **No inline ternary operators** - use explicit if/else blocks
- **Always destructure props** in function parameters
- **Explicit return statements** - avoid implicit returns
- **Named exports preferred** over default exports (except pages)

## React Patterns
- **Functional components only** - no class components
- **Custom hooks** must start with `use` prefix
- **Props interfaces** named `ComponentNameProps`
- **Event handlers** prefixed with `handle` (handleClick, handleSubmit)

## File Organization
- **One component per file** - matching filename
- **Index files** for clean imports from directories
- **Types co-located** with components when specific to that component

## Naming Conventions
- **Components**: PascalCase (`PatientDashboard`)
- **Files**: kebab-case (`patient-dashboard.tsx`)
- **Functions**: camelCase (`parseLabResults`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **CSS classes**: kebab-case (`patient-card-header`)

## Healthcare-Specific Rules
- **Never console.log RUT numbers** - use anonymized IDs in development
- **Sensitive data handling** - explicit security comments required
- **Patient data** - always validate and sanitize inputs
- **Medical terminology** - use Spanish names with English type annotations

## Code Quality
- **Meaningful variable names** - no abbreviations except standard ones (id, url)
- **Function length** - max 50 lines, extract if longer
- **Component props** - max 7 props, use objects for more
- **Comments required** for complex medical logic

## Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal utilities/types
4. Relative imports
5. CSS/style imports (last)

## Error Handling
- **Never expose sensitive data** in error messages
- **User-friendly errors** in Spanish for healthcare workers
- **Technical errors** logged securely without patient data
