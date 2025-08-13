'use client'

import { Container, Heading, Card, Flex, Text } from '@radix-ui/themes'
import { PDFViewerButton } from '@/components/healthcare/pdf-viewer-button'

export default function TestPDFViewerPage() {
  // Mock data for testing
  const mockPatient = {
    name: 'Juan Pérez González',
    rut: '12.345.678-9',
    labReportId: 'test-lab-report-123',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // Test PDF
  }

  return (
    <Container size="3" style={{ padding: 'var(--space-6)' }}>
      <Flex direction="column" gap="6">
        <Heading size="8" style={{ color: 'var(--mint-11)' }}>
          Prueba del Visor de PDF - Tarea 11
        </Heading>

        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">Funcionalidad del Visor de PDF</Heading>
            
            <Text>
              Esta página prueba la funcionalidad implementada en la Tarea 11: 
              "Ver PDF Original" con registro de auditoría.
            </Text>

            <Flex direction="column" gap="3">
              <Text weight="bold">Datos del Paciente de Prueba:</Text>
              <Text>• Nombre: {mockPatient.name}</Text>
              <Text>• RUT: {mockPatient.rut}</Text>
              <Text>• ID Reporte: {mockPatient.labReportId}</Text>
              <Text>• URL PDF: {mockPatient.pdfUrl}</Text>
            </Flex>

            <Flex direction="column" gap="3">
              <Text weight="bold">Funcionalidades Implementadas:</Text>
              <Text>✅ Botón "Ver PDF Original" con icono</Text>
              <Text>✅ Apertura del PDF en nueva pestaña del navegador</Text>
              <Text>✅ Registro de auditoría del acceso al PDF</Text>
              <Text>✅ Manejo de errores y estados de carga</Text>
              <Text>✅ Integración con el sistema de autenticación</Text>
            </Flex>

            <Flex gap="4" align="center">
              <Text weight="bold">Probar Funcionalidad:</Text>
              <PDFViewerButton
                pdfUrl={mockPatient.pdfUrl}
                patientRut={mockPatient.rut}
                labReportId={mockPatient.labReportId}
                patientName={mockPatient.name}
              />
            </Flex>

            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Text weight="bold" size="3">Instrucciones de Prueba:</Text>
                <Text size="2">1. Haz clic en el botón "Ver PDF Original"</Text>
                <Text size="2">2. El sistema registrará el acceso en los logs de auditoría</Text>
                <Text size="2">3. Se abrirá una nueva pestaña con el PDF</Text>
                <Text size="2">4. Puedes usar las funciones estándar del navegador (imprimir, guardar, zoom)</Text>
                <Text size="2">5. Verifica en la consola del navegador que no hay errores</Text>
              </Flex>
            </Card>

            <Card variant="surface" style={{ backgroundColor: 'var(--mint-2)' }}>
              <Flex direction="column" gap="2">
                <Text weight="bold" size="3" style={{ color: 'var(--mint-11)' }}>
                  Requisitos Cumplidos (Requirement 12):
                </Text>
                <Text size="2">✅ Opción "View Original PDF" disponible</Text>
                <Text size="2">✅ PDF se abre en nueva pestaña del navegador</Text>
                <Text size="2">✅ Funciones estándar del navegador disponibles</Text>
                <Text size="2">✅ Acceso al PDF registrado en auditoría</Text>
                <Text size="2">✅ Formato y calidad original mantenidos</Text>
                <Text size="2">✅ Manejo de errores cuando PDF no disponible</Text>
              </Flex>
            </Card>
          </Flex>
        </Card>
      </Flex>
    </Container>
  )
}