'use client'

import { Box } from '@radix-ui/themes'
import { DashboardTopbar } from './dashboard-topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function DashboardLayout({ children, style }: DashboardLayoutProps) {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)', ...style }}>
      <DashboardTopbar />
      <Box style={{ padding: '1rem', width: '100%' }}>
        {children}
      </Box>
    </Box>
  )
}