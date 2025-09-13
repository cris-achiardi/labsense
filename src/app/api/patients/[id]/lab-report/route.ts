import { supabaseAdmin } from '@/lib/database/supabase-admin';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		const { id: patientId } = await params;

		if (!patientId) {
			return NextResponse.json(
				{ error: 'ID de paciente requerido' },
				{ status: 400 }
			);
		}

		console.log(`🔍 Fetching lab report for patient ID: ${patientId}`);

		// Fetch most recent lab report with healthcare metadata
		const { data: labReport, error } = await supabaseAdmin
			.from('lab_reports')
			.select(
				`
        id,
        patient_id,
        folio,
        fecha_ingreso,
        toma_muestra,
        fecha_validacion,
        profesional_solicitante,
        procedencia,
        created_at
      `
			)
			.eq('patient_id', patientId)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (error) {
			console.error('❌ Database error fetching lab report:', {
				code: error.code,
				message: error.message,
				patientId,
			});

			// If no lab report found, return null rather than error
			if (error.code === 'PGRST116') {
				return NextResponse.json(null);
			}

			return NextResponse.json(
				{
					error: 'Error al obtener información del reporte de laboratorio',
					details: error.message,
					code: error.code,
				},
				{ status: 500 }
			);
		}

		console.log(`✅ Lab report data fetched successfully:`, {
			id: labReport?.id,
			folio: labReport?.folio,
			patientId: labReport?.patient_id,
		});

		return NextResponse.json(labReport);
	} catch (error) {
		console.error('Lab report API error:', error);
		return NextResponse.json(
			{
				error: 'Error interno del servidor',
			},
			{ status: 500 }
		);
	}
}
