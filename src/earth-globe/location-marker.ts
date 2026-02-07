/**
 * Earth Globe Module - Location Marker
 *
 * Creates hockey puck-style location markers for placing on the globe.
 */

import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

/**
 * Configuration for location marker appearance
 */
export interface LocationMarkerOptions {
    /** Radius of the marker (default: 0.03) */
    radius?: number;

    /** Height of the marker (default: 0.01) */
    height?: number;

    /** Fill color (default: white) */
    fillColor?: Color3;

    /** Stroke color (default: black) */
    strokeColor?: Color3;

    /** Stroke width as fraction of radius (default: 0.15) */
    strokeWidth?: number;
}

/**
 * Creates a hockey puck-style location marker
 */
export class LocationMarker {
    private scene: Scene;
    private mesh: Mesh;
    private strokeMesh: Mesh;

    constructor(scene: Scene, position: Vector3, normal: Vector3, options: LocationMarkerOptions = {}) {
        this.scene = scene;

        const radius = options.radius ?? 0.03;
        const height = options.height ?? 0.01;
        const fillColor = options.fillColor ?? new Color3(1, 1, 1);
        const strokeColor = options.strokeColor ?? new Color3(0, 0, 0);
        const strokeWidth = options.strokeWidth ?? 0.15;

        // Create main puck (white cylinder)
        this.mesh = MeshBuilder.CreateCylinder('locationMarker', {
            diameter: radius * 2,
            height: height,
            tessellation: 32
        }, scene);

        const fillMaterial = new StandardMaterial('markerFill', scene);
        fillMaterial.diffuseColor = fillColor;
        fillMaterial.emissiveColor = fillColor.scale(0.5); // Make it slightly glowing
        fillMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
        this.mesh.material = fillMaterial;

        // Create stroke (black cylinder, slightly larger)
        const strokeRadius = radius + (radius * strokeWidth);
        this.strokeMesh = MeshBuilder.CreateCylinder('locationMarkerStroke', {
            diameter: strokeRadius * 2,
            height: height * 0.95, // Slightly shorter so it doesn't poke through top/bottom
            tessellation: 32
        }, scene);

        const strokeMaterial = new StandardMaterial('markerStroke', scene);
        strokeMaterial.diffuseColor = strokeColor;
        strokeMaterial.emissiveColor = strokeColor.scale(0.3);
        strokeMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        this.strokeMesh.material = strokeMaterial;

        // Position and orient both meshes
        this.positionMarker(position, normal);

        // Parent the main mesh to the stroke so they move together
        this.mesh.parent = this.strokeMesh;

        // Offset the fill slightly outward along local Y to prevent z-fighting
        // (Cylinders are aligned along Y-axis, so this moves it away from the stroke)
        this.mesh.position.y = height * 0.5;
    }

    /**
     * Position the marker at the given location with the given orientation
     */
    private positionMarker(position: Vector3, normal: Vector3): void {
        // Position at the location
        this.strokeMesh.position = position;

        // Orient the cylinder so its top faces along the normal
        // Cylinders are created with Y-axis as height, so we need to align Y with normal
        const up = new Vector3(0, 1, 0);
        const axis = Vector3.Cross(up, normal);
        const angle = Math.acos(Vector3.Dot(up, normal));

        if (axis.length() > 0.001) {
            this.strokeMesh.rotationQuaternion = null; // Clear any existing quaternion
            this.strokeMesh.rotate(axis.normalize(), angle);
        }
    }

    /**
     * Update the marker's position and orientation
     */
    setPosition(position: Vector3, normal: Vector3): void {
        this.positionMarker(position, normal);
    }

    /**
     * Get the marker's mesh
     */
    getMesh(): Mesh {
        return this.strokeMesh;
    }

    /**
     * Show or hide the marker
     */
    setVisible(visible: boolean): void {
        this.strokeMesh.isVisible = visible;
        this.mesh.isVisible = visible;
    }

    /**
     * Dispose of the marker and free resources
     */
    dispose(): void {
        this.mesh.dispose();
        this.strokeMesh.dispose();
    }
}
