'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Heading, Text, Button, Flex, Box, Container } from '@radix-ui/themes'

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
        // Handle error - could show toast or error message
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
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
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Sistema Inteligente de Priorización de Resultados de Laboratorio
            </Text>
          </Box>

          {/* Sign In Card */}
          <Card style={{ width: '400px', padding: 'var(--space-6)' }}>
            <Flex direction="column" gap="4" align="center">
              <Heading size="6" style={{ textAlign: 'center' }}>
                Iniciar Sesión
              </Heading>
              
              <Text size="3" style={{ textAlign: 'center', color: 'var(--gray-11)' }}>
                Accede con tu cuenta de Google para usar LabSense
              </Text>

              <Button
                size="3"
                color="mint"
                variant="solid"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
              >
                {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
              </Button>

              <Text size="2" style={{ textAlign: 'center', color: 'var(--gray-10)', marginTop: 'var(--space-4)' }}>
                Solo personal autorizado de centros de salud primaria puede acceder al sistema
              </Text>
            </Flex>
          </Card>

          {/* Footer */}
          <Text size="2" style={{ color: 'var(--gray-10)', marginTop: 'var(--space-6)', textAlign: 'center' }}>
            LabSense - Desarrollado para Centros de Atención Primaria de Chile
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}