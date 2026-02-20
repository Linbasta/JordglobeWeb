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
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';

import { AnimationTexture } from './animation-texture';
import { RegionRenderer } from './region-renderer';
import { RegionAnimator } from './region-animator';
import { RegionPicker } from './region-picker';
import { BorderRenderer } from './border-renderer';
import { OutlineRenderer } from './outline-renderer';
import { ShaderFactory } from './shader-factory';
import { loadSegments } from './segment-loader';
import { getZoomValue } from '../shared/animation/camera-utils';
import { PICKER_CELL_SIZE, TUBE_RADIUS, SMALL_OUTLINE_TUBE_RADIUS, zoom } from './constants';
import type { RegionData, RegionPolygon, RegionType, SegmentData } from './types';

export type { RegionType };

/**
 * Region Controller — owns one Renderer, one Animator, one Picker, and one AnimationTexture.
 * Phase 1: Now owns its AnimationTexture (was previously passed in).
 */
export class RegionController {
    readonly type: RegionType;

    private scene: Scene;
    private renderer: RegionRenderer;
    private animator: RegionAnimator;
    private picker: RegionPicker;
    private borderRenderer: BorderRenderer;
    private outlineRenderer: OutlineRenderer;
    private shaderFactory: ShaderFactory;
    private animationTexture: AnimationTexture;  // NOW OWNED BY CONTROLLER

    // Segment data and materials
    private segmentData: SegmentData | null = null;
    private segmentBorderMaterial: import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial | null = null;
    private outlineMaterial: import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial | null = null;
    private smallOutlineMaterial: import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial | null = null;

    constructor(
        type: RegionType,
        scene: Scene,
        shaderFactory: ShaderFactory
    ) {
        this.type = type;
        this.scene = scene;
        this.shaderFactory = shaderFactory;

        // Create and own AnimationTexture
        this.animationTexture = new AnimationTexture(scene);
        this.shaderFactory.setAnimationTexture(this.animationTexture.getTexture());

        this.renderer = new RegionRenderer(scene, shaderFactory);
        this.animator = new RegionAnimator(this.animationTexture);
        this.picker = new RegionPicker(PICKER_CELL_SIZE);

        // Use type as name prefix (e.g. "province_" for provinces, "" for countries)
        const namePrefix = type === 'province' ? 'province_' : '';
        this.borderRenderer = new BorderRenderer(scene, namePrefix);
        this.outlineRenderer = new OutlineRenderer(scene);
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

    /**
     * Get the animation texture (for init-time setup like setEntriesUsed)
     */
    getAnimationTexture(): AnimationTexture {
        return this.animationTexture;
    }

    /**
     * Set the number of entries used in the animation texture
     * Typically called during initialization: regionCount + segmentCount
     */
    setEntriesUsed(count: number): void {
        this.animationTexture.setEntriesUsed(count);
        this.animationTexture.update();
    }

    // =========================================================================
    // Loading
    // =========================================================================

    async loadFromURL(
        url: string,
        onRegionAdded?: (region: RegionData) => void
    ): Promise<void> {
        await this.renderer.loadFromURL(url, this.picker, onRegionAdded);
    }

    async loadFromItems(
        countryISO2: string,
        items: Array<{ id: number; name: string; paths: string }>,
        parentRegionIndex: number,
        onRegionAdded?: (region: RegionData) => void
    ): Promise<void> {
        await this.renderer.loadFromItems(countryISO2, items, this.picker, parentRegionIndex, onRegionAdded);
    }

    // =========================================================================
    // Region queries
    // =========================================================================

    getRegionAt(latLon: { lat: number; lon: number }): RegionPolygon | null {
        return this.picker.getCountryAt(latLon);
    }

    getRegionByIndex(index: number): RegionData | undefined {
        return this.renderer.getRegionByIndex(index);
    }

    getRegionByISO2(iso2: string): RegionData | undefined {
        return this.renderer.getRegionByISO2(iso2);
    }

    getAllRegions(): RegionData[] {
        return this.renderer.getRegionsData();
    }

    getRegionCount(): number {
        return this.renderer.getRegionCount();
    }

    // =========================================================================
    // Animation — altitude
    // =========================================================================

    setAltitude(index: number, value: number): void {
        this.animator.setAltitude(index, value);
        this.animationTexture.update();
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
        this.animationTexture.update();
    }

    getState(index: number): number {
        return this.animator.getState(index);
    }

    // =========================================================================
    // Animation — blend
    // =========================================================================

    setBlend(index: number, value: number): void {
        this.animator.setBlend(index, value);
        this.animationTexture.update();
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
        this.animationTexture.update();
    }

    getExpansion(index: number): number {
        return this.animator.getExpansion(index);
    }

    animateExpansion(index: number, target: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.animator.animateExpansion(index, target, durationMs, easing);
    }

    // =========================================================================
    // Segments (border lines)
    // =========================================================================

    /**
     * Load segment borders for this region type
     * @param url Path to segments JSON (e.g., /segments.json for countries, /province-segments/US.json for provinces)
     * @param animationIndexOffset Starting index for segment animations (to avoid collisions)
     */
    async loadSegments(url: string, animationIndexOffset: number): Promise<void> {
        console.log(`[RegionController.loadSegments] type=${this.type}, url=${url}, offset=${animationIndexOffset}`);

        // Load segment data using unified loader
        const format = this.type === 'province' ? 'province' : 'country';
        this.segmentData = await loadSegments(url, format);

        console.log(`[${this.type}] Loaded ${this.segmentData.segments.length} segments from controller`);

        // Create segment border material
        this.segmentBorderMaterial = this.shaderFactory.createSegmentBorderMaterial();
        console.log(`[${this.type}] Created segment material: ${this.segmentBorderMaterial.name}`);

        // Render segment borders
        const regionsData = this.renderer.getRegionsData();
        this.borderRenderer.renderSegmentBorders(
            this.segmentData,
            regionsData,
            this.segmentBorderMaterial,
            animationIndexOffset
        );

        const mesh = this.borderRenderer.getMergedSegmentBorders();
        console.log(`[${this.type}] Segment mesh: name=${mesh?.name}, vertices=${mesh?.getTotalVertices()}, enabled=${mesh?.isEnabled()}, material=${mesh?.material?.name}`);
        console.log(`[${this.type}] Segment borders rendered with offset ${animationIndexOffset}`);
    }

    /**
     * Get the merged segment borders mesh
     */
    getSegmentBordersMesh(): import('@babylonjs/core/Meshes/mesh').Mesh | null {
        return this.borderRenderer.getMergedSegmentBorders();
    }

    /**
     * Get segment animation indices (for syncing with region animations)
     */
    getSegmentAnimationIndices(): Map<number, number[]> {
        return this.borderRenderer.getSegmentAnimationIndices();
    }

    // =========================================================================
    // Borders (extruded walls)
    // =========================================================================

    /**
     * Get the border renderer (for creating polygon borders)
     */
    getBorderRenderer(): BorderRenderer {
        return this.borderRenderer;
    }

    /**
     * Get the merged extruded borders mesh
     */
    getExtrudedBordersMesh(): import('@babylonjs/core/Meshes/mesh').Mesh | null {
        return this.borderRenderer.getMergedExtrudedBorders();
    }

    // =========================================================================
    // Outlines (selection highlight)
    // =========================================================================

    /**
     * Initialize outline materials (must be called before showOutline)
     */
    initOutlineMaterials(
        outlineMaterial: import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial,
        smallOutlineMaterial: import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial
    ): void {
        this.outlineMaterial = outlineMaterial;
        this.smallOutlineMaterial = smallOutlineMaterial;
    }

    /**
     * Show selection outline for a region
     */
    showOutline(regionIndex: number): void {
        if (!this.outlineMaterial) return;

        const regionData = this.renderer.getRegionByIndex(regionIndex);
        if (!regionData) return;

        const polygonsData = this.renderer.getPolygonsData();
        const borderPointArrays = regionData.polygonIndices.map(
            idx => polygonsData[idx].borderPoints
        );

        if (regionData.centroid && this.smallOutlineMaterial) {
            this.outlineRenderer.showOutline(
                regionIndex, borderPointArrays, this.smallOutlineMaterial,
                SMALL_OUTLINE_TUBE_RADIUS, regionData.centroid
            );
        } else {
            this.outlineRenderer.showOutline(regionIndex, borderPointArrays, this.outlineMaterial);
        }
    }

    /**
     * Clear the selection outline
     */
    clearOutline(): void {
        this.outlineRenderer.clearOutline();
    }

    // =========================================================================
    // Update loop
    // =========================================================================

    /**
     * Update border thickness based on camera zoom
     */
    updateBorderThickness(camera: ArcRotateCamera): void {
        if (this.segmentBorderMaterial) {
            const scale = getZoomValue(camera, zoom.borderThicknessClose, zoom.borderThicknessFar);
            const offset = (scale - 1.0) * TUBE_RADIUS * 0.8;
            this.segmentBorderMaterial.setFloat("thicknessOffset", offset);
        }
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
        this.animationTexture.dispose();
        this.renderer.dispose();
        this.borderRenderer.dispose();
        this.outlineRenderer.dispose();
    }
}
