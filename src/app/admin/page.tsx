'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Flex, Box, Container, Badge } from '@radix-ui/themes'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <Container size="1">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Text>Verificando permisos de administrador...</Text>
          </Flex>
        </Container>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <DashboardLayout>
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Admin Header */}
          <Box>
            <Flex align="center" gap="3" mb="2">
              <Heading size="7" style={{ color: 'var(--gray-12)' }}>
                Panel de Administración
              </Heading>
              <Badge color="mint" variant="solid">Admin</Badge>
            </Flex>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Gestión del sistema LabSense
            </Text>
          </Box>

          {/* Admin Cards */}
          <Flex gap="4" wrap="wrap">
            {/* User Management */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--mint-11)' }}>
                    group
                  </span>
                  <Text weight="bold" size="4">Gestión de Usuarios</Text>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  Administrar roles y permisos de usuarios del sistema
                </Text>
                <Button color="mint" variant="solid">
                  Gestionar Usuarios
                </Button>
              </Flex>
            </Card>

            {/* System Settings */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--mint-11)' }}>
                    settings
                  </span>
                  <Text weight="bold" size="4">Configuración</Text>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  Configurar parámetros del sistema y umbrales médicos
                </Text>
                <Button color="mint" variant="outline">
                  Configurar Sistema
                </Button>
              </Flex>
            </Card>

            {/* Audit Logs */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--mint-11)' }}>
                    history
                  </span>
                  <Text weight="bold" size="4">Logs de Auditoría</Text>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  Revisar actividad del sistema y accesos de usuarios
                </Text>
                <Button color="mint" variant="soft">
                  Ver Logs
                </Button>
              </Flex>
            </Card>
          </Flex>

          {/* Current Admin Info */}
          <Card style={{ maxWidth: '600px' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">Información del Administrador</Heading>
              <Text size="3">
                <strong>Usuario:</strong> {session.user.name}<br/>
                <strong>Email:</strong> {session.user.email}<br/>
                <strong>Rol:</strong> {session.user.role}
              </Text>
              <Button color="gray" variant="outline" asChild>
                <a href="/dashboard">Volver al Dashboard</a>
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}