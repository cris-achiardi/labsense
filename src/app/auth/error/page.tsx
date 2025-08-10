'use client'

import { useSearchParams } from 'next/navigation'
import { Card, Heading, Text, Button, Flex, Box, Container } from '@radix-ui/themes'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Error de configuración del servidor. Contacte al administrador.'
      case 'AccessDenied':
        return 'Acceso denegado. No tiene permisos para acceder al sistema.'
      case 'Verification':
        return 'Error de verificación. Intente nuevamente.'
      default:
        return 'Error de autenticación. Intente nuevamente.'
    }
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Container size="1">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          {/* Header */}
          <Box style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Heading size="8" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
              LabSense
            </Heading>
          </Box>

          {/* Error Card */}
          <Card style={{ width: '400px', padding: 'var(--space-6)' }}>
            <Flex direction="column" gap="4" align="center">
              <Heading size="6" style={{ textAlign: 'center', color: 'var(--red-11)' }}>
                Error de Autenticación
              </Heading>
              
              <Text size="3" style={{ textAlign: 'center', color: 'var(--gray-11)' }}>
                {getErrorMessage(error)}
              </Text>

              <Link href="/auth/signin">
                <Button
                  size="3"
                  color="mint"
                  variant="solid"
                  style={{ width: '100%', marginTop: 'var(--space-4)' }}
                >
                  Intentar Nuevamente
                </Button>
              </Link>

              <Text size="2" style={{ textAlign: 'center', color: 'var(--gray-10)', marginTop: 'var(--space-4)' }}>
                Si el problema persiste, contacte al administrador del sistema
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Box>
  )
}