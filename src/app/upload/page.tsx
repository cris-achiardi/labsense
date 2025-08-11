'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { PDFUpload } from '@/components/healthcare/pdf-upload'
import { Container, Flex, Box, Text, Card } from '@radix-ui/themes'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
            <Text>Cargando...</Text>
          </Flex>
        </Container>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  const handleFileSelect = (file: File) => {
    setError(null)
    setSuccess(`Archivo seleccionado: ${file.name} (${Math.round(file.size / 1024)}KB)`)
    console.log('File selected:', file)
    // TODO: Implement actual file processing
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setSuccess(null)
  }

  return (
    <DashboardLayout>
      <Container size="3">
        <Flex direction="column" gap="6" align="center">
          {/* Page Header */}
          <Box style={{ textAlign: 'center' }}>
            <Text size="7" weight="bold" style={{ color: 'var(--gray-12)' }}>
              Subir Resultado de Laboratorio
            </Text>
            <Text size="4" style={{ color: 'var(--gray-11)', marginTop: 'var(--space-2)' }}>
              Procesa automáticamente los resultados de laboratorio de pacientes chilenos
            </Text>
          </Box>

          {/* Error Message */}
          {error && (
            <Card style={{ 
              backgroundColor: 'var(--red-2)', 
              border: '1px solid var(--red-6)',
              width: '100%',
              maxWidth: '600px'
            }}>
              <Flex align="center" gap="3">
                <span className="material-symbols-outlined" style={{ color: 'var(--red-9)' }}>
                  error
                </span>
                <Text size="3" style={{ color: 'var(--red-11)' }}>
                  {error}
                </Text>
              </Flex>
            </Card>
          )}

          {/* Success Message */}
          {success && (
            <Card style={{ 
              backgroundColor: 'var(--green-2)', 
              border: '1px solid var(--green-6)',
              width: '100%',
              maxWidth: '600px'
            }}>
              <Flex align="center" gap="3">
                <span className="material-symbols-outlined" style={{ color: 'var(--green-9)' }}>
                  check_circle
                </span>
                <Text size="3" style={{ color: 'var(--green-11)' }}>
                  {success}
                </Text>
              </Flex>
            </Card>
          )}

          {/* Upload Component */}
          <PDFUpload 
            onFileSelect={handleFileSelect}
            onError={handleError}
          />

          {/* Navigation */}
          <Flex gap="3">
            <Text size="2" style={{ color: 'var(--gray-10)' }}>
              <a href="/dashboard" style={{ color: 'var(--mint-11)', textDecoration: 'underline' }}>
                ← Volver al Dashboard
              </a>
            </Text>
          </Flex>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}