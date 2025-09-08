/**
 * Core types and interfaces for lab extraction system
 * Centralized type definitions following DRY principles
 */

import type { ComprehensiveLabResult } from './global-fallback';

// Re-export for backward compatibility
export type { ComprehensiveLabResult } from './global-fallback';

/**
 * Health marker mapping for standardization
 * Extended from spanish-health-markers.ts for compatibility
 */
export interface HealthMarkerMapping {
	systemCode: string;
	category: string;
	normalRange?: string;
	unit?: string;
	// Extended properties for better standardization
	standardName?: string;
	sampleType?: string;
}

/**
 * Extraction result with confidence score
 */
export interface ExtractionResult {
	success: boolean;
	results: ComprehensiveLabResult[];
	confidence: number;
	extractorUsed: string;
}

/**
 * Sample type block for segmented processing
 */
export interface SampleTypeBlock {
	sampleType: string;
	content: string;
	startIndex: number;
	endIndex: number;
}

/**
 * Processing pipeline configuration
 */
export interface ProcessingConfig {
	enableDeduplication: boolean;
	enableNormalization: boolean;
	enableFiltering: boolean;
	minConfidence: number;
}

/**
 * Pattern matching configuration
 */
export interface PatternConfig {
	pattern: RegExp;
	confidence: number;
	priority: number;
	sampleTypes: string[];
}

/**
 * Extraction strategy interface
 */
export interface ExtractionStrategy {
	name: string;
	extract(text: string, healthMarkerLookup: Map<string, HealthMarkerMapping>): ComprehensiveLabResult[];
	supportedSampleTypes: string[];
	priority: number;
}