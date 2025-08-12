'use client'

/**
 * Enhanced Manual Review Interface with PDF Comparison
 * Integrates side-by-side PDF comparison for visual validation
 * Provides comprehensive review workflow for Chilean healthcare workers
 */

import { useState } from 'react'
import { Badge, Button, Card, Flex, Text, Heading, Box, Tabs } from '@radix-ui/themes'
import { EyeOpenIcon, ListBulletIcon, CheckIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import { ManualReviewInterface, ManualReviewData } from './manual-review-interface'
import { PDFComparisonView, PDFComparisonData, ExtractedDataItem } from './pdf-comparison-view'

interface EnhancedManualReviewProps {
  reviewData: ManualReviewData
  pdfComparisonData?: PDFComparisonData
  onApprove: (id: string, notes: string, validatedItems?: ExtractedDataItem[]) => void
  onReject: (id: string, reason: string, notes: string) => void
  onRequestMoreInfo: (id: string, questions: string[]) => void
  isLoading?: boolean
}

export function EnhancedManualReview({
  reviewData,
  pdfComparisonData,
  onApprove,
  onReject,
  onRequestMoreInfo,
  isLoading = false
}: EnhancedManualReviewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [validatedItems, setValidatedItems] = useState<Map<string, { isValid: boolean; notes?: string }>>(new Map())
  const [highlightedItem, setHighlightedItem] = useState<ExtractedDataItem | null>(null)

  // Create PDF comparison data from review data if not provided
  const defaultPdfData: PDFComparisonData = pdfComparisonData || {
    pdfUrl: reviewData.originalPdfUrl || '/placeholder-pdf.pdf',
    patientInfo: {
      rut: reviewData.patientRUT,
      name: reviewData.patientName,
      date: reviewData.uploadDate
    },
    extractedData: [
      // Convert review data to extracted data format
      ...(reviewData.patientRUT ? [{
        type: 'rut' as const,
        label: 'RUT del Paciente',
        value: reviewData.patientRUT,
        confidence: reviewData.components.find(c => c.component === 'rut')?.score || 0,
        context: reviewData.components.find(c => c.component === 'rut')?.details || '',
        issues: reviewData.components.find(c => c.component === 'rut')?.issues || []
      }] : []),
      
      // Add abnormalities as extracted data
      ...reviewData.abnormalities.map((abnormality, index) => ({
        type: 'lab_value' as const,
        label: abnormality.marker,
        value: `${abnormality.value} (Ref: ${abnormality.referenceRange})`,
        confidence: 85, // Default confidence for abnormalities
        context: `Valor anormal detectado: ${abnormality.severity}`,
        issues: abnormality.severity === 'critical' ? ['Valor crítico detectado'] : []
      }))
    ],
    summary: {
      totalExtracted: reviewData.components.length + reviewData.abnormalities.length,
      highConfidence: reviewData.components.filter(c => c.score >= 85).length,
      lowConfidence: reviewData.components.filter(c => c.score < 70).length,
      withIssues: reviewData.components.filter(c => c.issues.length > 0).length
    }
  }

  const handleItemValidation = (item: ExtractedDataItem, isValid: boolean, notes?: string) => {
    const key = `${item.type}-${item.label}-${item.value}`
    setValidatedItems(prev => new Map(prev.set(key, { isValid, notes })))
  }

  const handleHighlightItem = (item: ExtractedDataItem) => {
    setHighlightedItem(item)
  }

  const handleApproveWithValidation = (id: string, notes: string) => {
    // Include validated items in approval
    const validatedItemsArray = Array.from(validatedItems.entries()).map(([key, validation]) => ({
      key,
      ...validation
    }))
    
    onApprove(id, notes, defaultPdfData.extractedData.filter(item => {
      const key = `${item.type}-${item.label}-${item.value}`
      const validation = validatedItems.get(key)
      return validation?.isValid !== false // Include items that are valid or not validated
    }))
  }

  const getValidationSummary = () => {
    const total = defaultPdfData.extractedData.length
    const validated = validatedItems.size
    const correct = Array.from(validatedItems.values()).filter(v => v.isValid).length
    const incorrect = Array.from(validatedItems.values()).filter(v => !v.isValid).length
    
    return { total, validated, correct, incorrect }
  }

  const validationSummary = getValidationSummary()

  return (
    <Card size="4" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <Flex direction="column" gap="4">
        {/* Header with Validation Summary */}
        <Flex justify="between" align="center">
          <Heading size="6">Revisión Manual Mejorada</Heading>
          <Flex gap="2" align="center">
            <Badge color="blue" size="2">
              {validationSummary.validated}/{validationSummary.total} validados
            </Badge>
            {validationSummary.correct > 0 && (
              <Badge color="green" size="2">
                {validationSummary.correct} correctos
              </Badge>
            )}
            {validationSummary.incorrect > 0 && (
              <Badge color="red" size="2">
                {validationSummary.incorrect} incorrectos
              </Badge>
            )}
          </Flex>
        </Flex>

        {/* Tabs for Different Views */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">
              <ListBulletIcon />
              Resumen General
            </Tabs.Trigger>
            <Tabs.Trigger value="comparison">
              <EyeOpenIcon />
              Comparación PDF
            </Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab - Original Manual Review Interface */}
          <Tabs.Content value="overview">
            <Box mt="4">
              <ManualReviewInterface
                reviewData={reviewData}
                onApprove={handleApproveWithValidation}
                onReject={onReject}
                onRequestMoreInfo={onRequestMoreInfo}
                isLoading={isLoading}
              />
            </Box>
          </Tabs.Content>

          {/* PDF Comparison Tab */}
          <Tabs.Content value="comparison">
            <Box mt="4">
              {defaultPdfData.pdfUrl ? (
                <PDFComparisonView
                  data={defaultPdfData}
                  onHighlightItem={handleHighlightItem}
                  onValidateItem={handleItemValidation}
                />
              ) : (
                <Card>
                  <Flex direction="column" align="center" gap="3" py="6">
                    <EyeOpenIcon width="32" height="32" color="gray" />
                    <Heading size="4" color="gray">PDF No Disponible</Heading>
                    <Text size="3" color="gray" align="center">
                      El PDF original no está disponible para comparación.
                      <br />
                      Utilice la pestaña "Resumen General" para revisar los datos extraídos.
                    </Text>
                  </Flex>
                </Card>
              )}
            </Box>
          </Tabs.Content>
        </Tabs.Root>

        {/* Highlighted Item Info */}
        {highlightedItem && (
          <Card>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Heading size="4">Elemento Resaltado</Heading>
                <Button 
                  size="1" 
                  variant="ghost" 
                  onClick={() => setHighlightedItem(null)}
                >
                  ✕
                </Button>
              </Flex>
              
              <Flex gap="4" align="center">
                <Text size="2">
                  <strong>Tipo:</strong> {highlightedItem.type}
                </Text>
                <Text size="2">
                  <strong>Valor:</strong> {highlightedItem.value}
                </Text>
                <Text size="2">
                  <strong>Confianza:</strong> {highlightedItem.confidence}%
                </Text>
              </Flex>

              {highlightedItem.issues && highlightedItem.issues.length > 0 && (
                <Box>
                  <Text size="2" weight="bold" color="red">Problemas detectados:</Text>
                  <Flex direction="column" gap="1" mt="1">
                    {highlightedItem.issues.map((issue, index) => (
                      <Text key={index} size="1" color="red">
                        • {issue}
                      </Text>
                    ))}
                  </Flex>
                </Box>
              )}
            </Flex>
          </Card>
        )}

        {/* Validation Progress */}
        {validationSummary.total > 0 && (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="4">Progreso de Validación</Heading>
              
              <Flex justify="between" align="center">
                <Text size="2">
                  Elementos validados: {validationSummary.validated} de {validationSummary.total}
                </Text>
                <Text size="2">
                  Progreso: {Math.round((validationSummary.validated / validationSummary.total) * 100)}%
                </Text>
              </Flex>

              {/* Progress Bar */}
              <Box style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--gray-4)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <Box style={{
                  width: `${(validationSummary.validated / validationSummary.total) * 100}%`,
                  height: '100%',
                  backgroundColor: validationSummary.incorrect > 0 ? 'var(--orange-9)' : 'var(--green-9)',
                  transition: 'width 0.3s ease'
                }} />
              </Box>

              {validationSummary.validated > 0 && (
                <Flex gap="4" mt="2">
                  <Flex align="center" gap="1">
                    <CheckIcon color="green" />
                    <Text size="1" color="green">
                      {validationSummary.correct} correctos
                    </Text>
                  </Flex>
                  <Flex align="center" gap="1">
                    <CrossCircledIcon color="red" />
                    <Text size="1" color="red">
                      {validationSummary.incorrect} incorrectos
                    </Text>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Utilice las pestañas para alternar entre el resumen general y la comparación visual con el PDF
            </Text>
            <Flex gap="2">
              <Button 
                variant="soft" 
                onClick={() => setActiveTab('comparison')}
                disabled={!defaultPdfData.pdfUrl}
              >
                <EyeOpenIcon />
                Ver Comparación PDF
              </Button>
              <Button 
                variant="soft" 
                onClick={() => setActiveTab('overview')}
              >
                <ListBulletIcon />
                Ver Resumen
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Card>
  )
}