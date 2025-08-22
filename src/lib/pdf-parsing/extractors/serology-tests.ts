/**
 * Extractor for serology and immunology tests (R.P.R., etc.).
 */

import { type HealthMarkerMapping } from '../spanish-health-markers';
export interface ComprehensiveLabResult {
	examen: string;
	resultado: string | number | null;
	unidad: string | null;
	valorReferencia: string | null;
	metodo: string | null;
	tipoMuestra: string;
	isAbnormal: boolean;
	abnormalIndicator: string;
	systemCode: string | null;
	category: string | null;
	priority: string | null;
	confidence: number;
	position: number;
	context: string;
	resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy';
}

/**
 * Extract serology tests including R.P.R. and other immunological markers
 */
export function extractSerologyTests(
	text: string,
	healthMarkerLookup: Map<string, HealthMarkerMapping>
): ComprehensiveLabResult[] {
	const results: ComprehensiveLabResult[] = [];

	// Enhanced R.P.R. patterns to handle various formats
	const rprPatterns = [
		// Standard format: R.P.R. No reactivo
		/R\.P\.R\.\s+(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// With colon: R.P.R.: No reactivo
		/R\.P\.R\.\s*:\s*(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Flexible spacing: R.P.R.    No reactivo
		/R\.P\.R\.\s{1,5}(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Without final period: R.P.R No reactivo
		/R\.P\.R\s+(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Without periods: RPR No reactivo
		/RPR\s+(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Multi-line: R.P.R.\n No reactivo
		/R\.P\.R\.\s*\n\s*(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// With dash: R.P.R. - No reactivo
		/R\.P\.R\.\s*-\s*(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Capture group variation for backward compatibility
		/(R\.P\.R\.)\s+(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,

		// Tab-separated: R.P.R.\tNo reactivo
		/R\.P\.R\.\t+(No reactivo|Reactivo|Positivo|Negativo)\s*([^\n]*)/i,
	];

	for (const pattern of rprPatterns) {
		const match = pattern.exec(text);
		if (match) {
			// Handle different capture group patterns
			let examen: string,
				resultado: string,
				valorReferencia: string | undefined;

			if (match.length === 3) {
				// Patterns like: /R\.P\.R\.\s+(No reactivo)/
				[, resultado, valorReferencia] = match;
				examen = 'R.P.R.';
			} else if (match.length === 4) {
				// Patterns like: /(R\.P\.R\.)\s+(No reactivo)\s*([^\n]*)/
				[, examen, resultado, valorReferencia] = match;
			} else {
				// Fallback
				examen = 'R.P.R.';
				resultado = match[1] || 'No reactivo';
				valorReferencia = match[2];
			}

			results.push(
				createLabResult({
					examen: examen.trim(),
					resultado: resultado.trim(),
					unidad: null,
					valorReferencia: valorReferencia?.trim() || 'No reactivo',
					metodo: 'Aglutinación En Látex',
					tipoMuestra: 'SUERO',
					isAbnormal:
						resultado.trim() !== 'No reactivo' &&
						resultado.trim() !== 'Negativo',
					abnormalIndicator:
						resultado.trim() !== 'No reactivo' &&
						resultado.trim() !== 'Negativo'
							? '*'
							: '',
					resultType: 'qualitative',
					confidence: 98,
					position: 0,
					context: match[0],
					healthMarkerLookup,
				})
			);

			console.log(`✅ Serology: R.P.R. = ${resultado.trim()}`);
			break;
		}
	}

	return results;
}

// Helper function
function createLabResult(params: {
	examen: string;
	resultado: string | number | null;
	unidad: string | null;
	valorReferencia: string | null;
	metodo: string;
	tipoMuestra: string;
	isAbnormal: boolean;
	abnormalIndicator: string;
	resultType: 'numeric' | 'qualitative' | 'calculated' | 'microscopy';
	confidence: number;
	position: number;
	context: string;
	healthMarkerLookup: Map<string, HealthMarkerMapping>;
}): ComprehensiveLabResult {
	const {
		examen,
		resultado,
		unidad,
		valorReferencia,
		metodo,
		tipoMuestra,
		isAbnormal,
		abnormalIndicator,
		confidence,
		position,
		context,
		resultType,
		healthMarkerLookup,
	} = params;

	const healthMarker = healthMarkerLookup.get(examen.toUpperCase());

	return {
		examen,
		resultado,
		unidad: unidad || healthMarker?.unit || null,
		valorReferencia: valorReferencia || null,
		metodo: metodo || null,
		tipoMuestra,
		isAbnormal,
		abnormalIndicator,
		systemCode: healthMarker?.systemCode || null,
		category: 'serology',
		priority: isAbnormal ? 'high' : 'low',
		confidence: confidence / 100,
		position,
		context,
		resultType,
	};
}
