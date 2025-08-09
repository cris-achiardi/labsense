---
inclusion: always
---

# Healthcare Security Policies

## Patient Data Protection
- **Never log RUT numbers** in plain text
- **Anonymize patient names** in development logs
- **Encrypt sensitive data** at rest and in transit
- **Session timeouts** at 30 minutes for shared devices

## Chilean Healthcare Compliance
- **Audit all access** to patient data with timestamp + user ID
- **Data retention**: PDFs 12+ months, parsed data permanent
- **Secure deletion** capabilities with audit trail integrity
- **Role-based access**: healthcare_worker vs admin permissions

## Development Security
```javascript
// NEVER commit these patterns:
const sensitivePatterns = [
  /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/,  // Chilean RUT
  /paciente.*[A-Z]{2,}/,           // Patient names
  /sk-[a-zA-Z0-9]{48}/,           // API keys
  /Bearer [a-zA-Z0-9]+/,          // Auth tokens
]
```

## Authentication Requirements
- **Google OAuth only** for healthcare worker access
- **Multi-factor authentication** for admin accounts
- **IP whitelisting** for production environments
- **Regular access review** quarterly for compliance

## Error Handling Security
- **No sensitive data** in error messages exposed to users
- **Sanitized stack traces** in production
- **Security incident logging** for failed auth attempts
- **Rate limiting** on authentication endpoints

## Code Security Standards
- **Input validation** for all RUT and patient data
- **SQL injection prevention** with parameterized queries
- **XSS protection** with Content Security Policy
- **CSRF protection** on all forms handling patient data
