// API endpoint to populate test data for dashboard testing

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { createTestData } from '@/lib/database/init-schema'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only allow admins to populate test data
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden poblar datos de prueba' },
        { status: 403 }
      )
    }

    // Create test data
    const success = await createTestData()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Datos de prueba creados exitosamente'
      })
    } else {
      return NextResponse.json(
        { error: 'Error creando datos de prueba' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in populate test data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to populate test data',
    endpoint: '/api/test-data/populate',
    method: 'POST',
    auth: 'Admin required'
  })
}