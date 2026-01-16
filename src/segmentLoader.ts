/**
 * Segment Loader - Backward Compatibility Re-export
 *
 * This file re-exports from the earth-globe module for backward compatibility.
 * For new code, import directly from './earth-globe' instead.
 */

export {
    loadSegments,
    getCountrySegments,
    getSharedSegments,
    getSegmentsBetween,
    getSegmentStats
} from './earth-globe';

export type {
    Point2D,
    Segment2D,
    Segment3D,
    SegmentData
} from './earth-globe';
