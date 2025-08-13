// API endpoint for updating patient contact status

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/database'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    // Validate status
    if (!status || !['pending', 'contacted', 'processed'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser: pending, contacted, o processed' },
        { status: 400 }
      )
    }

    // Validate patient ID
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID de paciente requerido' },
        { status: 400 }
      )
    }

    // Update patient contact status
    await db.updatePatientContactStatus(
      params.id,
      status,
      session.user.userId || session.user.id,
      session.user.email || ''
    )

    return NextResponse.json({
      success: true,
      message: `Estado del paciente actualizado a: ${status}`,
      patientId: params.id,
      newStatus: status,
      updatedBy: session.user.email,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating patient contact status:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error actualizando estado: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get patient info (this would need to be implemented in the database helpers)
    // For now, return basic info about the endpoint
    return NextResponse.json({
      patientId: params.id,
      endpoint: `/api/patients/${params.id}/contact-status`,
      methods: ['GET', 'PATCH'],
      availableStatuses: ['pending', 'contacted', 'processed'],
      currentUser: session.user.email
    })

  } catch (error) {
    console.error('Error getting patient contact status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}