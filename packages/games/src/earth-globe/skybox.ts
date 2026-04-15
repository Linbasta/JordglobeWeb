/**
 * Earth Globe Module - Skybox
 *
 * Creates the space background skybox.
 */

import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import { SKYBOX_SIZE, DEFAULT_ASSETS } from './constants';
import type { AssetPaths } from './types';

/**
 * Skybox - Space background
 */
export class Skybox {
    private scene: Scene;
    private mesh: Mesh;
    private material: StandardMaterial;

    constructor(scene: Scene, assets: AssetPaths = {}) {
        this.scene = scene;

        // Create skybox cube
        this.mesh = MeshBuilder.CreateBox("skyBox", { size: SKYBOX_SIZE }, scene);

        // Create skybox material
        this.material = new StandardMaterial("skyBoxMaterial", scene);
        this.material.backFaceCulling = false;
        this.material.disableLighting = true;

        // Get texture paths
        const midTexture = assets.spaceTextureMid || DEFAULT_ASSETS.spaceTextureMid;
        const topTexture = assets.spaceTextureTop || DEFAULT_ASSETS.spaceTextureTop;
        const bottomTexture = assets.spaceTextureBottom || DEFAULT_ASSETS.spaceTextureBottom;

        // Create reflection texture for the skybox
        // CubeTexture order: +X, +Y, +Z, -X, -Y, -Z (right, top, front, left, bottom, back)
        const reflectionTexture = new CubeTexture("", scene, null, false, [
            midTexture,      // positive X (right)
            topTexture,      // positive Y (top)
            midTexture,      // positive Z (front)
            midTexture,      // negative X (left)
            bottomTexture,   // negative Y (bottom)
            midTexture       // negative Z (back)
        ]);

        reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        this.material.reflectionTexture = reflectionTexture;

        this.mesh.material = this.material;
        this.mesh.infiniteDistance = true;  // Skybox follows camera

        console.log('Skybox created with space textures');
    }

    /**
     * Get the skybox mesh
     */
    getMesh(): Mesh {
        return this.mesh;
    }

    /**
     * Get the skybox material
     */
    getMaterial(): StandardMaterial {
        return this.material;
    }

    /**
     * Dispose of the skybox
     */
    dispose(): void {
        this.mesh.dispose();
        this.material.dispose();
    }
}
