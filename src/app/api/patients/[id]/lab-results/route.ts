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

    console.log(`🔍 Fetching lab results for patient ID: ${patientId}`)

    // Fetch lab results for the patient using admin client
    const { data: labResults, error } = await supabaseAdmin
      .from('health_markers')
      .select(`
        id,
        marker_type,
        value,
        unit,
        is_abnormal,
        severity,
        extracted_text,
        confidence,
        created_at,
        lab_reports!inner(
          patient_id
        )
      `)
      .eq('lab_reports.patient_id', patientId)
      .order('is_abnormal', { ascending: false })
      .order('value', { ascending: false })

    if (error) {
      console.error('❌ Database error fetching lab results:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        patientId
      })
      return NextResponse.json({ 
        error: 'Error al obtener resultados de laboratorio',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ Lab results fetched: ${labResults?.length || 0} results found`)

    // Transform the data to remove nested lab_reports
    const transformedResults = labResults?.map(result => ({
      id: result.id,
      marker_type: result.marker_type,
      value: result.value,
      unit: result.unit,
      is_abnormal: result.is_abnormal,
      severity: result.severity,
      extracted_text: result.extracted_text,
      confidence: result.confidence,
      created_at: result.created_at
    })) || []

    return NextResponse.json(transformedResults)

  } catch (error) {
    console.error('Lab results API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}