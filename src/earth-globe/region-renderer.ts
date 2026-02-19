/**
 * Earth Globe Module - Region Renderer
 *
 * Creates and manages region meshes from geographic data.
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import {
    EARTH_RADIUS,
    REGION_ALTITUDE,
    MAX_COUNTRIES,
    ANIMATION_AMPLITUDE,
    COUNTRY_HSV_SATURATION,
    COUNTRY_HSV_VALUE,
    TRIANGULATION_GRID_SPACING
} from './constants';
import { latLonToSphere, hsvToRgb, generateInteriorPoints, pointInPolygon2D } from './geo-math';
import { cdt2d, filterTriangles } from './triangulation';
import { ShaderFactory } from './shader-factory';
import { RegionPicker, calculateBoundingBox } from './region-picker';
import type { LatLonPoint, PolygonData, RegionData, CountryJSON, TriangulationResult } from './types';
import { isSmallCountry, isSurroundedCountry } from './small-countries';

/**
 * Region Renderer - Creates and manages region meshes
 */
export class RegionRenderer {
    private scene: Scene;
    private engine: AbstractEngine;
    private shaderFactory: ShaderFactory;

    /** Flat array of all polygon data */
    private polygonsData: PolygonData[] = [];

    /** Region-level metadata */
    private regionsData: RegionData[] = [];

    /** Total triangle count for statistics */
    private totalTriangleCount: number = 0;

    /** Merged mesh for regular region polygons */
    private mergedRegions: Mesh | null = null;

    /** Merged mesh for small region polygons (expanded via shader) */
    private mergedRegionsSmall: Mesh | null = null;

    constructor(scene: Scene, shaderFactory: ShaderFactory) {
        this.scene = scene;
        this.engine = scene.getEngine();
        this.shaderFactory = shaderFactory;
    }

    /**
     * Get all polygon data
     */
    getPolygonsData(): PolygonData[] {
        return this.polygonsData;
    }

    /**
     * Get all region data
     */
    getRegionsData(): RegionData[] {
        return this.regionsData;
    }

    /**
     * Get region count
     */
    getRegionCount(): number {
        return this.regionsData.length;
    }

    /**
     * Get polygon count
     */
    getPolygonCount(): number {
        return this.polygonsData.length;
    }

    /**
     * Get triangle count
     */
    getTriangleCount(): number {
        return this.totalTriangleCount;
    }

    /**
     * Get merged regions mesh
     */
    getMergedMesh(): Mesh | null {
        return this.mergedRegions;
    }

    /**
     * Get merged small regions mesh
     */
    getMergedSmallMesh(): Mesh | null {
        return this.mergedRegionsSmall;
    }

    /**
     * Get region by ISO2 code (or province id string like "US-0")
     */
    getRegionByISO2(iso2: string): RegionData | undefined {
        return this.regionsData.find(c => c.iso2 === iso2);
    }

    /**
     * Get region by index
     */
    getRegionByIndex(index: number): RegionData | undefined {
        return this.regionsData[index];
    }

    /**
     * Triangulate polygon using CDT2D
     */
    private triangulateWithCDT(
        points: { x: number; y: number }[],
        holes?: { x: number; y: number }[][],
        steinerPoints?: { x: number; y: number }[]
    ): TriangulationResult | null {
        try {
            const vertices: [number, number][] = [];
            const edges: [number, number][] = [];

            // Add boundary vertices and edges
            const boundaryStart = vertices.length;
            for (const p of points) {
                vertices.push([p.x, p.y]);
            }
            for (let i = 0; i < points.length; i++) {
                edges.push([boundaryStart + i, boundaryStart + ((i + 1) % points.length)]);
            }

            // Store hole polygons for filtering
            const holePolygons: [number, number][][] = [];

            // Add hole vertices and edges
            if (holes && holes.length > 0) {
                for (const hole of holes) {
                    if (hole.length >= 3) {
                        const holeStart = vertices.length;
                        const holeVertices: [number, number][] = [];
                        for (const p of hole) {
                            vertices.push([p.x, p.y]);
                            holeVertices.push([p.x, p.y]);
                        }
                        holePolygons.push(holeVertices);
                        for (let i = 0; i < hole.length; i++) {
                            edges.push([holeStart + i, holeStart + ((i + 1) % hole.length)]);
                        }
                    }
                }
            }

            // Add Steiner points
            if (steinerPoints && steinerPoints.length > 0) {
                for (const sp of steinerPoints) {
                    vertices.push([sp.x, sp.y]);
                }
            }

            // Run CDT
            let triangles = cdt2d(vertices, edges);

            // Filter to interior
            const boundaryForFilter: [number, number][] = points.map(p => [p.x, p.y]);
            triangles = filterTriangles(
                vertices,
                triangles,
                boundaryForFilter,
                holePolygons.length > 0 ? holePolygons : undefined
            );

            // Convert to flat indices
            const indices: number[] = [];
            for (const tri of triangles) {
                indices.push(tri[0], tri[1], tri[2]);
            }

            const verticesXY = vertices.map(v => ({ x: v[0], y: v[1] }));
            return { vertices: verticesXY, indices };
        } catch (error) {
            console.error('CDT triangulation failed:', error);
            return null;
        }
    }

    /**
     * Create a country mesh from lat/lon points
     */
    private createCountryMesh(
        latLonPoints: LatLonPoint[],
        altitude: number = 0,
        holes?: LatLonPoint[][]
    ): Mesh | null {
        if (latLonPoints.length < 3) {
            console.error("Not enough points to create mesh");
            return null;
        }

        try {
            const points2D = latLonPoints.map(p => ({ x: p.lon, y: p.lat }));
            const holes2D = holes ? holes.map(hole => hole.map(p => ({ x: p.lon, y: p.lat }))) : [];

            // Generate interior points for better triangulation
            const steinerPoints2D = generateInteriorPoints(latLonPoints, holes, TRIANGULATION_GRID_SPACING)
                .map(p => ({ x: p.lon, y: p.lat }));

            const cdtResult = this.triangulateWithCDT(points2D, holes2D, steinerPoints2D);

            if (!cdtResult || cdtResult.indices.length === 0) {
                console.error("CDT triangulation failed");
                return null;
            }

            // Convert back to lat/lon
            const finalVertices = cdtResult.vertices.map(v => ({ lat: v.y, lon: v.x }));

            // Reverse winding order
            const finalIndices: number[] = [];
            for (let i = 0; i < cdtResult.indices.length; i += 3) {
                finalIndices.push(
                    cdtResult.indices[i + 2],
                    cdtResult.indices[i + 1],
                    cdtResult.indices[i]
                );
            }

            // Convert to 3D
            const positions: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];

            for (const point of finalVertices) {
                const vertex = latLonToSphere(point.lat, point.lon, altitude);
                positions.push(vertex.x, vertex.y, vertex.z);

                const normal = vertex.normalizeToNew();
                normals.push(normal.x, normal.y, normal.z);

                // UV with v=1 so country surfaces animate fully
                uvs.push(0, 1);
            }

            const customMesh = new Mesh("country", this.scene);
            const vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = finalIndices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            vertexData.applyToMesh(customMesh);

            this.totalTriangleCount += finalIndices.length / 3;

            // Create temporary material
            const material = new StandardMaterial("countryMat", this.scene);
            const hue = (this.polygonsData.length % 360) / 360;
            const color = hsvToRgb(hue, COUNTRY_HSV_SATURATION, COUNTRY_HSV_VALUE);
            material.diffuseColor = color;
            material.specularColor = new Color3(0.1, 0.1, 0.1);
            customMesh.material = material;

            return customMesh;
        } catch (error) {
            console.error("Error creating country mesh:", error);
            return null;
        }
    }

    /**
     * Add a polygon to the renderer
     */
    addPolygon(
        coordinates: number[],
        countryIndex: number,
        holePolygons?: number[][][],
        small: boolean = false
    ): number | null {
        if (this.polygonsData.length >= MAX_COUNTRIES) {
            console.error("Max polygons reached");
            return null;
        }

        // Convert flat array to lat/lon points
        const latLonPoints: LatLonPoint[] = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            latLonPoints.push({ lat: coordinates[i], lon: coordinates[i + 1] });
        }

        // Convert holes
        const holeLatLonPoints: LatLonPoint[][] = [];
        if (holePolygons) {
            for (const holePoly of holePolygons) {
                const holePoints: LatLonPoint[] = [];
                for (const point of holePoly) {
                    holePoints.push({ lat: point[0], lon: point[1] });
                }
                holeLatLonPoints.push(holePoints);
            }
        }

        const mesh = this.createCountryMesh(latLonPoints, 0, holeLatLonPoints);

        if (mesh) {
            const polygonData: PolygonData = {
                mesh,
                extrudedBorder: null,
                borderPoints: latLonPoints,
                countryIndex,
                isSmall: small
            };

            const polygonIndex = this.polygonsData.length;
            this.polygonsData.push(polygonData);
            return polygonIndex;
        }

        return null;
    }

    /**
     * Set extruded border for a polygon
     */
    setPolygonBorder(polygonIndex: number, border: Mesh | null): void {
        if (polygonIndex >= 0 && polygonIndex < this.polygonsData.length) {
            this.polygonsData[polygonIndex].extrudedBorder = border;
        }
    }

    /**
     * Add region metadata
     */
    addRegion(data: RegionData): void {
        this.regionsData.push(data);
    }

    /**
     * Compute centroid on the sphere surface for a small country.
     * Averages all border points, projects back onto sphere.
     */
    private computeCentroid(polygonIndices: number[]): Vector3 {
        let sumX = 0, sumY = 0, sumZ = 0;
        let count = 0;

        for (const polyIdx of polygonIndices) {
            const polygon = this.polygonsData[polyIdx];
            for (const point of polygon.borderPoints) {
                const pos = latLonToSphere(point.lat, point.lon, 0);
                sumX += pos.x;
                sumY += pos.y;
                sumZ += pos.z;
                count++;
            }
        }

        const avg = new Vector3(sumX / count, sumY / count, sumZ / count);
        avg.normalize().scaleInPlace(EARTH_RADIUS);
        return avg;
    }

    /**
     * Merge and apply countryIndex attribute to a set of polygon meshes.
     * Optionally builds a countryPivot vec3 attribute using centroids.
     */
    private mergeMeshBucket(
        polygons: PolygonData[],
        material: ShaderMaterial,
        name: string,
        centroids?: Map<number, Vector3>
    ): Mesh | null {
        const meshes: Mesh[] = [];
        const vertexCounts: number[] = [];
        const countryIndicesPerMesh: number[] = [];

        for (const polygon of polygons) {
            if (polygon.mesh) {
                meshes.push(polygon.mesh);
                vertexCounts.push(polygon.mesh.getTotalVertices());
                countryIndicesPerMesh.push(polygon.countryIndex);
            }
        }

        if (meshes.length === 0) return null;

        const merged = Mesh.MergeMeshes(
            meshes,
            true,   // disposeSource
            true,   // allow32BitsIndices
            undefined,
            false,
            false
        );

        if (!merged) return null;

        merged.name = name;

        // Rebuild countryIndex attribute
        const totalVertices = merged.getTotalVertices();
        const countryIndices = new Float32Array(totalVertices);

        let vertexOffset = 0;
        for (let meshIdx = 0; meshIdx < vertexCounts.length; meshIdx++) {
            const vertexCount = vertexCounts[meshIdx];
            const countryIndex = countryIndicesPerMesh[meshIdx];
            for (let i = 0; i < vertexCount; i++) {
                countryIndices[vertexOffset + i] = countryIndex;
            }
            vertexOffset += vertexCount;
        }

        const buffer = new VertexBuffer(
            this.engine,
            countryIndices,
            "countryIndex",
            false, false, 1, false
        );
        merged.setVerticesBuffer(buffer);

        // Build countryPivot attribute if centroids provided
        if (centroids) {
            const pivotData = new Float32Array(totalVertices * 3);

            vertexOffset = 0;
            for (let meshIdx = 0; meshIdx < vertexCounts.length; meshIdx++) {
                const vertexCount = vertexCounts[meshIdx];
                const countryIndex = countryIndicesPerMesh[meshIdx];
                const centroid = centroids.get(countryIndex);
                const cx = centroid ? centroid.x : 0;
                const cy = centroid ? centroid.y : 0;
                const cz = centroid ? centroid.z : 0;

                for (let i = 0; i < vertexCount; i++) {
                    const base = (vertexOffset + i) * 3;
                    pivotData[base] = cx;
                    pivotData[base + 1] = cy;
                    pivotData[base + 2] = cz;
                }
                vertexOffset += vertexCount;
            }

            const pivotBuffer = new VertexBuffer(
                this.engine,
                pivotData,
                "countryPivot",
                false, false, 3, false
            );
            merged.setVerticesBuffer(pivotBuffer);
        }

        // Apply shader
        merged.material = material;

        // Update polygon references to point to merged mesh
        for (const polygon of polygons) {
            polygon.mesh = merged;
        }

        return merged;
    }

    /**
     * Merge all region meshes into merged meshes with animation support.
     * Partitions into regular and small region buckets.
     */
    mergeRegions(regularMaterial: ShaderMaterial, smallMaterial: ShaderMaterial): void {
        console.log('Merging region polygons...');
        const startTime = performance.now();

        // Partition polygons
        const regularPolygons: PolygonData[] = [];
        const smallPolygons: PolygonData[] = [];

        for (const polygon of this.polygonsData) {
            if (polygon.isSmall) {
                smallPolygons.push(polygon);
            } else {
                regularPolygons.push(polygon);
            }
        }

        this.mergedRegions = this.mergeMeshBucket(
            regularPolygons, regularMaterial, "mergedRegions"
        );

        if (smallPolygons.length > 0) {
            // Build centroid map from regionsData
            const centroids = new Map<number, Vector3>();
            for (const region of this.regionsData) {
                if (region.centroid) {
                    centroids.set(region.index, region.centroid);
                }
            }

            this.mergedRegionsSmall = this.mergeMeshBucket(
                smallPolygons, smallMaterial, "mergedRegionsSmall", centroids
            );
            console.log(`Small regions: ${smallPolygons.length} polygons in separate mesh`);
        }

        const totalMeshes = regularPolygons.length + smallPolygons.length;
        const endTime = performance.now();
        console.log(`Merged ${totalMeshes} region meshes in ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Load regions from pre-parsed items.
     * Items have { id, name, paths } where paths is JSON-stringified number[][][].
     * No holes/lakes/enclaves — simpler than loadFromURL.
     *
     * @param countryISO2       The parent country ISO2 code (e.g. "US")
     * @param items             Array of region items from the province JSON file
     * @param picker            RegionPicker to register polygons into
     * @param parentRegionIndex Index of the parent country in the country controller
     * @param onAdded           Optional callback per region added
     */
    async loadFromItems(
        countryISO2: string,
        items: Array<{ id: number; name: string; paths: string }>,
        picker: RegionPicker,
        parentRegionIndex: number,
        onAdded?: (region: RegionData) => void
    ): Promise<void> {
        const startTime = performance.now();
        let addedCount = 0;

        for (const item of items) {
            if (!item.paths || item.paths === '[]') continue;

            try {
                const paths = JSON.parse(item.paths) as number[][][];
                const polygonIndices: number[] = [];

                for (let polyIdx = 0; polyIdx < paths.length; polyIdx++) {
                    const polygon = paths[polyIdx];
                    if (polygon.length === 0) continue;

                    // Check antimeridian
                    let hasLargeJump = false;
                    for (let i = 1; i < polygon.length; i++) {
                        if (Math.abs(polygon[i][1] - polygon[i - 1][1]) > 180) {
                            hasLargeJump = true;
                            break;
                        }
                    }
                    if (hasLargeJump) continue;

                    const flatCoords: number[] = [];
                    const latLonPoints: { lat: number; lon: number }[] = [];
                    for (const point of polygon) {
                        flatCoords.push(point[0], point[1]);
                        latLonPoints.push({ lat: point[0], lon: point[1] });
                    }

                    if (flatCoords.length < 6) continue;

                    // Provinces are never "small countries" — always full-size
                    const polygonIndex = this.addPolygon(flatCoords, this.regionsData.length, [], false);
                    if (polygonIndex !== null) {
                        polygonIndices.push(polygonIndex);

                        picker.addPolygon({
                            iso2: `${countryISO2}-${item.id}`,
                            name: item.name,
                            regionIndex: this.regionsData.length,
                            polygonIndex: polyIdx,
                            points: latLonPoints,
                            bbox: calculateBoundingBox(latLonPoints),
                        });
                    }
                }

                if (polygonIndices.length > 0) {
                    const regionData: RegionData = {
                        name: item.name,
                        iso2: `${countryISO2}-${item.id}`,
                        index: this.regionsData.length,
                        polygonIndices,
                        neighbourCountries: [],
                        centroid: null,
                        parentRegionIndex,
                    };
                    this.regionsData.push(regionData);

                    if (onAdded) {
                        onAdded(regionData);
                    }

                    addedCount++;
                }
            } catch (e) {
                console.error(`Failed to add province ${item.name}:`, e);
            }
        }

        const endTime = performance.now();
        console.log(`Loaded ${addedCount} regions (${countryISO2}) with ${this.polygonsData.length} polygons in ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Load regions from a JSON URL and populate the region picker.
     * The URL should return a CountryJSON[] array.
     */
    async loadFromURL(
        url: string,
        picker: RegionPicker,
        onRegionAdded?: (region: RegionData) => void
    ): Promise<void> {
        const startTime = performance.now();

        const response = await fetch(url);
        const countries = await response.json() as CountryJSON[];
        console.log(`Fetched ${countries.length} regions from URL`);

        // Build enclave set
        const enclaveISO2Set = new Set<string>();
        for (const country of countries) {
            if (country.holes) {
                for (const holesInPolygon of Object.values(country.holes)) {
                    for (const enclaveISO2 of holesInPolygon) {
                        enclaveISO2Set.add(enclaveISO2);
                    }
                }
            }
        }

        let addedCount = 0;

        for (const country of countries) {
            if (!country.paths || country.paths === '[]') continue;

            try {
                const paths = JSON.parse(country.paths) as number[][][];
                const polygonIndices: number[] = [];

                // Lake indices
                const lakePolygonIndices = new Set<number>();
                if (country.lakes) {
                    for (const lakeIndices of Object.values(country.lakes)) {
                        for (const lakeIdx of lakeIndices) {
                            lakePolygonIndices.add(lakeIdx);
                        }
                    }
                }

                for (let polyIdx = 0; polyIdx < paths.length; polyIdx++) {
                    if (lakePolygonIndices.has(polyIdx)) continue;

                    const polygon = paths[polyIdx];
                    if (polygon.length === 0) continue;

                    // Check antimeridian
                    let hasLargeJump = false;
                    for (let i = 1; i < polygon.length; i++) {
                        if (Math.abs(polygon[i][1] - polygon[i - 1][1]) > 180) {
                            hasLargeJump = true;
                            break;
                        }
                    }
                    if (hasLargeJump) continue;

                    // Flatten coordinates
                    const flatCoords: number[] = [];
                    const latLonPoints: { lat: number; lon: number }[] = [];
                    for (const point of polygon) {
                        flatCoords.push(point[0], point[1]);
                        latLonPoints.push({ lat: point[0], lon: point[1] });
                    }

                    if (flatCoords.length < 6) continue;

                    // Get holes
                    const holePolygons: number[][][] = [];

                    // Enclave holes
                    const holesForPolygon = country.holes?.[polyIdx];
                    if (holesForPolygon && holesForPolygon.length > 0) {
                        for (const holeISO2 of holesForPolygon) {
                            const holeCountry = countries.find(c => c.iso2 === holeISO2);
                            if (holeCountry && holeCountry.paths && !holeCountry.skipHole) {
                                const holePaths = JSON.parse(holeCountry.paths) as number[][][];
                                for (const holePoly of holePaths) {
                                    holePolygons.push(holePoly);
                                }
                            }
                        }
                    }

                    // Lake holes
                    const lakesForPolygon = country.lakes?.[polyIdx];
                    if (lakesForPolygon && lakesForPolygon.length > 0) {
                        for (const lakeIdx of lakesForPolygon) {
                            const lakePoly = paths[lakeIdx];
                            if (lakePoly && lakePoly.length >= 3) {
                                holePolygons.push(lakePoly);
                            }
                        }
                    }

                    const small = isSmallCountry(country.iso2);
                    const polygonIndex = this.addPolygon(flatCoords, this.regionsData.length, holePolygons, small);
                    if (polygonIndex !== null) {
                        polygonIndices.push(polygonIndex);

                        // Add to picker
                        picker.addPolygon({
                            iso2: country.iso2,
                            name: country.name_en,
                            regionIndex: this.regionsData.length,
                            polygonIndex: polyIdx,
                            points: latLonPoints,
                            bbox: calculateBoundingBox(latLonPoints)
                        });
                    }
                }

                if (polygonIndices.length > 0) {
                    const small = isSmallCountry(country.iso2);
                    const surrounded = isSurroundedCountry(country.iso2);
                    const needsCentroid = small || surrounded;
                    const centroid = needsCentroid ? this.computeCentroid(polygonIndices) : null;

                    const regionData: RegionData = {
                        name: country.name_en,
                        iso2: country.iso2,
                        index: this.regionsData.length,
                        polygonIndices,
                        neighbourCountries: [],
                        centroid
                    };
                    this.regionsData.push(regionData);

                    if (onRegionAdded) {
                        onRegionAdded(regionData);
                    }

                    addedCount++;
                }
            } catch (e) {
                console.error('Failed to add region', country.name_en, ':', e);
            }
        }

        const endTime = performance.now();
        console.log(`Loaded ${addedCount} regions with ${this.polygonsData.length} polygons, ${this.totalTriangleCount} triangles in ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Dispose of all meshes
     */
    dispose(): void {
        if (this.mergedRegions) {
            this.mergedRegions.dispose();
            this.mergedRegions = null;
        }
        if (this.mergedRegionsSmall) {
            this.mergedRegionsSmall.dispose();
            this.mergedRegionsSmall = null;
        }
        this.polygonsData = [];
        this.regionsData = [];
    }
}
