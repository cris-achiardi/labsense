'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Heading, 
  Text, 
  Button, 
  TextField, 
  Select, 
  Flex, 
  Box, 
  Badge,
  IconButton
} from '@radix-ui/themes'
import { PatientFilters } from '@/types/database'

interface PatientSearchFiltersProps {
  onFiltersChange: (filters: PatientFilters) => void
  onClearFilters: () => void
  loading?: boolean
  resultCount?: number
}

export function PatientSearchFilters({ 
  onFiltersChange, 
  onClearFilters, 
  loading = false,
  resultCount 
}: PatientSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityLevel, setPriorityLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW' | ''>('')
  const [contactStatus, setContactStatus] = useState<'pending' | 'contacted' | 'processed' | ''>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [markerTypes, setMarkerTypes] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Available health marker types for filtering
  const availableMarkerTypes = [
    'GLICEMIA EN AYUNO',
    'GLUCOSA',
    'HEMOGLOBINA GLICADA A1C',
    'COLESTEROL TOTAL',
    'TRIGLICERIDOS',
    'ALT',
    'AST',
    'TSH'
  ]

  // Apply filters when any filter value changes
  useEffect(() => {
    const filters: PatientFilters = {}

    if (searchQuery.trim()) {
      filters.searchQuery = searchQuery.trim()
    }

    if (priorityLevel) {
      filters.priorityLevel = priorityLevel
    }

    if (contactStatus) {
      filters.contactStatus = contactStatus
    }

    if (dateRange.start && dateRange.end) {
      filters.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      }
    }

    if (markerTypes.length > 0) {
      filters.markerTypes = markerTypes
    }

    onFiltersChange(filters)
  }, [searchQuery, priorityLevel, contactStatus, dateRange, markerTypes, onFiltersChange])

  const handleClearFilters = () => {
    setSearchQuery('')
    setPriorityLevel('')
    setContactStatus('')
    setDateRange({ start: '', end: '' })
    setMarkerTypes([])
    setShowAdvanced(false)
    onClearFilters()
  }

  const toggleMarkerType = (markerType: string) => {
    setMarkerTypes(prev => 
      prev.includes(markerType)
        ? prev.filter(type => type !== markerType)
        : [...prev, markerType]
    )
  }

  const hasActiveFilters = searchQuery || priorityLevel || contactStatus || 
                          dateRange.start || dateRange.end || markerTypes.length > 0

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="4">Buscar y Filtrar Pacientes</Heading>
            {resultCount !== undefined && (
              <Text size="2" style={{ color: 'var(--gray-11)' }}>
                {resultCount} paciente{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
              </Text>
            )}
          </Box>
          
          <Flex gap="2" align="center">
            {hasActiveFilters && (
              <Badge color="mint" variant="soft">
                {[searchQuery, priorityLevel, contactStatus, dateRange.start, markerTypes.length > 0]
                  .filter(Boolean).length} filtro{[searchQuery, priorityLevel, contactStatus, dateRange.start, markerTypes.length > 0]
                  .filter(Boolean).length !== 1 ? 's' : ''} activo{[searchQuery, priorityLevel, contactStatus, dateRange.start, markerTypes.length > 0]
                  .filter(Boolean).length !== 1 ? 's' : ''}
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="2"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {showAdvanced ? 'expand_less' : 'expand_more'}
                </span>
                {showAdvanced ? 'Menos filtros' : 'Más filtros'}
              </Flex>
            </Button>
          </Flex>
        </Flex>

        {/* Basic Search */}
        <Flex gap="3" align="end" wrap="wrap">
          <Box style={{ flex: 1, minWidth: '200px' }}>
            <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
              Buscar por nombre o RUT
            </Text>
            <TextField.Root
              placeholder="Ej: Juan Pérez o 12.345.678-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            >
              <TextField.Slot>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  search
                </span>
              </TextField.Slot>
              {searchQuery && (
                <TextField.Slot>
                  <IconButton 
                    size="1" 
                    variant="ghost"
                    onClick={() => setSearchQuery('')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      close
                    </span>
                  </IconButton>
                </TextField.Slot>
              )}
            </TextField.Root>
          </Box>

          <Box style={{ minWidth: '140px' }}>
            <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
              Prioridad
            </Text>
            <Select.Root 
              value={priorityLevel} 
              onValueChange={(value) => setPriorityLevel(value as any)}
              disabled={loading}
            >
              <Select.Trigger placeholder="Todas" />
              <Select.Content>
                <Select.Item value="">Todas las prioridades</Select.Item>
                <Select.Item value="HIGH">
                  <Flex align="center" gap="2">
                    <Badge color="red" variant="solid" size="1">ALTA</Badge>
                    Alta Prioridad
                  </Flex>
                </Select.Item>
                <Select.Item value="MEDIUM">
                  <Flex align="center" gap="2">
                    <Badge color="orange" variant="solid" size="1">MEDIA</Badge>
                    Prioridad Media
                  </Flex>
                </Select.Item>
                <Select.Item value="LOW">
                  <Flex align="center" gap="2">
                    <Badge color="green" variant="solid" size="1">BAJA</Badge>
                    Prioridad Baja
                  </Flex>
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box style={{ minWidth: '140px' }}>
            <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
              Estado
            </Text>
            <Select.Root 
              value={contactStatus} 
              onValueChange={(value) => setContactStatus(value as any)}
              disabled={loading}
            >
              <Select.Trigger placeholder="Todos" />
              <Select.Content>
                <Select.Item value="">Todos los estados</Select.Item>
                <Select.Item value="pending">
                  <Flex align="center" gap="2">
                    <Badge color="yellow" variant="soft" size="1">PENDIENTE</Badge>
                    Pendiente
                  </Flex>
                </Select.Item>
                <Select.Item value="contacted">
                  <Flex align="center" gap="2">
                    <Badge color="blue" variant="soft" size="1">CONTACTADO</Badge>
                    Contactado
                  </Flex>
                </Select.Item>
                <Select.Item value="processed">
                  <Flex align="center" gap="2">
                    <Badge color="green" variant="soft" size="1">PROCESADO</Badge>
                    Procesado
                  </Flex>
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              color="gray"
              onClick={handleClearFilters}
              disabled={loading}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  clear_all
                </span>
                Limpiar
              </Flex>
            </Button>
          )}
        </Flex>

        {/* Advanced Filters */}
        {showAdvanced && (
          <Box style={{ 
            borderTop: '1px solid var(--gray-6)', 
            paddingTop: 'var(--space-4)',
            marginTop: 'var(--space-2)'
          }}>
            <Flex direction="column" gap="4">
              {/* Date Range */}
              <Box>
                <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
                  Rango de fechas de examen
                </Text>
                <Flex gap="3" align="center">
                  <Box style={{ flex: 1 }}>
                    <TextField.Root
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      disabled={loading}
                    />
                  </Box>
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>hasta</Text>
                  <Box style={{ flex: 1 }}>
                    <TextField.Root
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      disabled={loading}
                    />
                  </Box>
                </Flex>
              </Box>

              {/* Health Marker Types */}
              <Box>
                <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
                  Marcadores de salud anormales
                </Text>
                <Flex gap="2" wrap="wrap">
                  {availableMarkerTypes.map((markerType) => (
                    <Button
                      key={markerType}
                      variant={markerTypes.includes(markerType) ? 'solid' : 'outline'}
                      color={markerTypes.includes(markerType) ? 'mint' : 'gray'}
                      size="1"
                      onClick={() => toggleMarkerType(markerType)}
                      disabled={loading}
                    >
                      {markerType}
                    </Button>
                  ))}
                </Flex>
                {markerTypes.length > 0 && (
                  <Text size="1" style={{ color: 'var(--gray-11)', marginTop: 'var(--space-2)' }}>
                    Mostrando pacientes con valores anormales en: {markerTypes.join(', ')}
                  </Text>
                )}
              </Box>
            </Flex>
          </Box>
        )}

        {/* Quick Filter Buttons */}
        <Box>
          <Text size="2" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>
            Filtros rápidos
          </Text>
          <Flex gap="2" wrap="wrap">
            <Button
              variant="outline"
              size="2"
              onClick={() => {
                setPriorityLevel('HIGH')
                setContactStatus('pending')
              }}
              disabled={loading}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  priority_high
                </span>
                Urgentes Pendientes
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="2"
              onClick={() => {
                setContactStatus('pending')
                setDateRange({
                  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                })
              }}
              disabled={loading}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  schedule
                </span>
                Última Semana
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="2"
              onClick={() => {
                setMarkerTypes(['GLICEMIA EN AYUNO', 'HEMOGLOBINA GLICADA A1C'])
              }}
              disabled={loading}
            >
              <Flex align="center" gap="1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  medical_services
                </span>
                Diabetes
              </Flex>
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Card>
  )
}