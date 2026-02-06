/**
 * Earth Globe Module - Outline Renderer
 *
 * Creates and manages outline tube meshes around selected countries.
 * Uses the same tube technique as segment borders but thicker and with a distinctive color.
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import {
    OUTLINE_TUBE_RADIUS,
    TUBE_TESSELLATION
} from './constants';
import { latLonToSphere } from './GeoMath';
import type { LatLonPoint } from './types';

/**
 * Outline Renderer - Creates tube outlines around selected countries
 */
export class OutlineRenderer {
    private scene: Scene;
    private engine: AbstractEngine;

    /** Current outline mesh (merged from all polygon tubes) */
    private outlineMesh: Mesh | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();
    }

    /**
     * Show an outline around a country's polygons
     * @param countryIndex The country animation index (for vertex attribute)
     * @param borderPointArrays Array of border point arrays (one per polygon)
     * @param material The shader material to apply
     */
    showOutline(
        countryIndex: number,
        borderPointArrays: LatLonPoint[][],
        material: ShaderMaterial
    ): void {
        // Clear any existing outline
        this.clearOutline();

        const tubes: Mesh[] = [];
        const vertexCounts: number[] = [];

        for (const borderPoints of borderPointArrays) {
            if (borderPoints.length < 3) continue;

            // Convert lat/lon to 3D positions
            const path = borderPoints.map(p => latLonToSphere(p.lat, p.lon, 0));
            // Close the loop
            path.push(path[0].clone());

            try {
                const tube = MeshBuilder.CreateTube(
                    "outlineTube",
                    {
                        path,
                        radius: OUTLINE_TUBE_RADIUS,
                        tessellation: TUBE_TESSELLATION,
                        cap: Mesh.NO_CAP
                    },
                    this.scene
                );

                // Set UV.y = 1.0 so outline fully participates in altitude animation
                const uvs = tube.getVerticesData(VertexBuffer.UVKind);
                if (uvs) {
                    for (let i = 1; i < uvs.length; i += 2) {
                        uvs[i] = 1.0;
                    }
                    tube.setVerticesData(VertexBuffer.UVKind, uvs);
                }

                tubes.push(tube);
                vertexCounts.push(tube.getTotalVertices());
            } catch (error) {
                console.error('Error creating outline tube:', error);
            }
        }

        if (tubes.length === 0) return;

        // Merge all tubes into a single mesh
        this.outlineMesh = Mesh.MergeMeshes(
            tubes,
            true, true, undefined, false, false
        );

        if (!this.outlineMesh) {
            console.error('Failed to merge outline tubes');
            return;
        }

        this.outlineMesh.name = "countryOutline";

        // Set countryIndex attribute on all vertices
        const totalVertices = this.outlineMesh.getTotalVertices();
        const countryIndices = new Float32Array(totalVertices);
        countryIndices.fill(countryIndex);

        const buffer = new VertexBuffer(
            this.engine,
            countryIndices,
            "countryIndex",
            false, false, 1, false
        );
        this.outlineMesh.setVerticesBuffer(buffer);

        // Apply shader material
        this.outlineMesh.material = material;
    }

    /**
     * Clear the current outline
     */
    clearOutline(): void {
        if (this.outlineMesh) {
            this.outlineMesh.dispose();
            this.outlineMesh = null;
        }
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.clearOutline();
    }
}
