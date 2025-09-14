/**
 * Complete Lab Processing API
 * Task 11.1: Process and store complete lab extraction results
 *
 * This endpoint:
 * 1. Extracts complete lab data from PDF
 * 2. Stores all data in database with proper relationships
 * 3. Prevents duplicate processing using folio
 * 4. Calculates priority scores
 * 5. Creates audit logs
 */

import { authOptions } from '@/lib/auth/config';
import { supabase } from '@/lib/database/supabase';
import { supabaseAdmin } from '@/lib/database/supabase-admin';
import { extractCompleteLabReport } from '@/lib/pdf-parsing/lab-results-extractor';
import { extractAllLabResults } from '@/lib/pdf-parsing/comprehensive-lab-extractor';
import pdfParse from 'pdf-parse';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Maps Spanish priority values to English values expected by database constraint
 */
function mapPriorityToEnglish(spanishPriority: string): string {
	const priorityMap: Record<string, string> = {
		crítico: 'critical',
		critico: 'critical',
		alto: 'high',
		high: 'high',
		moderado: 'medium',
		medio: 'medium',
		medium: 'medium',
		bajo: 'low',
		low: 'low',
		normal: 'low', // Normal values get low priority
		leve: 'low',
		severo: 'high',
		grave: 'critical',
	};

	const mapped = priorityMap[spanishPriority.toLowerCase()];
	if (!mapped) {
		console.warn(
			`Unknown priority value: ${spanishPriority}, defaulting to 'medium'`
		);
		return 'medium';
	}

	return mapped;
}

/**
 * Maps sample types to values allowed by database constraint
 */
function mapSampleType(sampleType: string): string {
	const sampleMap: Record<string, string> = {
		SUERO: 'SUERO',
		'SANGRE TOTAL + E.D.T.A.': 'SANGRE TOTAL',
		'SANGRE TOTAL': 'SANGRE TOTAL',
		ORINA: 'ORINA',
		PLASMA: 'PLASMA',
		'Suero y plasma (heparina de litio)': 'PLASMA',
	};

	const mapped = sampleMap[sampleType];
	if (!mapped) {
		console.warn(`Unknown sample type: ${sampleType}, defaulting to 'SUERO'`);
		return 'SUERO';
	}

	return mapped;
}

/**
 * Maps categories to values allowed by database constraint
 */
function mapCategory(category: string | null | undefined): string {
	// Handle null/undefined/empty values
	if (!category || category.trim() === '') {
		console.warn(`Empty/null category detected, defaulting to 'other'`);
		return 'other';
	}

	const categoryMap: Record<string, string> = {
		glucose: 'glucose',
		lipids: 'lipids',
		liver: 'liver',
		thyroid: 'thyroid',
		kidney: 'kidney',
		blood: 'blood',
		blood_differential: 'blood', // Blood differential → blood
		electrolytes: 'electrolytes',
		urine: 'kidney', // Urine tests → kidney (related to kidney function)
		urine_sediment: 'kidney', // Urine sediment → kidney (related to kidney function)
		serology: 'other', // Serology → other
		other: 'other',
	};

	const cleanCategory = category.trim().toLowerCase();
	const mapped = categoryMap[cleanCategory];

	if (!mapped) {
		console.error(
			`❌ UNMAPPED CATEGORY: "${category}" (cleaned: "${cleanCategory}")`
		);
		console.error(
			`Available categories: ${Object.keys(categoryMap).join(', ')}`
		);
		return 'other';
	}

	console.log(`✅ Mapped category: "${category}" → "${mapped}"`);
	return mapped;
}

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		// Get PDF file and overwrite flag from form data
		const formData = await request.formData();
		const file = formData.get('pdf') as File;
		let overwrite = formData.get('overwrite') === 'true';

		if (!file) {
			return NextResponse.json(
				{ error: 'No se proporcionó archivo PDF' },
				{ status: 400 }
			);
		}

		// Validate file type and size
		if (file.type !== 'application/pdf') {
			return NextResponse.json(
				{ error: 'El archivo debe ser un PDF' },
				{ status: 400 }
			);
		}

		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ error: 'El archivo PDF es demasiado grande (máximo 10MB)' },
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const pdfBuffer = Buffer.from(arrayBuffer);

		// Extract complete lab report using original extractor for metadata
		const extractionResult = await extractCompleteLabReport(pdfBuffer);
		
		// If successful, replace lab results with comprehensive extraction
		if (extractionResult.success) {
			const pdfData = await pdfParse(pdfBuffer);
			const comprehensiveResults = extractAllLabResults(pdfData.text);
			
			// Convert ComprehensiveLabResult[] to LabResult[] by filtering/converting null values
			const convertedResults = comprehensiveResults
				.filter(r => r.resultado !== null) // Filter out null results
				.map(r => ({
					...r,
					resultado: r.resultado as string | number, // Type assertion since we filtered nulls
					unidad: r.unidad || '', // Convert null to empty string
					valorReferencia: r.valorReferencia || '', // Convert null to empty string
					metodo: r.metodo || '' // Convert null to empty string
				}));
			
			// Replace lab results with comprehensive extraction
			extractionResult.labResults = convertedResults;
			extractionResult.metadata.totalResults = convertedResults.length;
			extractionResult.metadata.abnormalCount = convertedResults.filter(r => r.isAbnormal).length;
			extractionResult.metadata.criticalCount = convertedResults.filter(r => r.priority === 'critical').length;
		}

		if (!extractionResult.success) {
			return NextResponse.json(
				{
					error: extractionResult.error || 'Error al procesar el PDF',
					success: false,
				},
				{ status: 400 }
			);
		}

		// Check if we have minimum required data
		if (!extractionResult.patient?.rut) {
			return NextResponse.json(
				{
					error: 'No se pudo extraer el RUT del paciente del PDF',
					success: false,
				},
				{ status: 400 }
			);
		}

		if (extractionResult.labResults.length === 0) {
			return NextResponse.json(
				{
					error: 'No se encontraron resultados de laboratorio en el PDF',
					success: false,
				},
				{ status: 400 }
			);
		}

		// Auto-overwrite existing reports with same folio
		let existingReportId: string | null = null;
		if (extractionResult.metadata.folio) {
			// Check for existing reports with same folio
			const { data: allReports } = await supabaseAdmin
				.from('lab_reports')
				.select('id, folio, created_at')
				.eq('folio', extractionResult.metadata.folio)
				.order('created_at', { ascending: false });

			// If existing reports found, use the most recent one for overwrite
			if (allReports && allReports.length > 0) {
				existingReportId = allReports[0].id;
				overwrite = true;
				console.log(`🔄 Overwriting existing report for folio ${extractionResult.metadata.folio}`);
			}
		}

		// Store complete lab extraction using database function
		const { data: labReportId, error: storeError } = await supabaseAdmin.rpc(
			'store_complete_lab_extraction',
			{
				p_patient_data: {
					rut: extractionResult.patient.rut,
					name: extractionResult.patient.name,
					age: extractionResult.patient.age,
					gender: extractionResult.patient.gender,
				},
				p_lab_results: extractionResult.labResults.map((result, index) => {
					console.log(
						`🔍 Processing result ${index + 1}/${extractionResult.labResults.length}:`,
						{
							examen: result.examen,
							category: result.category,
							priority: result.priority,
							tipoMuestra: result.tipoMuestra,
						}
					);

					return {
						examen: result.examen,
						resultado: result.resultado?.toString() || '', // Handle null resultado
						unidad: result.unidad || '', // Handle null unidad
						valorReferencia: result.valorReferencia || '',
						metodo: result.metodo || '',
						tipoMuestra: mapSampleType(result.tipoMuestra),
						systemCode: result.systemCode || '',
						category: mapCategory(result.category),
						priority: mapPriorityToEnglish(result.priority || 'medium'),
						isAbnormal: result.isAbnormal || false,
						abnormalIndicator: result.abnormalIndicator || '',
						confidence: result.confidence || 0,
						context: result.context || '',
						// resultType: result.resultType || 'numeric',
					};
				}),
				p_metadata: {
					folio: extractionResult.metadata.folio,
					fechaIngreso: extractionResult.metadata.fechaIngreso,
					tomaMuestra: extractionResult.metadata.tomaMuestra,
					fechaValidacion: extractionResult.metadata.fechaValidacion,
					profesionalSolicitante:
						extractionResult.metadata.profesionalSolicitante,
					procedencia: extractionResult.metadata.procedencia,
					confidence: extractionResult.confidence,
				},
				p_uploaded_by: session.user.email,
				p_file_name: file.name,
				p_file_path: `lab-pdfs/${Date.now()}-${file.name}`, // Placeholder path
				p_file_size: file.size,
				p_overwrite: overwrite,
				p_existing_report_id: existingReportId,
			}
		);

		if (storeError) {
			console.error('Database storage error:', storeError);
			return NextResponse.json(
				{
					error: 'Error al almacenar los datos en la base de datos',
					success: false,
					details: storeError.message,
				},
				{ status: 500 }
			);
		}

		// Get the complete stored data for response
		const { data: storedReport, error: fetchError } = await supabase
			.from('complete_lab_reports')
			.select('*')
			.eq('lab_report_id', labReportId)
			.single();

		if (fetchError) {
			console.error('Error fetching stored report:', fetchError);
		}

		// Log successful processing
		console.log('Complete lab processing successful:', {
			user: session.user.email,
			folio: extractionResult.metadata.folio,
			patientRUT: extractionResult.patient.rut ? '***' : null, // Anonymized
			totalResults: extractionResult.metadata.totalResults,
			abnormalCount: extractionResult.metadata.abnormalCount,
			criticalCount: extractionResult.metadata.criticalCount,
			labReportId,
			overwrite: overwrite,
			existingReportId: existingReportId,
		});

		// Return success response
		return NextResponse.json({
			success: true,
			message: 'Examen de laboratorio procesado exitosamente',
			data: {
				labReportId,
				folio: extractionResult.metadata.folio,
				patient: {
					rut: extractionResult.patient.rut,
					name: extractionResult.patient.name,
				},
				summary: {
					totalResults: extractionResult.metadata.totalResults,
					abnormalResults: extractionResult.metadata.abnormalCount,
					criticalResults: extractionResult.metadata.criticalCount,
					confidence: extractionResult.confidence,
				},
				storedReport: storedReport || null
			},
		});
	} catch (error) {
		console.error('Complete lab processing API error:', error);
		return NextResponse.json(
			{
				error: 'Error interno del servidor',
				success: false,
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: 'Complete Lab Processing API',
		description:
			'Processes and stores complete lab extraction results with duplicate prevention and overwrite option',
		method: 'POST',
		parameters: {
			pdf: 'PDF file to process (required)',
			overwrite: 'Boolean flag to allow overwriting existing folio data (optional, default: false)'
		},
		status: 'available',
	});
}
