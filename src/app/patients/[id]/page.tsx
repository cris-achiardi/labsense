'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Flex, Box, Container, Badge, Separator } from '@radix-ui/themes'
import { CHILEAN_HEALTH_MARKERS } from '@/lib/pdf-parsing/spanish-health-markers'

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

  // Dynamic helper functions using CHILEAN_HEALTH_MARKERS as single source of truth
  const getLabUnit = (markerType: string): string => {
    // Try to find exact match by system code first
    const exactMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
      marker.systemCode === markerType
    )
    if (exactMatch?.unit) return exactMatch.unit

    // Try to find by Spanish name (case-insensitive match)
    const spanishMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
      marker.spanishName.toLowerCase().includes(markerType.toLowerCase()) ||
      markerType.toLowerCase().includes(marker.spanishName.toLowerCase())
    )
    if (spanishMatch?.unit) return spanishMatch.unit

    // Fallback for partial matches
    const marker = markerType.toLowerCase()
    const partialMatch = CHILEAN_HEALTH_MARKERS.find(m => {
      const spanish = m.spanishName.toLowerCase()
      return spanish.includes('glicemia') && marker.includes('glicemia') ||
             spanish.includes('colesterol') && marker.includes('colesterol') ||
             spanish.includes('trigliceridos') && marker.includes('trigliceridos') ||
             spanish.includes('tsh') && marker.includes('tsh') ||
             spanish.includes('got') && (marker.includes('got') || marker.includes('ast')) ||
             spanish.includes('gpt') && (marker.includes('gpt') || marker.includes('alt')) ||
             spanish.includes('creatinina') && marker.includes('creatinina') ||
             spanish.includes('hemoglobina') && marker.includes('hemoglobina')
    })
    
    return partialMatch?.unit || 'mg/dL' // default
  }

  const getNormalRange = (markerType: string): string => {
    // Try to find exact match by system code first
    const exactMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
      marker.systemCode === markerType
    )
    if (exactMatch?.normalRange?.text) return exactMatch.normalRange.text

    // Try to find by Spanish name (case-insensitive match)
    const spanishMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
      marker.spanishName.toLowerCase().includes(markerType.toLowerCase()) ||
      markerType.toLowerCase().includes(marker.spanishName.toLowerCase())
    )
    if (spanishMatch?.normalRange?.text) return spanishMatch.normalRange.text

    // Fallback for partial matches
    const marker = markerType.toLowerCase()
    const partialMatch = CHILEAN_HEALTH_MARKERS.find(m => {
      const spanish = m.spanishName.toLowerCase()
      return spanish.includes('glicemia') && marker.includes('glicemia') ||
             spanish.includes('colesterol') && marker.includes('colesterol') ||
             spanish.includes('trigliceridos') && marker.includes('trigliceridos') ||
             spanish.includes('tsh') && marker.includes('tsh') ||
             spanish.includes('got') && (marker.includes('got') || marker.includes('ast')) ||
             spanish.includes('gpt') && (marker.includes('gpt') || marker.includes('alt')) ||
             spanish.includes('creatinina') && marker.includes('creatinina') ||
             spanish.includes('hemoglobina') && marker.includes('hemoglobina')
    })
    
    return partialMatch?.normalRange?.text || 'Consultar médico' // default
  }

  return (
    <DashboardLayout style={{ backgroundColor: '#EFEFEF' }}>
      <Box style={{ width: '100%' }}>
        <Flex direction="column" gap="2">
          {/* Back Button - Outside main card */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            style={{
              color: 'var(--labsense-blue)',
              fontWeight: '700',
              fontSize: '14px',
              padding: '0.5rem 0',
              justifyContent: 'flex-start',
              alignSelf: 'flex-start',
              marginLeft: '0',
              width: 'fit-content'
            }}
          >
            ← Back to Dashboard
          </Button>

          {/* Main Container Card */}
          <Card style={{ 
            backgroundColor: 'var(--color-panel)',
            padding: '1rem'
          }}>
            {/* Section 1: Header (inside main card) */}
            <Flex justify="between" align="center" style={{ marginBottom: 'var(--space-4)' }}>
              <Text size="4" weight="bold" style={{ color: 'var(--labsense-text-primary)' }}>
                Resultados Laboratorio
              </Text>
              <Flex align="center" gap="2">
                <Text size="3" style={{ color: 'var(--gray-11)', fontWeight: '300' }}>
                  Folio
                </Text>
                <Text size="3" style={{ color: 'var(--labsense-text-primary)', fontWeight: '700' }}>
                  345571
                </Text>
              </Flex>
            </Flex>

            {/* Section 2: Patient Info Card */}
            <Card style={{ 
              border: '1px solid var(--gray-6)',
              backgroundColor: 'var(--color-panel)',
              padding: '1rem',
              marginBottom: 'var(--space-3)'
            }}>
              <Flex justify="between" align="start">
                <Flex direction="column" gap="1">
                  <Text size="3" weight="medium" style={{ color: 'var(--labsense-text-primary)' }}>
                    D**** A****** B****** L******
                  </Text>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>
                    RUT: *.***.***.* 
                  </Text>
                </Flex>
                <Flex direction="column" align="end" gap="1">
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>Edad: 61a 7m 4d</Text>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>Sexo: masculino</Text>
                </Flex>
              </Flex>
            </Card>

            {/* Section 3: Lab Test Info Card */}
            <Card style={{ 
              border: '1px solid var(--gray-6)',
              backgroundColor: 'var(--color-panel)',
              padding: '1rem',
              marginBottom: 'var(--space-3)'
            }}>
              <Flex justify="between" align="start">
                <Box style={{ flex: '1' }}>
                  <Flex direction="column" gap="1">
                    <Flex align="center" gap="6">
                      <Text size="2" style={{ color: 'var(--gray-10)', minWidth: '140px' }}>Fecha de Ingreso:</Text>
                      <Text size="2" style={{ color: 'var(--gray-11)' }}>25/04/2024 8:54:27</Text>
                    </Flex>
                    <Flex align="center" gap="6">
                      <Text size="2" style={{ color: 'var(--gray-10)', minWidth: '140px' }}>Toma de Muestra:</Text>
                      <Text size="2" style={{ color: 'var(--gray-11)' }}>25/04/2024 8:54:27</Text>
                    </Flex>
                    <Flex align="center" gap="6">
                      <Text size="2" style={{ color: 'var(--gray-10)', minWidth: '140px' }}>Fecha de Validación:</Text>
                      <Text size="2" style={{ color: 'var(--gray-11)' }}>25/04/2024 8:54:27</Text>
                    </Flex>
                    <Flex align="center" gap="6">
                      <Text size="2" style={{ color: 'var(--gray-10)', minWidth: '140px' }}>Profesional Solicitante:</Text>
                      <Text size="2" style={{ color: 'var(--gray-11)' }}>ROMINA VARGAS CRUZ</Text>
                    </Flex>
                    <Flex align="center" gap="6">
                      <Text size="2" style={{ color: 'var(--gray-10)', minWidth: '140px' }}>Procedencia:</Text>
                      <Text size="2" style={{ color: 'var(--gray-11)' }}>CESFAM QUEBRADA VERDE</Text>
                    </Flex>
                  </Flex>
                </Box>
                <Flex direction="column" align="end" gap="2">
                  <Flex align="center" gap="2">
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>Prioridad</Text>
                    <Badge className="chip-error" size="1" style={{ width: '3.875rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      alta
                    </Badge>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>Exámenes</Text>
                    <Badge className="chip-gray" size="1" style={{ width: '3.875rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      55
                    </Badge>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>Anormal</Text>
                    <Badge className="chip-error" size="1" style={{ width: '3.875rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      17
                    </Badge>
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Section 4: Results Table Card */}
            {labResults.length > 0 ? (
              <Card style={{ 
                border: '1px solid var(--gray-6)',
                backgroundColor: 'var(--color-panel)',
                padding: '0',
                overflow: 'auto'
              }}>
                {/* Table Rows */}
                {labResults.map((result, index) => {
                  const isAbnormal = result.is_abnormal
                  const unit = getLabUnit(result.marker_type)
                  const normalRange = getNormalRange(result.marker_type)
                  
                  return (
                    <Box 
                      key={result.id}
                      style={{
                        borderBottom: index < labResults.length - 1 ? '1px solid var(--gray-6)' : 'none',
                        backgroundColor: 'var(--color-panel)'
                      }}
                    >
                      <Flex align="center" style={{ minHeight: '40px', minWidth: '600px', padding: '8px 16px' }}>
                        {/* Lab Name */}
                        <Box style={{ flex: '1', minWidth: '250px' }}>
                          <Text 
                            size="2" 
                            style={{ 
                              color: isAbnormal ? 'var(--red-10)' : 'var(--labsense-text-primary)', 
                              fontWeight: '400'
                            }}
                          >
                            {result.marker_type}
                          </Text>
                        </Box>

                        {/* Result Value */}
                        <Box style={{ width: '120px', textAlign: 'right' }}>
                          <Text 
                            size="2" 
                            weight="medium"
                            style={{ 
                              color: isAbnormal ? 'var(--red-10)' : 'var(--labsense-text-primary)'
                            }}
                          >
                            {result.value}
                          </Text>
                        </Box>

                        {/* Unit */}
                        <Box style={{ width: '100px', textAlign: 'center' }}>
                          <Text size="2" style={{ color: 'var(--gray-11)', fontWeight: '400' }}>
                            ({unit})
                          </Text>
                        </Box>

                        {/* Reference Range */}
                        <Box style={{ width: '180px', textAlign: 'right' }}>
                          <Text size="2" style={{ color: 'var(--gray-10)', fontWeight: '400' }}>
                            {isAbnormal && '[ * ] '}{normalRange}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  )
                })}
              </Card>
            ) : (
              <Card style={{ 
                border: '1px solid var(--gray-6)',
                backgroundColor: 'var(--color-panel)',
                padding: '2rem'
              }}>
                <Flex direction="column" align="center" gap="4">
                  <Text size="3" style={{ color: 'var(--gray-11)' }}>
                    No se encontraron resultados de laboratorio para este paciente
                  </Text>
                  <Button color="mint" variant="solid" size="2">
                    Subir Resultado PDF
                  </Button>
                </Flex>
              </Card>
            )}
          </Card>
        </Flex>
      </Box>
    </DashboardLayout>
  )
}