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
        scaledConstant: 0.45,  // Reduced from 0.6 to decrease expansion for small countries
        exponent: 0.3
    };
}

/**
 * Per-country expansion factor overrides
 * Use this to fine-tune expansion for specific countries that need special handling.
 * If a country is listed here, this value is used instead of the calculated one.
 */
export const EXPANSION_OVERRIDES: Map<string, number> = new Map([
    // Caribbean / Antilles - reduce expansion
    ['AG', 3.5],  // Antigua and Barbuda
    ['BB', 3.5],  // Barbados
    ['DM', 3.5],  // Dominica
    ['GD', 3.5],  // Grenada
    ['KN', 3.5],  // Saint Kitts and Nevis
    ['LC', 3.5],  // Saint Lucia
    ['VC', 3.5],  // Saint Vincent and the Grenadines
    ['TT', 3.3],  // Trinidad and Tobago
    ['JM', 2.0],  // Jamaica 
    ['ST', 2.0],  // San Tomé and Principe 
]);

/**
 * Get expansion factor for a country, checking overrides first
 *
 * @param iso2 - Country ISO2 code
 * @param surfaceArea - Total mesh surface area in world units²
 * @param tuning - Tuning parameters (uses defaults if not provided)
 * @returns Expansion factor (minimum 1.0, never shrinks)
 */
export function getExpansionFactorForCountry(
    iso2: string,
    surfaceArea: number,
    tuning?: ExpansionTuning
): number {
    // Check for per-country override first
    const override = EXPANSION_OVERRIDES.get(iso2);
    if (override !== undefined) {
        return override;
    }

    // Fall back to calculated value
    return calculateExpansionFactor(surfaceArea, tuning);
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
