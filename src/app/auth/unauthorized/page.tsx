'use client'

import { Box, Container, Flex, Heading, Text, Button, Card } from '@radix-ui/themes'

export default function UnauthorizedPage() {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Container size="2">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Card style={{ textAlign: 'center', maxWidth: '500px' }}>
            <Flex direction="column" gap="4" p="6">
              <span className="material-symbols-outlined" style={{ 
                fontSize: '64px', 
                color: 'var(--red-9)',
                alignSelf: 'center'
              }}>
                block
              </span>
              
              <Heading size="6" style={{ color: 'var(--red-11)' }}>
                Acceso No Autorizado
              </Heading>
              
              <Text size="3" style={{ color: 'var(--gray-11)' }}>
                Su cuenta no tiene permisos para acceder a LabSense. 
                Solo usuarios pre-aprobados pueden ingresar al sistema.
              </Text>
              
              <Text size="2" style={{ color: 'var(--gray-10)' }}>
                Si necesita acceso, contacte al administrador del sistema 
                para que su cuenta sea agregada a la lista de usuarios autorizados.
              </Text>
              
              <Flex gap="3" justify="center" mt="2">
                <Button color="mint" variant="solid" asChild>
                  <a href="/demo">Ver Demo Público</a>
                </Button>
                <Button color="gray" variant="outline" asChild>
                  <a href="/auth/signin">Intentar Nuevamente</a>
                </Button>
              </Flex>
            </Flex>
          </Card>
          
          <Text size="2" style={{ color: 'var(--gray-10)', marginTop: 'var(--space-4)' }}>
            LabSense - Sistema de Priorización de Resultados de Laboratorio
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}