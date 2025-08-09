import { Card, Heading, Text, Button, Badge, Flex, Box, Container } from '@radix-ui/themes'

export default function HomePage() {
  return (
    <Box p="6" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Container size="4">
        <Flex direction="column" gap="6" align="center">
          {/* Header */}
          <Box style={{ textAlign: 'center' }}>
            <Heading size="8" style={{ color: 'var(--gray-12)', marginBottom: 'var(--space-2)' }}>
              LabSense
            </Heading>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Sistema Inteligente de Priorización de Resultados de Laboratorio
            </Text>
          </Box>

          {/* Demo Cards */}
          <Flex gap="4" wrap="wrap" justify="center">
            {/* High Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">Isabel Bolados Vega</Text>
                  <Badge color="red" variant="solid">ALTA PRIORIDAD</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: 7.236.426-0 • Edad: 73a 3m 17d
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
                <Button color="mint" variant="solid">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>

            {/* Medium Priority Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">Paciente Ejemplo</Text>
                  <Badge color="orange" variant="solid">PRIORIDAD MEDIA</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: 12.345.678-9 • Edad: 45a 2m 10d
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
                <Button color="mint" variant="outline">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>

            {/* Normal Patient */}
            <Card style={{ width: '320px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text weight="bold">Paciente Normal</Text>
                  <Badge color="green" variant="solid">NORMAL</Badge>
                </Flex>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  RUT: 98.765.432-1 • Edad: 32a 8m 5d
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
                <Button color="mint" variant="soft">
                  Ver Detalles
                </Button>
              </Flex>
            </Card>
          </Flex>

          {/* Action Buttons */}
          <Flex gap="3">
            <Button size="3" color="mint" variant="solid">
              Cargar Nuevo PDF
            </Button>
            <Button size="3" color="mint" variant="outline">
              Ver Dashboard
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}