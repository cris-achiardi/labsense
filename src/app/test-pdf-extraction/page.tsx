'use client'

import { useState } from 'react'
import { Button, Card, Text, Heading, Box, Flex } from '@radix-ui/themes'

export default function TestPDFExtractionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError(null)
    } else {
      setError('Por favor selecciona un archivo PDF válido')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf/extract', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.data)
      } else {
        setError(data.error || 'Error al procesar el PDF')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p="6" maxWidth="800px" mx="auto">
      <Heading size="6" mb="4">
        🧪 Test PDF Extraction
      </Heading>
      
      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <Flex direction="column" gap="3">
          <Text size="2" color="gray">
            Selecciona un PDF de laboratorio chileno para probar la extracción de texto
          </Text>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ padding: '8px' }}
          />
          
          {file && (
            <Text size="2" color="green">
              ✅ Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          )}
          
          <Button 
            onClick={handleExtract} 
            disabled={!file || loading}
            size="2"
          >
            {loading ? 'Procesando...' : 'Extraer Texto'}
          </Button>
        </Flex>
      </Card>

      {error && (
        <Card style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'var(--red-2)' }}>
          <Text color="red" weight="medium">
            ❌ Error: {error}
          </Text>
        </Card>
      )}

      {result && (
        <Card style={{ padding: '16px' }}>
          <Heading size="4" mb="3">
            📊 Resultados de Extracción
          </Heading>
          
          <Flex direction="column" gap="3">
            <Text size="2">
              <strong>Páginas:</strong> {result.pageCount}
            </Text>
            <Text size="2">
              <strong>Caracteres totales:</strong> {result.fullText.length}
            </Text>
            <Text size="2">
              <strong>Primera página:</strong> {result.firstPageText.length} caracteres
            </Text>
            <Text size="2">
              <strong>Procesado:</strong> {new Date(result.extractedAt).toLocaleString()}
            </Text>
          </Flex>

          <Box mt="4">
            <Heading size="3" mb="2">
              📄 Primera Página (primeros 1000 caracteres)
            </Heading>
            <Card style={{ padding: '12px', backgroundColor: 'var(--gray-2)' }}>
              <Text size="1" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {result.firstPageText.substring(0, 1000)}
                {result.firstPageText.length > 1000 && '...'}
              </Text>
            </Card>
          </Box>
        </Card>
      )}
    </Box>
  )
}