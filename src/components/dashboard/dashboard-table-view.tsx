'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, Text, Button, Badge, Flex, Box, Container, Spinner } from '@radix-ui/themes'
import { PrioritizedPatient, PatientFilters } from '@/types/database'
import { db } from '@/lib/database'
import { PDFViewerButton } from '@/components/healthcare/pdf-viewer-button'

interface DashboardTableViewProps {
  limit?: number
  onPatientClick?: (patientId: string) => void
  filters?: PatientFilters
  viewMode?: 'table' | 'cards'
}

export function DashboardTableView({ 
  limit = 10, 
  onPatientClick,
  filters,
  viewMode = 'table'
}: DashboardTableViewProps) {
  const { data: session } = useSession()
  const [patients, setPatients] = useState<PrioritizedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
  }, [limit, filters])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const prioritizedPatients = await db.getPrioritizedPatients(limit, 0, filters)
      setPatients(prioritizedPatients)
    } catch (err) {
      console.error('Error loading patients:', err)
      setError('Error cargando pacientes. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handlePatientClick = (patientId: string) => {
    if (onPatientClick) {
      onPatientClick(patientId)
    } else {
      window.location.href = `/patients/${patientId}`
    }
  }

  const getPriorityBadge = (priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priorityLevel) {
      case 'HIGH':
        return { 
          color: 'red' as const,
          variant: 'solid' as const,
          text: 'alto' 
        }
      case 'MEDIUM':
        return { 
          color: 'amber' as const,
          variant: 'solid' as const,
          text: 'medio' 
        }
      case 'LOW':
        return { 
          color: 'green' as const,
          variant: 'solid' as const,
          text: 'bajo' 
        }
      default:
        return { 
          color: 'gray' as const,
          variant: 'soft' as const,
          text: 'sin clasificar' 
        }
    }
  }

  const anonymizeRut = (rut: string) => {
    return rut.replace(/\d/g, '*')
  }

  const anonymizeName = (name: string) => {
    return name.split(' ').map(part => 
      part.length > 0 ? part[0] + '*'.repeat(Math.max(part.length - 1, 3)) : part
    ).join(' ')
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No disponible'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Container size="4">
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <Spinner size="3" />
          <Text>Cargando pacientes priorizados...</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="4">
        <Card>
          <Flex direction="column" align="center" gap="4" style={{ padding: 'var(--space-6)' }}>
            <Text color="red" weight="bold">Error</Text>
            <Text>{error}</Text>
            <Button onClick={loadPatients} color="mint" variant="outline">
              Reintentar
            </Button>
          </Flex>
        </Card>
      </Container>
    )
  }

  if (patients.length === 0) {
    return (
      <Container size="4">
        <Card>
          <Flex direction="column" align="center" gap="4" style={{ padding: 'var(--space-6)' }}>
            <Text size="4" weight="bold">No hay pacientes para mostrar</Text>
            <Text color="gray">
              No se encontraron pacientes con resultados de laboratorio procesados.
            </Text>
          </Flex>
        </Card>
      </Container>
    )
  }

  if (viewMode === 'cards') {
    // Mobile-friendly card grid view
    return (
      <Flex gap="4" wrap="wrap">
        {patients.map((patient) => {
          const priorityBadge = getPriorityBadge(patient.priority_level)
          
          return (
            <Card key={patient.id} style={{ width: '380px', minHeight: '280px' }}>
              <Flex direction="column" gap="3" style={{ height: '100%' }}>
                <Flex justify="between" align="center">
                  <Text weight="bold" size="3">
                    {anonymizeName(patient.name)}
                  </Text>
                  <Badge color={priorityBadge.color} variant={priorityBadge.variant}>
                    {priorityBadge.text}
                  </Badge>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>
                    RUT: {anonymizeRut(patient.rut)}
                  </Text>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>
                    Fecha de examen: {formatDate(patient.test_date)}
                  </Text>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>
                    Puntaje: {patient.priority_score}
                  </Text>
                </Flex>

                <Flex gap="2" style={{ marginTop: 'auto' }}>
                  <Button 
                    color="mint" 
                    variant="solid" 
                    size="2"
                    style={{ flex: 1 }}
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    Ver Detalles
                  </Button>
                  
                  {patient.pdf_file_path && patient.lab_report_id && (
                    <PDFViewerButton
                      pdfUrl={patient.pdf_file_path}
                      patientRut={patient.rut}
                      labReportId={patient.lab_report_id}
                      patientName={patient.name}
                    />
                  )}
                </Flex>
              </Flex>
            </Card>
          )
        })}
      </Flex>
    )
  }

  // Table-like view using Cards and Flex
  return (
    <Box style={{ width: '100%' }}>
      <Card style={{ 
        borderRadius: '8px',
        border: '1px solid var(--gray-6)',
        overflow: 'hidden'
      }}>
        {/* Table Header Card */}
        <Box style={{
          backgroundColor: 'var(--gray-1)',
          borderBottom: '1px solid var(--gray-6)',
          padding: '0'
        }}>
          <Flex align="center" style={{ minHeight: '40px' }}>
            <Box style={{ width: '365px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Nombre del Paciente (ID)
              </Text>
            </Box>
            <Box style={{ width: '100px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                RUT
              </Text>
            </Box>
            <Box style={{ width: '94px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Edad
              </Text>
            </Box>
            <Box style={{ width: '83px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Sexo
              </Text>
            </Box>
            <Box style={{ width: '78px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Prioridad
              </Text>
            </Box>
            <Box style={{ width: '115px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Fecha Examen
              </Text>
            </Box>
            <Box style={{ width: '70px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Folio
              </Text>
            </Box>
            <Box style={{ width: '89px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Exámenes
              </Text>
            </Box>
            <Box style={{ width: '84px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Anormal
              </Text>
            </Box>
            <Box style={{ width: '88px', padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Pje. Riesgo
              </Text>
            </Box>
            <Box style={{ flex: 1, padding: '8px' }}>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                PDF
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Table Rows as Cards */}
        {patients.map((patient, index) => {
          const priorityBadge = getPriorityBadge(patient.priority_level)
          
          return (
            <Box 
              key={patient.id}
              style={{
                borderBottom: index < patients.length - 1 ? '1px solid var(--gray-6)' : 'none',
                backgroundColor: 'white'
              }}
            >
              <Flex align="center" style={{ minHeight: '40px' }}>
                {/* Patient Name and ID */}
                <Box style={{ width: '365px', padding: '8px' }}>
                  <Flex align="center" gap="2">
                    <Text 
                      size="2"
                      style={{ 
                        color: 'var(--blue-11)', 
                        cursor: 'pointer',
                        fontWeight: '300'
                      }}
                      onClick={() => handlePatientClick(patient.id)}
                    >
                      {anonymizeName(patient.name)}
                    </Text>
                    <Text size="2" style={{ color: 'var(--blue-11)', fontWeight: '300' }}>
                      ({patient.id.slice(-5)})
                    </Text>
                  </Flex>
                </Box>

                {/* RUT */}
                <Box style={{ width: '100px', padding: '8px' }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {anonymizeRut(patient.rut)}
                  </Text>
                </Box>

                {/* Age */}
                <Box style={{ width: '94px', padding: '8px' }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {patient.age || 'N/A'}
                  </Text>
                </Box>

                {/* Gender */}
                <Box style={{ width: '83px', padding: '8px' }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {patient.gender === 'M' ? 'masculino' : patient.gender === 'F' ? 'femenino' : 'N/A'}
                  </Text>
                </Box>

                {/* Priority Badge */}
                <Box style={{ width: '78px', padding: '8px' }}>
                  <Badge 
                    color={priorityBadge.color} 
                    variant={priorityBadge.variant}
                    size="1"
                    style={{ fontSize: '12px' }}
                  >
                    {priorityBadge.text}
                  </Badge>
                </Box>

                {/* Test Date */}
                <Box style={{ width: '115px', padding: '8px' }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {formatDate(patient.test_date)}
                  </Text>
                </Box>

                {/* Folio */}
                <Box style={{ width: '70px', padding: '8px' }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {patient.lab_report_id?.slice(-6) || 'N/A'}
                  </Text>
                </Box>

                {/* Total Tests Count */}
                <Box style={{ width: '89px', padding: '8px', textAlign: 'center' }}>
                  <Text size="1" style={{ color: 'var(--gray-12)', fontWeight: '300' }}>
                    {patient.total_tests_count || 0}
                  </Text>
                </Box>

                {/* Abnormal Count */}
                <Box style={{ width: '84px', padding: '8px', textAlign: 'center' }}>
                  <Text 
                    size="1" 
                    style={{ 
                      color: patient.abnormal_count > 0 ? 'var(--red-11)' : 'var(--gray-12)', 
                      fontWeight: '300' 
                    }}
                  >
                    {patient.abnormal_count || 0}
                  </Text>
                </Box>

                {/* Priority Score */}
                <Box style={{ width: '88px', padding: '8px', textAlign: 'center' }}>
                  <Text 
                    size="1" 
                    style={{ 
                      color: patient.priority_score > 1000 ? 'var(--red-11)' : 
                             patient.priority_score > 100 ? 'var(--amber-9)' : 
                             'var(--green-11)', 
                      fontWeight: '300' 
                    }}
                  >
                    {patient.priority_score || 0}
                  </Text>
                </Box>

                {/* PDF Button */}
                <Box style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
                  {patient.pdf_file_path && patient.lab_report_id && (
                    <Box style={{
                      backgroundColor: 'var(--purple-3)',
                      borderRadius: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PDFViewerButton
                        pdfUrl={patient.pdf_file_path}
                        patientRut={patient.rut}
                        labReportId={patient.lab_report_id}
                        patientName={patient.name}
                        variant="icon"
                      />
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          )
        })}
      </Card>
    </Box>
  )
}