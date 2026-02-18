/**
 * Earth Globe Module - Country Picker
 *
 * Efficient point-in-polygon detection for countries using a grid-based spatial index.
 * This avoids checking every country polygon for each query.
 */

import { PICKER_CELL_SIZE } from './constants';
import { pointInBoundingBox, pointInPolygon, calculateBoundingBox } from './geo-math';
import type { LatLon, CountryPolygon, BoundingBox, GridCell, LofiCircle } from './types';

/**
 * A single collider circle registered for hit detection
 */
interface ColliderCircle {
    lat: number;
    lon: number;
    radiusDegSq: number;    // pre-squared for fast comparison
    countryIndex: number;
    polygon: CountryPolygon; // first polygon, returned on proximity match
}

export class RegionPicker {
    private grid: Map<string, GridCell>;
    private cellSize: number;
    private polygons: CountryPolygon[];
    private overrideColliders: ColliderCircle[] = [];  // Tier 2: checked before PIP
    private catchColliders: ColliderCircle[] = [];     // Tier 3: checked when PIP finds nothing
    private colliderMultiplierSq = 1.0;

    /**
     * Create a new CountryPicker
     * @param cellSize Grid cell size in degrees (default from constants)
     */
    constructor(cellSize: number = PICKER_CELL_SIZE) {
        this.grid = new Map();
        this.cellSize = cellSize;
        this.polygons = [];
    }

    /**
     * Set the zoom-based collider radius multiplier.
     * Stored squared since hit-tests compare squared distances.
     */
    setColliderMultiplier(m: number): void {
        this.colliderMultiplierSq = m * m;
    }

    /**
     * Get the current collider multiplier (linear, not squared).
     */
    getColliderMultiplier(): number {
        return Math.sqrt(this.colliderMultiplierSq);
    }

    /**
     * Add a country polygon to the spatial index
     */
    addPolygon(polygon: CountryPolygon): void {
        this.polygons.push(polygon);

        // Calculate which grid cells this polygon overlaps
        const minCellX = Math.floor(polygon.bbox.minLon / this.cellSize);
        const maxCellX = Math.floor(polygon.bbox.maxLon / this.cellSize);
        const minCellY = Math.floor(polygon.bbox.minLat / this.cellSize);
        const maxCellY = Math.floor(polygon.bbox.maxLat / this.cellSize);

        // Add polygon to all overlapping cells
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx},${cy}`;
                let cell = this.grid.get(key);
                if (!cell) {
                    cell = { polygons: [] };
                    this.grid.set(key, cell);
                }
                cell.polygons.push(polygon);
            }
        }
    }

    /**
     * Get which country contains the given point
     * @returns The country polygon containing the point, or null if over ocean/no country
     */
    getCountryAt(point: LatLon): CountryPolygon | null {
        // Tier 1: standard point-in-polygon via spatial grid
        const pipResult = this.pointInPolygonSearch(point);

        // Tier 2: override — cursor near a surrounded country's centroid
        const override = this.checkOverride(point);
        if (override) return override;

        // If PIP found something, use it
        if (pipResult) return pipResult;

        // Tier 3: catch — PIP found nothing, check all centroids with catchRadius
        return this.checkCatch(point);
    }

    /**
     * Tier 1: standard point-in-polygon search via spatial grid
     */
    private pointInPolygonSearch(point: LatLon): CountryPolygon | null {
        const cellX = Math.floor(point.lon / this.cellSize);
        const cellY = Math.floor(point.lat / this.cellSize);
        const key = `${cellX},${cellY}`;

        const cell = this.grid.get(key);
        if (!cell) return null;

        for (const polygon of cell.polygons) {
            if (!pointInBoundingBox(point, polygon.bbox)) continue;
            if (pointInPolygon(point, polygon.points)) return polygon;
        }

        return null;
    }

    /**
     * Tier 2: override — check override colliders (surrounded countries).
     * Returns the closest match within any circle's radius.
     */
    private checkOverride(point: LatLon): CountryPolygon | null {
        let bestDist = Infinity;
        let bestMatch: CountryPolygon | null = null;

        for (const c of this.overrideColliders) {
            const dlat = point.lat - c.lat;
            const dlon = point.lon - c.lon;
            const dist = dlat * dlat + dlon * dlon;
            const scaledRadius = c.radiusDegSq * this.colliderMultiplierSq;

            if (dist < scaledRadius && dist < bestDist) {
                bestDist = dist;
                bestMatch = c.polygon;
            }
        }

        return bestMatch;
    }

    /**
     * Tier 3: catch — PIP found nothing, check all catch colliders.
     * Returns the closest match within any circle's radius.
     */
    private checkCatch(point: LatLon): CountryPolygon | null {
        let bestDist = Infinity;
        let bestMatch: CountryPolygon | null = null;

        for (const c of this.catchColliders) {
            const dlat = point.lat - c.lat;
            const dlon = point.lon - c.lon;
            const dist = dlat * dlat + dlon * dlon;
            const scaledRadius = c.radiusDegSq * this.colliderMultiplierSq;

            if (dist < scaledRadius && dist < bestDist) {
                bestDist = dist;
                bestMatch = c.polygon;
            }
        }

        return bestMatch;
    }

    /**
     * Register collider circles for a country.
     * @param isOverride true for surrounded countries (checked before PIP)
     */
    registerColliders(countryIndex: number, circles: LofiCircle[], isOverride: boolean): void {
        const polygon = this.polygons.find(p => p.countryIndex === countryIndex);
        if (!polygon) return;

        for (const circle of circles) {
            const entry: ColliderCircle = {
                lat: circle.lat,
                lon: circle.lon,
                radiusDegSq: circle.radiusDeg * circle.radiusDeg,
                countryIndex,
                polygon
            };

            if (isOverride) {
                this.overrideColliders.push(entry);
            }
            // All colliders go into catch (override countries are also findable when PIP misses)
            this.catchColliders.push(entry);
        }
    }

    /**
     * Get all polygons in the picker
     */
    getAllPolygons(): CountryPolygon[] {
        return this.polygons;
    }

    /**
     * Get statistics about the spatial index
     */
    getStats(): { polygonCount: number; cellCount: number; avgPolygonsPerCell: number } {
        let totalPolygons = 0;
        for (const cell of this.grid.values()) {
            totalPolygons += cell.polygons.length;
        }
        return {
            polygonCount: this.polygons.length,
            cellCount: this.grid.size,
            avgPolygonsPerCell: this.grid.size > 0 ? totalPolygons / this.grid.size : 0
        };
    }

    /**
     * Get collider debug info for visualization (dev only)
     */
    getColliderDebugInfo(): { overrides: { lat: number; lon: number; radiusDeg: number; countryIndex: number }[]; catches: { lat: number; lon: number; radiusDeg: number; countryIndex: number }[] } {
        const map = (c: ColliderCircle) => ({
            lat: c.lat,
            lon: c.lon,
            radiusDeg: Math.sqrt(c.radiusDegSq),
            countryIndex: c.countryIndex
        });
        return {
            overrides: this.overrideColliders.map(map),
            catches: this.catchColliders.map(map)
        };
    }

    /**
     * Clear all polygons from the spatial index
     */
    clear(): void {
        this.grid.clear();
        this.polygons = [];
        this.overrideColliders = [];
        this.catchColliders = [];
    }
}

// Re-export utility functions for backward compatibility
export { calculateBoundingBox, pointInPolygon, pointInBoundingBox } from './geo-math';
export { cartesianToLatLon } from './geo-math';
