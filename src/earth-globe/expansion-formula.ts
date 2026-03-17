/**
 * Expansion Formula for Small Countries
 *
 * Calculates geometric expansion factor based on surface area.
 * Smaller countries expand more to remain visible on the globe.
 */

/**
 * Tuning parameters for expansion calculation
 */
export interface ExpansionTuning {
    /** Scaling constant in the formula (default: 70.0) */
    scaledConstant: number;

    /** Exponent in the formula (default: 0.3) */
    exponent: number;
}

/**
 * Default tuning parameters
 * These values produce:
 * - Monaco/Vatican (~0.002 area): 1000x-5000x expansion
 * - Luxembourg (~0.02 area): 100x-500x expansion
 */
export function getDefaultTuning(): ExpansionTuning {
    return {
        scaledConstant: 0.6,
        exponent: 0.3
    };
}

/**
 * Calculate expansion factor from surface area
 *
 * Formula: expansion = scaledConstant / (area ^ exponent)
 *
 * @param surfaceArea - Total mesh surface area in world units²
 * @param tuning - Tuning parameters (uses defaults if not provided)
 * @returns Expansion factor (minimum 1.0, never shrinks)
 */
export function calculateExpansionFactor(
    surfaceArea: number,
    tuning?: ExpansionTuning
): number {
    if (surfaceArea <= 0) {
        return 1.0;
    }

    const params = tuning || getDefaultTuning();
    const factor = params.scaledConstant / Math.pow(surfaceArea, params.exponent);

    // Never shrink - minimum expansion is 1.0
    return Math.max(1.0, factor);
}
