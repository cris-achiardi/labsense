'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { PrioritizedPatientList } from '@/components/dashboard/prioritized-patient-list'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { PatientSearchFilters } from '@/components/dashboard/patient-search-filters'
import { Card, Heading, Text, Button, Flex, Box, Container } from '@radix-ui/themes'
import { PatientFilters } from '@/types/database'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filters, setFilters] = useState<PatientFilters>({})

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
              Sistema inteligente de priorización de resultados de laboratorio
            </Text>
          </Box>

          {/* Dashboard Summary */}
          <DashboardSummary 
            userId={session.user.id} 
            userEmail={session.user.email || ''} 
          />

          {/* Search and Filters */}
          <PatientSearchFilters
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({})}
          />

          {/* Prioritized Patient List - Now using real data with filters */}
          <PrioritizedPatientList 
            limit={20} 
            showTitle={false}
            filters={filters}
            onPatientClick={(patientId) => {
              router.push(`/patients/${patientId}`)
            }}
          />

          {/* Upload Lab Results */}
          <Card style={{ maxWidth: '600px' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">Procesar Resultados de Laboratorio</Heading>
              <Text size="3">
                Sube archivos PDF de resultados de laboratorio para análisis automático y priorización de pacientes.
              </Text>
              <Flex gap="3">
                <Button color="mint" variant="solid" asChild>
                  <a href="/upload">
                    <Flex align="center" gap="2">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        upload_file
                      </span>
                      Subir Resultado PDF
                    </Flex>
                  </a>
                </Button>
                <Button color="mint" variant="outline" asChild>
                  <a href="/patients">Ver Todos los Pacientes</a>
                </Button>
              </Flex>
            </Flex>
          </Card>

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