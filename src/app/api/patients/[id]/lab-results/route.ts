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

    // Fetch health markers for this patient through lab_reports
    const { data: labResults, error } = await supabaseAdmin
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
        examen,
        resultado_raw,
        valor_referencia,
        metodo,
        tipo_muestra,
        system_code,
        category,
        priority,
        abnormal_indicator,
        lab_reports!inner(
          id,
          patient_id,
          folio
        )
      `)
      .eq('lab_reports.patient_id', patientId)
      .order('is_abnormal', { ascending: false })
      .order('priority', { ascending: true })
      .order('examen', { ascending: true })

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
      created_at: result.created_at,
      examen: result.examen,
      resultado_raw: result.resultado_raw,
      valor_referencia: result.valor_referencia,
      metodo: result.metodo,
      tipo_muestra: result.tipo_muestra,
      system_code: result.system_code,
      category: result.category,
      priority: result.priority,
      abnormal_indicator: result.abnormal_indicator
    })) || []

    return NextResponse.json(transformedResults)

  } catch (error) {
    console.error('Lab results API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}