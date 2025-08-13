'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, Heading, Text, Button, Badge, Flex, Box, Container, Spinner } from '@radix-ui/themes'
import { PrioritizedPatient, PatientFilters } from '@/types/database'
import { db } from '@/lib/database'
import { PDFViewerButton } from '@/components/healthcare/pdf-viewer-button'

interface PrioritizedPatientListProps {
  limit?: number
  showTitle?: boolean
  onPatientClick?: (patientId: string) => void
  filters?: PatientFilters
}

export function PrioritizedPatientList({ 
  limit = 10, 
  showTitle = true,
  onPatientClick,
  filters 
}: PrioritizedPatientListProps) {
  const { data: session } = useSession()
  const [patients, setPatients] = useState<PrioritizedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingPatient, setUpdatingPatient] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
  }, [limit, filters])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get prioritized patients from database with filters
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
      // Default behavior: navigate to patient details
      window.location.href = `/patients/${patientId}`
    }
  }

  const handleContactStatusUpdate = async (patientId: string, newStatus: 'contacted' | 'processed') => {
    if (!session?.user) {
      setError('Sesión no válida. Por favor, inicia sesión nuevamente.')
      return
    }

    try {
      setUpdatingPatient(patientId)
      setError(null)
      
      // Update patient contact status via API
      const response = await fetch(`/api/patients/${patientId}/contact-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando estado')
      }

      // Show success message briefly
      setError(null)
      
      // Reload patients to reflect changes
      await loadPatients()
    } catch (err) {
      console.error('Error updating contact status:', err)
      setError(`Error actualizando estado del paciente: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setUpdatingPatient(null)
    }
  }

  const getPriorityBadgeProps = (priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priorityLevel) {
      case 'HIGH':
        return { color: 'red' as const, variant: 'solid' as const, text: 'ALTA PRIORIDAD' }
      case 'MEDIUM':
        return { color: 'orange' as const, variant: 'solid' as const, text: 'PRIORIDAD MEDIA' }
      case 'LOW':
        return { color: 'green' as const, variant: 'solid' as const, text: 'PRIORIDAD BAJA' }
      default:
        return { color: 'gray' as const, variant: 'soft' as const, text: 'SIN CLASIFICAR' }
    }
  }

  const getContactStatusBadge = (status: 'pending' | 'contacted' | 'processed') => {
    switch (status) {
      case 'pending':
        return { color: 'yellow' as const, text: 'PENDIENTE' }
      case 'contacted':
        return { color: 'blue' as const, text: 'CONTACTADO' }
      case 'processed':
        return { color: 'green' as const, text: 'PROCESADO' }
      default:
        return { color: 'gray' as const, text: 'DESCONOCIDO' }
    }
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No disponible'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const anonymizeRut = (rut: string) => {
    // Anonymize RUT for display: 12.345.678-9 -> **.***.**-*
    return rut.replace(/\d/g, '*').replace(/\*/g, (match, offset) => {
      // Keep some digits visible for identification
      if (offset === 0 || offset === rut.length - 1) return match
      return '*'
    })
  }

  const anonymizeName = (name: string) => {
    // Anonymize name: Juan Pérez -> J*** P****
    return name.split(' ').map(part => 
      part.length > 0 ? part[0] + '*'.repeat(Math.max(part.length - 1, 3)) : part
    ).join(' ')
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
            <Button asChild color="mint" variant="solid">
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
      </Container>
    )
  }

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {showTitle && (
          <Box>
            <Heading size="7" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
              Pacientes Priorizados
            </Heading>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              {patients.length} paciente{patients.length !== 1 ? 's' : ''} ordenado{patients.length !== 1 ? 's' : ''} por prioridad médica
            </Text>
          </Box>
        )}

        <Flex gap="4" wrap="wrap">
          {patients.map((patient) => {
            const priorityBadge = getPriorityBadgeProps(patient.priority_level)
            const contactBadge = getContactStatusBadge(patient.contact_status)
            
            return (
              <Card key={patient.id} style={{ width: '380px', minHeight: '280px' }}>
                <Flex direction="column" gap="3" style={{ height: '100%' }}>
                  {/* Header with name and priority */}
                  <Flex justify="between" align="center">
                    <Text weight="bold" size="3">
                      {anonymizeName(patient.name)}
                    </Text>
                    <Badge color={priorityBadge.color} variant={priorityBadge.variant}>
                      {priorityBadge.text}
                    </Badge>
                  </Flex>

                  {/* Patient info */}
                  <Flex direction="column" gap="1">
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>
                      RUT: {anonymizeRut(patient.rut)}
                    </Text>
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>
                      Fecha de examen: {formatDate(patient.test_date)}
                    </Text>
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>
                      Laboratorio: {patient.laboratory_name || 'No especificado'}
                    </Text>
                  </Flex>

                  {/* Priority score and abnormal markers */}
                  <Box>
                    <Flex justify="between" align="center" style={{ marginBottom: 'var(--space-2)' }}>
                      <Text size="2" weight="medium">
                        Puntaje de Prioridad: {patient.priority_score}
                      </Text>
                      <Badge color={contactBadge.color} variant="soft">
                        {contactBadge.text}
                      </Badge>
                    </Flex>
                    
                    {patient.abnormal_markers && (
                      <Box>
                        <Text size="2" weight="medium" style={{ 
                          color: patient.priority_level === 'HIGH' ? 'var(--red-11)' : 
                                patient.priority_level === 'MEDIUM' ? 'var(--orange-11)' : 
                                'var(--green-11)' 
                        }}>
                          Marcadores Anormales ({patient.abnormal_count}):
                        </Text>
                        <Text size="2" style={{ color: 'var(--gray-11)' }}>
                          {patient.abnormal_markers}
                        </Text>
                      </Box>
                    )}

                    {!patient.abnormal_markers && (
                      <Text size="2" style={{ color: 'var(--green-11)' }}>
                        Todos los valores normales
                      </Text>
                    )}
                  </Box>

                  {/* Action buttons */}
                  <Flex gap="2" style={{ marginTop: 'auto' }} wrap="wrap">
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
                    
                    {patient.contact_status === 'pending' && (
                      <Button 
                        color="blue" 
                        variant="outline" 
                        size="2"
                        loading={updatingPatient === patient.id}
                        disabled={updatingPatient === patient.id}
                        onClick={() => handleContactStatusUpdate(patient.id, 'contacted')}
                      >
                        {updatingPatient === patient.id ? 'Actualizando...' : 'Marcar Contactado'}
                      </Button>
                    )}
                    
                    {patient.contact_status === 'contacted' && (
                      <Button 
                        color="green" 
                        variant="outline" 
                        size="2"
                        loading={updatingPatient === patient.id}
                        disabled={updatingPatient === patient.id}
                        onClick={() => handleContactStatusUpdate(patient.id, 'processed')}
                      >
                        {updatingPatient === patient.id ? 'Actualizando...' : 'Marcar Procesado'}
                      </Button>
                    )}
                  </Flex>

                  {/* Last contact date */}
                  {patient.last_contact_date && (
                    <Text size="1" style={{ color: 'var(--gray-10)' }}>
                      Último contacto: {formatDate(patient.last_contact_date)}
                    </Text>
                  )}
                </Flex>
              </Card>
            )
          })}
        </Flex>

        {/* Load more button if there might be more patients */}
        {patients.length === limit && (
          <Flex justify="center">
            <Button 
              color="mint" 
              variant="outline"
              onClick={() => {
                // This would implement pagination
                console.log('Load more patients...')
              }}
            >
              Cargar Más Pacientes
            </Button>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}