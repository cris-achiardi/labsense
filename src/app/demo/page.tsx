import { Card, Heading, Text, Button, Badge, Flex, Box, Container } from '@radix-ui/themes'

export default function DemoPage() {
  return (
    <Box p="6" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Container size="4">
        <Flex direction="column" gap="6" align="center">
          {/* Header */}
          <Box style={{ textAlign: 'center' }}>
            <Heading size="8" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
              LabSense - Demo
            </Heading>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Sistema Inteligente de Priorización de Resultados de Laboratorio
            </Text>
            <Text size="3" style={{ color: 'var(--gray-10)', marginTop: 'var(--space-2)' }}>
              Demostración con datos anonimizados
            </Text>
          </Box>

          {/* Demo Cards */}
          <Flex gap="4" wrap="wrap" justify="center">
            {/* High Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** ******* ****</Text>
                  <Badge color="red" variant="solid">ALTA PRIORIDAD</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 73a 3m 17d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--red-11)' }}>
                    Valores Anormales:
                  </Text>
                  <Text size="2" as="div">
                    • Glucosa: 269 mg/dL (normal: 74-106)
                  </Text>
                  <Text size="2" as="div">
                    • HbA1c: 11.8% (normal: 4-6)
                  </Text>
                  <Text size="2" as="div">
                    • TSH: 11.040 μUI/mL (normal: 0.55-4.78)
                  </Text>
                </Box>
                <Button color="mint" variant="solid" disabled>
                  Ver Detalles (Demo)
                </Button>
              </Flex>
            </Card>

            {/* Medium Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** *******</Text>
                  <Badge color="orange" variant="solid">PRIORIDAD MEDIA</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 45a 2m 10d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--orange-11)' }}>
                    Valores Anormales:
                  </Text>
                  <Text size="2" as="div">
                    • Colesterol: 220 mg/dL (normal: &lt;200)
                  </Text>
                  <Text size="2" as="div">
                    • Triglicéridos: 180 mg/dL (normal: &lt;150)
                  </Text>
                </Box>
                <Button color="mint" variant="outline" disabled>
                  Ver Detalles (Demo)
                </Button>
              </Flex>
            </Card>

            {/* Normal Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">****** ******</Text>
                  <Badge color="green" variant="solid">NORMAL</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: **.***.**-* • Edad: 32a 8m 5d
                </Text>
                <Box>
                  <Text size="2" weight="medium" style={{ color: 'var(--green-11)' }}>
                    Todos los valores normales
                  </Text>
                  <Text size="2" as="div">
                    • Glucosa: 95 mg/dL ✓
                  </Text>
                  <Text size="2" as="div">
                    • Colesterol: 180 mg/dL ✓
                  </Text>
                </Box>
                <Button color="mint" variant="soft" disabled>
                  Ver Detalles (Demo)
                </Button>
              </Flex>
            </Card>
          </Flex>

          {/* Demo Info */}
          <Card style={{ maxWidth: '600px', textAlign: 'center' }}>
            <Flex direction="column" gap="3">
              <Heading size="5">Acerca de LabSense</Heading>
              <Text size="3">
                LabSense automatiza la revisión de resultados de laboratorio en centros de atención primaria de Chile, 
                utilizando inteligencia artificial para identificar instantáneamente valores críticos y priorizar 
                pacientes que necesitan atención médica inmediata.
              </Text>
              <Text size="2" style={{ color: 'var(--gray-10)' }}>
                Los datos mostrados son ejemplos anonimizados para fines de demostración.
              </Text>
            </Flex>
          </Card>

          {/* Action Buttons */}
          <Flex gap="3">
            <Button size="3" color="mint" variant="solid" asChild>
              <a href="/auth/signin">Acceder al Sistema</a>
            </Button>
            <Button size="3" color="mint" variant="outline" asChild>
              <a href="/test-db">Probar Conexión BD</a>
            </Button>
          </Flex>

          {/* Footer */}
          <Text size="2" style={{ color: 'var(--gray-10)', textAlign: 'center' }}>
            LabSense - Desarrollado para Centros de Atención Primaria de Chile
            <br />
            Transformando horas de revisión manual en minutos de atención enfocada
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}