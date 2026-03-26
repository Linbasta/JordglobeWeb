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
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
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
    REGION_ALTITUDE,
    ANIMATION_AMPLITUDE,
    CAMERA_LOWER_RADIUS,
    CAMERA_UPPER_RADIUS,
    CAMERA_DEFAULT_RADIUS,
    CAMERA_WHEEL_PRECISION,
    CAMERA_PINCH_DELTA_PERCENTAGE,
    CAMERA_MIN_Z,
    MOBILE_ORBIT_MULTIPLIER,
    PICKER_CELL_SIZE,
    DEFAULT_ASSETS,
    MAX_ANIMATION_COUNTRIES,
    TUBE_RADIUS,
    SMALL_OUTLINE_TUBE_RADIUS,
    OUTLINE_COLOR,
    ISLANDS_DASH_LENGTH,
    ISLANDS_GAP_LENGTH,
    ISLANDS_ALPHA_DEFAULT,
    ISLANDS_ALPHA_HOVER,
    zoom,
} from './constants';
import { latLonToSphere, positionToLatLon } from './geo-math';
import { RegionPicker } from './region-picker';
import { RegionController } from './region-controller';
import { loadSegments } from './segment-loader';
import { GlobeSphere } from './globe-sphere';
import { RegionRenderer } from './region-renderer';
import { BorderRenderer } from './border-renderer';
import { OutlineRenderer } from './outline-renderer';
import { IslandsFrame, ISLANDS_DEFINITIONS } from './islands-frame';
import { Skybox } from './skybox';
import { AnimationTexture, STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from './animation-texture';
import { RegionAnimator } from './region-animator';

export { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED };
import { ShaderFactory } from './shader-factory';
import { LocationMarkerPool } from './location-marker-pool';
import { isSmallCountry as checkSmallCountry, isSurroundedCountry } from './small-countries';
import { getZoomValue } from '../shared/animation/camera-utils';
import { tickPerf } from '../shared/dev/perf-overlay';

import type {
    EarthGlobeOptions,
    AssetPaths,
    LatLon,
    RegionPolygon,
    RegionData,
    CountryHoverEvent,
    CountryClickEvent,
    SegmentData,
    LofiColliderItem
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

    // Region controllers
    private countryController!: RegionController;
    private provinceController!: RegionController;
    private activeController!: RegionController;  // routes hover/click events

    // Rendering components
    private globeSphere: GlobeSphere;
    private skybox: Skybox;
    private shaderFactory: ShaderFactory;
    private provinceShaderFactory: ShaderFactory | null = null;
    private worldTexture: Texture | null = null;

    // Animation (kept for backward compat in getDisplacedPositionAtLatLon)
    private countryAnimator: RegionAnimator;

    // Location markers
    private markerPool: LocationMarkerPool | null = null;
    private smallMarkerPool: LocationMarkerPool | null = null;

    // Materials
    private outlineMaterial: ShaderMaterial | null = null;  // Shared with both controllers
    private smallOutlineMaterial: ShaderMaterial | null = null;  // Shared with both controllers

    // Islands frame (for scattered island nations like Kiribati)
    private islandsFrame: IslandsFrame | null = null;
    private islandsMaterialDefault: ShaderMaterial | null = null;  // Transparent, always visible
    private islandsMaterialHover: ShaderMaterial | null = null;    // Solid white, on hover

    // Options and callbacks
    private options: EarthGlobeOptions;
    private assets: AssetPaths;
    private onCountryHoverCallback: ((event: CountryHoverEvent) => void) | null = null;
    private onCountryClickCallback: ((event: CountryClickEvent) => void) | null = null;

    // State
    private isInitialized: boolean = false;
    private isMobile: boolean = false;
    private colliderDebugUpdate: (() => void) | null = null;

    // Region mode state
    private regionModeISO2: string | null = null;
    private regionModeParentIndex: number = -1;  // country index hidden while in region mode
    private provinceLoadingPromise: Promise<void> | null = null;  // tracks province index loading status
    private loadedSegmentCountry: string | null = null;  // tracks which country's province segments are loaded

    // Lazy province loading state
    private provinceCodes: string[] = [];  // from index.json
    private loadedProvinceCountries: Set<string> = new Set();
    private provinceFaceMeshes: Map<string, { regular: Mesh | null; small: Mesh | null }> = new Map();
    private provinceBorderMeshes: Map<string, { regular: Mesh | null; small: Mesh | null }> = new Map();
    private provinceFaceMaterial: ShaderMaterial | null = null;
    private provinceSmallFaceMaterial: ShaderMaterial | null = null;
    private provinceBorderRegularMaterial: ShaderMaterial | null = null;
    private provinceBorderSmallMaterial: ShaderMaterial | null = null;

    constructor(options: EarthGlobeOptions = {}) {
        this.options = options;
        this.assets = options.assets || {};
        this.isMobile = matchMedia('(pointer: coarse)').matches;

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
        this.shaderFactory = new ShaderFactory(this.scene);

        // Create the country controller (now owns its animation texture)
        this.countryController = new RegionController(
            'country', this.scene, this.shaderFactory
        );
        this.activeController = this.countryController;

        // Expose animator via shorthand field for backward compat (used in getDisplacedPositionAtLatLon)
        this.countryAnimator = this.countryController.getAnimator();

        // Create province controller (now owns its animation texture)
        this.provinceShaderFactory = new ShaderFactory(this.scene, 'province_');
        this.provinceController = new RegionController(
            'province', this.scene, this.provinceShaderFactory
        );

        this.globeSphere = new GlobeSphere(this.scene, this.assets);
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
        this.camera.pinchDeltaPercentage = CAMERA_PINCH_DELTA_PERCENTAGE;
        this.camera.minZ = CAMERA_MIN_Z;
        this.camera.panningSensibility = 0; // Disable two-finger pan
    }

    private async init(): Promise<void> {
        try {
            // Load countries
            const countriesUrl = this.assets.countriesJson || DEFAULT_ASSETS.countriesJson;
            await this.countryController.loadFromURL(
                countriesUrl,
                (region) => {
                    // Initialize animation data for each country
                    const defaultAnimValue = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
                    this.countryController.getAnimationTexture().setAltitude(region.index, defaultAnimValue);
                }
            );

            // Load lofi colliders for enhanced hit detection
            const collidersUrl = this.assets.lofiCollidersJson || DEFAULT_ASSETS.lofiCollidersJson;
            const collidersResponse = await fetch(collidersUrl);
            const collidersEntries: LofiColliderItem[] = await collidersResponse.json();

            for (const entry of collidersEntries) {
                if (entry.colliders.length === 0) continue;
                if (ISLANDS_DEFINITIONS.has(entry.id)) continue; // island nations use frame polygons instead
                const country = this.getCountryByISO2(entry.id);
                if (!country) continue;
                this.countryController.getPicker().registerColliders(
                    country.index,
                    entry.colliders,
                    isSurroundedCountry(entry.id)
                );
            }

            // Register island frame polygons as colliders
            const picker = this.countryController.getPicker();
            for (const [iso2, definition] of ISLANDS_DEFINITIONS) {
                const country = this.getCountryByISO2(iso2);
                if (!country) continue;
                for (const region of definition.regions) {
                    picker.registerFramePolygon(country.index, region.points);
                }
            }

            // Create extruded borders for all country polygons
            const borderRenderer = this.countryController.getBorderRenderer();
            const polygonsData = this.countryController.getRenderer().getPolygonsData();
            for (const polygon of polygonsData) {
                const border = borderRenderer.createPolygonBorders(
                    polygon.borderPoints,
                    polygon.holePoints,
                    polygon.countryIndex
                );
                polygon.extrudedBorder = border;
            }

            // Load world texture (cached for province loading later)
            const worldTextureUrl = this.assets.worldTexture || DEFAULT_ASSETS.worldTexture;
            this.worldTexture = new Texture(worldTextureUrl, this.scene, false, true);

            // Merge meshes for performance
            const countryMaterial = this.shaderFactory.createCountryShaderMaterial(this.worldTexture);
            const smallCountryMaterial = this.shaderFactory.createSmallCountryShaderMaterial(this.worldTexture);
            this.countryController.getRenderer().mergeRegions(countryMaterial, smallCountryMaterial);
            borderRenderer.mergeExtrudedBorders(
                this.countryController.getRenderer().getPolygonsData(),
                this.shaderFactory.createExtrudedBorderMaterial(),
                this.shaderFactory.createSmallExtrudedBorderMaterial(),
                this.countryController.getAllRegions()
            );

            // Load and render segment borders via controller
            const segmentsUrl = this.assets.segmentsJson || DEFAULT_ASSETS.segmentsJson;
            await this.countryController.loadSegments(segmentsUrl, MAX_ANIMATION_COUNTRIES);

            // NOW resize animation texture to include countries + segments
            const countryCount = this.countryController.getRegionCount();
            const segmentCount = this.countryController.getSegmentAnimationIndices().size;
            const totalEntries = MAX_ANIMATION_COUNTRIES + segmentCount;
            this.countryController.setEntriesUsed(totalEntries);
            console.log(`[Animation] Texture sized for ${countryCount} countries + ${segmentCount} segments = ${totalEntries} total entries`);

            // Set up segment animation mapping
            this.countryAnimator.setSegmentCountryMap(
                this.countryController.getSegmentAnimationIndices()
            );

            // Set small region indices so borders animate correctly
            this.countryAnimator.setSmallRegionIndices(
                this.countryController.getSmallRegionIndices()
            );

            // Create outline materials (shared between both controllers)
            this.outlineMaterial = this.shaderFactory.createOutlineMaterial();
            this.smallOutlineMaterial = this.shaderFactory.createSmallOutlineMaterial();
            this.countryController.initOutlineMaterials(this.outlineMaterial, this.smallOutlineMaterial);

            // Create islands frame renderer with dashed line materials
            this.islandsFrame = new IslandsFrame(this.scene);
            // Default material: transparent white, always visible
            this.islandsMaterialDefault = this.shaderFactory.createDashedBorderMaterial(
                new Color3(1, 1, 1),
                ISLANDS_DASH_LENGTH,
                ISLANDS_GAP_LENGTH,
                ISLANDS_ALPHA_DEFAULT
            );
            // Hover material: solid white
            this.islandsMaterialHover = this.shaderFactory.createDashedBorderMaterial(
                new Color3(1, 1, 1),
                ISLANDS_DASH_LENGTH,
                ISLANDS_GAP_LENGTH,
                ISLANDS_ALPHA_HOVER
            );

            // Pre-create all island frames with default (transparent) material
            this.islandsFrame.createAllFrames(
                (iso2) => this.countryController.getRegionByISO2(iso2)?.index,
                this.islandsMaterialDefault
            );

            // Show all frames by default (with transparency)
            this.islandsFrame.showAllFrames();

            // Create location marker pool (200 markers, batched rendering)
            this.markerPool = new LocationMarkerPool(this.scene, {
                name: 'LocationMarkers',
                poolSize: 200
            });

            // Create separate green marker pool for small country indicators
            this.smallMarkerPool = new LocationMarkerPool(this.scene, {
                name: 'SmallCountryMarkers',
                poolSize: 100,
                fillColor: new Color3(0.2, 0.8, 0.2),
                strokeColor: new Color3(0, 0.4, 0),
                strokeWidth: 0.35,
            });

            // Initialize controller with the marker pool
            this.countryController.initMarkerPool(this.smallMarkerPool);

            // Place markers at small country centroids
            // Markers start visible by default - we'll hide them all initially
            // and let the quiz/game logic show only the ones it needs
            // Skip island nations - they use frame instead of markers
            for (const country of this.countryController.getAllRegions()) {
                if (country.centroid && checkSmallCountry(country.id) && !ISLANDS_DEFINITIONS.has(country.id)) {
                    const normal = country.centroid.normalizeToNew();
                    const position = country.centroid.add(normal.scale(REGION_ALTITUDE + 0.01));
                    const markerId = this.smallMarkerPool.acquireMarker(position, normal);
                    if (markerId >= 0) {
                        this.countryController.registerSmallRegionMarker(country.index, markerId);
                        // Hide marker initially - quiz/game will show them as needed
                        this.smallMarkerPool.hideMarker(markerId);
                    }
                }
            }

            // NOW update small region indices (after markers are registered)
            this.countryAnimator.setSmallRegionIndices(
                this.countryController.getSmallRegionIndices()
            );

            // Log statistics
            const pickerStats = this.countryController.getPicker().getStats();
            console.log(`Country picker: ${pickerStats.polygonCount} polygons in ${pickerStats.cellCount} grid cells`);
            console.log(`Countries: ${countryCount}, Polygons: ${this.countryController.getRenderer().getPolygonCount()}, Triangles: ${this.countryController.getRenderer().getTriangleCount()}`);

            this.isInitialized = true;

            // Start render loop
            this.engine.runRenderLoop(() => {
                if (import.meta.env.DEV) tickPerf(performance.now());
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

            // Load provinces in background (non-blocking)
            this.provinceLoadingPromise = this.loadProvinces().catch(err => {
                console.warn('Province loading failed (non-fatal):', err);
            });

        } catch (error) {
            console.error('Failed to initialize EarthGlobe:', error);
        }
    }

    /**
     * Load province index and init materials.
     * Actual province data is loaded lazily per-country in loadProvincesForCountry().
     */
    private async loadProvinces(): Promise<void> {
        // Fetch province index
        try {
            const indexResponse = await fetch('/provinces/index.json');
            if (!indexResponse.ok) {
                console.log('No province index found — skipping province loading');
                return;
            }
            this.provinceCodes = await indexResponse.json() as string[];
        } catch {
            console.log('No province index found — skipping province loading');
            return;
        }

        if (this.provinceCodes.length === 0) {
            console.log('Province index is empty — skipping province loading');
            return;
        }

        console.log(`Province index loaded: ${this.provinceCodes.join(', ')}`);

        // Pre-create materials (reused for each country loaded later)
        this.provinceFaceMaterial = this.provinceShaderFactory!.createCountryShaderMaterial(this.worldTexture!);
        this.provinceSmallFaceMaterial = this.provinceShaderFactory!.createSmallCountryShaderMaterial(this.worldTexture!);
        this.provinceBorderRegularMaterial = this.provinceShaderFactory!.createExtrudedBorderMaterial();
        this.provinceBorderSmallMaterial = this.provinceShaderFactory!.createSmallExtrudedBorderMaterial();

        // Init outline materials
        const provinceOutlineMaterial = this.provinceShaderFactory!.createOutlineMaterial();
        const provinceSmallOutlineMaterial = this.provinceShaderFactory!.createSmallOutlineMaterial();
        this.provinceController.initOutlineMaterials(provinceOutlineMaterial, provinceSmallOutlineMaterial);

        // Init marker pool (shared with countries)
        if (this.smallMarkerPool) {
            this.provinceController.initMarkerPool(this.smallMarkerPool);
        }
    }

    /**
     * Load province data for a single country on demand.
     * Fetches JSON, triangulates, creates borders, merges meshes, caches result.
     * No-op if already loaded.
     */
    private async loadProvincesForCountry(iso2: string): Promise<void> {
        if (this.loadedProvinceCountries.has(iso2)) return;
        if (!this.provinceCodes.includes(iso2)) {
            console.warn(`No province data available for ${iso2}`);
            return;
        }

        console.log(`Loading provinces for ${iso2}...`);
        const startTime = performance.now();

        const response = await fetch(`/provinces/${iso2}.json`);
        if (!response.ok) {
            console.warn(`Province file not found: /provinces/${iso2}.json`);
            return;
        }
        const data = await response.json() as { country: string; provinces: Array<{ id: number; name: string; paths: string }> };

        const parentCountry = this.countryController.getRegionByISO2(iso2);
        const parentRegionIndex = parentCountry?.index ?? -1;
        if (parentRegionIndex < 0) {
            console.warn(`Province parent country not found: ${iso2}`);
        }

        // Record polygon range before loading
        const provinceRenderer = this.provinceController.getRenderer();
        const polygonStart = provinceRenderer.getPolygonCount();

        await this.provinceController.loadFromItems(iso2, data.provinces, parentRegionIndex);

        const polygonEnd = provinceRenderer.getPolygonCount();

        // Set altitude=0 for newly added provinces (hidden initially)
        const allRegions = this.provinceController.getAllRegions();
        for (const region of allRegions) {
            if (region.parentRegionIndex === parentRegionIndex) {
                this.provinceController.getAnimationTexture().setAltitude(region.index, 0);
            }
        }

        // Create extruded borders for the new polygon range
        const provinceBorderRenderer = this.provinceController.getBorderRenderer();
        const provincePolygons = provinceRenderer.getPolygonsData();
        for (let i = polygonStart; i < polygonEnd; i++) {
            const polygon = provincePolygons[i];
            const border = provinceBorderRenderer.createPolygonBorders(
                polygon.borderPoints,
                undefined,
                polygon.countryIndex
            );
            polygon.extrudedBorder = border;
        }

        // Merge face meshes for this country's polygon range
        const faceMeshes = provinceRenderer.mergePolygonSubset(
            polygonStart, polygonEnd,
            this.provinceFaceMaterial!,
            this.provinceSmallFaceMaterial!
        );
        this.provinceFaceMeshes.set(iso2, faceMeshes);

        // Merge extruded border meshes for this country
        const borderPolygonSlice = provincePolygons.slice(polygonStart, polygonEnd);
        const countryRegions = allRegions.filter(r => r.parentRegionIndex === parentRegionIndex);
        const borderMeshes = provinceBorderRenderer.mergeExtrudedBorderSubset(
            borderPolygonSlice,
            this.provinceBorderRegularMaterial!,
            this.provinceBorderSmallMaterial!,
            countryRegions
        );
        this.provinceBorderMeshes.set(iso2, borderMeshes);

        // Create small province markers for newly added regions
        if (this.smallMarkerPool) {
            for (const region of countryRegions) {
                if (region.centroid) {
                    const normal = region.centroid.normalizeToNew();
                    const position = region.centroid.add(normal.scale(REGION_ALTITUDE + 0.01));
                    const markerId = this.smallMarkerPool.acquireMarker(position, normal);
                    if (markerId >= 0) {
                        this.provinceController.registerSmallRegionMarker(region.index, markerId);
                        this.smallMarkerPool.hideMarker(markerId);
                    }
                }
            }
        }

        // Resize animation texture to include all provinces loaded so far
        const provinceCount = this.provinceController.getRegionCount();
        this.provinceController.setEntriesUsed(provinceCount);

        // Hide meshes initially — activated in enterRegionMode()
        if (faceMeshes.regular) faceMeshes.regular.setEnabled(false);
        if (faceMeshes.small) faceMeshes.small.setEnabled(false);
        if (borderMeshes.regular) borderMeshes.regular.setEnabled(false);
        if (borderMeshes.small) borderMeshes.small.setEnabled(false);

        this.loadedProvinceCountries.add(iso2);

        const endTime = performance.now();
        console.log(`Loaded provinces for ${iso2} in ${(endTime - startTime).toFixed(0)}ms (polygons ${polygonStart}-${polygonEnd})`);
    }

    private update(): void {
        // Update animations
        this.countryController.tick();
        this.provinceController.tick();

        // Update border thickness for both controllers
        this.countryController.updateBorderThickness(this.camera);
        this.provinceController.updateBorderThickness(this.camera);

        // Update marker scale based on camera zoom
        if (this.markerPool) {
            const scale = getZoomValue(this.camera, zoom.markerScaleClose, zoom.markerScaleFar);
            this.markerPool.updateScale(scale);
        }

        // Update small country marker scale based on camera zoom
        if (this.smallMarkerPool) {
            const smallScale = getZoomValue(this.camera, zoom.markerScaleClose, zoom.markerScaleFar);
            this.smallMarkerPool.updateScale(smallScale);
        }

        // Update collider radius scale based on camera zoom
        const colliderMul = getZoomValue(this.camera, zoom.colliderScaleClose, zoom.colliderScaleFar);
        this.countryController.getPicker().setColliderMultiplier(colliderMul);

        // Update orbit sensitivity based on camera zoom (and mobile)
        let angular = getZoomValue(this.camera, zoom.orbitSensibilityClose, zoom.orbitSensibilityFar);
        if (this.isMobile) angular *= MOBILE_ORBIT_MULTIPLIER;
        this.camera.angularSensibilityX = angular;
        this.camera.angularSensibilityY = angular;

        // Rebuild debug circles if multiplier changed
        this.colliderDebugUpdate?.();
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
    getCountryPicker(): RegionPicker {
        return this.countryController.getPicker();
    }

    /**
     * Get the active region picker (routes based on region mode).
     * In country mode: returns country picker.
     * In region mode: returns province picker.
     */
    getActivePicker(): RegionPicker {
        return this.activeController.getPicker();
    }

    /**
     * Get the country controller (for direct access to country animations/state)
     */
    getCountryController(): RegionController {
        return this.countryController;
    }

    /**
     * Get the province controller (for direct access to province animations/state)
     */
    getProvinceController(): RegionController {
        return this.provinceController;
    }

    /**
     * Get the active controller (routes based on region mode - country or province)
     */
    getActiveController(): RegionController {
        return this.activeController;
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
        const finalAltitude = altitude !== undefined ? altitude : REGION_ALTITUDE + 0.01;
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
        const finalAltitude = altitude !== undefined ? altitude : REGION_ALTITUDE + 0.01;
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
        const country = this.countryController.getRegionAt({ lat, lon });

        // Base position at water level (country vertices start at altitude 0)
        const basePosition = latLonToSphere(lat, lon, 0);
        const normal = basePosition.normalizeToNew();

        // If there's a country, account for its current displacement
        if (country) {
            const animValue = this.countryAnimator.getAltitude(country.regionIndex);
            const displacement = animValue * ANIMATION_AMPLITUDE;
            const position = basePosition.add(normal.scale(displacement + offsetAbove));
            return { position, normal };
        }

        // No country found (coastal edge case) — default to landmass altitude
        const position = basePosition.add(normal.scale(REGION_ALTITUDE + offsetAbove));
        return { position, normal };
    }

    // =========================================================================
    // Public API - Country Queries
    // =========================================================================

    /**
     * Get the region at the given coordinates (routes to activeController).
     * In country mode: returns a country polygon.
     * In region mode: returns a province polygon.
     */
    getCountryAtLatLon(lat: number, lon: number): RegionPolygon | null {
        return this.activeController.getRegionAt({ lat, lon });
    }

    /**
     * Get country data by ISO2 code
     */
    getCountryByISO2(iso2: string): RegionData | undefined {
        return this.countryController.getRegionByISO2(iso2);
    }

    /**
     * Get country data by index
     */
    getCountryByIndex(index: number): RegionData | undefined {
        return this.countryController.getRegionByIndex(index);
    }

    /**
     * Get all countries
     */
    getAllCountries(): RegionData[] {
        return this.countryController.getAllRegions();
    }

    /**
     * Get the altitude at the given coordinates (land vs ocean)
     */
    getAltitudeAtLatLon(lat: number, lon: number): number {
        const country = this.countryController.getRegionAt({ lat, lon });
        return country ? REGION_ALTITUDE : 0;
    }

    // =========================================================================
    // Public API - Region Mode (province drill-down)
    // =========================================================================

    /**
     * Enter province mode for a given country.
     * - Shows province meshes for that country
     * - Hides (disables) the parent country
     * - Routes getCountryAtLatLon() to the province picker
     *
     * No-op if provinces for this iso2 have not been loaded yet.
     */
    async enterRegionMode(iso2: string): Promise<void> {
        if (this.regionModeISO2 === iso2) return;  // already in this mode
        if (this.regionModeISO2 !== null) {
            this.exitRegionMode();  // exit previous mode first
        }

        const parentCountry = this.countryController.getRegionByISO2(iso2);
        if (!parentCountry) {
            console.warn(`enterRegionMode: country not found: ${iso2}`);
            return;
        }

        const parentIndex = parentCountry.index;

        // Load provinces for this country on demand (no-op if already cached)
        await this.loadProvincesForCountry(iso2);

        const faceMeshes = this.provinceFaceMeshes.get(iso2);
        if (!faceMeshes) {
            console.warn(`enterRegionMode: no province data for ${iso2}`);
            return;
        }

        // Load province segments if not already loaded for this country
        const provinceCount = this.provinceController.getRegionCount();
        if (this.loadedSegmentCountry !== iso2) {
            try {
                // Province segments use their OWN animation texture, so offset starts after provinces (not after countries!)
                const provinceSegmentOffset = provinceCount;
                await this.provinceController.loadSegments(`/province-segments/${iso2}.json`, provinceSegmentOffset);

                // NOW resize province animation texture to include provinces + province segments
                const provinceSegmentCount = this.provinceController.getSegmentAnimationIndices().size;
                const totalProvinceEntries = provinceCount + provinceSegmentCount;
                this.provinceController.setEntriesUsed(totalProvinceEntries);

                // Set up segment animation mapping (so segments follow province altitudes)
                this.provinceController.getAnimator().setSegmentCountryMap(
                    this.provinceController.getSegmentAnimationIndices()
                );

                // Set small province indices so borders animate correctly
                this.provinceController.getAnimator().setSmallRegionIndices(
                    this.provinceController.getSmallRegionIndices()
                );

                this.loadedSegmentCountry = iso2;
            } catch (error) {
                console.warn(`[enterRegionMode] Failed to load segments for ${iso2}:`, error);
                // Continue without segments - the quiz will work, just no segment borders
            }
        }

        // Enable this country's face meshes and border meshes
        const borderMeshes = this.provinceBorderMeshes.get(iso2);
        const provinceSegmentMesh = this.provinceController.getSegmentBordersMesh();
        if (faceMeshes.regular) faceMeshes.regular.setEnabled(true);
        if (faceMeshes.small) faceMeshes.small.setEnabled(true);
        if (borderMeshes) {
            if (borderMeshes.regular) borderMeshes.regular.setEnabled(true);
            if (borderMeshes.small) borderMeshes.small.setEnabled(true);
        }
        if (provinceSegmentMesh) {
            provinceSegmentMesh.setEnabled(true);
        }

        // Set provinces for this country to normal altitude; other loaded countries stay hidden
        const defaultAltitude = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
        const allProvinces = this.provinceController.getAllRegions();
        for (const province of allProvinces) {
            if (province.parentRegionIndex === parentIndex) {
                this.provinceController.getAnimationTexture().setAltitude(province.index, defaultAltitude);
                this.provinceController.setState(province.index, STATE_NORMAL);
            }
        }

        // Hide the parent country: push altitude to 0 (recedes into globe) and grey it out
        this.countryController.setAltitude(parentIndex, 0);
        this.countryController.setState(parentIndex, STATE_DISABLED);

        // Hide all country markers (including the parent country marker if it's small)
        this.countryController.hideAllSmallRegionMarkers();

        // Show markers for active small provinces (those belonging to this country)
        for (const province of allProvinces) {
            if (province.parentRegionIndex === parentIndex && province.centroid) {
                this.provinceController.showSmallRegionMarker(province.index);
            }
        }

        // Switch active controller so hit-testing goes through provinces
        this.activeController = this.provinceController;
        this.regionModeISO2 = iso2;
        this.regionModeParentIndex = parentIndex;
    }

    /**
     * Exit province mode, returning to country view.
     */
    exitRegionMode(): void {
        if (this.regionModeISO2 === null) return;

        const exitISO2 = this.regionModeISO2;

        // Restore parent country altitude and state
        if (this.regionModeParentIndex >= 0) {
            const defaultAltitude = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
            this.countryController.setAltitude(this.regionModeParentIndex, defaultAltitude);
            this.countryController.setState(this.regionModeParentIndex, STATE_NORMAL);
        }

        // Reset only this country's provinces (push altitude to 0)
        const allProvinces = this.provinceController.getAllRegions();
        for (const province of allProvinces) {
            if (province.parentRegionIndex === this.regionModeParentIndex) {
                this.provinceController.setAltitude(province.index, 0);
                this.provinceController.setState(province.index, STATE_NORMAL);
            }
        }

        // Disable this country's face and border meshes
        const faceMeshes = this.provinceFaceMeshes.get(exitISO2);
        const borderMeshes = this.provinceBorderMeshes.get(exitISO2);
        const provinceSegmentMesh = this.provinceController.getSegmentBordersMesh();
        if (faceMeshes) {
            if (faceMeshes.regular) faceMeshes.regular.setEnabled(false);
            if (faceMeshes.small) faceMeshes.small.setEnabled(false);
        }
        if (borderMeshes) {
            if (borderMeshes.regular) borderMeshes.regular.setEnabled(false);
            if (borderMeshes.small) borderMeshes.small.setEnabled(false);
        }
        if (provinceSegmentMesh) provinceSegmentMesh.setEnabled(false);

        // Hide all province markers
        this.provinceController.hideAllSmallRegionMarkers();

        // Restore country markers (show all enabled small countries)
        this.countryController.showEnabledSmallRegionMarkers();

        // Restore active controller
        this.activeController = this.countryController;
        this.regionModeISO2 = null;
        this.regionModeParentIndex = -1;
    }

    /**
     * Returns true if currently in province mode.
     */
    isInRegionMode(): boolean {
        return this.regionModeISO2 !== null;
    }

    /**
     * Returns the ISO2 of the active region mode country, or null if not in region mode.
     */
    getRegionModeISO2(): string | null {
        return this.regionModeISO2;
    }

    /**
     * Wait for provinces to finish loading.
     * Resolves immediately if already loaded or no provinces are being loaded.
     */
    async waitForProvincesToLoad(): Promise<void> {
        if (this.provinceLoadingPromise) {
            await this.provinceLoadingPromise;
        }
    }

    /**
     * Get all regions from the active controller (countries or provinces).
     */
    getAllActiveRegions(): RegionData[] {
        return this.activeController.getAllRegions();
    }

    /**
     * Get all polygons from the active controller.
     * In country mode: returns country polygons.
     * In region mode: returns province polygons.
     */
    getActiveRegionPolygons(): RegionPolygon[] {
        return this.activeController.getPicker().getAllPolygons();
    }

    /**
     * Animate a region's altitude via the active controller.
     * In country mode: animates a country. In region mode: animates a province.
     */
    animateActiveRegionAltitude(regionIndex: number, targetAltitude: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.activeController.animateAltitude(regionIndex, targetAltitude, durationMs, easing);
    }

    // =========================================================================
    // Public API - Country Animation
    // =========================================================================

    // =========================================================================
    // Public API - Country Expansion (small countries)
    // =========================================================================

    /**
     * Check if a country is classified as small (needs magnification)
     */
    isSmallCountry(countryIndex: number): boolean {
        const country = this.countryController.getRegionByIndex(countryIndex);
        return country ? checkSmallCountry(country.id) : false;
    }


    // =========================================================================
    // Public API - Country Outline
    // =========================================================================

    /**
     * Show an outline around a country
     * @param countryIndex Country index
     */
    showCountryOutline(countryIndex: number): void {
        // Delegate to active controller (works for both countries and provinces!)
        this.activeController.showOutline(countryIndex);
    }

    /**
     * Clear the country outline
     */
    clearCountryOutline(): void {
        this.activeController.clearOutline();
    }

    // =========================================================================
    // Public API - Islands Frame
    // =========================================================================

    /**
     * Show islands frame for a country (e.g., Kiribati)
     * @param iso2 Country ISO2 code
     */
    showIslandsFrame(iso2: string): void {
        if (!this.islandsFrame || !this.islandsMaterialHover) return;

        // Get country index for animation
        const country = this.countryController.getRegionByISO2(iso2);
        if (!country) {
            console.warn(`Country ${iso2} not found`);
            return;
        }

        this.islandsFrame.showFrame(iso2, country.index, this.islandsMaterialHover);
    }

    /**
     * Clear the islands frame
     */
    clearIslandsFrame(): void {
        this.islandsFrame?.clearFrame();
    }

    /**
     * Check if a country has an islands frame definition
     * @param iso2 Country ISO2 code
     */
    hasIslandsFrame(iso2: string): boolean {
        return this.islandsFrame?.hasDefinition(iso2) ?? false;
    }

    /**
     * Show islands frames for all defined island nations
     */
    showAllIslandsFrames(): void {
        if (!this.islandsFrame || !this.islandsMaterialHover) return;

        this.islandsFrame.clearFrame();

        const codes = this.islandsFrame.getAllIslandsCodes();
        for (const iso2 of codes) {
            const country = this.countryController.getRegionByISO2(iso2);
            if (country) {
                this.islandsFrame.showFrame(
                    iso2,
                    country.index,
                    this.islandsMaterialHover,
                    undefined,
                    false  // don't clear existing
                );
            }
        }

        console.log(`Showing islands frames for ${codes.length} island nations`);
    }

    /**
     * Get list of all island nation country codes
     */
    getIslandsCodes(): string[] {
        return this.islandsFrame?.getAllIslandsCodes() ?? [];
    }

    /**
     * Show islands frames for a specific list of countries
     * @param iso2List List of ISO2 country codes to show
     */
    showIslandsFrameList(iso2List: string[]): void {
        if (!this.islandsFrame || !this.islandsMaterialHover) return;

        this.islandsFrame.clearFrame();

        for (const iso2 of iso2List) {
            const country = this.countryController.getRegionByISO2(iso2);
            if (country) {
                this.islandsFrame.showFrame(
                    iso2,
                    country.index,
                    this.islandsMaterialHover,
                    undefined,
                    false  // don't clear existing
                );
            }
        }
    }

    /**
     * Highlight islands frame for a country (switch to solid white)
     * @param iso2 Country ISO2 code
     */
    showIslandsFrameForCountry(iso2: string): void {
        if (this.islandsFrame && this.islandsMaterialHover) {
            this.islandsFrame.setMaterialByCode(iso2, this.islandsMaterialHover);
        }
    }

    /**
     * Unhighlight islands frame for a country (switch back to transparent)
     * @param iso2 Country ISO2 code
     */
    hideIslandsFrameForCountry(iso2: string): void {
        if (this.islandsFrame && this.islandsMaterialDefault) {
            this.islandsFrame.setMaterialByCode(iso2, this.islandsMaterialDefault);
        }
    }

    /**
     * Fully disable (hide mesh) an islands frame for a country
     */
    disableIslandsFrameForCountry(iso2: string): void {
        this.islandsFrame?.hideFrameByCode(iso2);
    }

    /**
     * Reset all islands frames to default (transparent) material
     */
    hideAllIslandsFrames(): void {
        if (this.islandsFrame && this.islandsMaterialDefault) {
            this.islandsFrame.setMaterialForAll(this.islandsMaterialDefault);
        }
    }

    /**
     * Check if a country has a pre-created islands frame
     */
    countryHasIslandsFrame(iso2: string): boolean {
        return this.islandsFrame?.hasFrame(iso2) ?? false;
    }

    /**
     * Show islands frames only for the specified country codes.
     * Hides frames for all other island nations.
     * Use this when disabling non-game countries in quizzes.
     */
    showIslandsFramesForCountries(enabledCodes: Set<string>): void {
        this.islandsFrame?.showFramesForCountries(enabledCodes);
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
    triggerCountryHover(country: RegionPolygon | null, latLon: LatLon): void {
        if (this.onCountryHoverCallback) {
            this.onCountryHoverCallback({ country, latLon });
        }
    }

    /**
     * Trigger a click event (call from external pointer handler)
     */
    triggerCountryClick(country: RegionPolygon | null, latLon: LatLon): void {
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

    /**
     * Set the scale of a specific marker
     * @param markerId Marker ID
     * @param scale Scale factor (1.0 = normal size)
     */
    setMarkerScale(markerId: number, scale: number): void {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return;
        }

        this.markerPool.setMarkerScale(markerId, scale);
    }

    /**
     * Get the scale of a specific marker
     * @param markerId Marker ID
     * @returns Scale factor, or 1.0 if not found
     */
    getMarkerScale(markerId: number): number {
        if (!this.markerPool) {
            return 1.0;
        }

        return this.markerPool.getMarkerScale(markerId);
    }

    /**
     * Get the world position of a marker
     * @param markerId Marker ID
     * @returns Position vector, or null if marker not found or not in use
     */
    getMarkerPosition(markerId: number): Vector3 | null {
        if (!this.markerPool) return null;
        return this.markerPool.getMarkerPosition(markerId);
    }

    /**
     * Hide a marker visually without releasing it from the pool
     * @param markerId Marker ID
     */
    hideMarker(markerId: number): void {
        if (!this.markerPool) return;
        this.markerPool.hideMarker(markerId);
    }

    /**
     * Show a previously hidden marker
     * @param markerId Marker ID
     */
    showMarker(markerId: number): void {
        if (!this.markerPool) return;
        this.markerPool.showMarker(markerId);
    }

    /**
     * Toggle debug visualization of lofi collider circles (dev only)
     */
    async toggleColliderDebugVisualization(): Promise<void> {
        if (!import.meta.env.DEV) return;
        const { toggleColliderDebug, updateColliderDebugScale } = await import('./collider-debug');
        this.colliderDebugUpdate = updateColliderDebugScale;

        // Collect country/border surface meshes to hide while debug is active
        const surfaceMeshes: Mesh[] = [];
        const names = [
            'mergedCountries', 'mergedCountriesSmall',
            'mergedExtrudedBorders', 'mergedExtrudedBordersSmall',
            'mergedSegmentBorders'
        ];
        for (const name of names) {
            const mesh = this.scene.getMeshByName(name) as Mesh | null;
            if (mesh) surfaceMeshes.push(mesh);
        }

        toggleColliderDebug(this.scene, this.countryController.getPicker(), surfaceMeshes);
    }

    /**
     * Toggle debug visualization of marker hit areas
     */
    toggleMarkerDebugVisualization(): void {
        if (!this.markerPool) {
            console.warn('EarthGlobe: Marker pool not initialized');
            return;
        }

        this.markerPool.toggleDebugVisualization();
    }

    /**
     * Update the debug sphere radius based on hit radius
     * @param hitRadius The current hit radius in world units
     */
    updateMarkerDebugRadius(hitRadius: number): void {
        if (!this.markerPool) {
            return;
        }

        this.markerPool.updateDebugRadius(hitRadius);
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
        // Controllers now own and dispose their renderers and animation textures
        this.countryController.dispose();
        this.provinceController.dispose();
        this.skybox.dispose();

        if (this.markerPool) {
            this.markerPool.dispose();
        }
        if (this.smallMarkerPool) {
            this.smallMarkerPool.dispose();
        }
        if (this.islandsFrame) {
            this.islandsFrame.dispose();
        }

        this.scene.dispose();
        this.engine.dispose();
    }
}
