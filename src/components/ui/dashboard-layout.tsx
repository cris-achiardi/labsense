'use client'

import { Box } from '@radix-ui/themes'
import { DashboardTopbar } from './dashboard-topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <DashboardTopbar />
      <Box style={{ padding: 'var(--space-4)' }}>
        {children}
      </Box>
    </Box>
  )
}