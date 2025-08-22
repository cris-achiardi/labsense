'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Flex, Box, Container, Badge, Separator } from '@radix-ui/themes'

interface Patient {
  id: string
  rut: string
  name: string
  age: string | null
  gender: string | null
  priority_score: number
  contact_status: string
  created_at: string
  updated_at: string
}

interface LabResult {
  id: string
  marker_type: string
  value: number
  unit: string
  is_abnormal: boolean
  severity: string | null
  extracted_text: string | null
  confidence: number
  created_at: string
}

interface PatientDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)

  useEffect(() => {
    params.then(resolvedParams => {
      setPatientId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session && patientId) {
      fetchPatientData()
    }
  }, [session, patientId])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      
      // Fetch patient data
      const patientResponse = await fetch(`/api/patients/${patientId}`)
      if (!patientResponse.ok) {
        throw new Error('No se pudo cargar la información del paciente')
      }
      const patientData = await patientResponse.json()
      setPatient(patientData)

      // Fetch lab results
      const labResponse = await fetch(`/api/patients/${patientId}/lab-results`)
      if (labResponse.ok) {
        const labData = await labResponse.json()
        setLabResults(labData)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (newStatus: string) => {
    if (!patientId) return
    try {
      const response = await fetch(`/api/patients/${patientId}/contact-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setPatient(prev => prev ? { ...prev, contact_status: newStatus } : null)
      }
    } catch (err) {
      console.error('Error updating contact status:', err)
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'red'
    if (score >= 5) return 'orange'
    if (score >= 3) return 'yellow'
    return 'green'
  }

  const getPriorityLabel = (score: number) => {
    if (score >= 8) return 'CRÍTICO'
    if (score >= 5) return 'ALTO'
    if (score >= 3) return 'MEDIO'
    return 'BAJO'
  }

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'green'
      case 'processed': return 'blue'
      default: return 'orange'
    }
  }

  const getContactStatusLabel = (status: string) => {
    switch (status) {
      case 'contacted': return 'Contactado'
      case 'processed': return 'Procesado'
      default: return 'Pendiente'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <Container size="1">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Text>Cargando información del paciente...</Text>
          </Flex>
        </Container>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container size="1">
          <Card>
            <Flex direction="column" align="center" gap="4">
              <Text size="5" style={{ color: 'var(--red-11)' }}>
                Error al cargar el paciente
              </Text>
              <Text>{error}</Text>
              <Button color="mint" variant="solid" onClick={() => router.back()}>
                Volver
              </Button>
            </Flex>
          </Card>
        </Container>
      </DashboardLayout>
    )
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <Container size="1">
          <Card>
            <Flex direction="column" align="center" gap="4">
              <Text size="5">Paciente no encontrado</Text>
              <Button color="mint" variant="solid" onClick={() => router.back()}>
                Volver
              </Button>
            </Flex>
          </Card>
        </Container>
      </DashboardLayout>
    )
  }

  const abnormalResults = labResults.filter(result => result.is_abnormal)
  const normalResults = labResults.filter(result => !result.is_abnormal)

  return (
    <DashboardLayout>
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Flex justify="between" align="center">
            <Box>
              <Heading size="7" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
                Detalle del Paciente
              </Heading>
              <Text size="4" style={{ color: 'var(--gray-11)' }}>
                Información completa y resultados de laboratorio
              </Text>
            </Box>
            <Flex gap="3">
              <Button color="gray" variant="outline" onClick={() => router.back()}>
                <Flex align="center" gap="2">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_back
                  </span>
                  Volver
                </Flex>
              </Button>
            </Flex>
          </Flex>

          {/* Patient Info Card */}
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="start">
                <Box>
                  <Heading size="6" style={{ marginBottom: 'var(--space-2)' }}>
                    {patient.name}
                  </Heading>
                  <Text size="4" style={{ color: 'var(--gray-11)' }}>
                    RUT: {patient.rut}
                  </Text>
                </Box>
                <Flex gap="3">
                  <Badge color={getPriorityColor(patient.priority_score)} size="2">
                    {getPriorityLabel(patient.priority_score)} ({patient.priority_score})
                  </Badge>
                  <Badge color={getContactStatusColor(patient.contact_status)} size="2">
                    {getContactStatusLabel(patient.contact_status)}
                  </Badge>
                </Flex>
              </Flex>

              <Separator />

              <Flex gap="6" wrap="wrap">
                {patient.age && (
                  <Box>
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>Edad</Text>
                    <Text size="3" weight="medium">{patient.age}</Text>
                  </Box>
                )}
                {patient.gender && (
                  <Box>
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>Género</Text>
                    <Text size="3" weight="medium">{patient.gender}</Text>
                  </Box>
                )}
                <Box>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>Total Exámenes</Text>
                  <Text size="3" weight="medium">{labResults.length}</Text>
                </Box>
                <Box>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>Valores Anormales</Text>
                  <Text size="3" weight="medium" style={{ color: 'var(--red-11)' }}>
                    {abnormalResults.length}
                  </Text>
                </Box>
              </Flex>

              {/* Contact Status Actions */}
              <Separator />
              <Box>
                <Text size="3" weight="medium" style={{ marginBottom: 'var(--space-3)' }}>
                  Estado de Contacto
                </Text>
                <Flex gap="3">
                  <Button 
                    color="orange" 
                    variant={patient.contact_status === 'pending' ? 'solid' : 'outline'}
                    onClick={() => updateContactStatus('pending')}
                  >
                    Pendiente
                  </Button>
                  <Button 
                    color="green" 
                    variant={patient.contact_status === 'contacted' ? 'solid' : 'outline'}
                    onClick={() => updateContactStatus('contacted')}
                  >
                    Contactado
                  </Button>
                  <Button 
                    color="blue" 
                    variant={patient.contact_status === 'processed' ? 'solid' : 'outline'}
                    onClick={() => updateContactStatus('processed')}
                  >
                    Procesado
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Card>

          {/* Abnormal Results */}
          {abnormalResults.length > 0 && (
            <Card>
              <Heading size="5" style={{ marginBottom: 'var(--space-4)', color: 'var(--red-11)' }}>
                Valores Anormales ({abnormalResults.length})
              </Heading>
              <Flex direction="column" gap="3">
                {abnormalResults.map((result) => (
                  <Flex key={result.id} justify="between" align="center" p="3" style={{ 
                    backgroundColor: 'var(--red-2)', 
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--red-6)'
                  }}>
                    <Box>
                      <Text size="3" weight="medium" style={{ color: 'var(--red-12)' }}>
                        {result.marker_type}
                      </Text>
                      <Text size="2" style={{ color: 'var(--red-11)' }}>
                        Confianza: {Math.round(result.confidence * 100)}%
                      </Text>
                    </Box>
                    <Flex align="center" gap="2">
                      <Text size="4" weight="bold" style={{ color: 'var(--red-12)' }}>
                        {result.value} {result.unit}
                      </Text>
                      {result.severity && (
                        <Badge color="red" size="1">
                          {result.severity.toUpperCase()}
                        </Badge>
                      )}
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}

          {/* Normal Results */}
          {normalResults.length > 0 && (
            <Card>
              <Heading size="5" style={{ marginBottom: 'var(--space-4)', color: 'var(--green-11)' }}>
                Valores Normales ({normalResults.length})
              </Heading>
              <Flex direction="column" gap="2">
                {normalResults.map((result) => (
                  <Flex key={result.id} justify="between" align="center" p="3" style={{ 
                    backgroundColor: 'var(--gray-2)', 
                    borderRadius: 'var(--radius-2)'
                  }}>
                    <Text size="3" weight="medium">
                      {result.marker_type}
                    </Text>
                    <Text size="3">
                      {result.value} {result.unit}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}

          {/* No Results */}
          {labResults.length === 0 && (
            <Card>
              <Flex direction="column" align="center" gap="4" p="6">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-9)' }}>
                  lab_research
                </span>
                <Text size="4" style={{ color: 'var(--gray-11)' }}>
                  No se encontraron resultados de laboratorio para este paciente
                </Text>
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
            </Card>
          )}
        </Flex>
      </Container>
    </DashboardLayout>
  )
}