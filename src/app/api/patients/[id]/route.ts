import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/database/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json({ error: 'ID de paciente requerido' }, { status: 400 })
    }

    console.log(`🔍 Fetching patient with ID: ${patientId}`)

    // Fetch patient data using admin client to bypass RLS
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error) {
      console.error('❌ Database error fetching patient:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        patientId
      })
      return NextResponse.json({ 
        error: 'Error al obtener información del paciente',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ Patient data fetched successfully:`, {
      id: patient?.id,
      name: patient?.name,
      rut: patient?.rut
    })

    if (!patient) {
      return NextResponse.json({ 
        error: 'Paciente no encontrado' 
      }, { status: 404 })
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Patient API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}