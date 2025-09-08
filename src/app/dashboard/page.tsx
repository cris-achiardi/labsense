'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { DashboardTableView } from '@/components/dashboard/dashboard-table-view'
import { DashboardSummaryCards } from '@/components/dashboard/dashboard-summary-cards'
import { PatientSearchFilters } from '@/components/dashboard/patient-search-filters'
import { Card, Text, Flex, Box, Container } from '@radix-ui/themes'
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
    <DashboardLayout style={{ backgroundColor: '#efefef' }}>
      <Container size="4" style={{ padding: '16px' }}>
        <Flex direction="column" gap="6">
          {/* Dashboard Summary Cards - Figma Style */}
          <DashboardSummaryCards 
            userId={session.user.id} 
            userEmail={session.user.email || ''} 
          />

          {/* Dashboard Table with Filters */}
          <Card style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <Flex direction="column" gap="6">
              {/* Search and Filters */}
              <PatientSearchFilters
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters({})}
              />

              {/* Table View */}
              <DashboardTableView
                limit={20}
                filters={filters}
                onPatientClick={(patientId: string) => {
                  router.push(`/patients/${patientId}`)
                }}
              />
            </Flex>
          </Card>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}