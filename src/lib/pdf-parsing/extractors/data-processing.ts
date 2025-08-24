/**
 * Data processing pipeline for lab extraction results
 * Handles normalization, filtering, deduplication, and stitching
 */

import type { ComprehensiveLabResult, HealthMarkerMapping } from './global-fallback';
import { cleanReferenceValue, normalizeChileanNumber, normalizeUnit } from './utils';

/**
 * Canonical lab aliases for standardization
 */
const CANONICAL_LAB_ALIASES: Record<string, string> = {
	'COLESTEROL TOTAL': 'COLESTEROL TOTAL',
	'COLESTEROL HDL': 'COLESTEROL HDL',
	'COLESTEROL LDL': 'COLESTEROL LDL (CALCULO)',
	'COLESTEROL VLDL': 'COLESTEROL VLDL (CALCULO)',
	'HEMOGLOBINA': 'HEMOGLOBINA',
	'HEMATOCRITO': 'HEMATOCRITO',
	'TSH': 'H. TIROESTIMULANTE (TSH)',
	'T4 LIBRE': 'H. TIROXINA LIBRE (T4 LIBRE)',
};

/**
 * Normalize a single lab result for consistency
 */
export function normalizeLabResult(result: ComprehensiveLabResult): ComprehensiveLabResult {
	// Normalize numeric results - convert commas to dots
	if (typeof result.resultado === 'string' && /^\d+,\d+$/.test(result.resultado)) {
		result.resultado = normalizeChileanNumber(result.resultado);
	}

	// Normalize units - standardize common variations
	if (result.unidad) {
		result.unidad = normalizeUnit(result.unidad);
	}

	// Clean malformed reference values
	if (result.valorReferencia) {
		result.valorReferencia = cleanReferenceValue(result.valorReferencia);
	}

	// Apply canonical aliases for exam names
	const upperExamen = result.examen.toUpperCase().trim();
	if (CANONICAL_LAB_ALIASES[upperExamen]) {
		result.examen = CANONICAL_LAB_ALIASES[upperExamen];
	} else {
		// Normalize exam names - handle common variations
		result.examen = result.examen
			.replace(/\s+/g, ' ')
			.trim()
			.toUpperCase();
	}

	return result;
}

/**
 * Filter out noise and incomplete results
 */
export function filterNoiseResults(results: ComprehensiveLabResult[]): ComprehensiveLabResult[] {
	console.log('🧹 Starting noise filtering...');

	const initialCount = results.length;

	const filteredResults = results.filter((result) => {
		// Must have a valid exam name (not just fragments)
		if (!result.examen || result.examen.length < 3) {
			console.log(`❌ Dropped short exam name: "${result.examen}"`);
			return false;
		}

		// Filter out malformed parameter names that contain concatenated values
		const examName = result.examen.toUpperCase().trim();
		
		// Check for numeric concatenation at the end (e.g., "HEMOGLOBINA14.2", "COLESTEROL213")
		if (/[A-Z][0-9]/.test(examName) && !/\d+(?:,\d+)?(?:\.\d+)?$/.test(examName)) {
			console.log(`❌ Dropped concatenated parameter: "${result.examen}"`);
			return false;
		}

		// Check for incomplete fragments (common pattern: ends with comma followed by letters)
		if (/,\s*[A-Z]+$/.test(examName) || /^[A-Z]+,$/.test(examName)) {
			console.log(`❌ Dropped fragmented parameter: "${result.examen}"`);
			return false;
		}

		// Filter out malformed compound names that are clearly fragmented
		const fragmentedPatterns = [
			/^(CELULAS|HEMATIES|LEUCOCITOS|SANGRE)\s*,?\s*$/i,
			/^(NITROGENO|GLICEMIA|TIROXINA)\s*,?\s*$/i,
			/^(CAMPO|AYUNO|LIBRE|UREICO)\s*$/i,
			/EPITELI?ALES?No/i,
			/CAMPOo/i,
			/ORINANegativo/i,
		];

		for (const pattern of fragmentedPatterns) {
			if (pattern.test(examName)) {
				console.log(`❌ Dropped malformed fragment: "${result.examen}"`);
				return false;
			}
		}

		// Must have a result value
		if (
			result.resultado === null ||
			result.resultado === undefined ||
			result.resultado === ''
		) {
			console.log(`❌ Dropped result without value: "${result.examen}"`);
			return false;
		}

		// For numeric results, must have plausible numeric value
		if (result.resultType === 'numeric') {
			const numericValue =
				typeof result.resultado === 'number'
					? result.resultado
					: parseFloat(String(result.resultado));
			if (isNaN(numericValue)) {
				console.log(`❌ Dropped invalid numeric result: "${result.examen}" = "${result.resultado}"`);
				return false;
			}
		}

		// Confidence threshold
		if (result.confidence < 0.5) {
			console.log(`❌ Dropped low confidence result: "${result.examen}" (confidence: ${result.confidence})`);
			return false;
		}

		return true;
	});

	const removedCount = initialCount - filteredResults.length;
	console.log(`🧹 Noise filtering: removed ${removedCount} results, kept ${filteredResults.length}`);

	return filteredResults;
}

/**
 * Remove duplicate results with sample type context
 */
export function removeDuplicateResults(results: ComprehensiveLabResult[]): ComprehensiveLabResult[] {
	const uniqueResults: ComprehensiveLabResult[] = [];
	const seenExamenes = new Map<string, ComprehensiveLabResult>();

	// Define parameters that should be exclusive to specific sample types
	const bloodOnlyParams = new Set([
		'LINFOCITOS', 'NEUTROFILOS', 'MONOCITOS', 'EOSINOFILOS', 'BASOFILOS',
		'BACILIFORMES', 'JUVENILES', 'MIELOCITOS', 'PROMIELOCITOS', 'BLASTOS',
		'RECUENTO GLOBULOS ROJOS', 'RECUENTO GLOBULOS BLANCOS', 'RECUENTO PLAQUETAS',
		'HEMATOCRITO', 'HEMOGLOBINA', 'V.C.M', 'H.C.M', 'C.H.C.M'
	]);

	const urineOnlyParams = new Set([
		'GLUCOSA', 'PROTEINAS', 'SANGRE EN ORINA', 'CETONAS', 'BILIRRUBINA', 
		'NITRITOS', 'LEUCOCITOS', 'UROBILINOGENO', 'COLOR', 'ASPECTO', 'DENSIDAD'
	]);

	// Sort by confidence (highest first), then by sample type preference
	results.sort((a, b) => {
		if (b.confidence !== a.confidence) return b.confidence - a.confidence;
		
		// For blood-only params, prefer SANGRE TOTAL
		const aExamen = a.examen.toUpperCase().trim();
		if (bloodOnlyParams.has(aExamen)) {
			if (a.tipoMuestra === 'SANGRE TOTAL' && b.tipoMuestra !== 'SANGRE TOTAL') return -1;
			if (b.tipoMuestra === 'SANGRE TOTAL' && a.tipoMuestra !== 'SANGRE TOTAL') return 1;
		}
		
		// For urine-only params, prefer ORINA
		if (urineOnlyParams.has(aExamen)) {
			if (a.tipoMuestra === 'ORINA' && b.tipoMuestra !== 'ORINA') return -1;
			if (b.tipoMuestra === 'ORINA' && a.tipoMuestra !== 'ORINA') return 1;
		}
		
		return 0;
	});

	for (const result of results) {
		const key = result.examen.toUpperCase().trim();
		
		if (!seenExamenes.has(key)) {
			seenExamenes.set(key, result);
			uniqueResults.push(result);
		} else {
			// If we've seen this parameter, only keep if it's from preferred sample type
			const existing = seenExamenes.get(key)!;
			const examName = result.examen.toUpperCase().trim();
			
			let shouldReplace = false;
			
			// Replace if new result has higher confidence
			if (result.confidence > existing.confidence + 0.1) {
				shouldReplace = true;
			}
			// Replace if new result is from preferred sample type
			else if (bloodOnlyParams.has(examName) && result.tipoMuestra === 'SANGRE TOTAL' && existing.tipoMuestra !== 'SANGRE TOTAL') {
				shouldReplace = true;
			}
			else if (urineOnlyParams.has(examName) && result.tipoMuestra === 'ORINA' && existing.tipoMuestra !== 'ORINA') {
				shouldReplace = true;
			}
			
			if (shouldReplace) {
				// Replace existing result
				const index = uniqueResults.findIndex(r => r.examen.toUpperCase().trim() === key);
				if (index !== -1) {
					uniqueResults[index] = result;
					seenExamenes.set(key, result);
				}
			}
		}
	}

	console.log(`🔄 Deduplication: ${results.length} → ${uniqueResults.length} unique results`);
	return uniqueResults;
}

/**
 * Stitch reference ranges to results missing them
 */
export function stitchReferenceRanges(
	results: ComprehensiveLabResult[],
	originalText: string
): ComprehensiveLabResult[] {
	console.log('🔧 Starting reference stitching...');

	// Find results missing reference ranges
	const resultsNeedingRanges = results.filter(
		(r) => !r.valorReferencia || r.valorReferencia.trim() === ''
	);
	console.log(`📋 Found ${resultsNeedingRanges.length} results missing reference ranges`);

	if (resultsNeedingRanges.length === 0) return results;

	// Common reference range patterns
	const rangePatterns = [
		// Numeric ranges: 74-106, 0,55-4,78, <150, >60
		/(?:^|\s)([<>]?\s*\d+(?:[,.]\d+)?\s*-\s*\d+(?:[,.]\d+)?)\s*(?:\s|$)/g,
		// Descriptive ranges: Menor a 30, Mayor a 60, Hasta 116
		/(?:^|\s)((?:Menor a|Mayor a|Hasta)\s+\d+(?:[,.]\d+)?)\s*(?:\s|$)/gi,
		// Normal indicators: Normal: < 150, Bajo: < 40
		/(?:^|\s)(Normal:?\s*[<>]?\s*\d+(?:[,.]\d+)?)\s*(?:\s|$)/gi,
	];

	// For each result needing a range, search nearby in original text
	for (const result of resultsNeedingRanges) {
		const escapedExamName = result.examen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const examRegex = new RegExp(escapedExamName, 'gi');
		const examMatch = examRegex.exec(originalText);

		if (examMatch) {
			// Search for range patterns near the exam name
			const contextStart = Math.max(0, examMatch.index - 100);
			const contextEnd = Math.min(originalText.length, examMatch.index + 200);
			const contextText = originalText.substring(contextStart, contextEnd);

			for (const rangePattern of rangePatterns) {
				rangePattern.lastIndex = 0; // Reset regex
				const rangeMatch = rangePattern.exec(contextText);
				if (rangeMatch) {
					result.valorReferencia = rangeMatch[1].trim();
					console.log(`🔗 Stitched range for ${result.examen}: ${result.valorReferencia}`);
					break;
				}
			}
		}
	}

	return results;
}