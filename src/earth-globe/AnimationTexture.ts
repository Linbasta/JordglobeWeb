/**
 * Earth Globe Module - Animation Texture
 *
 * Manages the dynamic texture that stores per-country animation data.
 * The texture is a 1D texture (width x 1) where each pixel stores:
 * - R channel: altitude animation value (0-1)
 * - G channel: saturation value (0 = grayscale, 1 = full color)
 */

import { Scene } from '@babylonjs/core/scene';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ANIMATION_TEXTURE_WIDTH } from './constants';

/**
 * Animation Texture Manager
 * Manages per-country animation values stored in a GPU texture
 */
export class AnimationTexture {
    private scene: Scene;
    private texture: DynamicTexture;
    private buffer: Uint8ClampedArray;

    /** Animation/altitude values for each country (index 0 to countryCount-1) */
    private altitudeData: Float32Array;

    /** Saturation values for each country (1.0 = colored, 0.0 = grayscale) */
    private saturationData: Float32Array;

    /** Number of entries used in the texture */
    private entriesUsed: number = 0;

    constructor(scene: Scene) {
        this.scene = scene;

        // Create 1D texture (width x 1) to store animation values
        this.texture = new DynamicTexture(
            "animationTexture",
            { width: ANIMATION_TEXTURE_WIDTH, height: 1 },
            scene,
            false
        );

        // Pre-allocate buffer for updates
        this.buffer = new Uint8ClampedArray(ANIMATION_TEXTURE_WIDTH * 4);

        // Initialize alpha channel to 255
        for (let i = 0; i < this.buffer.length; i += 4) {
            this.buffer[i + 3] = 255;
        }

        // Initialize data arrays
        this.altitudeData = new Float32Array(ANIMATION_TEXTURE_WIDTH);
        this.saturationData = new Float32Array(ANIMATION_TEXTURE_WIDTH);
        this.saturationData.fill(1.0); // Default to full saturation
    }

    /**
     * Get the underlying DynamicTexture
     */
    getTexture(): DynamicTexture {
        return this.texture;
    }

    /**
     * Set the number of entries actively used in the texture
     * This is typically countryCount + segmentCount
     */
    setEntriesUsed(count: number): void {
        this.entriesUsed = Math.min(count, ANIMATION_TEXTURE_WIDTH);
    }

    /**
     * Set altitude value for an index
     * @param index Country or segment index
     * @param altitude Value between 0 and 1
     */
    setAltitude(index: number, altitude: number): void {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            this.altitudeData[index] = Math.max(0, Math.min(1, altitude));
        }
    }

    /**
     * Get altitude value for an index
     */
    getAltitude(index: number): number {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            return this.altitudeData[index];
        }
        return 0;
    }

    /**
     * Set saturation value for an index
     * @param index Country index
     * @param saturation Value between 0 (grayscale) and 1 (full color)
     */
    setSaturation(index: number, saturation: number): void {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            this.saturationData[index] = Math.max(0, Math.min(1, saturation));
        }
    }

    /**
     * Get saturation value for an index
     */
    getSaturation(index: number): number {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            return this.saturationData[index];
        }
        return 1.0;
    }

    /**
     * Get direct access to altitude data array
     * Use with care - call update() after modifications
     */
    getAltitudeData(): Float32Array {
        return this.altitudeData;
    }

    /**
     * Get direct access to saturation data array
     * Use with care - call update() after modifications
     */
    getSaturationData(): Float32Array {
        return this.saturationData;
    }

    /**
     * Update the GPU texture from the data arrays
     * Call this after modifying altitude or saturation values
     */
    update(): void {
        // Update buffer from data arrays
        for (let i = 0; i < this.entriesUsed; i++) {
            const pixelIndex = i * 4;
            this.buffer[pixelIndex] = this.altitudeData[i] * 255;     // R = altitude
            this.buffer[pixelIndex + 1] = this.saturationData[i] * 255; // G = saturation
            // B already 0, A already 255
        }

        // Update texture from buffer
        const context = this.texture.getContext() as CanvasRenderingContext2D;
        const imageData = context.createImageData(ANIMATION_TEXTURE_WIDTH, 1);
        imageData.data.set(this.buffer);
        context.putImageData(imageData, 0, 0);
        this.texture.update();
    }

    /**
     * Reset all values to defaults
     */
    reset(): void {
        this.altitudeData.fill(0);
        this.saturationData.fill(1.0);
        this.update();
    }

    /**
     * Set all altitudes to a specific value
     */
    setAllAltitudes(value: number): void {
        this.altitudeData.fill(Math.max(0, Math.min(1, value)));
    }

    /**
     * Set all saturations to a specific value
     */
    setAllSaturations(value: number): void {
        this.saturationData.fill(Math.max(0, Math.min(1, value)));
    }

    /**
     * Dispose of the texture
     */
    dispose(): void {
        this.texture.dispose();
    }
}
