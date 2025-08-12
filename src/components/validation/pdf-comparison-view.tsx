'use client'

/**
 * Side-by-Side PDF Comparison View for Chilean Lab Reports
 * Allows healthcare workers to visually validate extracted data against original PDF
 * Critical for quality assurance and error detection
 */

import { useState, useRef, useEffect } from 'react'
import { Badge, Button, Card, Flex, Text, Heading, Box, Separator, ScrollArea } from '@radix-ui/themes'
import { ZoomInIcon, ZoomOutIcon, MagnifyingGlassIcon, TargetIcon } from '@radix-ui/react-icons'

export interface ExtractedDataItem {
  type: 'rut' | 'health_marker' | 'reference_range' | 'lab_value'
  label: string
  value: string
  confidence: number
  position?: { page: number; x: number; y: number; width: number; height: number }
  context: string
  issues?: string[]
}

export interface PDFComparisonData {
  pdfUrl: string
  extractedData: ExtractedDataItem[]
  patientInfo: {
    rut?: string
    name?: string
    date?: string
  }
  summary: {
    totalExtracted: number
    highConfidence: number
    lowConfidence: number
    withIssues: number
  }
}

interface PDFComparisonViewProps {
  data: PDFComparisonData
  onHighlightItem?: (item: ExtractedDataItem) => void
  onValidateItem?: (item: ExtractedDataItem, isValid: boolean, notes?: string) => void
}

export function PDFComparisonView({ 
  data, 
  onHighlightItem, 
  onValidateItem 
}: PDFComparisonViewProps) {
  const [selectedItem, setSelectedItem] = useState<ExtractedDataItem | null>(null)
  const [pdfZoom, setPdfZoom] = useState(100)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)
  const pdfViewerRef = useRef<HTMLIFrameElement>(null)

  // Filter extracted data based on search and issues filter
  const filteredData = data.extractedData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesIssueFilter = !showOnlyIssues || (item.issues && item.issues.length > 0)
    
    return matchesSearch && matchesIssueFilter
  })

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'green'
    if (confidence >= 70) return 'blue'
    if (confidence >= 50) return 'yellow'
    return 'red'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rut': return '👤'
      case 'health_marker': return '🩺'
      case 'reference_range': return '📊'
      case 'lab_value': return '🔬'
      default: return '📄'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rut': return 'RUT Paciente'
      case 'health_marker': return 'Marcador de Salud'
      case 'reference_range': return 'Rango de Referencia'
      case 'lab_value': return 'Valor de Laboratorio'
      default: return 'Dato Extraído'
    }
  }

  const handleItemClick = (item: ExtractedDataItem) => {
    setSelectedItem(item)
    onHighlightItem?.(item)
    
    // If item has position, try to navigate PDF to that location
    if (item.position && pdfViewerRef.current) {
      // This would require PDF.js integration for precise positioning
      console.log('Navigate to PDF position:', item.position)
    }
  }

  const handleZoomIn = () => {
    setPdfZoom(prev => Math.min(200, prev + 25))
  }

  const handleZoomOut = () => {
    setPdfZoom(prev => Math.max(50, prev - 25))
  }

  const handleValidateItem = (item: ExtractedDataItem, isValid: boolean) => {
    onValidateItem?.(item, isValid)
    // Update UI to show validation status
    console.log(`Item ${item.label} validated as ${isValid ? 'correct' : 'incorrect'}`)
  }

  return (
    <Card size="4" style={{ height: '800px', maxWidth: '1400px', margin: '0 auto' }}>
      <Flex direction="column" gap="3" height="100%">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="5">Comparación PDF - Datos Extraídos</Heading>
          <Flex gap="2" align="center">
            <Badge color="blue" size="2">
              {data.summary.totalExtracted} elementos extraídos
            </Badge>
            <Badge color="green" size="2">
              {data.summary.highConfidence} alta confianza
            </Badge>
            {data.summary.withIssues > 0 && (
              <Badge color="red" size="2">
                {data.summary.withIssues} con problemas
              </Badge>
            )}
          </Flex>
        </Flex>

        {/* Patient Info */}
        <Card size="1">
          <Flex gap="4" align="center">
            <Text size="2">
              <strong>Paciente:</strong> {data.patientInfo.name || 'No identificado'}
            </Text>
            <Text size="2">
              <strong>RUT:</strong> {data.patientInfo.rut || 'No detectado'}
            </Text>
            <Text size="2">
              <strong>Fecha:</strong> {data.patientInfo.date || 'No disponible'}
            </Text>
          </Flex>
        </Card>

        {/* Main Content - Split View */}
        <Flex gap="3" style={{ flex: 1, minHeight: 0 }}>
          {/* Left Panel - PDF Viewer */}
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Flex justify="between" align="center" mb="2">
              <Heading size="4">PDF Original</Heading>
              <Flex gap="2" align="center">
                <Button size="1" variant="soft" onClick={handleZoomOut}>
                  <ZoomOutIcon />
                </Button>
                <Text size="1">{pdfZoom}%</Text>
                <Button size="1" variant="soft" onClick={handleZoomIn}>
                  <ZoomInIcon />
                </Button>
              </Flex>
            </Flex>
            
            <Box style={{ 
              flex: 1, 
              border: '1px solid var(--gray-6)', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <iframe
                ref={pdfViewerRef}
                src={`${data.pdfUrl}#zoom=${pdfZoom}`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Original del Laboratorio"
              />
            </Box>
          </Card>

          {/* Right Panel - Extracted Data */}
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Flex direction="column" gap="2" mb="3">
              <Flex justify="between" align="center">
                <Heading size="4">Datos Extraídos</Heading>
                <Button 
                  size="1" 
                  variant={showOnlyIssues ? 'solid' : 'soft'}
                  color="red"
                  onClick={() => setShowOnlyIssues(!showOnlyIssues)}
                >
                  Solo Problemas
                </Button>
              </Flex>
              
              {/* Search */}
              <Box>
                <input
                  type="text"
                  placeholder="Buscar en datos extraídos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </Box>
            </Flex>

            {/* Extracted Data List */}
            <ScrollArea style={{ flex: 1 }}>
              <Flex direction="column" gap="2">
                {filteredData.length === 0 ? (
                  <Card>
                    <Flex direction="column" align="center" gap="2" py="4">
                      <MagnifyingGlassIcon width="24" height="24" color="gray" />
                      <Text size="3" color="gray">
                        {showOnlyIssues 
                          ? 'No se encontraron elementos con problemas'
                          : 'No se encontraron datos que coincidan con la búsqueda'}
                      </Text>
                    </Flex>
                  </Card>
                ) : (
                  filteredData.map((item, index) => (
                    <Card 
                      key={index}
                      style={{ 
                        cursor: 'pointer',
                        border: selectedItem === item ? '2px solid var(--blue-8)' : '1px solid var(--gray-6)'
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <Flex direction="column" gap="2">
                        {/* Item Header */}
                        <Flex justify="between" align="center">
                          <Flex align="center" gap="2">
                            <Text size="2">{getTypeIcon(item.type)}</Text>
                            <Text size="2" weight="bold" color="gray">
                              {getTypeLabel(item.type)}
                            </Text>
                            <Badge color={getConfidenceColor(item.confidence)} size="1">
                              {item.confidence}%
                            </Badge>
                          </Flex>
                          
                          {item.position && (
                            <Button size="1" variant="ghost">
                              <TargetIcon />
                            </Button>
                          )}
                        </Flex>

                        {/* Item Content */}
                        <Box>
                          <Text size="2" weight="bold">{item.label}</Text>
                          <Text size="3" style={{ display: 'block', marginTop: '4px' }}>
                            {item.value}
                          </Text>
                        </Box>

                        {/* Context */}
                        {item.context && (
                          <Box>
                            <Text size="1" color="gray">
                              Contexto: {item.context.substring(0, 100)}
                              {item.context.length > 100 ? '...' : ''}
                            </Text>
                          </Box>
                        )}

                        {/* Issues */}
                        {item.issues && item.issues.length > 0 && (
                          <Box>
                            <Flex direction="column" gap="1">
                              {item.issues.map((issue, issueIndex) => (
                                <Text key={issueIndex} size="1" color="red">
                                  ⚠️ {issue}
                                </Text>
                              ))}
                            </Flex>
                          </Box>
                        )}

                        {/* Validation Buttons */}
                        {selectedItem === item && (
                          <Flex gap="2" mt="2">
                            <Button 
                              size="1" 
                              color="green" 
                              variant="soft"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleValidateItem(item, true)
                              }}
                            >
                              ✓ Correcto
                            </Button>
                            <Button 
                              size="1" 
                              color="red" 
                              variant="soft"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleValidateItem(item, false)
                              }}
                            >
                              ✗ Incorrecto
                            </Button>
                          </Flex>
                        )}
                      </Flex>
                    </Card>
                  ))
                )}
              </Flex>
            </ScrollArea>
          </Card>
        </Flex>

        {/* Selected Item Details */}
        {selectedItem && (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="3">Detalles del Elemento Seleccionado</Heading>
              <Flex gap="4" wrap="wrap">
                <Text size="2">
                  <strong>Tipo:</strong> {getTypeLabel(selectedItem.type)}
                </Text>
                <Text size="2">
                  <strong>Confianza:</strong> {selectedItem.confidence}%
                </Text>
                {selectedItem.position && (
                  <Text size="2">
                    <strong>Página:</strong> {selectedItem.position.page}
                  </Text>
                )}
              </Flex>
              
              <Box>
                <Text size="2" weight="bold">Contexto completo:</Text>
                <Text size="2" style={{ 
                  display: 'block', 
                  marginTop: '4px',
                  padding: '8px',
                  backgroundColor: 'var(--gray-2)',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  {selectedItem.context}
                </Text>
              </Box>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  )
}