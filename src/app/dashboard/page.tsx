'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Badge, Flex, Box, Container } from '@radix-ui/themes'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <Container size="1">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Text>Cargando dashboard...</Text>
          </Flex>
        </Container>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Welcome Header */}
          <Box>
            <Heading size="7" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
              Dashboard de Pacientes
            </Heading>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Resultados de laboratorio priorizados por urgencia médica
            </Text>
          </Box>

          {/* Patient Cards */}
          <Flex gap="4" wrap="wrap">
            {/* High Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** ******* ****</Text>
                  <Badge color="red" variant="solid">ALTA PRIORIDAD</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 73a 3m 17d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--red-11)' }}>
                    Valores Anormales:
                  </Text>
                  <Text size="2" as="div">
                    • Glucosa: 269 mg/dL (normal: 74-106)
                  </Text>
                  <Text size="2" as="div">
                    • HbA1c: 11.8% (normal: 4-6)
                  </Text>
                  <Text size="2" as="div">
                    • TSH: 11.040 μUI/mL (normal: 0.55-4.78)
                  </Text>
                </Box>
                <Button color="mint" variant="solid">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>

            {/* Medium Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** *******</Text>
                  <Badge color="orange" variant="solid">PRIORIDAD MEDIA</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 45a 2m 10d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--orange-11)' }}>
                    Valores Anormales:
                  </Text>
                  <Text size="2" as="div">
                    • Colesterol: 220 mg/dL (normal: &lt;200)
                  </Text>
                  <Text size="2" as="div">
                    • Triglicéridos: 180 mg/dL (normal: &lt;150)
                  </Text>
                </Box>
                <Button color="mint" variant="outline">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>

            {/* Normal Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** ******</Text>
                  <Badge color="green" variant="solid">NORMAL</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 32a 8m 5d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--green-11)' }}>
                    Todos los valores normales
                  </Text>
                  <Text size="2" as="div">
                    • Glucosa: 95 mg/dL ✓
                  </Text>
                  <Text size="2" as="div">
                    • Colesterol: 180 mg/dL ✓
                  </Text>
                </Box>
                <Button color="mint" variant="soft">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>
          </Flex>

          {/* Admin Panel Access */}
          {session.user.role === 'admin' && (
            <Card style={{ maxWidth: '600px' }}>
              <Flex direction="column" gap="3">
                <Heading size="5">Panel de Administración</Heading>
                <Text size="3">
                  Como administrador, tienes acceso a funciones adicionales del sistema.
                </Text>
                <Flex gap="3">
                  <Button color="mint" variant="solid" asChild>
                    <a href="/admin">Acceder al Panel Admin</a>
                  </Button>
                  <Button color="mint" variant="outline" asChild>
                    <a href="/admin/users">Gestionar Usuarios</a>
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}
        </Flex>
      </Container>
    </DashboardLayout>
  )
}