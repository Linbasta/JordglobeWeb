/**
 * Earth Globe Module - Location Marker Pool
 *
 * Manages a pool of reusable location markers using instancing for efficient batching.
 * All instances are automatically batched by Babylon.js for optimal rendering performance.
 */

import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3, Quaternion } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

/**
 * Configuration for the marker pool
 */
export interface LocationMarkerPoolOptions {
    /** Number of markers to create in the pool (default: 200) */
    poolSize?: number;

    /** Radius of each marker (default: 0.03) */
    radius?: number;

    /** Height of each marker (default: 0.01) */
    height?: number;

    /** Fill color (default: white) */
    fillColor?: Color3;

    /** Stroke color (default: black) */
    strokeColor?: Color3;

    /** Stroke width as fraction of radius (default: 0.15) */
    strokeWidth?: number;
}

interface PooledMarker {
    id: number;
    strokeInstance: InstancedMesh;
    fillInstance: InstancedMesh;
    inUse: boolean;
}

/**
 * Manages a pool of reusable location markers using GPU instancing
 * All markers are batched automatically for optimal rendering performance
 */
export class LocationMarkerPool {
    private scene: Scene;
    private markers: PooledMarker[] = [];

    // Source meshes for instancing
    private sourceFillMesh: Mesh;
    private sourceStrokeMesh: Mesh;

    private radius: number;
    private height: number;

    constructor(scene: Scene, options: LocationMarkerPoolOptions = {}) {
        this.scene = scene;

        const poolSize = options.poolSize ?? 200;
        this.radius = options.radius ?? 0.03;
        this.height = options.height ?? 0.01;
        const fillColor = options.fillColor ?? new Color3(1, 1, 1);
        const strokeColor = options.strokeColor ?? new Color3(0, 0, 0);
        const strokeWidth = options.strokeWidth ?? 0.15;

        // Create source meshes (these won't be rendered, only their instances)
        this.sourceFillMesh = this.createSourceFillMesh(this.radius, this.height, fillColor);
        this.sourceStrokeMesh = this.createSourceStrokeMesh(this.radius, this.height, strokeColor, strokeWidth);

        // Hide source meshes (only instances will be visible)
        this.sourceFillMesh.setEnabled(false);
        this.sourceStrokeMesh.setEnabled(false);

        // Create pool of marker instances
        for (let i = 0; i < poolSize; i++) {
            const strokeInstance = this.sourceStrokeMesh.createInstance(`markerStroke_${i}`);
            const fillInstance = this.sourceFillMesh.createInstance(`markerFill_${i}`);

            // Parent fill to stroke so they move together
            fillInstance.parent = strokeInstance;

            // Offset fill outward to prevent z-fighting
            fillInstance.position.y = this.height * 0.5;

            // Start hidden
            strokeInstance.setEnabled(false);

            this.markers.push({
                id: i,
                strokeInstance,
                fillInstance,
                inUse: false
            });
        }

        console.log(`LocationMarkerPool: Created ${poolSize} markers (batched rendering enabled)`);
    }

    /**
     * Create the source mesh for marker fills (white cylinder)
     */
    private createSourceFillMesh(radius: number, height: number, fillColor: Color3): Mesh {
        const mesh = MeshBuilder.CreateCylinder('markerFillSource', {
            diameter: radius * 2,
            height: height,
            tessellation: 32
        }, this.scene);

        const material = new StandardMaterial('markerFillMaterial', this.scene);
        material.diffuseColor = fillColor;
        material.emissiveColor = fillColor.scale(0.5);
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        mesh.material = material;

        return mesh;
    }

    /**
     * Create the source mesh for marker strokes (black cylinder)
     */
    private createSourceStrokeMesh(radius: number, height: number, strokeColor: Color3, strokeWidth: number): Mesh {
        const strokeRadius = radius + (radius * strokeWidth);
        const mesh = MeshBuilder.CreateCylinder('markerStrokeSource', {
            diameter: strokeRadius * 2,
            height: height * 0.95,
            tessellation: 32
        }, this.scene);

        const material = new StandardMaterial('markerStrokeMaterial', this.scene);
        material.diffuseColor = strokeColor;
        material.emissiveColor = strokeColor.scale(0.3);
        material.specularColor = new Color3(0.1, 0.1, 0.1);
        mesh.material = material;

        return mesh;
    }

    /**
     * Acquire a marker from the pool and position it
     * @returns Marker ID, or -1 if pool is exhausted
     */
    acquireMarker(position: Vector3, normal: Vector3): number {
        // Find first available marker
        const marker = this.markers.find(m => !m.inUse);

        if (!marker) {
            console.warn('LocationMarkerPool: No available markers in pool');
            return -1;
        }

        marker.inUse = true;
        this.positionMarker(marker, position, normal);
        marker.strokeInstance.setEnabled(true);

        return marker.id;
    }

    /**
     * Release a marker back to the pool
     */
    releaseMarker(id: number): void {
        const marker = this.markers[id];
        if (!marker) {
            console.warn(`LocationMarkerPool: Invalid marker ID ${id}`);
            return;
        }

        marker.inUse = false;
        marker.strokeInstance.setEnabled(false);
    }

    /**
     * Update a marker's position
     */
    updateMarkerPosition(id: number, position: Vector3, normal: Vector3): void {
        const marker = this.markers[id];
        if (!marker || !marker.inUse) {
            console.warn(`LocationMarkerPool: Cannot update marker ${id} (not in use)`);
            return;
        }

        this.positionMarker(marker, position, normal);
    }

    /**
     * Position and orient a marker
     */
    private positionMarker(marker: PooledMarker, position: Vector3, normal: Vector3): void {
        // Position at the location
        marker.strokeInstance.position = position;

        // Orient the cylinder so its top faces along the normal
        // Cylinders are created with Y-axis as height, so we need to align Y with normal
        const up = new Vector3(0, 1, 0);
        const axis = Vector3.Cross(up, normal);
        const angle = Math.acos(Vector3.Dot(up, normal));

        if (axis.length() > 0.001) {
            // Create rotation quaternion
            const quaternion = Quaternion.RotationAxis(axis.normalize(), angle);
            marker.strokeInstance.rotationQuaternion = quaternion;
        } else {
            // Normal is aligned with up or down
            marker.strokeInstance.rotationQuaternion = Quaternion.Identity();
        }
    }

    /**
     * Release all markers
     */
    releaseAll(): void {
        this.markers.forEach(marker => {
            if (marker.inUse) {
                this.releaseMarker(marker.id);
            }
        });
    }

    /**
     * Get pool statistics
     */
    getStats(): { total: number; inUse: number; available: number } {
        const inUse = this.markers.filter(m => m.inUse).length;
        return {
            total: this.markers.length,
            inUse,
            available: this.markers.length - inUse
        };
    }

    /**
     * Update the scale of all markers based on zoom
     * @param scale Scale factor (1.0 = normal size)
     */
    updateScale(scale: number): void {
        // Update all marker instances (both in use and available)
        this.markers.forEach(marker => {
            // Scale the stroke instance (parent)
            marker.strokeInstance.scaling.setAll(scale);
        });
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        // Dispose instances
        this.markers.forEach(marker => {
            marker.fillInstance.dispose();
            marker.strokeInstance.dispose();
        });

        // Dispose source meshes
        this.sourceFillMesh.dispose();
        this.sourceStrokeMesh.dispose();

        this.markers = [];
    }
}
