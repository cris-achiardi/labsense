'use client'

import { useState, useEffect } from 'react'
import { TextField, Select, Flex, Box, Text } from '@radix-ui/themes'
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
  const [priorityLevel, setPriorityLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'all'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Apply filters when any filter value changes
  useEffect(() => {
    const filters: PatientFilters = {}

    if (searchQuery.trim()) {
      filters.searchQuery = searchQuery.trim()
    }

    if (priorityLevel !== 'all') {
      filters.priorityLevel = priorityLevel
    }

    if (dateRange.start && dateRange.end) {
      filters.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      }
    }

    onFiltersChange(filters)
  }, [searchQuery, priorityLevel, dateRange, onFiltersChange])

  return (
    <Flex gap="4" align="center" style={{ width: '100%' }}>
      {/* Search Field */}
      <Box style={{ flex: 1 }}>
        <Text 
          size="2" 
          weight="medium" 
          style={{ 
            color: '#363d3a',
            fontFamily: 'Lexend Deca, sans-serif',
            display: 'block',
            marginBottom: '8px'
          }}
        >
          Búsqueda por Paciente o Folio
        </Text>
        <TextField.Root
          placeholder="Ingresa nombre, Rut o folio del exámen"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          style={{
            backgroundColor: 'white',
            border: '1px solid #dcdbdd',
            borderRadius: '6px',
            padding: '6px',
            fontFamily: 'Lexend Deca, sans-serif',
            fontWeight: '300',
            fontSize: '14px',
            width: '100%'
          }}
        />
      </Box>

      {/* Priority Select */}
      <Box style={{ minWidth: '191px' }}>
        <Text 
          size="2" 
          weight="medium" 
          style={{ 
            color: '#363d3a',
            fontFamily: 'Lexend Deca, sans-serif',
            display: 'block',
            marginBottom: '8px'
          }}
        >
          Prioridad
        </Text>
        <Select.Root
          value={priorityLevel}
          onValueChange={(value) => setPriorityLevel(value as any)}
          disabled={loading}
        >
          <Select.Trigger 
            placeholder="Seleccionar prioridad"
            style={{
              backgroundColor: 'white',
              border: '1px solid #dcdbdd',
              borderRadius: '6px',
              padding: '6px',
              fontFamily: 'Lexend Deca, sans-serif',
              fontWeight: '300',
              fontSize: '14px',
              width: '191px',
              color: 'rgba(25,33,30,0.5)'
            }}
          />
          <Select.Content>
            <Select.Item value="all">Todas las prioridades</Select.Item>
            <Select.Item value="HIGH">Alta</Select.Item>
            <Select.Item value="MEDIUM">Media</Select.Item>
            <Select.Item value="LOW">Baja</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>

      {/* Date Range */}
      <Box>
        <Text 
          size="2" 
          weight="medium" 
          style={{ 
            color: '#363d3a',
            fontFamily: 'Lexend Deca, sans-serif',
            display: 'block',
            marginBottom: '8px'
          }}
        >
          Exámenes por Rango de Fecha
        </Text>
        <Flex gap="2" align="center">
          <Flex gap="2" align="center">
            <Text 
              size="2" 
              style={{ 
                color: '#363d3a',
                fontFamily: 'Lexend Deca, sans-serif',
                fontWeight: '300',
                fontSize: '14px'
              }}
            >
              desde
            </Text>
            <Box style={{ position: 'relative' }}>
              <TextField.Root
                type="date"
                placeholder="Fecha de inicio"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                disabled={loading}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #dcdbdd',
                  borderRadius: '6px',
                  padding: '6px',
                  fontFamily: 'Lexend Deca, sans-serif',
                  fontWeight: '300',
                  fontSize: '14px',
                  width: '191px',
                  color: 'rgba(25,33,30,0.5)'
                }}
              />
              <img 
                src="/assets/icons/lucide/calendar.svg" 
                alt="Calendar" 
                style={{ 
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  pointerEvents: 'none'
                }}
              />
            </Box>
          </Flex>
          
          <Flex gap="2" align="center">
            <Text 
              size="2" 
              style={{ 
                color: '#363d3a',
                fontFamily: 'Lexend Deca, sans-serif',
                fontWeight: '300',
                fontSize: '14px'
              }}
            >
              a
            </Text>
            <Box style={{ position: 'relative' }}>
              <TextField.Root
                type="date"
                placeholder="Fecha de termino"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                disabled={loading}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #dcdbdd',
                  borderRadius: '6px',
                  padding: '6px',
                  fontFamily: 'Lexend Deca, sans-serif',
                  fontWeight: '300',
                  fontSize: '14px',
                  width: '191px',
                  color: 'rgba(25,33,30,0.5)'
                }}
              />
              <img 
                src="/assets/icons/lucide/calendar.svg" 
                alt="Calendar" 
                style={{ 
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  pointerEvents: 'none'
                }}
              />
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  )
}