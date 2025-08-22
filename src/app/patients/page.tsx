'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { PrioritizedPatientList } from '@/components/dashboard/prioritized-patient-list'
import { PatientSearchFilters } from '@/components/dashboard/patient-search-filters'
import { Card, Heading, Text, Button, Flex, Box, Container } from '@radix-ui/themes'
import { PatientFilters } from '@/types/database'

export default function PatientsPage() {
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
            <Text>Cargando pacientes...</Text>
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
          {/* Header */}
          <Flex justify="between" align="center">
            <Box>
              <Heading size="7" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
                Todos los Pacientes
              </Heading>
              <Text size="4" style={{ color: 'var(--gray-11)' }}>
                Lista completa de pacientes con resultados de laboratorio
              </Text>
            </Box>
            <Flex gap="3">
              <Button color="mint" variant="outline" asChild>
                <a href="/dashboard">
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      dashboard
                    </span>
                    Volver al Dashboard
                  </Flex>
                </a>
              </Button>
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
            </Flex>
          </Flex>

          {/* Search and Filters */}
          <PatientSearchFilters
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({})}
          />

          {/* Patient List */}
          <Card>
            <PrioritizedPatientList 
              limit={100} 
              showTitle={false}
              filters={filters}
              onPatientClick={(patientId) => {
                router.push(`/patients/${patientId}`)
              }}
            />
          </Card>

          {/* Quick Actions */}
          <Card style={{ maxWidth: '600px' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">Acciones Rápidas</Heading>
              <Text size="3">
                Herramientas para gestionar pacientes y resultados de laboratorio.
              </Text>
              <Flex gap="3" wrap="wrap">
                <Button color="mint" variant="outline" asChild>
                  <a href="/manual-review">
                    <Flex align="center" gap="2">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        fact_check
                      </span>
                      Revisión Manual
                    </Flex>
                  </a>
                </Button>
                <Button color="mint" variant="outline" asChild>
                  <a href="/dashboard">
                    <Flex align="center" gap="2">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        analytics
                      </span>
                      Estadísticas
                    </Flex>
                  </a>
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}