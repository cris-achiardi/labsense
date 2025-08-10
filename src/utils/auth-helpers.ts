import { Session } from 'next-auth'

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'admin'
}

export function isHealthcareWorker(session: Session | null): boolean {
  return session?.user?.role === 'healthcare_worker' || isAdmin(session)
}

export function canAccessPatientData(session: Session | null): boolean {
  return isHealthcareWorker(session)
}

export function canAccessAuditLogs(session: Session | null): boolean {
  return isAdmin(session)
}

export function canModifySystemSettings(session: Session | null): boolean {
  return isAdmin(session)
}

export function canUploadPDFs(session: Session | null): boolean {
  return isHealthcareWorker(session)
}

export function getUserDisplayName(session: Session | null): string {
  if (!session?.user) return 'Usuario'
  return session.user.name || session.user.email || 'Usuario'
}

export function getRoleDisplayName(role: string): string {
  const roleNames: { [key: string]: string } = {
    admin: 'Administrador',
    healthcare_worker: 'Trabajador de Salud',
  }
  return roleNames[role] || role
}

export function getHealthcareRoleDisplayName(healthcareRole: string | null | undefined): string {
  if (!healthcareRole) return 'No especificado'
  
  const roles: { [key: string]: string } = {
    nurse: 'Enfermero/a',
    medic: 'Médico/a',
    nutritionist: 'Nutricionista',
    psychologist: 'Psicólogo/a',
    social_worker: 'Trabajador/a Social',
    administrative: 'Administrativo/a',
  }
  
  return roles[healthcareRole] || healthcareRole
}