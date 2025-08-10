'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/ui/dashboard-layout'
import { Card, Heading, Text, Button, Flex, Box, Container, Badge, TextField, Select } from '@radix-ui/themes'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('healthcare_worker')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Mock data for now - in real implementation, fetch from Supabase
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      // Simulate loading users
      setTimeout(() => {
        setUsers([
          {
            id: '1',
            email: 'crmorales.achiardi@gmail.com',
            name: 'Cristian Morales Achiardi',
            role: 'admin',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            email: 'js.rodriguez.parco@gmail.com',
            name: 'Julissa Rodriguez Parco',
            role: 'admin',
            created_at: '2024-01-15T10:00:00Z'
          }
        ])
        setLoading(false)
      }, 1000)
    }
  }, [session])

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) return
    
    setAdding(true)
    try {
      // In real implementation, call Supabase API
      const newUser: UserProfile = {
        id: Date.now().toString(),
        email: newUserEmail,
        name: newUserName,
        role: newUserRole,
        created_at: new Date().toISOString()
      }
      
      setUsers([...users, newUser])
      setNewUserEmail('')
      setNewUserName('')
      setNewUserRole('healthcare_worker')
      
      // Show success message
      alert('Usuario agregado exitosamente')
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error al agregar usuario')
    } finally {
      setAdding(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <Container size="1">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Text>Cargando gestión de usuarios...</Text>
          </Flex>
        </Container>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <DashboardLayout>
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Box>
            <Flex align="center" gap="3" mb="2">
              <Heading size="7" style={{ color: 'var(--gray-12)' }}>
                Gestión de Usuarios
              </Heading>
              <Badge color="mint" variant="solid">Admin</Badge>
            </Flex>
            <Text size="4" style={{ color: 'var(--gray-11)' }}>
              Administrar usuarios autorizados del sistema LabSense
            </Text>
          </Box>

          {/* Add New User */}
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">Agregar Nuevo Usuario</Heading>
              <Flex gap="3" wrap="wrap">
                <Box style={{ minWidth: '200px' }}>
                  <Text size="2" weight="medium" mb="1">Email</Text>
                  <TextField.Input
                    placeholder="usuario@ejemplo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </Box>
                <Box style={{ minWidth: '200px' }}>
                  <Text size="2" weight="medium" mb="1">Nombre Completo</Text>
                  <TextField.Input
                    placeholder="Nombre Apellido"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </Box>
                <Box style={{ minWidth: '150px' }}>
                  <Text size="2" weight="medium" mb="1">Rol</Text>
                  <Select.Root value={newUserRole} onValueChange={setNewUserRole}>
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="healthcare_worker">Healthcare Worker</Select.Item>
                      <Select.Item value="admin">Admin</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
                <Box style={{ alignSelf: 'end' }}>
                  <Button 
                    color="mint" 
                    onClick={handleAddUser}
                    disabled={adding || !newUserEmail || !newUserName}
                  >
                    {adding ? 'Agregando...' : 'Agregar Usuario'}
                  </Button>
                </Box>
              </Flex>
            </Flex>
          </Card>

          {/* Users List */}
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">Usuarios Autorizados ({users.length})</Heading>
              <Flex direction="column" gap="3">
                {users.map((user) => (
                  <Box 
                    key={user.id}
                    style={{ 
                      padding: 'var(--space-3)',
                      border: '1px solid var(--gray-6)',
                      borderRadius: 'var(--radius-3)'
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Box>
                        <Text weight="medium" size="3">{user.name}</Text>
                        <Text size="2" style={{ color: 'var(--gray-11)' }}>
                          {user.email}
                        </Text>
                        <Text size="1" style={{ color: 'var(--gray-10)' }}>
                          Agregado: {new Date(user.created_at).toLocaleDateString('es-CL')}
                        </Text>
                      </Box>
                      <Flex align="center" gap="2">
                        <Badge 
                          color={user.role === 'admin' ? 'mint' : 'blue'} 
                          variant="soft"
                        >
                          {user.role === 'admin' ? 'Admin' : 'Healthcare Worker'}
                        </Badge>
                        <Button size="1" color="red" variant="soft">
                          Eliminar
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>

          {/* Back Button */}
          <Button color="gray" variant="outline" asChild style={{ alignSelf: 'start' }}>
            <a href="/admin">← Volver al Panel Admin</a>
          </Button>
        </Flex>
      </Container>
    </DashboardLayout>
  )
}