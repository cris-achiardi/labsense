'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { DemoPDFUpload } from '@/components/demo/demo-pdf-upload'
import { Container, Flex, Box, Text, Card, Button } from '@radix-ui/themes'

interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  confidence: number
}

export default function DemoUploadPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [extractedPatient, setExtractedPatient] = useState<PatientInfo | null>(null)

  const handleFileSelect = (file: File) => {
    setError(null)
    setSuccess(`Archivo seleccionado: ${file.name} (${Math.round(file.size / 1024)}KB)`)
    setExtractedPatient(null)
    console.log('Demo: File selected:', file)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setSuccess(null)
  }

  const handlePatientExtracted = (patient: PatientInfo) => {
    setExtractedPatient(patient)
    setError(null)
    setSuccess(`Información del paciente extraída con ${patient.confidence}% de confianza`)
  }

  const handleSuccess = (data: any) => {
    setError(null)
    setSuccess(`¡PDF procesado y almacenado exitosamente! Paciente: ${data.patient.name} (${data.patient.rut})`)
    setExtractedPatient(null)
  }

  return (
    <DashboardLayout>
      <Container size="3">
        <Flex direction="column" gap="6" align="center">
          {/* Back Button */}
          <Flex justify="start" style={{ width: '100%' }}>
            <Button
              variant="ghost"
              onClick={() => router.push('/demo')}
              style={{
                color: 'var(--labsense-blue)',
                fontWeight: '700',
                fontSize: '14px',
                padding: '0.5rem 0',
                justifyContent: 'flex-start'
              }}
            >
              ← Volver a Demo Dashboard
            </Button>
          </Flex>

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
          <DemoPDFUpload 
            onFileSelect={handleFileSelect}
            onError={handleError}
            onPatientExtracted={handlePatientExtracted}
            onSuccess={handleSuccess}
          />
        </Flex>
      </Container>
    </DashboardLayout>
  )
}