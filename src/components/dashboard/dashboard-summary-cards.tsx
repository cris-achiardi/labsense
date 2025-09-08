'use client'

import { useState, useEffect } from 'react'
import { Card, Text, Button, Flex, Box } from '@radix-ui/themes'
import { dbOperations } from '@/lib/database'

interface DashboardSummaryCardsProps {
  userId: string
  userEmail: string
}

interface SummaryStats {
  totalPatients: number
  pendingReviews: number
  highPriorityPatients: number
  processedToday: number
}

export function DashboardSummaryCards({ userId, userEmail }: DashboardSummaryCardsProps) {
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [userId, userEmail])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      const { patients, summary } = await dbOperations.getDashboardData(userId, userEmail)
      setStats(summary)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <Flex gap="2" style={{ width: '100%' }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} style={{ flex: 1, minHeight: '120px', backgroundColor: 'white' }}>
            <Box style={{ padding: '16px' }}>
              <Text size="2" color="gray">Cargando...</Text>
            </Box>
          </Card>
        ))}
      </Flex>
    )
  }

  return (
    <Flex gap="2" style={{ width: '100%' }}>
      {/* Lista de Espera Card */}
      <Card style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: '9px',
        border: 'none',
        boxShadow: 'var(--shadow-2)'
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
                color: 'var(--blue-11)',
                fontFamily: 'Lexend Deca, sans-serif',
                fontWeight: '300'
              }}
            >
              {stats.pendingReviews} Pacientes
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Download Labs Card */}
      <Card style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: '9px',
        border: 'none',
        boxShadow: 'var(--shadow-2)'
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
                border: '1px solid var(--blue-9)',
                color: 'var(--blue-11)',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                height: '38px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Lexend Deca, sans-serif'
              }}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  cloud_download
                </span>
                Download PDFs set
              </Flex>
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Procesar Resultados Card */}
      <Card style={{ 
        backgroundColor: 'white', 
        borderRadius: '9px',
        border: 'none',
        boxShadow: 'var(--shadow-2)',
        minWidth: '400px'
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
                backgroundColor: 'var(--purple-3)',
                color: 'var(--blue-11)',
                border: 'none',
                borderRadius: '8px',
                height: '38px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Lexend Deca, sans-serif',
                padding: '0 24px'
              }}
              asChild
            >
              <a href="/upload">
                <Flex align="center" gap="1">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    file_upload
                  </span>
                  Cargar PDF Resultados
                </Flex>
              </a>
            </Button>
          </Flex>
        </Box>
      </Card>
    </Flex>
  )
}