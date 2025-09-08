'use client'

import { Card, Text, Button, Flex, Box, Grid } from '@radix-ui/themes'

interface DashboardSummaryCardsProps {
  userId: string
  userEmail: string
  patientCount?: number
}

export function DashboardSummaryCards({ userId, userEmail, patientCount = 0 }: DashboardSummaryCardsProps) {
  return (
    <Grid columns="1fr 1fr 2fr" gap="2" width="100%">
      {/* Lista de Espera Card */}
      <Card style={{
        borderRadius: '1rem'
      }}>
        <Box style={{ padding: '16px' }}>
          <Box style={{ padding: '8px' }}>
            <Text 
              size="2" 
              weight="medium" 
              style={{ 
                color: 'var(--gray-12)',
                fontFamily: 'Lexend Deca, sans-serif',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              Lista de Espera
            </Text>
            <Text 
              size="2" 
              style={{ 
                color: 'var(--labsense-blue)',
                fontFamily: 'Lexend Deca, sans-serif',
                fontWeight: '300'
              }}
            >
              {patientCount} Pacientes
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Download Labs Card */}
      <Card style={{
        borderRadius: '1rem'
      }}>
        <Box style={{ padding: '16px' }}>
          <Box style={{ padding: '8px' }}>
            <Text 
              size="2" 
              weight="medium" 
              style={{ 
                color: 'var(--gray-12)',
                fontFamily: 'Lexend Deca, sans-serif',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              Download Labs for testing
            </Text>
            <Button 
              variant="outline" 
              style={{
                border: '1px solid var(--labsense-blue) !important',
                color: 'var(--labsense-blue)',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                height: '38px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Lexend Deca, sans-serif',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--labsense-blue-lighter)'
                e.currentTarget.style.borderColor = 'var(--labsense-blue-dark)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--labsense-blue)'
              }}
              asChild
            >
              <a href="/sample-labs.pdf" download>
                <Flex align="center" gap="1">
                  <img 
                    src="/assets/icons/lucide/cloud-download.svg" 
                    alt="Download" 
                    style={{ width: '20px', height: '20px' }}
                  />
                  Download PDFs set
                </Flex>
              </a>
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Procesar Resultados Card */}
      <Card style={{
        borderRadius: '1rem'
      }}>
        <Box style={{ padding: '16px' }}>
          <Flex gap="2" align="center">
            <Box style={{ padding: '8px', flex: 1 }}>
              <Text 
                size="2" 
                weight="medium" 
                style={{ 
                  color: 'var(--gray-12)',
                  fontFamily: 'Lexend Deca, sans-serif',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Procesar Resultados de Laboratorio
              </Text>
              <Text 
                size="2" 
                style={{ 
                  color: 'var(--gray-12)',
                  fontFamily: 'Lexend Deca, sans-serif',
                  fontWeight: '300',
                  lineHeight: '16px'
                }}
              >
                Sube resultados de laboratorio para análisis automático y priorización de pacientes.
              </Text>
            </Box>
            <Button 
              style={{
                backgroundColor: 'var(--labsense-purple)',
                color: 'var(--labsense-blue)',
                border: 'none',
                borderRadius: '8px',
                height: '38px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Lexend Deca, sans-serif',
                padding: '0 24px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--labsense-purple-lighter)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--labsense-purple)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--labsense-purple-lighter)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--labsense-purple)'
              }}
              asChild
            >
              <a href="/upload">
                <Flex align="center" gap="1">
                  <img 
                    src="/assets/icons/lucide/file-up.svg" 
                    alt="Upload" 
                    style={{ width: '20px', height: '20px' }}
                  />
                  Cargar PDF Resultados
                </Flex>
              </a>
            </Button>
          </Flex>
        </Box>
      </Card>
    </Grid>
  )
}