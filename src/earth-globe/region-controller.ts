/**
 * Earth Globe Module - Region Controller
 *
 * Wraps RegionRenderer, RegionAnimator, and RegionPicker into a single
 * controller. EarthGlobe holds two instances: countryController and
 * provinceController. The flat EarthGlobeAPI delegates to the active one.
 *
 * Phase 1 note: AnimationTexture is owned by EarthGlobe and passed in.
 * This keeps Phase 1 a pure refactor with zero behavior change.
 */

import type { Scene } from '@babylonjs/core/scene';

import { AnimationTexture } from './animation-texture';
import { RegionRenderer } from './region-renderer';
import { RegionAnimator } from './region-animator';
import { RegionPicker } from './region-picker';
import { ShaderFactory } from './shader-factory';
import { PICKER_CELL_SIZE } from './constants';
import type { CountryData, CountryPolygon, RegionType } from './types';

export type { RegionType };

/**
 * Region Controller — owns one Renderer, one Animator, one Picker.
 * The AnimationTexture is shared with EarthGlobe (passed in).
 */
export class RegionController {
    readonly type: RegionType;

    private renderer: RegionRenderer;
    private animator: RegionAnimator;
    private picker: RegionPicker;

    constructor(
        type: RegionType,
        scene: Scene,
        shaderFactory: ShaderFactory,
        animationTexture: AnimationTexture
    ) {
        this.type = type;
        this.renderer = new RegionRenderer(scene, shaderFactory);
        this.animator = new RegionAnimator(animationTexture);
        this.picker = new RegionPicker(PICKER_CELL_SIZE);
    }

    // =========================================================================
    // Accessors (used by EarthGlobe wiring code)
    // =========================================================================

    getRenderer(): RegionRenderer {
        return this.renderer;
    }

    getAnimator(): RegionAnimator {
        return this.animator;
    }

    getPicker(): RegionPicker {
        return this.picker;
    }

    // =========================================================================
    // Loading
    // =========================================================================

    async load(
        url: string,
        onRegionAdded?: (region: CountryData) => void
    ): Promise<void> {
        await this.renderer.loadCountries(url, this.picker, onRegionAdded);
    }

    // =========================================================================
    // Region queries
    // =========================================================================

    getRegionAt(latLon: { lat: number; lon: number }): CountryPolygon | null {
        return this.picker.getCountryAt(latLon);
    }

    getRegionByIndex(index: number): CountryData | undefined {
        return this.renderer.getCountryByIndex(index);
    }

    getRegionByISO2(iso2: string): CountryData | undefined {
        return this.renderer.getCountryByISO2(iso2);
    }

    getAllRegions(): CountryData[] {
        return this.renderer.getCountriesData();
    }

    getRegionCount(): number {
        return this.renderer.getCountryCount();
    }

    // =========================================================================
    // Animation — altitude
    // =========================================================================

    setAltitude(index: number, value: number): void {
        this.animator.setAltitude(index, value);
    }

    getAltitude(index: number): number {
        return this.animator.getAltitude(index);
    }

    animateAltitude(index: number, target: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.animator.animateAltitude(index, target, durationMs, easing);
    }

    // =========================================================================
    // Animation — state
    // =========================================================================

    setState(index: number, state: number): void {
        this.animator.setState(index, state);
    }

    getState(index: number): number {
        return this.animator.getState(index);
    }

    // =========================================================================
    // Animation — blend
    // =========================================================================

    setBlend(index: number, value: number): void {
        this.animator.setBlend(index, value);
    }

    getBlend(index: number): number {
        return this.animator.getBlend(index);
    }

    animateBlend(index: number, target: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.animator.animateBlend(index, target, durationMs, easing);
    }

    // =========================================================================
    // Animation — expansion (small regions)
    // =========================================================================

    setExpansion(index: number, value: number): void {
        this.animator.setExpansion(index, value);
    }

    getExpansion(index: number): number {
        return this.animator.getExpansion(index);
    }

    animateExpansion(index: number, target: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.animator.animateExpansion(index, target, durationMs, easing);
    }

    // =========================================================================
    // Tick
    // =========================================================================

    tick(): void {
        this.animator.update();
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    dispose(): void {
        this.renderer.dispose();
    }
}
