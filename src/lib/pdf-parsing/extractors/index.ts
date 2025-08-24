/**
 * Centralized exports for all lab extraction modules.
 * Maintains 100% coverage through modular architecture.
 * Following separation of concerns and DRY principles.
 */

// Core types and interfaces
export type { 
	ComprehensiveLabResult,
	HealthMarkerMapping,
	ExtractionResult,
	SampleTypeBlock,
	ProcessingConfig,
	PatternConfig,
	ExtractionStrategy
} from './types';

// Constants and configuration
export {
	SAMPLE_TYPES,
	PRIORITY_LEVELS,
	CATEGORIES,
	PRIORITY_MAP,
	SAMPLE_TYPE_MAP,
	CATEGORY_MAP,
	DEFAULT_PROCESSING_CONFIG,
	CONFIDENCE_THRESHOLDS
} from './constants';

// Core utilities
export {
	mapPriorityToEnglish,
	mapSampleType,
	mapCategory,
	cleanReferenceValue,
	normalizeChileanNumber,
	normalizeUnit,
	isAlreadyExtracted,
	escapeRegexChars,
	cleanHeaderFooterContamination
} from './utils';

// Data processing pipeline
export {
	normalizeLabResult,
	filterNoiseResults,
	removeDuplicateResults,
	stitchReferenceRanges
} from './data-processing';

// Specialized extractors (existing)
export {
	extractCompleteUrineAnalysis,
	extractUrineSedimentAnalysis,
} from './urine-analysis';

export {
	extractMissingHemogramParams,
	extractMissingLipidParam,
} from './blood-analysis';

export { extractSerologyTests } from './serology-tests';

export { extractMissingParametersGlobally } from './global-fallback';
