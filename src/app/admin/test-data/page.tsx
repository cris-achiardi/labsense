'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Flex, Box, Container, Callout } from '@radix-ui/themes'

export default function TestDataPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const populateTestData = async () => {
    try {
      setLoading(true)
      setMessage(null)

      const response = await fetch('/api/test-data/populate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error desconocido' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <Container size="1">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Text>Cargando...</Text>
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
      <Container size="2">
        <Flex direction="column" gap="6">
          <Box>
            <Heading size="6" style={{ marginBottom: 'var(--space-2)' }}>
              Gestión de Datos de Prueba
            </Heading>
            <Text size="3" style={{ color: 'var(--gray-11)' }}>
              Herramientas para poblar el sistema con datos de prueba para desarrollo y testing.
            </Text>
          </Box>

          {message && (
            <Callout.Root color={message.type === 'success' ? 'green' : 'red'}>
              <Callout.Icon>
                <span className="material-symbols-outlined">
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
              </Callout.Icon>
              <Callout.Text>{message.text}</Callout.Text>
            </Callout.Root>
          )}

          <Card>
            <Flex direction="column" gap="4">
              <Box>
                <Heading size="4" style={{ marginBottom: 'var(--space-2)' }}>
                  Poblar Datos de Prueba
                </Heading>
                <Text size="3" style={{ color: 'var(--gray-11)' }}>
                  Esto creará datos de prueba incluyendo:
                </Text>
                <Box style={{ marginTop: 'var(--space-3)' }}>
                  <Text size="2" as="div">• Paciente de prueba con RUT chileno</Text>
                  <Text size="2" as="div">• Reporte de laboratorio con valores anormales</Text>
                  <Text size="2" as="div">• Marcadores de salud con clasificación de severidad</Text>
                  <Text size="2" as="div">• Flags anormales con puntaje de prioridad</Text>
                  <Text size="2" as="div">• Logs de auditoría para cumplimiento</Text>
                </Box>
              </Box>

              <Flex gap="3">
                <Button 
                  color="mint" 
                  variant="solid"
                  loading={loading}
                  onClick={populateTestData}
                >
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      database
                    </span>
                    Crear Datos de Prueba
                  </Flex>
                </Button>

                <Button 
                  color="mint" 
                  variant="outline"
                  asChild
                >
                  <a href="/dashboard">
                    Ver Dashboard
                  </a>
                </Button>
              </Flex>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Información Técnica</Heading>
              <Text size="3" style={{ color: 'var(--gray-11)' }}>
                Los datos de prueba incluyen un caso real basado en el análisis de PDF chileno:
              </Text>
              <Box>
                <Text size="2" as="div" style={{ color: 'var(--gray-11)' }}>
                  <strong>Paciente:</strong> Mujer de 73 años con diabetes severa e hipotiroidismo
                </Text>
                <Text size="2" as="div" style={{ color: 'var(--gray-11)' }}>
                  <strong>Glucosa:</strong> 180 mg/dL (normal: 74-106) - Moderadamente elevada
                </Text>
                <Text size="2" as="div" style={{ color: 'var(--gray-11)' }}>
                  <strong>Colesterol:</strong> 95 mg/dL (normal: 0-200) - Normal
                </Text>
                <Text size="2" as="div" style={{ color: 'var(--gray-11)' }}>
                  <strong>Prioridad:</strong> ALTA - Requiere atención inmediata
                </Text>
              </Box>
            </Flex>
          </Card>

          <Flex gap="3">
            <Button variant="outline" asChild>
              <a href="/admin">Volver al Panel Admin</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/users">Gestionar Usuarios</a>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}