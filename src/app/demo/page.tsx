'use client'

import { useState } from 'react'
import { Card, Heading, Text, Button, Badge, Flex, Box, Container } from '@radix-ui/themes'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { DemoDashboardTableView } from '@/components/demo/demo-dashboard-table-view'
import { DemoDashboardSummaryCards } from '@/components/demo/demo-dashboard-summary-cards'
import { PatientSearchFilters } from '@/components/dashboard/patient-search-filters'
import { PatientFilters } from '@/types/database'

export default function DemoPage() {
  const [filters, setFilters] = useState<PatientFilters>({})
  const [patientCount, setPatientCount] = useState(0)
  return (
    <DashboardLayout style={{ backgroundColor: '#EFEFEF' }}>
      <Box style={{ width: '100%' }}>
        <Flex direction="column" gap="2">
          {/* Dashboard Summary Cards - Figma Style */}
          <DemoDashboardSummaryCards patientCount={patientCount} />

          {/* Dashboard Table with Filters */}
          <Card style={{ backgroundColor: 'var(--color-panel)', padding: '1rem' }}>
            <Flex direction="column" gap="6">
              {/* Search and Filters */}
              <PatientSearchFilters
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters({})}
              />

              {/* Table View */}
              <DemoDashboardTableView
                limit={20}
                filters={filters}
                onPatientCountChange={setPatientCount}
              />
            </Flex>
          </Card>
        </Flex>
      </Box>
    </DashboardLayout>
  )
}