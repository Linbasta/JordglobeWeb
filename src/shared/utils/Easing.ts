/**
 * Easing Functions
 *
 * Common easing functions for smooth interpolation.
 * Each function takes t (0-1) and returns an eased value (0-1).
 */

export type EasingFunction = (t: number) => number;

/**
 * Linear interpolation (no easing)
 */
export function Linear(t: number): number {
    return t;
}

/**
 * Sine ease-out: Decelerates towards the end
 */
export function OutSine(t: number): number {
    return Math.sin(t * Math.PI / 2);
}

/**
 * Sine ease-in: Accelerates from the start
 */
export function InSine(t: number): number {
    return 1 - Math.cos(t * Math.PI / 2);
}

/**
 * Sine ease-in-out: Accelerates then decelerates
 */
export function InOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Quad ease-out: Decelerates towards the end
 */
export function OutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

/**
 * Quad ease-in: Accelerates from the start
 */
export function InQuad(t: number): number {
    return t * t;
}

/**
 * Quad ease-in-out: Accelerates then decelerates
 */
export function InOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Cubic ease-out: Decelerates towards the end
 */
export function OutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Cubic ease-in: Accelerates from the start
 */
export function InCubic(t: number): number {
    return t * t * t;
}

/**
 * Cubic ease-in-out: Accelerates then decelerates
 */
export function InOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Get easing function by name
 */
export function getEasingFunction(name: string): EasingFunction {
    switch (name) {
        case 'Linear': return Linear;
        case 'OutSine': return OutSine;
        case 'InSine': return InSine;
        case 'InOutSine': return InOutSine;
        case 'OutQuad': return OutQuad;
        case 'InQuad': return InQuad;
        case 'InOutQuad': return InOutQuad;
        case 'OutCubic': return OutCubic;
        case 'InCubic': return InCubic;
        case 'InOutCubic': return InOutCubic;
        default:
            console.warn(`Unknown easing function: ${name}, using Linear`);
            return Linear;
    }
}

/**
 * Interpolate between two values using an easing function
 */
export function easedValue(
    t: number,
    minT: number,
    maxT: number,
    minValue: number,
    maxValue: number,
    easing: EasingFunction = Linear
): number {
    // Normalize t to 0-1 range
    const normalized = (t - minT) / (maxT - minT);
    const clamped = Math.max(0, Math.min(1, normalized));

    // Apply easing
    const eased = easing(clamped);

    // Interpolate between values
    return minValue + (maxValue - minValue) * eased;
}
