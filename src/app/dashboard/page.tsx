'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, Heading, Text, Button, Flex, Box, Container, Badge } from '@radix-ui/themes'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <Box p="6">
        <Text>Cargando...</Text>
      </Box>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true,
    })
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'red' : 'mint'
  }

  const getRoleDisplayName = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Trabajador de Salud'
  }

  const getHealthcareRoleDisplayName = (healthcareRole: string | null | undefined) => {
    const roles: { [key: string]: string } = {
      nurse: 'Enfermero/a',
      medic: 'Médico/a',
      nutritionist: 'Nutricionista',
      psychologist: 'Psicólogo/a',
      social_worker: 'Trabajador/a Social',
      administrative: 'Administrativo/a',
    }
    return healthcareRole ? roles[healthcareRole] || healthcareRole : 'No especificado'
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Container size="4">
        <Box p="6">
          {/* Header */}
          <Flex justify="between" align="center" mb="6">
            <Heading size="7">Dashboard - LabSense</Heading>
            <Button color="gray" variant="outline" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </Flex>

          {/* User Info Card */}
          <Card mb="6">
            <Flex direction="column" gap="3">
              <Heading size="5">Información del Usuario</Heading>
              
              <Flex align="center" gap="3">
                <Text weight="medium">Nombre:</Text>
                <Text>{session.user.name}</Text>
              </Flex>
              
              <Flex align="center" gap="3">
                <Text weight="medium">Email:</Text>
                <Text>{session.user.email}</Text>
              </Flex>
              
              <Flex align="center" gap="3">
                <Text weight="medium">Rol del Sistema:</Text>
                <Badge color={getRoleBadgeColor(session.user.role)} variant="solid">
                  {getRoleDisplayName(session.user.role)}
                </Badge>
              </Flex>
              
              <Flex align="center" gap="3">
                <Text weight="medium">Rol de Salud:</Text>
                <Text>{getHealthcareRoleDisplayName(session.user.healthcareRole)}</Text>
              </Flex>
            </Flex>
          </Card>

          {/* Admin Panel */}
          {session.user.role === 'admin' && (
            <Card mb="6" style={{ borderColor: 'var(--red-6)' }}>
              <Flex direction="column" gap="3">
                <Heading size="5" style={{ color: 'var(--red-11)' }}>
                  Panel de Administrador
                </Heading>
                <Text>Como administrador, tienes acceso a:</Text>
                <Box ml="4">
                  <Text as="div">• Gestión de usuarios y roles</Text>
                  <Text as="div">• Configuración de rangos normales</Text>
                  <Text as="div">• Logs de auditoría del sistema</Text>
                  <Text as="div">• Configuración del sistema</Text>
                </Box>
                <Button color="red" variant="outline" style={{ width: 'fit-content' }}>
                  Acceder a Panel de Admin
                </Button>
              </Flex>
            </Card>
          )}

          {/* Healthcare Worker Panel */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="5">Panel de Trabajo</Heading>
              <Text>Funciones disponibles:</Text>
              <Box ml="4">
                <Text as="div">• Ver pacientes priorizados</Text>
                <Text as="div">• Cargar resultados de laboratorio (PDF)</Text>
                <Text as="div">• Buscar y filtrar pacientes</Text>
                <Text as="div">• Marcar pacientes como contactados</Text>
                <Text as="div">• Ver historial de resultados por paciente</Text>
              </Box>
              
              <Flex gap="3" mt="4">
                <Button color="mint" variant="solid">
                  Ver Pacientes Priorizados
                </Button>
                <Button color="mint" variant="outline">
                  Cargar Nuevo PDF
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}