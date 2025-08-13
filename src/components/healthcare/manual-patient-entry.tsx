'use client'

import { useState } from 'react'
import { Card, Heading, Text, Button, Flex, Box, Badge } from '@radix-ui/themes'
import { validateChileanRUT, formatChileanRUT } from '@/lib/utils/chilean-rut'

interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  confidence: number
}

interface ManualPatientEntryProps {
  initialData?: PatientInfo | null
  onPatientConfirmed: (patient: PatientInfo) => void
  onCancel: () => void
}

export function ManualPatientEntry({ initialData, onPatientConfirmed, onCancel }: ManualPatientEntryProps) {
  const [rut, setRut] = useState(initialData?.rut || '')
  const [name, setName] = useState(initialData?.name || '')
  const [age, setAge] = useState(initialData?.age || '')
  const [gender, setGender] = useState(initialData?.gender || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate RUT
    if (!rut.trim()) {
      newErrors.rut = 'El RUT es obligatorio'
    } else if (!validateChileanRUT(rut)) {
      newErrors.rut = 'RUT inválido. Formato: 12.345.678-9'
    }

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    } else if (name.trim().split(/\s+/).length < 2) {
      newErrors.name = 'Ingresa nombre y apellido completos'
    } else if (name.length < 5 || name.length > 50) {
      newErrors.name = 'El nombre debe tener entre 5 y 50 caracteres'
    }

    // Validate age (optional but if provided, should be valid Chilean format or simple number)
    if (age.trim()) {
      // Check if it's Chilean format (e.g., "73a 3m 17d") or simple number
      const chileanAgePattern = /^\d{1,3}a\s*\d{1,2}m\s*\d{1,2}d$/i
      const simpleNumberPattern = /^\d{1,3}$/
      
      if (!chileanAgePattern.test(age.trim()) && !simpleNumberPattern.test(age.trim())) {
        newErrors.age = 'Formato inválido. Use: "73a 3m 17d" o "73"'
      } else if (simpleNumberPattern.test(age.trim())) {
        const ageNum = Number(age.trim())
        if (ageNum < 0 || ageNum > 120) {
          newErrors.age = 'Edad inválida (0-120 años)'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRutChange = (value: string) => {
    // Auto-format RUT as user types
    const cleanValue = value.replace(/[^0-9kK]/g, '')
    if (cleanValue.length <= 9) {
      setRut(cleanValue)
      // Clear RUT error when user starts typing
      if (errors.rut) {
        setErrors(prev => ({ ...prev, rut: '' }))
      }
    }
  }

  const handleRutBlur = () => {
    // Format RUT when user leaves the field
    if (rut && validateChileanRUT(rut)) {
      setRut(formatChileanRUT(rut))
    }
  }

  const handleNameChange = (value: string) => {
    // Convert to title case and limit to letters, spaces, and accents
    const cleanValue = value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '')
    setName(cleanValue)
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const patient: PatientInfo = {
      rut: formatChileanRUT(rut),
      name: name.trim(),
      age: age.trim() || null,
      gender: gender || null,
      confidence: 100 // Manual entry gets 100% confidence
    }

    onPatientConfirmed(patient)
  }

  return (
    <Card style={{ width: '100%', maxWidth: '600px' }}>
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="5" mb="2">
            {initialData ? 'Corregir Información del Paciente' : 'Ingresar Información del Paciente'}
          </Heading>
          <Text size="3" style={{ color: 'var(--gray-11)' }}>
            {initialData 
              ? 'Revisa y corrige la información extraída del PDF'
              : 'Ingresa manualmente los datos del paciente'
            }
          </Text>
        </Box>

        {initialData && initialData.confidence < 70 && (
          <Box style={{ backgroundColor: 'var(--orange-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-2)' }}>
            <Flex align="center" gap="2">
              <span className="material-symbols-outlined" style={{ color: 'var(--orange-9)', fontSize: '20px' }}>
                warning
              </span>
              <Text size="3" style={{ color: 'var(--orange-11)' }}>
                <strong>Confianza baja ({initialData.confidence}%):</strong> Verifica que la información sea correcta.
              </Text>
            </Flex>
          </Box>
        )}

        {/* RUT Field */}
        <Box>
          <Text size="2" weight="medium" mb="1" style={{ color: 'var(--gray-12)' }}>
            RUT del Paciente *
          </Text>
          <input
            type="text"
            placeholder="12.345.678-9"
            value={rut}
            onChange={(e) => handleRutChange(e.target.value)}
            onBlur={handleRutBlur}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              border: `1px solid ${errors.rut ? 'var(--red-7)' : 'var(--gray-7)'}`,
              borderRadius: 'var(--radius-2)',
              fontSize: 'var(--font-size-3)',
              backgroundColor: errors.rut ? 'var(--red-2)' : 'var(--color-background)'
            }}
          />
          {errors.rut && (
            <Text size="2" style={{ color: 'var(--red-11)', marginTop: 'var(--space-1)' }}>
              {errors.rut}
            </Text>
          )}
        </Box>

        {/* Name Field */}
        <Box>
          <Text size="2" weight="medium" mb="1" style={{ color: 'var(--gray-12)' }}>
            Nombre Completo *
          </Text>
          <input
            type="text"
            placeholder="María Elena González Pérez"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              border: `1px solid ${errors.name ? 'var(--red-7)' : 'var(--gray-7)'}`,
              borderRadius: 'var(--radius-2)',
              fontSize: 'var(--font-size-3)',
              backgroundColor: errors.name ? 'var(--red-2)' : 'var(--color-background)'
            }}
          />
          {errors.name && (
            <Text size="2" style={{ color: 'var(--red-11)', marginTop: 'var(--space-1)' }}>
              {errors.name}
            </Text>
          )}
        </Box>

        {/* Age and Gender Row */}
        <Flex gap="3">
          {/* Age Field */}
          <Box style={{ flex: 1 }}>
            <Text size="2" weight="medium" mb="1" style={{ color: 'var(--gray-12)' }}>
              Edad (formato chileno)
            </Text>
            <input
              type="text"
              placeholder="73a 3m 17d o 73"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                border: `1px solid ${errors.age ? 'var(--red-7)' : 'var(--gray-7)'}`,
                borderRadius: 'var(--radius-2)',
                fontSize: 'var(--font-size-3)',
                backgroundColor: errors.age ? 'var(--red-2)' : 'var(--color-background)'
              }}
            />
            {errors.age && (
              <Text size="2" style={{ color: 'var(--red-11)', marginTop: 'var(--space-1)' }}>
                {errors.age}
              </Text>
            )}
          </Box>

          {/* Gender Field */}
          <Box style={{ flex: 1 }}>
            <Text size="2" weight="medium" mb="1" style={{ color: 'var(--gray-12)' }}>
              Género
            </Text>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                border: '1px solid var(--gray-7)',
                borderRadius: 'var(--radius-2)',
                fontSize: 'var(--font-size-3)',
                backgroundColor: 'var(--color-background)'
              }}
            >
              <option value="">Seleccionar...</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </Box>
        </Flex>

        {/* Action Buttons */}
        <Flex gap="3" justify="end">
          <Button
            size="3"
            color="gray"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            size="3"
            color="mint"
            variant="solid"
            onClick={handleSubmit}
          >
            <Flex align="center" gap="2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                check
              </span>
              Confirmar Información
            </Flex>
          </Button>
        </Flex>

        {/* Help Text */}
        <Box style={{ backgroundColor: 'var(--blue-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-2)' }}>
          <Text size="2" style={{ color: 'var(--blue-11)' }}>
            <strong>Información:</strong> Los campos marcados con * son obligatorios. 
            El RUT debe ser válido según el algoritmo chileno. La información ingresada 
            manualmente tendrá 100% de confianza.
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}