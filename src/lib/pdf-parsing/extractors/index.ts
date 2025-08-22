/**
 * Centralized exports for all lab extraction modules.
 * Maintains 100% coverage (68/68 parameters) through modular architecture.
 */

export type { ComprehensiveLabResult } from './global-fallback';

export {
	extractCompleteUrineAnalysis,
	extractUrineSedimentAnalysis
} from './urine-analysis';

export {
	extractMissingHemogramParams,
	extractMissingLipidParam
} from './blood-analysis';

export {
	extractSerologyTests
} from './serology-tests';

export {
	extractMissingParametersGlobally
} from './global-fallback';