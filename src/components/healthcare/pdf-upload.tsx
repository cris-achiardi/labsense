'use client'

import { useState, useRef } from 'react'
import { Card, Heading, Text, Button, Flex, Box, Badge } from '@radix-ui/themes'

interface PDFUploadProps {
  onFileSelect: (file: File) => void
  onError: (error: string) => void
}

export function PDFUpload({ onFileSelect, onError }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card style={{ width: '100%', maxWidth: '600px' }}>
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="5" mb="2">
            Subir Resultado de Laboratorio
          </Heading>
          <Text size="3" style={{ color: 'var(--gray-11)' }}>
            Selecciona el archivo PDF del resultado de laboratorio del paciente
          </Text>
        </Box>

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
              <Text size="4" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Arrastra el archivo PDF aquí
              </Text>
              <Text size="3" style={{ color: 'var(--gray-11)' }}>
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

        {/* Upload button */}
        {selectedFile && (
          <Button
            size="3"
            color="mint"
            variant="solid"
            disabled={isUploading}
            style={{ width: '100%' }}
          >
            {isUploading ? (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  hourglass_empty
                </span>
                Procesando archivo...
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  cloud_upload
                </span>
                Procesar Resultado de Laboratorio
              </Flex>
            )}
          </Button>
        )}

        {/* Help text */}
        <Box style={{ backgroundColor: 'var(--blue-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-2)' }}>
          <Text size="2" style={{ color: 'var(--blue-11)' }}>
            <strong>Información:</strong> El sistema extraerá automáticamente la información del paciente 
            y los resultados de laboratorio del PDF. Asegúrate de que el archivo contenga los datos 
            completos del paciente incluyendo RUT, nombre y resultados.
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}