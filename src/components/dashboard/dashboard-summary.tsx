'use client'

import { useState, useEffect } from 'react'
import { Card, Heading, Text, Flex, Box, Badge, Grid } from '@radix-ui/themes'
import { dbOperations } from '@/lib/database'

interface DashboardSummaryProps {
  userId: string
  userEmail: string
}

interface SummaryStats {
  totalPatients: number
  pendingReviews: number
  highPriorityPatients: number
  processedToday: number
  averageConfidence: number
  criticalValuesDetected: number
}

export function DashboardSummary({ userId, userEmail }: DashboardSummaryProps) {
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardStats()
  }, [userId, userEmail])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get dashboard data using our database operations
      const { patients, summary } = await dbOperations.getDashboardData(userId, userEmail)
      setStats(summary)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError('Error cargando estadísticas del dashboard.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Grid columns="4" gap="4" width="auto">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} style={{ minHeight: '120px' }}>
            <Flex direction="column" gap="2" align="center" justify="center" style={{ height: '100%' }}>
              <Text size="2" color="gray">Cargando...</Text>
            </Flex>
          </Card>
        ))}
      </Grid>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <Flex direction="column" align="center" gap="3" style={{ padding: 'var(--space-4)' }}>
          <Text color="red" weight="bold">Error</Text>
          <Text size="2">{error || 'No se pudieron cargar las estadísticas'}</Text>
        </Flex>
      </Card>
    )
  }

  const summaryCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPatients,
      subtitle: 'en el sistema',
      color: 'blue' as const,
      icon: 'group'
    },
    {
      title: 'Revisiones Pendientes',
      value: stats.pendingReviews,
      subtitle: 'requieren atención',
      color: 'orange' as const,
      icon: 'pending_actions'
    },
    {
      title: 'Alta Prioridad',
      value: stats.highPriorityPatients,
      subtitle: 'urgente',
      color: 'red' as const,
      icon: 'priority_high'
    },
    {
      title: 'Procesados Hoy',
      value: stats.processedToday,
      subtitle: 'contactados',
      color: 'green' as const,
      icon: 'check_circle'
    }
  ]

  return (
    <Box>
      <Heading size="5" style={{ marginBottom: 'var(--space-4)' }}>
        Resumen del Sistema
      </Heading>
      
      <Grid columns="4" gap="4" width="auto" style={{ marginBottom: 'var(--space-6)' }}>
        {summaryCards.map((card, index) => (
          <Card key={index} style={{ minHeight: '120px' }}>
            <Flex direction="column" gap="2" style={{ height: '100%' }}>
              <Flex align="center" gap="2">
                <span 
                  className="material-symbols-outlined" 
                  style={{ 
                    fontSize: '20px',
                    color: `var(--${card.color}-11)`
                  }}
                >
                  {card.icon}
                </span>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-11)' }}>
                  {card.title}
                </Text>
              </Flex>
              
              <Text size="7" weight="bold" style={{ color: `var(--${card.color}-11)` }}>
                {card.value}
              </Text>
              
              <Text size="1" style={{ color: 'var(--gray-10)' }}>
                {card.subtitle}
              </Text>
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Additional metrics */}
      <Grid columns="2" gap="4" width="auto">
        <Card>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <span 
                className="material-symbols-outlined" 
                style={{ fontSize: '18px', color: 'var(--mint-11)' }}
              >
                analytics
              </span>
              <Text size="3" weight="medium">Métricas de Calidad</Text>
            </Flex>
            
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2">Confianza Promedio:</Text>
                <Badge color="mint" variant="soft">
                  {stats.averageConfidence.toFixed(1)}%
                </Badge>
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2">Valores Críticos:</Text>
                <Badge color={stats.criticalValuesDetected > 0 ? 'red' : 'green'} variant="soft">
                  {stats.criticalValuesDetected}
                </Badge>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <span 
                className="material-symbols-outlined" 
                style={{ fontSize: '18px', color: 'var(--mint-11)' }}
              >
                schedule
              </span>
              <Text size="3" weight="medium">Estado del Flujo</Text>
            </Flex>
            
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2">Pendientes:</Text>
                <Text size="2" weight="bold" style={{ color: 'var(--orange-11)' }}>
                  {stats.pendingReviews}
                </Text>
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2">Procesados Hoy:</Text>
                <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>
                  {stats.processedToday}
                </Text>
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2">Eficiencia:</Text>
                <Badge color="mint" variant="soft">
                  {stats.totalPatients > 0 
                    ? ((stats.processedToday / stats.totalPatients) * 100).toFixed(1)
                    : 0}%
                </Badge>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Grid>
    </Box>
  )
}