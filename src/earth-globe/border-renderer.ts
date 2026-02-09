/**
 * Earth Globe Module - Border Renderer
 *
 * Creates and manages border meshes (extruded walls and segment tubes).
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import {
    EARTH_RADIUS,
    COUNTRY_ALTITUDE,
    EXTRUDED_BORDER_DEPTH,
    TUBE_RADIUS,
    TUBE_TESSELLATION,
    MAX_ANIMATION_COUNTRIES
} from './constants';
import { latLonToSphere } from './geo-math';
import { getSharedSegments } from './segment-loader';
import type { LatLonPoint, PolygonData, CountryData, SegmentData, Segment3D } from './types';

/**
 * Border Renderer - Creates extruded border walls and segment tubes
 */
export class BorderRenderer {
    private scene: Scene;
    private engine: AbstractEngine;

    /** Merged mesh for regular extruded borders */
    private mergedExtrudedBorders: Mesh | null = null;

    /** Merged mesh for small country extruded borders */
    private mergedExtrudedBordersSmall: Mesh | null = null;

    /** Merged mesh for segment borders */
    private mergedSegmentBorders: Mesh | null = null;

    /** Map from segment animation index to country indices */
    private segmentAnimationIndices: Map<number, number[]> = new Map();

    constructor(scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();
    }

    /**
     * Get segment animation index map (for syncing with country animations)
     */
    getSegmentAnimationIndices(): Map<number, number[]> {
        return this.segmentAnimationIndices;
    }

    /**
     * Get merged extruded borders mesh
     */
    getMergedExtrudedBorders(): Mesh | null {
        return this.mergedExtrudedBorders;
    }

    /**
     * Get merged segment borders mesh
     */
    getMergedSegmentBorders(): Mesh | null {
        return this.mergedSegmentBorders;
    }

    /**
     * Create extruded border for a polygon
     */
    createExtrudedBorder(
        latLonPoints: LatLonPoint[],
        altitude: number,
        countryIndex: number,
        isHole: boolean = false
    ): Mesh | null {
        try {
            // Convert to 3D
            const topPoints: Vector3[] = [];
            for (const point of latLonPoints) {
                const vertex = latLonToSphere(point.lat, point.lon, altitude);
                topPoints.push(vertex);
            }

            if (topPoints.length < 2) return null;

            // Calculate extrude ratio
            const bottomRadius = EARTH_RADIUS + altitude - EXTRUDED_BORDER_DEPTH;
            const topRadius = EARTH_RADIUS + altitude;
            const extrudeRatio = bottomRadius / topRadius;

            // Create bottom points
            const bottomPoints = topPoints.map(p => p.scale(extrudeRatio));

            // Build mesh
            const positions: number[] = [];
            const indices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];

            let cumulativeDistance = 0;
            const totalPoints = topPoints.length;

            for (let i = 0; i < totalPoints; i++) {
                const nextI = (i + 1) % totalPoints;

                const top = topPoints[i];
                const bottom = bottomPoints[i];
                const nextTop = topPoints[nextI];
                const nextBottom = bottomPoints[nextI];

                const edgeDistance = Vector3.Distance(top, nextTop);
                const startU = cumulativeDistance;
                cumulativeDistance += edgeDistance;
                const endU = cumulativeDistance;

                const baseIndex = positions.length / 3;

                // Vertices: bottom-left, top-left, bottom-right, top-right
                positions.push(bottom.x, bottom.y, bottom.z);
                positions.push(top.x, top.y, top.z);
                positions.push(nextBottom.x, nextBottom.y, nextBottom.z);
                positions.push(nextTop.x, nextTop.y, nextTop.z);

                // Normal
                const edge1 = nextTop.subtract(top);
                const edge2 = bottom.subtract(top);
                const normal = isHole
                    ? Vector3.Cross(edge2, edge1).normalize()
                    : Vector3.Cross(edge1, edge2).normalize();

                for (let j = 0; j < 4; j++) {
                    normals.push(normal.x, normal.y, normal.z);
                }

                // UVs
                uvs.push(startU, 0);
                uvs.push(startU, 1);
                uvs.push(endU, 0);
                uvs.push(endU, 1);

                // Triangles
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
            }

            const borderMesh = new Mesh("extrudedBorder", this.scene);
            const vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            vertexData.applyToMesh(borderMesh);

            // Temporary material
            const material = new StandardMaterial("extrudedBorderMat", this.scene);
            material.emissiveColor = new Color3(0.9, 0.9, 0.9);
            material.disableLighting = true;
            borderMesh.material = material;

            return borderMesh;
        } catch (error) {
            console.error("Error creating extruded border:", error);
            return null;
        }
    }

    /**
     * Create borders for a polygon including holes
     */
    createPolygonBorders(
        borderPoints: LatLonPoint[],
        holePoints: LatLonPoint[][] | undefined,
        countryIndex: number,
        altitude: number = 0
    ): Mesh | null {
        // Main border
        const extrudedBorder = this.createExtrudedBorder(borderPoints, altitude, countryIndex, false);

        // Hole borders
        const holeExtrudedBorders: Mesh[] = [];
        if (holePoints && holePoints.length > 0) {
            for (const holeLatLonPoints of holePoints) {
                const holeExtruded = this.createExtrudedBorder(holeLatLonPoints, altitude, countryIndex, true);
                if (holeExtruded) {
                    holeExtrudedBorders.push(holeExtruded);
                }
            }
        }

        // Merge if needed
        if (extrudedBorder && holeExtrudedBorders.length > 0) {
            const allBorders = [extrudedBorder, ...holeExtrudedBorders];
            return Mesh.MergeMeshes(allBorders, true, true, undefined, false, false);
        } else if (holeExtrudedBorders.length > 0) {
            return Mesh.MergeMeshes(holeExtrudedBorders, true, true, undefined, false, false);
        }

        return extrudedBorder;
    }

    /**
     * Merge a set of border meshes into one, applying countryIndex and optional countryPivot attributes.
     */
    private mergeBorderBucket(
        polygons: PolygonData[],
        material: ShaderMaterial,
        name: string,
        centroids?: Map<number, Vector3>
    ): Mesh | null {
        const meshes: Mesh[] = [];
        const vertexCounts: number[] = [];
        const countryIndicesPerMesh: number[] = [];

        for (const polygon of polygons) {
            if (polygon.extrudedBorder) {
                meshes.push(polygon.extrudedBorder);
                vertexCounts.push(polygon.extrudedBorder.getTotalVertices());
                countryIndicesPerMesh.push(polygon.countryIndex);
            }
        }

        if (meshes.length === 0) return null;

        const merged = Mesh.MergeMeshes(
            meshes, true, true, undefined, false, false
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
            this.engine, countryIndices, "countryIndex",
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
                this.engine, pivotData, "countryPivot",
                false, false, 3, false
            );
            merged.setVerticesBuffer(pivotBuffer);
        }

        merged.material = material;
        return merged;
    }

    /**
     * Merge all extruded borders into merged meshes, partitioned by regular/small.
     */
    mergeExtrudedBorders(
        polygonsData: PolygonData[],
        regularMaterial: ShaderMaterial,
        smallMaterial: ShaderMaterial,
        countriesData: CountryData[]
    ): void {
        console.log('Merging extruded borders...');
        const startTime = performance.now();

        // Partition
        const regularPolygons: PolygonData[] = [];
        const smallPolygons: PolygonData[] = [];

        for (const polygon of polygonsData) {
            if (polygon.extrudedBorder) {
                if (polygon.isSmall) {
                    smallPolygons.push(polygon);
                } else {
                    regularPolygons.push(polygon);
                }
            }
        }

        this.mergedExtrudedBorders = this.mergeBorderBucket(
            regularPolygons, regularMaterial, "mergedExtrudedBorders"
        );

        if (smallPolygons.length > 0) {
            // Build centroid map
            const centroids = new Map<number, Vector3>();
            for (const country of countriesData) {
                if (country.centroid) {
                    centroids.set(country.index, country.centroid);
                }
            }

            this.mergedExtrudedBordersSmall = this.mergeBorderBucket(
                smallPolygons, smallMaterial, "mergedExtrudedBordersSmall", centroids
            );
        }

        // Clear references
        for (const polygon of polygonsData) {
            polygon.extrudedBorder = null;
        }

        const totalMeshes = regularPolygons.length + smallPolygons.length;
        const endTime = performance.now();
        console.log(`Merged ${totalMeshes} extruded borders in ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Render segment borders (international borders)
     */
    renderSegmentBorders(
        segmentData: SegmentData,
        countriesData: CountryData[],
        shaderMaterial: ShaderMaterial
    ): void {
        console.log('Rendering segment borders...');
        const startTime = performance.now();

        const sharedSegments = getSharedSegments(segmentData);
        console.log(`Rendering ${sharedSegments.length} shared border segments`);

        this.segmentAnimationIndices.clear();

        const segmentTubes: Mesh[] = [];
        const vertexCounts: number[] = [];
        const segmentIndicesPerTube: number[] = [];

        for (let segmentIdx = 0; segmentIdx < sharedSegments.length; segmentIdx++) {
            const segment = sharedSegments[segmentIdx];
            if (segment.points.length < 2) continue;

            try {
                const tube = MeshBuilder.CreateTube(
                    "segmentBorder",
                    {
                        path: segment.points,
                        radius: TUBE_RADIUS * 0.8,
                        tessellation: TUBE_TESSELLATION,
                        cap: Mesh.CAP_ALL
                    },
                    this.scene
                );

                // Fix UVs for animation
                const uvs = tube.getVerticesData(VertexBuffer.UVKind);
                if (uvs) {
                    for (let i = 1; i < uvs.length; i += 2) {
                        uvs[i] = 1.0;
                    }
                    tube.setVerticesData(VertexBuffer.UVKind, uvs);
                }

                segmentTubes.push(tube);
                vertexCounts.push(tube.getTotalVertices());

                const segmentAnimationIndex = MAX_ANIMATION_COUNTRIES + segmentIdx;
                segmentIndicesPerTube.push(segmentAnimationIndex);

                // Map segment to countries
                const countryIndices: number[] = [];
                for (const countryCode of segment.countries) {
                    const countryData = countriesData.find(c => c.iso2 === countryCode);
                    if (countryData) {
                        countryIndices.push(countryData.index);
                    }
                }
                this.segmentAnimationIndices.set(segmentAnimationIndex, countryIndices);
            } catch (error) {
                console.error('Error creating segment tube:', error);
            }
        }

        if (segmentTubes.length === 0) {
            console.log('No segment tubes created');
            return;
        }

        this.mergedSegmentBorders = Mesh.MergeMeshes(
            segmentTubes,
            true, true, undefined, false, false
        );

        if (!this.mergedSegmentBorders) {
            console.error('Failed to merge segment borders');
            return;
        }

        this.mergedSegmentBorders.name = "mergedSegmentBorders";

        // Rebuild animation index attribute
        const totalVertices = this.mergedSegmentBorders.getTotalVertices();
        const segmentIndices = new Float32Array(totalVertices);

        let vertexOffset = 0;
        for (let tubeIdx = 0; tubeIdx < vertexCounts.length; tubeIdx++) {
            const vertexCount = vertexCounts[tubeIdx];
            const segmentAnimationIndex = segmentIndicesPerTube[tubeIdx];
            for (let i = 0; i < vertexCount; i++) {
                segmentIndices[vertexOffset + i] = segmentAnimationIndex;
            }
            vertexOffset += vertexCount;
        }

        const buffer = new VertexBuffer(
            this.engine,
            segmentIndices,
            "countryIndex",
            false, false, 1, false
        );
        this.mergedSegmentBorders.setVerticesBuffer(buffer);

        // Apply shader
        this.mergedSegmentBorders.material = shaderMaterial;

        const endTime = performance.now();
        console.log(`Rendered ${sharedSegments.length} segment borders in ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Dispose of all border meshes
     */
    dispose(): void {
        if (this.mergedExtrudedBorders) {
            this.mergedExtrudedBorders.dispose();
            this.mergedExtrudedBorders = null;
        }
        if (this.mergedExtrudedBordersSmall) {
            this.mergedExtrudedBordersSmall.dispose();
            this.mergedExtrudedBordersSmall = null;
        }
        if (this.mergedSegmentBorders) {
            this.mergedSegmentBorders.dispose();
            this.mergedSegmentBorders = null;
        }
        this.segmentAnimationIndices.clear();
    }
}
