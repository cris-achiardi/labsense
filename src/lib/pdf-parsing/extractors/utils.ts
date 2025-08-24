/**
 * Core utility functions for lab extraction
 * Pure functions without side effects - highly testable
 */

import { PRIORITY_MAP, SAMPLE_TYPE_MAP, CATEGORY_MAP } from './constants';

/**
 * Maps Spanish priority values to English values expected by database constraint
 */
export function mapPriorityToEnglish(spanishPriority: string): string {
	const mapped = PRIORITY_MAP[spanishPriority.toLowerCase()];
	if (!mapped) {
		console.warn(`Unknown priority value: ${spanishPriority}, defaulting to 'medium'`);
		return 'medium';
	}
	return mapped;
}

/**
 * Maps sample types to values allowed by database constraint
 */
export function mapSampleType(sampleType: string): string {
	const mapped = SAMPLE_TYPE_MAP[sampleType];
	if (!mapped) {
		console.warn(`Unknown sample type: ${sampleType}, defaulting to 'SUERO'`);
		return 'SUERO';
	}
	return mapped;
}

/**
 * Maps categories to values allowed by database constraint
 */
export function mapCategory(category: string | null | undefined): string {
	// Handle null/undefined/empty values
	if (!category || category.trim() === '') {
		console.warn(`Empty/null category detected, defaulting to 'other'`);
		return 'other';
	}

	const cleanCategory = category.trim().toLowerCase();
	const mapped = CATEGORY_MAP[cleanCategory];

	if (!mapped) {
		console.error(`❌ UNMAPPED CATEGORY: "${category}" (cleaned: "${cleanCategory}")`);
		console.error(`Available categories: ${Object.keys(CATEGORY_MAP).join(', ')}`);
		return 'other';
	}

	console.log(`✅ Mapped category: "${category}" → "${mapped}"`);
	return mapped;
}

/**
 * Clean malformed reference values that contain extraction artifacts
 */
export function cleanReferenceValue(valorReferencia: string): string {
	if (!valorReferencia) return '';
	
	let cleaned = valorReferencia;
	
	// Remove extraction markers like [ * ] and [ ]
	cleaned = cleaned.replace(/\[\s*\*?\s*\]/g, '').trim();
	
	// Remove malformed value concatenations like "269(mg/dL)[ * ] 74"
	cleaned = cleaned.replace(/\d+\([^)]+\)\s*\[\s*\*?\s*\]\s*/, '').trim();
	
	// Extract clean reference from patterns like "74-106" or "Menor a 30"
	const cleanPatterns = [
		/(\d+(?:[,.]\d+)?\s*-\s*\d+(?:[,.]\d+)?)/,  // Range: 74-106
		/((?:Menor a|Mayor a|Hasta)\s+\d+(?:[,.]\d+)?)/i,  // Descriptive: Menor a 30
		/(Normal:?\s*[<>]?\s*\d+(?:[,.]\d+)?)/i,  // Normal: < 150
		/([<>]\s*\d+(?:[,.]\d+)?)/,  // Simple: < 150
	];
	
	for (const pattern of cleanPatterns) {
		const match = cleaned.match(pattern);
		if (match) {
			return match[1].trim();
		}
	}
	
	// If no clean pattern found but has reasonable content, keep basic cleaning
	if (cleaned.length > 50 || cleaned.includes('(') || cleaned.includes('[')) {
		// Too complex or malformed, return empty
		return '';
	}
	
	return cleaned;
}

/**
 * Normalize Chilean numeric format (comma decimal separator)
 */
export function normalizeChileanNumber(value: string): number {
	if (typeof value === 'string' && /^\d+,\d+$/.test(value)) {
		return parseFloat(value.replace(',', '.'));
	}
	return parseFloat(value);
}

/**
 * Normalize lab unit variations
 */
export function normalizeUnit(unit: string): string {
	if (!unit) return '';
	
	return unit
		.replace(/mgl?\/dl/gi, 'mg/dL')
		.replace(/ul?\/l/gi, 'U/L')
		.replace(/μui\/ml/gi, 'μUI/mL')
		.replace(/ng\/dl/gi, 'ng/dL')
		.replace(/pg\/ml/gi, 'pg/mL')
		.replace(/meq\/l/gi, 'mEq/L')
		.replace(/x10\^?(\d)/gi, 'x10^$1')
		.trim();
}

/**
 * Check if a result has already been extracted (deduplication helper)
 */
export function isAlreadyExtracted(results: any[], examName: string): boolean {
	return results.some(result => 
		result.examen.toUpperCase().trim() === examName.toUpperCase().trim()
	);
}

/**
 * Escape special regex characters in lab parameter names
 */
export function escapeRegexChars(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean header/footer contamination from text
 */
export function cleanHeaderFooterContamination(text: string, pages?: string[]): string {
	let cleaned = text;
	
	// Remove common header/footer patterns
	const contaminationPatterns = [
		/Fecha de Recepción:.*?\n/gi,
		/Método Analítico:.*?\n/gi,
		/Página \d+ de \d+/gi,
		/Laboratorio.*?\n/gi,
		/Copyright.*?\n/gi
	];
	
	for (const pattern of contaminationPatterns) {
		cleaned = cleaned.replace(pattern, '');
	}
	
	return cleaned.trim();
}