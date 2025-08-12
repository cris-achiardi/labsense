'use client'

/**
 * Manual Review Interface for Chilean Lab Reports
 * Provides healthcare workers with tools to review and validate low-confidence parsing results
 * Critical for ensuring no patient data is missed or misinterpreted
 */

import { useState } from 'react'
import { Badge, Button, Card, Flex, Text, Heading, Box, Separator, TextArea } from '@radix-ui/themes'
import { CheckIcon, CrossCircledIcon, ExclamationTriangleIcon, EyeOpenIcon } from '@radix-ui/react-icons'

export interface ManualReviewData {
  id: string
  patientRUT?: string
  patientName?: string
  uploadDate: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  components: {
    component: string
    score: number
    issues: string[]
    details: string
  }[]
  abnormalities: {
    marker: string
    value: string
    referenceRange: string
    severity: string
    priority: string
  }[]
  recommendations: string[]
  originalPdfUrl?: string
}

interface ManualReviewInterfaceProps {
  reviewData: ManualReviewData
  onApprove: (id: string, notes: string) => void
  onReject: (id: string, reason: string, notes: string) => void
  onRequestMoreInfo: (id: string, questions: string[]) => void
  isLoading?: boolean
}

export function ManualReviewInterface({
  reviewData,
  onApprove,
  onReject,
  onRequestMoreInfo,
  isLoading = false
}: ManualReviewInterfaceProps) {
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showPdf, setShowPdf] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'info' | null>(null)

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'green'
    if (score >= 70) return 'blue'
    if (score >= 50) return 'yellow'
    return 'red'
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal': return 'green'
      case 'mild': return 'yellow'
      case 'moderate': return 'orange'
      case 'severe': return 'red'
      case 'critical': return 'red'
      default: return 'gray'
    }
  }

  const handleApprove = () => {
    onApprove(reviewData.id, reviewNotes)
    setSelectedAction(null)
    setReviewNotes('')
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Por favor proporcione una razón para el rechazo')
      return
    }
    onReject(reviewData.id, rejectionReason, reviewNotes)
    setSelectedAction(null)
    setRejectionReason('')
    setReviewNotes('')
  }

  const handleRequestInfo = () => {
    const questions = [
      '¿El RUT del paciente es correcto?',
      '¿Los valores de laboratorio son legibles?',
      '¿Los rangos de referencia están claros?',
      '¿Hay información adicional relevante?'
    ]
    onRequestMoreInfo(reviewData.id, questions)
    setSelectedAction(null)
  }

  return (
    <Card size="4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Revisión Manual de Laboratorio</Heading>
          <Flex gap="2" align="center">
            <Badge color={getConfidenceColor(reviewData.confidence)} size="2">
              Confianza: {reviewData.confidence}%
            </Badge>
            <Badge color={getRiskColor(reviewData.riskLevel)} size="2">
              Riesgo: {reviewData.riskLevel.toUpperCase()}
            </Badge>
          </Flex>
        </Flex>

        {/* Patient Information */}
        <Card>
          <Flex direction="column" gap="2">
            <Heading size="4">Información del Paciente</Heading>
            <Flex gap="4">
              <Text size="3">
                <strong>RUT:</strong> {reviewData.patientRUT || 'No detectado'}
              </Text>
              <Text size="3">
                <strong>Nombre:</strong> {reviewData.patientName || 'No detectado'}
              </Text>
              <Text size="3">
                <strong>Fecha:</strong> {reviewData.uploadDate}
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* Risk Factors */}
        {reviewData.riskFactors.length > 0 && (
          <Card>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <ExclamationTriangleIcon color="orange" />
                <Heading size="4">Factores de Riesgo Detectados</Heading>
              </Flex>
              <Flex direction="column" gap="1">
                {reviewData.riskFactors.map((factor, index) => (
                  <Text key={index} size="2" color="orange">
                    • {factor}
                  </Text>
                ))}
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Component Analysis */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Análisis por Componente</Heading>
            <Flex direction="column" gap="2">
              {reviewData.components.map((component, index) => (
                <Box key={index}>
                  <Flex justify="between" align="center" mb="1">
                    <Text size="3" weight="bold">
                      {component.component === 'rut' ? 'RUT del Paciente' :
                       component.component === 'health_markers' ? 'Marcadores de Salud' :
                       component.component === 'reference_ranges' ? 'Rangos de Referencia' :
                       component.component === 'abnormal_values' ? 'Valores Anormales' :
                       component.component}
                    </Text>
                    <Badge color={getConfidenceColor(component.score)} size="1">
                      {component.score}%
                    </Badge>
                  </Flex>
                  <Text size="2" color="gray">
                    {component.details}
                  </Text>
                  {component.issues.length > 0 && (
                    <Flex direction="column" gap="1" mt="1">
                      {component.issues.map((issue, issueIndex) => (
                        <Text key={issueIndex} size="1" color="red">
                          ⚠️ {issue}
                        </Text>
                      ))}
                    </Flex>
                  )}
                  {index < reviewData.components.length - 1 && <Separator my="2" />}
                </Box>
              ))}
            </Flex>
          </Flex>
        </Card>

        {/* Abnormalities */}
        {reviewData.abnormalities.length > 0 && (
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Valores Anormales Detectados</Heading>
              <Flex direction="column" gap="2">
                {reviewData.abnormalities.map((abnormality, index) => (
                  <Flex key={index} justify="between" align="center" p="2" 
                        style={{ backgroundColor: 'var(--gray-2)', borderRadius: '6px' }}>
                    <Flex direction="column" gap="1">
                      <Text size="3" weight="bold">{abnormality.marker}</Text>
                      <Text size="2">
                        Valor: <strong>{abnormality.value}</strong> | 
                        Referencia: {abnormality.referenceRange}
                      </Text>
                    </Flex>
                    <Flex gap="2">
                      <Badge color={getSeverityColor(abnormality.severity)} size="1">
                        {abnormality.severity}
                      </Badge>
                      <Badge color={abnormality.priority === 'critical' ? 'red' : 
                                   abnormality.priority === 'high' ? 'orange' : 'yellow'} size="1">
                        {abnormality.priority}
                      </Badge>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Recommendations */}
        {reviewData.recommendations.length > 0 && (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="4">Recomendaciones del Sistema</Heading>
              <Flex direction="column" gap="1">
                {reviewData.recommendations.map((recommendation, index) => (
                  <Text key={index} size="2">
                    • {recommendation}
                  </Text>
                ))}
              </Flex>
            </Flex>
          </Card>
        )}

        {/* PDF Viewer */}
        {reviewData.originalPdfUrl && (
          <Card>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Heading size="4">PDF Original</Heading>
                <Button 
                  variant="soft" 
                  onClick={() => setShowPdf(!showPdf)}
                  disabled={isLoading}
                >
                  <EyeOpenIcon />
                  {showPdf ? 'Ocultar PDF' : 'Ver PDF'}
                </Button>
              </Flex>
              {showPdf && (
                <Box style={{ height: '400px', border: '1px solid var(--gray-6)' }}>
                  <iframe
                    src={reviewData.originalPdfUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="PDF Original del Laboratorio"
                  />
                </Box>
              )}
            </Flex>
          </Card>
        )}

        {/* Review Actions */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Decisión de Revisión</Heading>
            
            {/* Action Selection */}
            <Flex gap="2" wrap="wrap">
              <Button 
                color="green" 
                variant={selectedAction === 'approve' ? 'solid' : 'soft'}
                onClick={() => setSelectedAction('approve')}
                disabled={isLoading}
              >
                <CheckIcon />
                Aprobar
              </Button>
              <Button 
                color="red" 
                variant={selectedAction === 'reject' ? 'solid' : 'soft'}
                onClick={() => setSelectedAction('reject')}
                disabled={isLoading}
              >
                <CrossCircledIcon />
                Rechazar
              </Button>
              <Button 
                color="blue" 
                variant={selectedAction === 'info' ? 'solid' : 'soft'}
                onClick={() => setSelectedAction('info')}
                disabled={isLoading}
              >
                <ExclamationTriangleIcon />
                Solicitar Información
              </Button>
            </Flex>

            {/* Action-specific inputs */}
            {selectedAction === 'reject' && (
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Razón del rechazo:</Text>
                <TextArea
                  placeholder="Explique por qué se rechaza este reporte..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </Flex>
            )}

            {/* Review notes (always shown when action selected) */}
            {selectedAction && (
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  Notas de revisión {selectedAction !== 'approve' ? '(opcional)' : ''}:
                </Text>
                <TextArea
                  placeholder="Agregue notas adicionales sobre esta revisión..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </Flex>
            )}

            {/* Confirm Action */}
            {selectedAction && (
              <Flex gap="2" justify="end">
                <Button 
                  variant="soft" 
                  onClick={() => {
                    setSelectedAction(null)
                    setReviewNotes('')
                    setRejectionReason('')
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  color={selectedAction === 'approve' ? 'green' : 
                         selectedAction === 'reject' ? 'red' : 'blue'}
                  onClick={selectedAction === 'approve' ? handleApprove :
                           selectedAction === 'reject' ? handleReject :
                           handleRequestInfo}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {selectedAction === 'approve' ? 'Confirmar Aprobación' :
                   selectedAction === 'reject' ? 'Confirmar Rechazo' :
                   'Solicitar Información'}
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
      </Flex>
    </Card>
  )
}