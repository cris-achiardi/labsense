'use client'

/**
 * Manual Review Queue for Chilean Lab Reports
 * Displays and manages pending lab reports that require manual review
 * Prioritizes by risk level and confidence score
 */

import { useState, useEffect } from 'react'
import { Badge, Button, Card, Flex, Text, Heading, Box, Select, TextField } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ClockIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { ManualReviewInterface, ManualReviewData } from './manual-review-interface'

interface ManualReviewQueueProps {
  onReviewComplete?: (reviewId: string, action: 'approved' | 'rejected' | 'info_requested') => void
}

export function ManualReviewQueue({ onReviewComplete }: ManualReviewQueueProps) {
  const [pendingReviews, setPendingReviews] = useState<ManualReviewData[]>([])
  const [selectedReview, setSelectedReview] = useState<ManualReviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'risk'>('risk')

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    const mockReviews: ManualReviewData[] = [
      {
        id: '1',
        patientRUT: '12.345.678-9',
        patientName: 'María González',
        uploadDate: '2024-01-15 14:30',
        confidence: 65,
        riskLevel: 'high',
        riskFactors: [
          '⚠️ ALTO: Múltiples RUTs detectados - posible confusión de pacientes',
          '⚠️ MEDIO: Pocos marcadores detectados - análisis limitado'
        ],
        components: [
          {
            component: 'rut',
            score: 75,
            issues: ['Multiple RUTs detected'],
            details: 'RUT: 12.345.678-9, Fuente: body, Confianza: 75%'
          },
          {
            component: 'health_markers',
            score: 60,
            issues: ['Few health markers detected'],
            details: '3 marcadores encontrados (1 críticos, 1 alta prioridad)'
          },
          {
            component: 'reference_ranges',
            score: 70,
            issues: [],
            details: '2 rangos de referencia encontrados'
          },
          {
            component: 'abnormal_values',
            score: 55,
            issues: ['Low value extraction rate'],
            details: '3 marcadores procesados, 2 anormales (1 críticos, 0 severos)'
          }
        ],
        abnormalities: [
          {
            marker: 'GLICEMIA EN AYUNO (BASAL)',
            value: '180 mg/dL',
            referenceRange: '74 - 106',
            severity: 'moderate',
            priority: 'critical'
          },
          {
            marker: 'COLESTEROL TOTAL',
            value: '240 mg/dL',
            referenceRange: '< 200',
            severity: 'mild',
            priority: 'high'
          }
        ],
        recommendations: [
          '⚠️ Confianza insuficiente (65% < 70%) - requiere revisión manual',
          '🚨 2 valores anormales detectados',
          '📊 Total de 2 valores anormales encontrados'
        ]
      },
      {
        id: '2',
        patientRUT: 'No detectado',
        uploadDate: '2024-01-15 15:45',
        confidence: 45,
        riskLevel: 'critical',
        riskFactors: [
          '🚨 CRÍTICO: No se pudo identificar al paciente (RUT faltante)',
          '⚠️ MEDIO: Sin rangos de referencia - validación limitada'
        ],
        components: [
          {
            component: 'rut',
            score: 0,
            issues: ['No RUT found', 'Patient identification failed'],
            details: 'No se pudo extraer RUT del paciente'
          },
          {
            component: 'health_markers',
            score: 80,
            issues: [],
            details: '6 marcadores encontrados (2 críticos, 3 alta prioridad)'
          },
          {
            component: 'reference_ranges',
            score: 30,
            issues: ['No reference ranges found', 'Cannot validate abnormal values'],
            details: 'No se encontraron rangos de referencia explícitos'
          },
          {
            component: 'abnormal_values',
            score: 70,
            issues: [],
            details: '6 marcadores procesados, 0 anormales (0 críticos, 0 severos)'
          }
        ],
        abnormalities: [],
        recommendations: [
          '🚨 CRÍTICO: No se pudo identificar al paciente (RUT faltante)',
          '⚠️ Sin rangos de referencia - validación limitada',
          '✅ Todos los valores dentro de rangos normales'
        ]
      },
      {
        id: '3',
        patientRUT: '98.765.432-1',
        patientName: 'Carlos Rodríguez',
        uploadDate: '2024-01-15 16:20',
        confidence: 72,
        riskLevel: 'medium',
        riskFactors: [
          '⚠️ MEDIO: Rangos de referencia limitados'
        ],
        components: [
          {
            component: 'rut',
            score: 88,
            issues: [],
            details: 'RUT: 98.765.432-1, Fuente: form, Confianza: 88%'
          },
          {
            component: 'health_markers',
            score: 82,
            issues: [],
            details: '7 marcadores encontrados (1 críticos, 2 alta prioridad)'
          },
          {
            component: 'reference_ranges',
            score: 65,
            issues: ['Limited reference ranges'],
            details: '3 rangos de referencia encontrados'
          },
          {
            component: 'abnormal_values',
            score: 75,
            issues: [],
            details: '7 marcadores procesados, 1 anormales (0 críticos, 1 severos)'
          }
        ],
        abnormalities: [
          {
            marker: 'H. TIROESTIMULANTE (TSH)',
            value: '8.5 mUI/L',
            referenceRange: '0.55 - 4.78',
            severity: 'severe',
            priority: 'critical'
          }
        ],
        recommendations: [
          '⚠️ Confianza aceptable (72%) - revisión manual recomendada',
          '🚨 1 valores anormales detectados',
          '⚠️ SEVERO: 1 valores severos requieren seguimiento urgente'
        ]
      }
    ]
    setPendingReviews(mockReviews)
  }, [])

  // Filter and sort reviews
  const filteredReviews = pendingReviews
    .filter(review => {
      const matchesSearch = !searchTerm || 
        review.patientRUT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRisk = filterRisk === 'all' || review.riskLevel === filterRisk
      
      return matchesSearch && matchesRisk
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case 'confidence':
          return a.confidence - b.confidence // Lower confidence first
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        default:
          return 0
      }
    })

  const handleReviewAction = async (
    id: string, 
    action: 'approve' | 'reject' | 'info', 
    data: string | string[]
  ) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove from pending reviews
      setPendingReviews(prev => prev.filter(review => review.id !== id))
      setSelectedReview(null)
      
      // Notify parent component
      const actionMap = { approve: 'approved', reject: 'rejected', info: 'info_requested' } as const
      onReviewComplete?.(id, actionMap[action])
      
      console.log(`Review ${id} ${action}ed:`, data)
    } catch (error) {
      console.error('Error processing review:', error)
      alert('Error al procesar la revisión. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'green'
      case 'medium': return 'yellow'
      case 'high': return 'orange'
      case 'critical': return 'red'
      default: return 'gray'
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'blue'
    if (score >= 50) return 'yellow'
    return 'red'
  }

  if (selectedReview) {
    return (
      <Box>
        <Flex justify="between" align="center" mb="4">
          <Button variant="soft" onClick={() => setSelectedReview(null)}>
            ← Volver a la Cola
          </Button>
          <Text size="2" color="gray">
            {filteredReviews.length} reportes pendientes
          </Text>
        </Flex>
        
        <ManualReviewInterface
          reviewData={selectedReview}
          onApprove={(id, notes) => handleReviewAction(id, 'approve', notes)}
          onReject={(id, reason, notes) => handleReviewAction(id, 'reject', `${reason}\n${notes}`)}
          onRequestMoreInfo={(id, questions) => handleReviewAction(id, 'info', questions)}
          isLoading={isLoading}
        />
      </Box>
    )
  }

  return (
    <Card size="4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="6">Cola de Revisión Manual</Heading>
          <Badge color="blue" size="2">
            {filteredReviews.length} pendientes
          </Badge>
        </Flex>

        {/* Filters and Search */}
        <Card>
          <Flex gap="3" align="center" wrap="wrap">
            <Box style={{ minWidth: '200px' }}>
              <TextField.Root
                placeholder="Buscar por RUT o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            
            <Select.Root value={filterRisk} onValueChange={setFilterRisk}>
              <Select.Trigger placeholder="Filtrar por riesgo" />
              <Select.Content>
                <Select.Item value="all">Todos los riesgos</Select.Item>
                <Select.Item value="critical">Crítico</Select.Item>
                <Select.Item value="high">Alto</Select.Item>
                <Select.Item value="medium">Medio</Select.Item>
                <Select.Item value="low">Bajo</Select.Item>
              </Select.Content>
            </Select.Root>

            <Select.Root value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <Select.Trigger placeholder="Ordenar por" />
              <Select.Content>
                <Select.Item value="risk">Nivel de riesgo</Select.Item>
                <Select.Item value="confidence">Confianza (menor primero)</Select.Item>
                <Select.Item value="date">Fecha (más reciente)</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Card>

        {/* Review Queue */}
        <Flex direction="column" gap="3">
          {filteredReviews.length === 0 ? (
            <Card>
              <Flex direction="column" align="center" gap="2" py="6">
                <ClockIcon width="24" height="24" color="gray" />
                <Text size="4" color="gray">No hay reportes pendientes de revisión</Text>
                <Text size="2" color="gray">
                  {searchTerm || filterRisk !== 'all' 
                    ? 'Intente ajustar los filtros de búsqueda'
                    : 'Todos los reportes han sido procesados'}
                </Text>
              </Flex>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} style={{ cursor: 'pointer' }} 
                    onClick={() => setSelectedReview(review)}>
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="3">
                      <Text size="4" weight="bold">
                        {review.patientName || 'Paciente sin identificar'}
                      </Text>
                      <Badge color={getRiskColor(review.riskLevel)} size="1">
                        {review.riskLevel.toUpperCase()}
                      </Badge>
                      <Badge color={getConfidenceColor(review.confidence)} size="1">
                        {review.confidence}%
                      </Badge>
                    </Flex>
                    
                    <Flex gap="4" align="center">
                      <Text size="2" color="gray">
                        RUT: {review.patientRUT || 'No detectado'}
                      </Text>
                      <Text size="2" color="gray">
                        Fecha: {review.uploadDate}
                      </Text>
                      <Text size="2" color="gray">
                        Anormalidades: {review.abnormalities.length}
                      </Text>
                    </Flex>

                    {review.riskFactors.length > 0 && (
                      <Flex align="center" gap="2">
                        <ExclamationTriangleIcon color="orange" width="14" height="14" />
                        <Text size="1" color="orange">
                          {review.riskFactors.length} factor{review.riskFactors.length > 1 ? 'es' : ''} de riesgo
                        </Text>
                      </Flex>
                    )}
                  </Flex>

                  <Button variant="soft">
                    Revisar →
                  </Button>
                </Flex>
              </Card>
            ))
          )}
        </Flex>

        {/* Summary Stats */}
        {filteredReviews.length > 0 && (
          <Card>
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Resumen de la cola de revisión
              </Text>
              <Flex gap="4">
                <Text size="2">
                  Crítico: <strong>{filteredReviews.filter(r => r.riskLevel === 'critical').length}</strong>
                </Text>
                <Text size="2">
                  Alto: <strong>{filteredReviews.filter(r => r.riskLevel === 'high').length}</strong>
                </Text>
                <Text size="2">
                  Medio: <strong>{filteredReviews.filter(r => r.riskLevel === 'medium').length}</strong>
                </Text>
                <Text size="2">
                  Confianza promedio: <strong>
                    {Math.round(filteredReviews.reduce((sum, r) => sum + r.confidence, 0) / filteredReviews.length)}%
                  </strong>
                </Text>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  )
}