'use client'

/**
 * Test page for complete lab extraction
 * Task 11.1: Validate complete lab results extraction in browser
 */

import { useState } from 'react'
import { Button } from '@radix-ui/themes'
import { Card, Heading, Text, Badge, Separator } from '@radix-ui/themes'

interface LabResult {
  examen: string
  resultado: string | number
  unidad: string
  valorReferencia: string
  metodo: string
  tipoMuestra: string
  isAbnormal: boolean
  abnormalIndicator: string
  systemCode: string | null
  category: string | null
  priority: string | null
  confidence: number
}

interface ExtractionResult {
  success: boolean
  data?: {
    patient: {
      rut: string | null
      name: string | null
      age: string | null
      gender: string | null
    } | null
    labResults: LabResult[]
    metadata: {
      folio: string | null
      fechaIngreso: string | null
      tomaMuestra: string | null
      fechaValidacion: string | null
      profesionalSolicitante: string | null
      procedencia: string | null
      totalResults: number
      abnormalCount: number
      criticalCount: number
    }
    confidence: number
    summary: {
      totalResults: number
      abnormalResults: number
      criticalResults: number
      normalResults: number
      resultsByCategory: Record<string, number>
      resultsByPriority: Record<string, number>
    }
  }
  error?: string
}

export default function TestCompleteExtractionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf/extract-complete-lab', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Extraction error:', error)
      setResult({
        success: false,
        error: 'Error al procesar el PDF'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Heading size="6" mb="4">
        🧪 Test Complete Lab Extraction
      </Heading>
      
      <Text size="3" color="gray" mb="6">
        Task 11.1: Test complete lab results extraction from Chilean PDFs
      </Text>

      {/* File Upload */}
      <Card mb="6">
        <div className="space-y-4">
          <Heading size="4">Upload Chilean Lab Report PDF</Heading>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mint-50 file:text-mint-700 hover:file:bg-mint-100"
          />
          
          {file && (
            <div className="flex items-center gap-4">
              <Text size="2" color="gray">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Text>
              
              <Button 
                onClick={handleExtract} 
                disabled={loading}
                size="2"
              >
                {loading ? 'Extracting...' : 'Extract Complete Lab Data'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.success && result.data ? (
            <>
              {/* Summary */}
              <Card>
                <Heading size="4" mb="4">📊 Extraction Summary</Heading>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Text size="1" color="gray">Overall Confidence</Text>
                    <Text size="4" weight="bold">{result.data.confidence}%</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Total Results</Text>
                    <Text size="4" weight="bold">{result.data.summary.totalResults}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Abnormal Results</Text>
                    <Text size="4" weight="bold" color="red">{result.data.summary.abnormalResults}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Critical Results</Text>
                    <Text size="4" weight="bold" color="red">{result.data.summary.criticalResults}</Text>
                  </div>
                </div>
              </Card>

              {/* Patient Information */}
              {result.data.patient && (
                <Card>
                  <Heading size="4" mb="4">👤 Patient Information</Heading>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Text size="1" color="gray">RUT</Text>
                      <Text size="3">{result.data.patient.rut || 'Not found'}</Text>
                    </div>
                    <div>
                      <Text size="1" color="gray">Name</Text>
                      <Text size="3">{result.data.patient.name || 'Not found'}</Text>
                    </div>
                    <div>
                      <Text size="1" color="gray">Age</Text>
                      <Text size="3">{result.data.patient.age || 'Not found'}</Text>
                    </div>
                    <div>
                      <Text size="1" color="gray">Gender</Text>
                      <Text size="3">{result.data.patient.gender || 'Not found'}</Text>
                    </div>
                  </div>
                </Card>
              )}

              {/* Lab Report Metadata */}
              <Card>
                <Heading size="4" mb="4">📋 Lab Report Metadata</Heading>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Text size="1" color="gray">Folio</Text>
                    <Text size="3">{result.data.metadata.folio || 'Not found'}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Toma Muestra</Text>
                    <Text size="3">{result.data.metadata.tomaMuestra || 'Not found'}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Fecha Validación</Text>
                    <Text size="3">{result.data.metadata.fechaValidacion || 'Not found'}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Profesional Solicitante</Text>
                    <Text size="3">{result.data.metadata.profesionalSolicitante || 'Not found'}</Text>
                  </div>
                  <div>
                    <Text size="1" color="gray">Procedencia</Text>
                    <Text size="3">{result.data.metadata.procedencia || 'Not found'}</Text>
                  </div>
                </div>
              </Card>

              {/* Lab Results */}
              <Card>
                <Heading size="4" mb="4">🧪 Lab Results ({result.data.labResults.length})</Heading>
                
                {result.data.labResults.length === 0 ? (
                  <Text color="red">No lab results extracted. Check extraction patterns.</Text>
                ) : (
                  <div className="space-y-4">
                    {result.data.labResults.map((labResult, index) => (
                      <Card key={index} variant="surface">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <Heading size="3">{labResult.examen}</Heading>
                            <div className="flex gap-2 mt-1">
                              {labResult.category && (
                                <Badge color="blue" size="1">{labResult.category}</Badge>
                              )}
                              {labResult.priority && (
                                <Badge color={getPriorityColor(labResult.priority)} size="1">
                                  {labResult.priority}
                                </Badge>
                              )}
                              {labResult.isAbnormal && (
                                <Badge color="red" size="1">ABNORMAL {labResult.abnormalIndicator}</Badge>
                              )}
                            </div>
                          </div>
                          <Badge color="gray" size="1">{labResult.confidence}% confidence</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <Text size="1" color="gray">Resultado</Text>
                            <Text size="2" weight="bold">{labResult.resultado}</Text>
                          </div>
                          <div>
                            <Text size="1" color="gray">Unidad</Text>
                            <Text size="2">{labResult.unidad}</Text>
                          </div>
                          <div>
                            <Text size="1" color="gray">Valor Referencia</Text>
                            <Text size="2">{labResult.valorReferencia}</Text>
                          </div>
                          <div>
                            <Text size="1" color="gray">Método</Text>
                            <Text size="2">{labResult.metodo}</Text>
                          </div>
                          <div>
                            <Text size="1" color="gray">Tipo Muestra</Text>
                            <Text size="2">{labResult.tipoMuestra}</Text>
                          </div>
                        </div>
                        
                        {labResult.systemCode && (
                          <div className="mt-2 pt-2 border-t">
                            <Text size="1" color="gray">System Code: {labResult.systemCode}</Text>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <Heading size="4" mb="4">Results by Category</Heading>
                  <div className="space-y-2">
                    {Object.entries(result.data.summary.resultsByCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <Text size="2">{category}</Text>
                        <Badge color="blue">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <Heading size="4" mb="4">Results by Priority</Heading>
                  <div className="space-y-2">
                    {Object.entries(result.data.summary.resultsByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between">
                        <Text size="2">{priority}</Text>
                        <Badge color={getPriorityColor(priority)}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <Text color="red" size="3">
                ❌ Extraction failed: {result.error}
              </Text>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}