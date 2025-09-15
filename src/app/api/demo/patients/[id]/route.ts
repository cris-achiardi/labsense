import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/database/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json({ error: 'ID de paciente requerido' }, { status: 400 })
    }

    // Fetch patient data using admin client (no auth required for demo)
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientError) {
      return NextResponse.json({ 
        error: 'Paciente no encontrado',
        details: patientError.message
      }, { status: 404 })
    }

    // Fetch lab results (health markers)
    const { data: labResults, error: labError } = await supabaseAdmin
      .from('health_markers')
      .select(`
        id,
        lab_report_id,
        marker_type,
        value,
        unit,
        is_abnormal,
        severity,
        extracted_text,
        confidence,
        created_at,
        lab_reports!inner(
          id,
          patient_id
        )
      `)
      .eq('lab_reports.patient_id', patientId)

    // Fetch lab report metadata
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('lab_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      patient,
      labResults: labResults || [],
      labReport: reportData || null
    })

  } catch (err) {
    console.error('Demo patient API error:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 })
  }
}