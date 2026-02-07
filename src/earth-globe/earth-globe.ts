/**
 * Earth Globe Module - Main Class
 *
 * The primary orchestrator for rendering an interactive 3D Earth globe.
 * This is a pure rendering module with no game logic.
 */

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3, Color4 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Material } from '@babylonjs/core/Materials/material';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

// Side effect imports
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Culling/ray';  // Required for scene.pick() to work!

// Module imports
import {
    EARTH_RADIUS,
    COUNTRY_ALTITUDE,
    ANIMATION_AMPLITUDE,
    CAMERA_LOWER_RADIUS,
    CAMERA_UPPER_RADIUS,
    CAMERA_DEFAULT_RADIUS,
    CAMERA_WHEEL_PRECISION,
    CAMERA_MIN_Z,
    CAMERA_ANGULAR_SENSITIVITY,
    CAMERA_PANNING_SENSITIVITY,
    PICKER_CELL_SIZE,
    DEFAULT_ASSETS,
    MAX_ANIMATION_COUNTRIES,
    TUBE_RADIUS
} from './constants';
import { latLonToSphere, positionToLatLon } from './geo-math';
import { CountryPicker } from './country-picker';
import { loadSegments } from './segment-loader';
import { GlobeSphere } from './globe-sphere';
import { CountryRenderer } from './country-renderer';
import { BorderRenderer } from './border-renderer';
import { OutlineRenderer } from './outline-renderer';
import { Skybox } from './skybox';
import { AnimationTexture, STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from './animation-texture';
import { CountryAnimator } from './country-animator';

export { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED };
import { ShaderFactory } from './shader-factory';
import { LocationMarkerPool } from './location-marker-pool';
import { getConfig } from '../shared/config/global-config';
import { getZoomValue } from '../shared/animation/camera-utils';

import type {
    EarthGlobeOptions,
    AssetPaths,
    LatLon,
    CountryPolygon,
    CountryData,
    CountryHoverEvent,
    CountryClickEvent,
    SegmentData
} from './types';

/**
 * EarthGlobe - Main rendering class for the 3D Earth globe
 *
 * @example
 * ```typescript
 * import { EarthGlobe } from './earth-globe';
 *
 * const globe = new EarthGlobe({
 *   canvasId: 'renderCanvas',
 *   onReady: (g) => {
 *     // Globe is ready
 *     const country = g.getCountryAtLatLon(40.7128, -74.0060);
 *     console.log('New York is in:', country?.name);
 *   }
 * });
 * ```
 */
export class EarthGlobe {
    // Core Babylon.js
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private camera: ArcRotateCamera;

    // Rendering components
    private globeSphere: GlobeSphere;
    private countryRenderer: CountryRenderer;
    private borderRenderer: BorderRenderer;
    private outlineRenderer: OutlineRenderer;
    private skybox: Skybox;
    private shaderFactory: ShaderFactory;

    // Animation
    private animationTexture: AnimationTexture;
    private countryAnimator: CountryAnimator;

    // Location markers
    private markerPool: LocationMarkerPool | null = null;

    // Materials
    private outlineMaterial: ShaderMaterial | null = null;
    private segmentBorderMaterial: ShaderMaterial | null = null;

    // Data
    private countryPicker: CountryPicker;
    private segmentData: SegmentData | null = null;

    // Options and callbacks
    private options: EarthGlobeOptions;
    private assets: AssetPaths;
    private onCountryHoverCallback: ((event: CountryHoverEvent) => void) | null = null;
    private onCountryClickCallback: ((event: CountryClickEvent) => void) | null = null;

    // State
    private isInitialized: boolean = false;

    constructor(options: EarthGlobeOptions = {}) {
        this.options = options;
        this.assets = options.assets || {};

        // Get canvas
        const canvasId = options.canvasId || 'renderCanvas';
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        // Create engine and scene
        this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true });
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);

        // Create camera
        this.camera = new ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 2,
            CAMERA_DEFAULT_RADIUS,
            Vector3.Zero(),
            this.scene
        );
        this.setupCamera();

        // Create light
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 1.2;

        // Create components
        this.countryPicker = new CountryPicker(PICKER_CELL_SIZE);
        this.shaderFactory = new ShaderFactory(this.scene);
        this.animationTexture = new AnimationTexture(this.scene);
        this.countryAnimator = new CountryAnimator(this.animationTexture);
        this.shaderFactory.setAnimationTexture(this.animationTexture.getTexture());

        this.globeSphere = new GlobeSphere(this.scene, this.assets);
        this.countryRenderer = new CountryRenderer(this.scene, this.shaderFactory);
        this.borderRenderer = new BorderRenderer(this.scene);
        this.outlineRenderer = new OutlineRenderer(this.scene);
        this.skybox = new Skybox(this.scene, this.assets);

        // Start initialization
        this.init();
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    private setupCamera(): void {
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = CAMERA_LOWER_RADIUS;
        this.camera.upperRadiusLimit = CAMERA_UPPER_RADIUS;
        this.camera.wheelPrecision = CAMERA_WHEEL_PRECISION;
        this.camera.minZ = CAMERA_MIN_Z;
        this.camera.angularSensibilityX = CAMERA_ANGULAR_SENSITIVITY;
        this.camera.angularSensibilityY = CAMERA_ANGULAR_SENSITIVITY;
        this.camera.panningSensibility = CAMERA_PANNING_SENSITIVITY;
    }

    private async init(): Promise<void> {
        try {
            // Load segments
            const segmentsUrl = this.assets.segmentsJson || DEFAULT_ASSETS.segmentsJson;
            this.segmentData = await loadSegments(segmentsUrl);

            // Load countries
            const countriesUrl = this.assets.countriesJson || DEFAULT_ASSETS.countriesJson;
            await this.countryRenderer.loadCountries(
                countriesUrl,
                this.countryPicker,
                (country) => {
                    // Initialize animation data for each country
                    const defaultAnimValue = COUNTRY_ALTITUDE / ANIMATION_AMPLITUDE;
                    this.animationTexture.setAltitude(country.index, defaultAnimValue);
                }
            );

            // Create borders for polygons
            const polygonsData = this.countryRenderer.getPolygonsData();
            for (const polygon of polygonsData) {
                const border = this.borderRenderer.createPolygonBorders(
                    polygon.borderPoints,
                    undefined, // holes handled during country loading
                    polygon.countryIndex
                );
                polygon.extrudedBorder = border;
            }

            // Set up animation texture size
            const countryCount = this.countryRenderer.getCountryCount();
            const segmentCount = this.segmentData.segments.length;
            this.animationTexture.setEntriesUsed(countryCount + segmentCount);
            this.animationTexture.update();

            // Load world texture
            const worldTextureUrl = this.assets.worldTexture || DEFAULT_ASSETS.worldTexture;
            const worldTexture = new Texture(worldTextureUrl, this.scene, false, true);

            // Merge meshes for performance
            this.countryRenderer.mergeCountries(this.shaderFactory.createCountryShaderMaterial(worldTexture));
            this.borderRenderer.mergeExtrudedBorders(
                this.countryRenderer.getPolygonsData(),
                this.shaderFactory.createExtrudedBorderMaterial()
            );

            // Render segment borders
            if (this.segmentData) {
                this.segmentBorderMaterial = this.shaderFactory.createSegmentBorderMaterial();
                this.borderRenderer.renderSegmentBorders(
                    this.segmentData,
                    this.countryRenderer.getCountriesData(),
                    this.segmentBorderMaterial
                );

                // Set up segment animation mapping
                this.countryAnimator.setSegmentCountryMap(
                    this.borderRenderer.getSegmentAnimationIndices()
                );
            }

            // Create outline material (once, reused for all outlines)
            this.outlineMaterial = this.shaderFactory.createOutlineMaterial();

            // Create location marker pool (200 markers, batched rendering)
            this.markerPool = new LocationMarkerPool(this.scene, { poolSize: 200 });

            // Log statistics
            const pickerStats = this.countryPicker.getStats();
            console.log(`Country picker: ${pickerStats.polygonCount} polygons in ${pickerStats.cellCount} grid cells`);
            console.log(`Countries: ${countryCount}, Polygons: ${this.countryRenderer.getPolygonCount()}, Triangles: ${this.countryRenderer.getTriangleCount()}`);

            this.isInitialized = true;

            // Start render loop
            this.engine.runRenderLoop(() => {
                this.update();
                this.scene.render();
            });

            // Handle resize
            window.addEventListener('resize', () => {
                this.engine.resize();
            });

            // Call ready callback
            if (this.options.onReady) {
                this.options.onReady(this);
            }
        } catch (error) {
            console.error('Failed to initialize EarthGlobe:', error);
        }
    }

    private update(): void {
        // Update animations
        this.countryAnimator.update();

        const config = getConfig();

        // Update border thickness based on camera zoom
        if (this.segmentBorderMaterial) {
            const bt = config.zoom.borderThickness;
            const scale = getZoomValue(this.camera, bt.closeValue, bt.farValue, bt.easing);
            const offset = (scale - 1.0) * TUBE_RADIUS * 0.8;
            this.segmentBorderMaterial.setFloat("thicknessOffset", offset);
        }

        // Update marker scale based on camera zoom
        if (this.markerPool) {
            const ms = config.zoom.markerScale;
            const scale = getZoomValue(this.camera, ms.closeValue, ms.farValue, ms.easing);
            this.markerPool.updateScale(scale);
        }
    }

    // =========================================================================
    // Public API - Scene Access
    // =========================================================================

    /**
     * Get the Babylon.js Scene
     */
    getScene(): Scene {
        return this.scene;
    }

    /**
     * Get the camera
     */
    getCamera(): ArcRotateCamera {
        return this.camera;
    }

    /**
     * Get the engine
     */
    getEngine(): Engine {
        return this.engine;
    }

    /**
     * Get the canvas element
     */
    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Get the earth sphere mesh
     */
    getEarthSphere(): Mesh {
        return this.globeSphere.getMesh();
    }

    /**
     * Get the water material for parameter adjustments
     */
    getWaterMaterial(): ShaderMaterial {
        return this.globeSphere.getWaterMaterial();
    }

    /**
     * Get the country picker
     */
    getCountryPicker(): CountryPicker {
        return this.countryPicker;
    }

    /**
     * Get the shader factory (for creating unlit materials)
     */
    getShaderFactory(): ShaderFactory {
        return this.shaderFactory;
    }

    /**
     * Create an unlit material (useful for pins and other objects)
     */
    createUnlitMaterial(originalMaterial: Material | null): ShaderMaterial {
        return this.shaderFactory.createUnlitMaterial(originalMaterial);
    }

    // =========================================================================
    // Public API - Coordinate Conversion
    // =========================================================================

    /**
     * Convert latitude/longitude to 3D position
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @param altitude Altitude above surface (default: just above countries)
     */
    latLonToPosition(lat: number, lon: number, altitude?: number): Vector3 {
        const finalAltitude = altitude !== undefined ? altitude : COUNTRY_ALTITUDE + 0.01;
        return latLonToSphere(lat, lon, finalAltitude);
    }

    /**
     * Convert 3D position to latitude/longitude
     * @param position Position vector
     */
    positionToLatLon(position: Vector3): LatLon {
        return positionToLatLon(position);
    }

    /**
     * Get position at lat/lon with normal vector
     */
    positionAtLatLon(lat: number, lon: number, altitude?: number): { position: Vector3; normal: Vector3 } {
        const finalAltitude = altitude !== undefined ? altitude : COUNTRY_ALTITUDE + 0.01;
        const position = latLonToSphere(lat, lon, finalAltitude);
        const normal = position.normalizeToNew();
        return { position, normal };
    }

    /**
     * Get position at lat/lon accounting for current country displacement
     * This is useful for placing objects that should sit on top of the displaced country surface
     *
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @param offsetAbove Additional offset above the country surface (default: 0.01)
     * @returns Position and normal vector
     */
    getDisplacedPositionAtLatLon(lat: number, lon: number, offsetAbove: number = 0.01): { position: Vector3; normal: Vector3 } {
        // Get the country at this location
        const country = this.countryPicker.getCountryAt({ lat, lon });

        // Base position at water level (country vertices start at altitude 0)
        const basePosition = latLonToSphere(lat, lon, 0);
        const normal = basePosition.normalizeToNew();

        // If there's a country, account for its current displacement
        if (country) {
            const animValue = this.countryAnimator.getAltitude(country.countryIndex);
            const displacement = animValue * ANIMATION_AMPLITUDE;
            const position = basePosition.add(normal.scale(displacement + offsetAbove));
            return { position, normal };
        }

        // No country (ocean) - just return base position with small offset
        const position = basePosition.add(normal.scale(offsetAbove));
        return { position, normal };
    }

    // =========================================================================
    // Public API - Country Queries
    // =========================================================================

    /**
     * Get the country at the given coordinates
     */
    getCountryAtLatLon(lat: number, lon: number): CountryPolygon | null {
        return this.countryPicker.getCountryAt({ lat, lon });
    }

    /**
     * Get country data by ISO2 code
     */
    getCountryByISO2(iso2: string): CountryData | undefined {
        return this.countryRenderer.getCountryByISO2(iso2);
    }

    /**
     * Get country data by index
     */
    getCountryByIndex(index: number): CountryData | undefined {
        return this.countryRenderer.getCountryByIndex(index);
    }

    /**
     * Get all countries
     */
    getAllCountries(): CountryData[] {
        return this.countryRenderer.getCountriesData();
    }

    /**
     * Get the altitude at the given coordinates (land vs ocean)
     */
    getAltitudeAtLatLon(lat: number, lon: number): number {
        const country = this.countryPicker.getCountryAt({ lat, lon });
        return country ? COUNTRY_ALTITUDE : 0;
    }

    // =========================================================================
    // Public API - Country Animation
    // =========================================================================

    /**
     * Set the altitude value for a country (instant)
     * @param countryIndex Country index
     * @param altitude Value between 0 and 1
     */
    setCountryAltitude(countryIndex: number, altitude: number): void {
        this.countryAnimator.setAltitude(countryIndex, altitude);
        this.animationTexture.update();
    }

    /**
     * Get the current altitude value for a country
     */
    getCountryAltitude(countryIndex: number): number {
        return this.countryAnimator.getAltitude(countryIndex);
    }

    /**
     * Set the state value for a country (instant)
     * @param countryIndex Country index
     * @param state One of STATE_NORMAL (0.0), STATE_DISABLED (0.25), STATE_CLEARED (0.50)
     */
    setCountryState(countryIndex: number, state: number): void {
        this.countryAnimator.setState(countryIndex, state);
        this.animationTexture.update();
    }

    /**
     * Get the current state value for a country
     */
    getCountryState(countryIndex: number): number {
        return this.countryAnimator.getState(countryIndex);
    }

    /**
     * Set the blend factor for a country (instant)
     * @param countryIndex Country index
     * @param blend Value between 0 (full state effect) and 1 (normal appearance)
     */
    setCountryBlend(countryIndex: number, blend: number): void {
        this.countryAnimator.setBlend(countryIndex, blend);
        this.animationTexture.update();
    }

    /**
     * Get the current blend factor for a country
     */
    getCountryBlend(countryIndex: number): number {
        return this.countryAnimator.getBlend(countryIndex);
    }

    /**
     * Animate a country's altitude over time
     * @param countryIndex Country index
     * @param targetAltitude Target altitude (0-1)
     * @param durationMs Animation duration in milliseconds
     */
    animateCountryAltitude(countryIndex: number, targetAltitude: number, durationMs: number): Promise<void> {
        return this.countryAnimator.animateAltitude(countryIndex, targetAltitude, durationMs);
    }

    /**
     * Animate a country's blend factor over time
     * @param countryIndex Country index
     * @param targetBlend Target blend (0 = full state effect, 1 = normal appearance)
     * @param durationMs Animation duration in milliseconds
     */
    animateCountryBlend(countryIndex: number, targetBlend: number, durationMs: number): Promise<void> {
        return this.countryAnimator.animateBlend(countryIndex, targetBlend, durationMs);
    }

    // =========================================================================
    // Public API - Country Outline
    // =========================================================================

    /**
     * Show an outline around a country
     * @param countryIndex Country index
     */
    showCountryOutline(countryIndex: number): void {
        if (!this.outlineMaterial) return;

        const countryData = this.countryRenderer.getCountryByIndex(countryIndex);
        if (!countryData) return;

        const polygonsData = this.countryRenderer.getPolygonsData();
        const borderPointArrays = countryData.polygonIndices.map(
            idx => polygonsData[idx].borderPoints
        );

        this.outlineRenderer.showOutline(countryIndex, borderPointArrays, this.outlineMaterial);
    }

    /**
     * Clear the country outline
     */
    clearCountryOutline(): void {
        this.outlineRenderer.clearOutline();
    }

    // =========================================================================
    // Public API - Event Callbacks
    // =========================================================================

    /**
     * Set callback for country hover events
     */
    onCountryHover(callback: (event: CountryHoverEvent) => void): void {
        this.onCountryHoverCallback = callback;
    }

    /**
     * Set callback for country click events
     */
    onCountryClick(callback: (event: CountryClickEvent) => void): void {
        this.onCountryClickCallback = callback;
    }

    /**
     * Trigger a hover event (call from external pointer handler)
     */
    triggerCountryHover(country: CountryPolygon | null, latLon: LatLon): void {
        if (this.onCountryHoverCallback) {
            this.onCountryHoverCallback({ country, latLon });
        }
    }

    /**
     * Trigger a click event (call from external pointer handler)
     */
    triggerCountryClick(country: CountryPolygon | null, latLon: LatLon): void {
        if (this.onCountryClickCallback) {
            this.onCountryClickCallback({ country, latLon });
        }
    }

    // =========================================================================
    // Public API - Location Markers
    // =========================================================================

    /**
     * Acquire a marker from the pool and position it at the given coordinates
     * The marker will be positioned on top of the displaced country surface
     *
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @param offsetAbove Additional offset above the country surface (default: 0.01)
     * @returns Marker ID (use this to release or update the marker), or -1 if pool is exhausted
     */
    acquireMarker(lat: number, lon: number, offsetAbove: number = 0.01): number {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return -1;
        }

        const { position, normal } = this.getDisplacedPositionAtLatLon(lat, lon, offsetAbove);
        return this.markerPool.acquireMarker(position, normal);
    }

    /**
     * Release a marker back to the pool
     * @param markerId Marker ID returned from acquireMarker()
     */
    releaseMarker(markerId: number): void {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return;
        }

        this.markerPool.releaseMarker(markerId);
    }

    /**
     * Update a marker's position
     * @param markerId Marker ID
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @param offsetAbove Additional offset above the country surface (default: 0.01)
     */
    updateMarkerPosition(markerId: number, lat: number, lon: number, offsetAbove: number = 0.01): void {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return;
        }

        const { position, normal } = this.getDisplacedPositionAtLatLon(lat, lon, offsetAbove);
        this.markerPool.updateMarkerPosition(markerId, position, normal);
    }

    /**
     * Release all markers from the pool
     */
    releaseAllMarkers(): void {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return;
        }

        this.markerPool.releaseAll();
    }

    /**
     * Get marker pool statistics
     */
    getMarkerPoolStats(): { total: number; inUse: number; available: number } | null {
        if (!this.markerPool) {
            return null;
        }

        return this.markerPool.getStats();
    }

    // =========================================================================
    // Public API - Lifecycle
    // =========================================================================

    /**
     * Check if the globe is fully initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.engine.stopRenderLoop();

        this.globeSphere.dispose();
        this.countryRenderer.dispose();
        this.borderRenderer.dispose();
        this.outlineRenderer.dispose();
        this.skybox.dispose();
        this.animationTexture.dispose();

        if (this.markerPool) {
            this.markerPool.dispose();
        }

        this.scene.dispose();
        this.engine.dispose();
    }
}
