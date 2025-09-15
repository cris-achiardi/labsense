'use client'

import { useState, useRef } from 'react'
import { Card, Heading, Text, Button, Flex, Box, Badge } from '@radix-ui/themes'

interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  confidence: number
}

interface DemoPDFUploadProps {
  onFileSelect: (file: File) => void
  onError: (error: string) => void
  onPatientExtracted?: (patient: PatientInfo) => void
  onSuccess?: (data: any) => void
}

export function DemoPDFUpload({ onFileSelect, onError, onPatientExtracted, onSuccess }: DemoPDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [extractedPatient, setExtractedPatient] = useState<PatientInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 10MB size limit
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Solo se permiten archivos PDF'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo permitido: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const extractPatientInfo = async (file: File) => {
    setIsProcessing(true)
    setExtractedPatient(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      // Use demo API endpoint - no authentication required
      const response = await fetch('/api/demo/pdf/extract-patient', {
        method: 'POST',
        body: formData
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        onError('Error del servidor: respuesta no válida')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        onError(data.error || 'Error al procesar el PDF')
        return
      }

      if (data.success && data.patient) {
        setExtractedPatient(data.patient)
        onPatientExtracted?.(data.patient)
      } else {
        onError('No se pudo extraer información del paciente del PDF')
      }
    } catch (error) {
      console.error('Error extracting patient info:', error)
      onError('Error de conexión al procesar el PDF')
    } finally {
      setIsProcessing(false)
    }
  }

  const processAndStorePDF = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('pdf', selectedFile)
      
      // Use extracted patient data if available
      if (extractedPatient) {
        formData.append('patientData', JSON.stringify(extractedPatient))
      }

      // Use demo API endpoint - no authentication required
      const response = await fetch('/api/demo/pdf/process-complete-lab', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        onError(data.error || 'Error al procesar y almacenar el PDF')
        return
      }

      if (data.success) {
        // Success! Reset form and show success message
        setSelectedFile(null)
        setExtractedPatient(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Call success callback if provided
        onSuccess?.(data.data)
        
        // Show detailed success message with lab processing results
        const summary = data.data.summary || {}
        alert(`¡Examen de laboratorio procesado exitosamente! (Demo)\n\nPaciente: ${data.data.patient.name}\nRUT: ${data.data.patient.rut}\nFolio: ${data.data.folio || 'N/A'}\n\nResultados procesados: ${summary.totalResults || 0}\nValores anormales: ${summary.abnormalResults || 0}\nValores críticos: ${summary.criticalResults || 0}\nConfianza: ${summary.confidence || 0}%`)
      }
    } catch (error) {
      console.error('Error processing and storing PDF:', error)
      onError('Error de conexión al procesar el PDF')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card style={{ width: '100%', maxWidth: '600px', padding: '3rem' }}>
      <Flex direction="column" gap="4">
        <Box style={{ textAlign: 'center' }}>
          <Heading size="5" mb="2">
            Subir Resultado de Laboratorio - Demo
          </Heading>
          <Text size="3" style={{ color: 'var(--gray-11)' }}>
            Selecciona el archivo PDF del resultado de laboratorio del paciente
          </Text>
        </Box>

        {/* Demo Notice */}
        <Card
          style={{
            backgroundColor: 'var(--mint-2)',
            border: '1px solid var(--mint-6)',
            padding: '0.75rem',
          }}
        >
          <Text
            size="2"
            style={{
              color: 'var(--mint-11)',
              textAlign: 'center',
              display: 'block'
            }}
          >
            ✨ Modo Demo - Procesamiento real de PDFs sin autenticación
          </Text>
        </Card>

        {/* Upload Area */}
        <Box
          style={{
            border: `2px dashed ${isDragOver ? 'var(--mint-8)' : 'var(--gray-7)'}`,
            borderRadius: 'var(--radius-3)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            backgroundColor: isDragOver ? 'var(--mint-2)' : 'var(--gray-2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <Flex direction="column" align="center" gap="3">
            <span 
              className="material-symbols-outlined" 
              style={{ 
                fontSize: '48px', 
                color: isDragOver ? 'var(--mint-9)' : 'var(--gray-9)' 
              }}
            >
              upload_file
            </span>
            
            <Box>
              <Text size="4" weight="medium" style={{ color: 'var(--gray-12)', display: 'block' }}>
                Arrastra el archivo PDF aquí
              </Text>
              <Text size="3" style={{ color: 'var(--gray-11)', display: 'block' }}>
                o haz clic para seleccionar archivo
              </Text>
            </Box>

            <Badge color="gray" variant="soft">
              Máximo 10MB • Solo archivos PDF
            </Badge>
          </Flex>
        </Box>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Selected file info */}
        {selectedFile && (
          <Card style={{ backgroundColor: 'var(--mint-2)', border: '1px solid var(--mint-6)' }}>
            <Flex justify="between" align="center">
              <Flex align="center" gap="3">
                <span 
                  className="material-symbols-outlined" 
                  style={{ color: 'var(--mint-9)', fontSize: '24px' }}
                >
                  picture_as_pdf
                </span>
                <Box>
                  <Text size="3" weight="medium" style={{ color: 'var(--mint-12)' }}>
                    {selectedFile.name}
                  </Text>
                  <Text size="2" style={{ color: 'var(--mint-11)' }}>
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </Box>
              </Flex>
              
              <Button
                size="1"
                color="mint"
                variant="soft"
                onClick={() => {
                  setSelectedFile(null)
                  setExtractedPatient(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  close
                </span>
              </Button>
            </Flex>
          </Card>
        )}

        {/* Extract Patient Info button */}
        {selectedFile && !extractedPatient && (
          <Button
            size="3"
            color="mint"
            variant="solid"
            disabled={isProcessing}
            style={{ width: '100%' }}
            onClick={() => extractPatientInfo(selectedFile)}
          >
            {isProcessing ? (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  hourglass_empty
                </span>
                Extrayendo información del paciente...
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  person_search
                </span>
                Extraer Información del Paciente
              </Flex>
            )}
          </Button>
        )}

        {/* Patient Information Display */}
        {extractedPatient && (
          <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Text size="4" weight="bold" style={{ color: 'var(--blue-12)' }}>
                  Información del Paciente Extraída
                </Text>
                <Badge 
                  color={extractedPatient.confidence >= 85 ? 'green' : extractedPatient.confidence >= 70 ? 'orange' : 'red'}
                  variant="solid"
                >
                  Confianza: {extractedPatient.confidence}%
                </Badge>
              </Flex>

              <Flex direction="column" gap="2">
                {extractedPatient.rut && (
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--blue-9)' }}>
                      badge
                    </span>
                    <Text size="3">
                      <strong>RUT:</strong> {extractedPatient.rut}
                    </Text>
                  </Flex>
                )}

                {extractedPatient.name && (
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--blue-9)' }}>
                      person
                    </span>
                    <Text size="3">
                      <strong>Nombre:</strong> {extractedPatient.name}
                    </Text>
                  </Flex>
                )}

                {extractedPatient.age && (
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--blue-9)' }}>
                      calendar_today
                    </span>
                    <Text size="3">
                      <strong>Edad:</strong> {extractedPatient.age}
                    </Text>
                  </Flex>
                )}

                {extractedPatient.gender && (
                  <Flex align="center" gap="2">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--blue-9)' }}>
                      wc
                    </span>
                    <Text size="3">
                      <strong>Género:</strong> {extractedPatient.gender}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Process Lab Results button */}
        {extractedPatient && (
          <Button
            size="3"
            color="mint"
            variant="solid"
            disabled={isUploading}
            style={{ width: '100%' }}
            onClick={() => processAndStorePDF()}
          >
            {isUploading ? (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  hourglass_empty
                </span>
                Procesando y almacenando...
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  cloud_upload
                </span>
                Procesar y Almacenar PDF
              </Flex>
            )}
          </Button>
        )}

        {/* Help text */}
        <Box style={{ backgroundColor: 'var(--blue-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-2)', textAlign: 'center' }}>
          <Text size="2" style={{ color: 'var(--blue-11)' }}>
            <strong>Demo Mode:</strong> El sistema procesará realmente el PDF y almacenará los datos en la base de datos.
            Los datos se procesan sin autenticación para fines de demostración. La información del paciente se mostrará
            de forma anonimizada en las vistas del dashboard y páginas de pacientes.
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}