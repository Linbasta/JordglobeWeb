/**
 * Earth Globe Module - Country Picker
 *
 * Efficient point-in-polygon detection for countries using a grid-based spatial index.
 * This avoids checking every country polygon for each query.
 */

import { PICKER_CELL_SIZE } from './constants';
import { pointInBoundingBox, pointInPolygon, calculateBoundingBox } from './geo-math';
import type { LatLon, CountryPolygon, BoundingBox, GridCell } from './types';

/**
 * Spatial index for fast country polygon lookup
 */
interface SmallCountryCentroid {
    countryIndex: number;
    lat: number;
    lon: number;
    radiusDeg: number;
    polygon: CountryPolygon;  // first polygon, returned on proximity match
}

export class CountryPicker {
    private grid: Map<string, GridCell>;
    private cellSize: number;
    private polygons: CountryPolygon[];
    private smallCentroids: SmallCountryCentroid[] = [];

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
        // Find which grid cell this point is in
        const cellX = Math.floor(point.lon / this.cellSize);
        const cellY = Math.floor(point.lat / this.cellSize);
        const key = `${cellX},${cellY}`;

        const cell = this.grid.get(key);
        if (!cell) {
            return null; // No countries in this cell
        }

        // Check each polygon in this cell
        for (const polygon of cell.polygons) {
            // Quick bounding box check
            if (!pointInBoundingBox(point, polygon.bbox)) {
                continue;
            }

            // Detailed point-in-polygon check
            if (pointInPolygon(point, polygon.points)) {
                return polygon;
            }
        }

        // Fallback: check proximity to small country centroids
        return this.checkSmallCountryCentroids(point);
    }

    /**
     * Check if a point is near any small country centroid
     */
    private checkSmallCountryCentroids(point: LatLon): CountryPolygon | null {
        let bestDist = Infinity;
        let bestMatch: CountryPolygon | null = null;

        for (const entry of this.smallCentroids) {
            const dlat = point.lat - entry.lat;
            const dlon = point.lon - entry.lon;
            const dist = dlat * dlat + dlon * dlon;
            const radiusSq = entry.radiusDeg * entry.radiusDeg;

            if (dist < radiusSq && dist < bestDist) {
                bestDist = dist;
                bestMatch = entry.polygon;
            }
        }

        return bestMatch;
    }

    /**
     * Register a small country centroid for enlarged hit detection
     */
    registerSmallCountryCentroid(countryIndex: number, lat: number, lon: number, radiusDeg: number): void {
        // Find the first polygon for this country
        const polygon = this.polygons.find(p => p.countryIndex === countryIndex);
        if (!polygon) return;

        this.smallCentroids.push({ countryIndex, lat, lon, radiusDeg, polygon });
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
     * Clear all polygons from the spatial index
     */
    clear(): void {
        this.grid.clear();
        this.polygons = [];
    }
}

// Re-export utility functions for backward compatibility
export { calculateBoundingBox, pointInPolygon, pointInBoundingBox } from './geo-math';
export { cartesianToLatLon } from './geo-math';
