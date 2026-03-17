/**
 * Earth Globe Module - Expansion Texture
 *
 * Manages a separate texture that stores per-country expansion factors.
 * This texture is ONLY used by the small country shader, keeping it completely
 * isolated from the main animation texture used by regular countries.
 *
 * The texture is a 1D texture (width x 1) where each pixel stores:
 * - R channel: expansion factor (stored as expansion/255, max expansion 255x)
 * - G, B, A channels: unused
 */

import { Scene } from '@babylonjs/core/scene';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ANIMATION_TEXTURE_WIDTH } from './constants';

// Expansion encoding: store as value/255, shader multiplies by 255
// This allows expansion range of 1.0 to 255.0
// At byte storage: 1.0 → 1/255 * 255 = 1 (minimum non-zero value)
// Monaco needs ~100x expansion, which fits: 100/255 * 255 = 100
const EXPANSION_DIVISOR = 255.0;

/**
 * Expansion Texture Manager
 * Manages per-country expansion values stored in a separate GPU texture
 * for small countries only
 */
export class ExpansionTexture {
    private scene: Scene;
    private texture: DynamicTexture;
    private buffer: Uint8ClampedArray;

    /** Expansion factor for each small country */
    private expansionData: Float32Array;

    /** Number of entries used in the texture */
    private entriesUsed: number = 0;

    constructor(scene: Scene, name: string = "expansionTexture") {
        this.scene = scene;

        // Create 1D texture (width x 1) to store expansion values
        this.texture = new DynamicTexture(
            name,
            { width: ANIMATION_TEXTURE_WIDTH, height: 1 },
            scene,
            false
        );

        // Pre-allocate buffer for updates (only R channel used)
        this.buffer = new Uint8ClampedArray(ANIMATION_TEXTURE_WIDTH * 4);

        // Initialize data array
        this.expansionData = new Float32Array(ANIMATION_TEXTURE_WIDTH);
        // Default: expansion = 1.0 (no expansion)
        // Stored as 1.0 / EXPANSION_DIVISOR for texture encoding
        this.expansionData.fill(1.0 / EXPANSION_DIVISOR);
    }

    /**
     * Get the underlying DynamicTexture
     */
    getTexture(): DynamicTexture {
        return this.texture;
    }

    /**
     * Set the number of entries actively used in the texture
     */
    setEntriesUsed(count: number): void {
        this.entriesUsed = Math.min(count, ANIMATION_TEXTURE_WIDTH);
        this.update();
    }

    /**
     * Set expansion value for an index
     * @param index Country index
     * @param expansion Expansion factor (1.0 = normal, >1 = magnified, max 255x)
     */
    setExpansion(index: number, expansion: number): void {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            // Encode: divide by EXPANSION_DIVISOR to fit in 0-1 range
            this.expansionData[index] = Math.max(0, Math.min(1, expansion / EXPANSION_DIVISOR));
        }
    }

    /**
     * Get expansion value for an index
     * @returns Expansion factor (1.0 = normal, max 255x)
     */
    getExpansion(index: number): number {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            // Decode: multiply by EXPANSION_DIVISOR
            return this.expansionData[index] * EXPANSION_DIVISOR;
        }
        return 1.0;
    }

    /**
     * Get direct access to expansion data array
     * Use with care - call update() after modifications
     */
    getExpansionData(): Float32Array {
        return this.expansionData;
    }

    /**
     * Update the GPU texture from the data array
     * Call this after modifying expansion values
     */
    update(): void {
        // Update buffer from data array (only R channel)
        for (let i = 0; i < this.entriesUsed; i++) {
            const pixelIndex = i * 4;
            this.buffer[pixelIndex] = this.expansionData[i] * 255;         // R = expansion
            this.buffer[pixelIndex + 1] = 0;  // G unused
            this.buffer[pixelIndex + 2] = 0;  // B unused
            this.buffer[pixelIndex + 3] = 255;  // A = fully opaque
        }

        // Update texture from buffer
        const context = this.texture.getContext() as CanvasRenderingContext2D;
        const imageData = context.createImageData(ANIMATION_TEXTURE_WIDTH, 1);
        imageData.data.set(this.buffer);
        context.putImageData(imageData, 0, 0);
        this.texture.update(true); // Pass true to force immediate update
    }

    /**
     * Reset all values to defaults (expansion = 1.0)
     */
    reset(): void {
        this.expansionData.fill(1.0 / EXPANSION_DIVISOR);
        this.update();
    }

    /**
     * Dispose texture resources
     */
    dispose(): void {
        this.texture.dispose();
    }
}
