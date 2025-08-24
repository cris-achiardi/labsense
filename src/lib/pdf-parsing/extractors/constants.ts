/**
 * Centralized constants and configuration for lab extraction
 * Separates data from logic following separation of concerns
 */

/**
 * Standard sample types supported by the system
 */
export const SAMPLE_TYPES = {
	SERUM: 'SUERO',
	WHOLE_BLOOD: 'SANGRE TOTAL',
	BLOOD_EDTA: 'SANGRE TOTAL + E.D.T.A.',
	URINE: 'ORINA',
	PLASMA: 'PLASMA'
} as const;

/**
 * Priority levels for lab results
 */
export const PRIORITY_LEVELS = {
	CRITICAL: 'critical',
	HIGH: 'high', 
	MEDIUM: 'medium',
	LOW: 'low'
} as const;

/**
 * Lab result categories
 */
export const CATEGORIES = {
	GLUCOSE: 'glucose',
	LIPIDS: 'lipids',
	LIVER: 'liver',
	THYROID: 'thyroid',
	KIDNEY: 'kidney',
	BLOOD: 'blood',
	ELECTROLYTES: 'electrolytes',
	OTHER: 'other'
} as const;

/**
 * Spanish to English priority mapping
 */
export const PRIORITY_MAP: Record<string, string> = {
	crítico: 'critical',
	critico: 'critical',
	alto: 'high',
	high: 'high',
	moderado: 'medium',
	medio: 'medium',
	medium: 'medium',
	bajo: 'low',
	low: 'low',
	normal: 'low',
	leve: 'low',
	severo: 'high',
	grave: 'critical',
};

/**
 * Sample type mapping for database constraints
 */
export const SAMPLE_TYPE_MAP: Record<string, string> = {
	SUERO: 'SUERO',
	'SANGRE TOTAL + E.D.T.A.': 'SANGRE TOTAL',
	'SANGRE TOTAL': 'SANGRE TOTAL',
	ORINA: 'ORINA',
	PLASMA: 'PLASMA',
	'Suero y plasma (heparina de litio)': 'PLASMA',
};

/**
 * Category mapping for database constraints
 */
export const CATEGORY_MAP: Record<string, string> = {
	glucose: 'glucose',
	lipids: 'lipids',
	liver: 'liver',
	thyroid: 'thyroid',
	kidney: 'kidney',
	blood: 'blood',
	blood_differential: 'blood',
	electrolytes: 'electrolytes',
	urine: 'kidney',
	urine_sediment: 'kidney',
	serology: 'other',
	other: 'other',
};

/**
 * Processing pipeline configuration
 */
export const DEFAULT_PROCESSING_CONFIG = {
	enableDeduplication: true,
	enableNormalization: true,
	enableFiltering: true,
	minConfidence: 0.7
};

/**
 * Extraction confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
	HIGH: 0.95,
	MEDIUM: 0.85,
	LOW: 0.70,
	MINIMUM: 0.50
};