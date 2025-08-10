'use client'

import { useSession, signOut } from 'next-auth/react'
import { Flex, Box, Text, Avatar, Button, Badge } from '@radix-ui/themes'

export function DashboardTopbar() {
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Box 
      style={{ 
        borderBottom: '1px solid var(--gray-6)',
        backgroundColor: 'var(--color-background)',
        padding: 'var(--space-3) var(--space-4)'
      }}
    >
      <Flex justify="between" align="center">
        {/* Logo */}
        <Box>
          <Text size="6" weight="bold" style={{ color: 'var(--mint-11)' }}>
            LabSense
          </Text>
        </Box>

        {/* User Info */}
        <Flex align="center" gap="3">
          {session?.user && (
            <>
              <Avatar
                src={session.user.image || undefined}
                fallback={session.user.name?.charAt(0) || 'U'}
                size="2"
              />
              <Box>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                  {session.user.name}
                </Text>
                <Flex align="center" gap="2">
                  <Badge 
                    color={session.user.role === 'admin' ? 'mint' : 'blue'} 
                    variant="soft"
                    size="1"
                  >
                    {session.user.role === 'admin' ? 'Admin' : 'Healthcare Worker'}
                  </Badge>
                </Flex>
              </Box>
              <Button
                variant="ghost"
                size="2"
                onClick={handleLogout}
                style={{ color: 'var(--gray-11)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  logout
                </span>
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}