/**
 * Earth Globe Module - Animation Texture
 *
 * Manages the dynamic texture that stores per-country animation data.
 * The texture is a 1D texture (width x 1) where each pixel stores:
 * - R channel: altitude animation value (0-1)
 * - G channel: state enum (0.00=Normal, 0.25=Disabled, 0.50=Cleared)
 * - B channel: blend factor (0.0=full state effect, 1.0=normal appearance)
 * - A channel: reserved (255)
 */

// State constants for G channel encoding
export const STATE_NORMAL = 0.0;
export const STATE_DISABLED = 0.25;
export const STATE_CLEARED = 0.50;

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

    /** State values for each country (STATE_NORMAL, STATE_DISABLED, STATE_CLEARED) */
    private stateData: Float32Array;

    /** Blend factor for each country (0.0 = full state effect, 1.0 = normal appearance) */
    private blendData: Float32Array;

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
        this.stateData = new Float32Array(ANIMATION_TEXTURE_WIDTH);
        this.blendData = new Float32Array(ANIMATION_TEXTURE_WIDTH);
        // Default: STATE_NORMAL (0.0), blend = 1.0 (normal appearance)
        this.stateData.fill(STATE_NORMAL);
        this.blendData.fill(1.0);
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
     * Set state value for an index
     * @param index Country index
     * @param state One of STATE_NORMAL (0.0), STATE_DISABLED (0.25), STATE_CLEARED (0.50)
     */
    setState(index: number, state: number): void {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            this.stateData[index] = Math.max(0, Math.min(1, state));
        }
    }

    /**
     * Get state value for an index
     */
    getState(index: number): number {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            return this.stateData[index];
        }
        return STATE_NORMAL;
    }

    /**
     * Set blend factor for an index
     * @param index Country index
     * @param blend Value between 0 (full state effect) and 1 (normal appearance)
     */
    setBlend(index: number, blend: number): void {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            this.blendData[index] = Math.max(0, Math.min(1, blend));
        }
    }

    /**
     * Get blend factor for an index
     */
    getBlend(index: number): number {
        if (index >= 0 && index < ANIMATION_TEXTURE_WIDTH) {
            return this.blendData[index];
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
     * Get direct access to state data array
     * Use with care - call update() after modifications
     */
    getStateData(): Float32Array {
        return this.stateData;
    }

    /**
     * Get direct access to blend data array
     * Use with care - call update() after modifications
     */
    getBlendData(): Float32Array {
        return this.blendData;
    }

    /**
     * Update the GPU texture from the data arrays
     * Call this after modifying altitude, state, or blend values
     */
    update(): void {
        // Update buffer from data arrays
        for (let i = 0; i < this.entriesUsed; i++) {
            const pixelIndex = i * 4;
            this.buffer[pixelIndex] = this.altitudeData[i] * 255;     // R = altitude
            this.buffer[pixelIndex + 1] = this.stateData[i] * 255;    // G = state
            this.buffer[pixelIndex + 2] = this.blendData[i] * 255;    // B = blend
            // A already 255
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
        this.stateData.fill(STATE_NORMAL);
        this.blendData.fill(1.0);
        this.update();
    }

    /**
     * Set all altitudes to a specific value
     */
    setAllAltitudes(value: number): void {
        this.altitudeData.fill(Math.max(0, Math.min(1, value)));
    }

    /**
     * Set all states to a specific value
     */
    setAllStates(state: number): void {
        this.stateData.fill(Math.max(0, Math.min(1, state)));
    }

    /**
     * Set all blend factors to a specific value
     */
    setAllBlends(blend: number): void {
        this.blendData.fill(Math.max(0, Math.min(1, blend)));
    }

    /**
     * Dispose of the texture
     */
    dispose(): void {
        this.texture.dispose();
    }
}
