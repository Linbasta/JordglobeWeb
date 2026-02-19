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
    CountryPolygon,
    CountryData,
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
    private countryRenderer: RegionRenderer;
    private borderRenderer: BorderRenderer;
    private outlineRenderer: OutlineRenderer;
    private skybox: Skybox;
    private shaderFactory: ShaderFactory;
    private provinceShaderFactory: ShaderFactory | null = null;
    private worldTexture: Texture | null = null;

    // Animation
    private animationTexture: AnimationTexture;
    private provinceAnimationTexture: AnimationTexture | null = null;
    private countryAnimator: RegionAnimator;

    // Location markers
    private markerPool: LocationMarkerPool | null = null;
    private smallMarkerPool: LocationMarkerPool | null = null;

    // Materials
    private outlineMaterial: ShaderMaterial | null = null;
    private smallOutlineMaterial: ShaderMaterial | null = null;
    private segmentBorderMaterial: ShaderMaterial | null = null;

    // Data
    private countryPicker: RegionPicker;
    private segmentData: SegmentData | null = null;

    // Options and callbacks
    private options: EarthGlobeOptions;
    private assets: AssetPaths;
    private onCountryHoverCallback: ((event: CountryHoverEvent) => void) | null = null;
    private onCountryClickCallback: ((event: CountryClickEvent) => void) | null = null;

    // Small country markers (countryIndex -> markerId)
    private smallCountryMarkers: Map<number, number> = new Map();

    // State
    private isInitialized: boolean = false;
    private isMobile: boolean = false;
    private colliderDebugUpdate: (() => void) | null = null;

    // Region mode state
    private regionModeISO2: string | null = null;
    private regionModeParentIndex: number = -1;  // country index hidden while in region mode
    private provinceBorderMesh: Mesh | null = null;  // merged extruded border mesh for provinces

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
        this.animationTexture = new AnimationTexture(this.scene);
        this.shaderFactory.setAnimationTexture(this.animationTexture.getTexture());

        // Create the country controller (wraps renderer, animator, picker)
        this.countryController = new RegionController(
            'country', this.scene, this.shaderFactory, this.animationTexture
        );
        this.activeController = this.countryController;

        // Expose inner components via shorthand fields for backward compat
        this.countryRenderer = this.countryController.getRenderer();
        this.countryAnimator = this.countryController.getAnimator();
        this.countryPicker = this.countryController.getPicker();

        // Create province controller (provinces loaded lazily in init())
        this.provinceAnimationTexture = new AnimationTexture(this.scene);
        this.provinceShaderFactory = new ShaderFactory(this.scene, 'province_');
        this.provinceShaderFactory.setAnimationTexture(this.provinceAnimationTexture.getTexture());
        this.provinceController = new RegionController(
            'province', this.scene, this.provinceShaderFactory, this.provinceAnimationTexture
        );

        this.globeSphere = new GlobeSphere(this.scene, this.assets);
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
        this.camera.pinchDeltaPercentage = CAMERA_PINCH_DELTA_PERCENTAGE;
        this.camera.minZ = CAMERA_MIN_Z;
        this.camera.panningSensibility = 0; // Disable two-finger pan
    }

    private async init(): Promise<void> {
        try {
            // Load segments
            const segmentsUrl = this.assets.segmentsJson || DEFAULT_ASSETS.segmentsJson;
            this.segmentData = await loadSegments(segmentsUrl);

            // Load countries
            const countriesUrl = this.assets.countriesJson || DEFAULT_ASSETS.countriesJson;
            await this.countryController.loadFromURL(
                countriesUrl,
                (region) => {
                    // Initialize animation data for each country
                    const defaultAnimValue = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
                    this.animationTexture.setAltitude(region.index, defaultAnimValue);
                }
            );

            // Load lofi colliders for enhanced hit detection
            const collidersUrl = this.assets.lofiCollidersJson || DEFAULT_ASSETS.lofiCollidersJson;
            const collidersResponse = await fetch(collidersUrl);
            const collidersEntries: LofiColliderItem[] = await collidersResponse.json();

            for (const entry of collidersEntries) {
                if (entry.colliders.length === 0) continue;
                const country = this.getCountryByISO2(entry.id);
                if (!country) continue;
                this.countryPicker.registerColliders(
                    country.index,
                    entry.colliders,
                    isSurroundedCountry(entry.id)
                );
            }

            // Create extruded borders for all country polygons
            const polygonsData = this.countryRenderer.getPolygonsData();
            for (const polygon of polygonsData) {
                const border = this.borderRenderer.createPolygonBorders(
                    polygon.borderPoints,
                    undefined, // holes handled during loading
                    polygon.countryIndex
                );
                polygon.extrudedBorder = border;
            }

            // Set up animation texture size
            const countryCount = this.countryRenderer.getRegionCount();
            const segmentCount = this.segmentData.segments.length;
            this.animationTexture.setEntriesUsed(countryCount + segmentCount);
            this.animationTexture.update();

            // Load world texture (cached for province loading later)
            const worldTextureUrl = this.assets.worldTexture || DEFAULT_ASSETS.worldTexture;
            this.worldTexture = new Texture(worldTextureUrl, this.scene, false, true);

            // Merge meshes for performance
            const countryMaterial = this.shaderFactory.createCountryShaderMaterial(this.worldTexture);
            const smallCountryMaterial = this.shaderFactory.createSmallCountryShaderMaterial(this.worldTexture);
            this.countryRenderer.mergeRegions(countryMaterial, smallCountryMaterial);
            this.borderRenderer.mergeExtrudedBorders(
                this.countryRenderer.getPolygonsData(),
                this.shaderFactory.createExtrudedBorderMaterial(),
                this.shaderFactory.createSmallExtrudedBorderMaterial(),
                this.countryRenderer.getRegionsData()
            );

            // Render segment borders
            if (this.segmentData) {
                this.segmentBorderMaterial = this.shaderFactory.createSegmentBorderMaterial();
                this.borderRenderer.renderSegmentBorders(
                    this.segmentData,
                    this.countryRenderer.getRegionsData(),
                    this.segmentBorderMaterial
                );

                // Set up segment animation mapping
                this.countryAnimator.setSegmentCountryMap(
                    this.borderRenderer.getSegmentAnimationIndices()
                );
            }

            // Create outline material (once, reused for all outlines)
            this.outlineMaterial = this.shaderFactory.createOutlineMaterial();
            this.smallOutlineMaterial = this.shaderFactory.createSmallOutlineMaterial();

            // Create location marker pool (200 markers, batched rendering)
            this.markerPool = new LocationMarkerPool(this.scene, { poolSize: 200 });

            // Create separate green marker pool for small country indicators
            this.smallMarkerPool = new LocationMarkerPool(this.scene, {
                poolSize: 100,
                fillColor: new Color3(0.2, 0.8, 0.2),
                strokeColor: new Color3(0, 0.4, 0),
                strokeWidth: 0.35,
            });

            // Place markers at small country centroids
            for (const country of this.countryRenderer.getRegionsData()) {
                if (country.centroid) {
                    const normal = country.centroid.normalizeToNew();
                    const position = country.centroid.add(normal.scale(REGION_ALTITUDE + 0.01));
                    const markerId = this.smallMarkerPool.acquireMarker(position, normal);
                    if (markerId >= 0) {
                        this.smallCountryMarkers.set(country.index, markerId);
                    }
                }
            }

            // Log statistics
            const pickerStats = this.countryPicker.getStats();
            console.log(`Country picker: ${pickerStats.polygonCount} polygons in ${pickerStats.cellCount} grid cells`);
            console.log(`Countries: ${countryCount}, Polygons: ${this.countryRenderer.getPolygonCount()}, Triangles: ${this.countryRenderer.getTriangleCount()}`);

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
            this.loadProvinces().catch(err => {
                console.warn('Province loading failed (non-fatal):', err);
            });

        } catch (error) {
            console.error('Failed to initialize EarthGlobe:', error);
        }
    }

    /**
     * Load all province data in the background.
     * Fetches public/provinces/index.json, then loads each country's province file.
     * Province meshes start hidden (all altitudes at 0).
     */
    private async loadProvinces(): Promise<void> {
        // Fetch province index
        let provinceCodes: string[];
        try {
            const indexResponse = await fetch('/provinces/index.json');
            if (!indexResponse.ok) {
                console.log('No province index found — skipping province loading');
                return;
            }
            provinceCodes = await indexResponse.json() as string[];
        } catch {
            console.log('No province index found — skipping province loading');
            return;
        }

        if (provinceCodes.length === 0) {
            console.log('Province index is empty — skipping province loading');
            return;
        }

        console.log(`Loading provinces for: ${provinceCodes.join(', ')}`);

        // Load all province files in parallel
        const loadPromises = provinceCodes.map(async (iso2) => {
            const response = await fetch(`/provinces/${iso2}.json`);
            if (!response.ok) {
                console.warn(`Province file not found: /provinces/${iso2}.json`);
                return;
            }
            const data = await response.json() as { country: string; provinces: Array<{ id: number; name: string; paths: string }> };

            // Look up parent country index so provinces can reference it
            const parentCountry = this.countryController.getRegionByISO2(iso2);
            const parentRegionIndex = parentCountry?.index ?? -1;
            if (parentRegionIndex < 0) {
                console.warn(`Province parent country not found: ${iso2}`);
            }

            await this.provinceController.loadFromItems(
                iso2,
                data.provinces,
                parentRegionIndex
            );
        });

        await Promise.all(loadPromises);

        const provinceCount = this.provinceController.getRegionCount();
        console.log(`[Province] Loaded: ${provinceCount} total`);

        // Set animation texture entries to 0 (all hidden initially)
        const allProvinces = this.provinceController.getAllRegions();
        for (const region of allProvinces) {
            this.provinceAnimationTexture!.setAltitude(region.index, 0);
        }
        this.provinceAnimationTexture!.setEntriesUsed(provinceCount);
        this.provinceAnimationTexture!.update();
        console.log(`[Province] Animation texture: ${provinceCount} entries, texture size=${this.provinceAnimationTexture!.getTexture().getSize().width}x${this.provinceAnimationTexture!.getTexture().getSize().height}`);

        // Create extruded borders for all province polygons (same as country pipeline)
        const provinceRenderer = this.provinceController.getRenderer();
        const provincePolygons = provinceRenderer.getPolygonsData();
        console.log(`[Province] Creating borders for ${provincePolygons.length} polygons`);
        for (const polygon of provincePolygons) {
            const border = this.borderRenderer.createPolygonBorders(
                polygon.borderPoints,
                undefined,
                polygon.countryIndex
            );
            polygon.extrudedBorder = border;
        }
        const bordersCreated = provincePolygons.filter(p => p.extrudedBorder !== null).length;
        console.log(`[Province] Extruded borders created: ${bordersCreated}/${provincePolygons.length}`);

        // Merge province face meshes (reuse cached world texture)
        const provinceMaterial = this.provinceShaderFactory!.createCountryShaderMaterial(this.worldTexture!);
        console.log(`[Province] worldTexture null? ${this.worldTexture === null}`);
        provinceRenderer.mergeRegions(provinceMaterial, provinceMaterial);
        const provinceFaceMesh = provinceRenderer.getMergedMesh();
        console.log(`[Province] Face mesh after merge: ${provinceFaceMesh ? provinceFaceMesh.name : 'NULL'}, enabled=${provinceFaceMesh?.isEnabled()}`);

        // Merge province extruded borders (same pipeline as countries)
        this.borderRenderer.mergeExtrudedBorders(
            provincePolygons,
            this.provinceShaderFactory!.createExtrudedBorderMaterial(),
            this.provinceShaderFactory!.createSmallExtrudedBorderMaterial(),
            allProvinces
        );

        // Track the province border mesh for show/hide in enterRegionMode
        this.provinceBorderMesh = this.borderRenderer.getMergedExtrudedBorders();
        console.log(`[Province] Border mesh after merge: ${this.provinceBorderMesh ? this.provinceBorderMesh.name : 'NULL'}, enabled=${this.provinceBorderMesh?.isEnabled()}`);

        // Hide both meshes initially — activated in enterRegionMode()
        if (provinceFaceMesh) provinceFaceMesh.setEnabled(false);
        if (this.provinceBorderMesh) this.provinceBorderMesh.setEnabled(false);
        console.log(`[Province] Meshes hidden. Face=${provinceFaceMesh?.name ?? 'NULL'} Border=${this.provinceBorderMesh?.name ?? 'NULL'}`);
    }

    private update(): void {
        // Update animations
        this.countryAnimator.update();
        this.provinceController.tick();

        // Update border thickness based on camera zoom
        if (this.segmentBorderMaterial) {
            const scale = getZoomValue(this.camera, zoom.borderThicknessClose, zoom.borderThicknessFar);
            const offset = (scale - 1.0) * TUBE_RADIUS * 0.8;
            this.segmentBorderMaterial.setFloat("thicknessOffset", offset);
        }

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
        this.countryPicker.setColliderMultiplier(colliderMul);

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
    getCountryAtLatLon(lat: number, lon: number): CountryPolygon | null {
        return this.activeController.getRegionAt({ lat, lon });
    }

    /**
     * Get country data by ISO2 code
     */
    getCountryByISO2(iso2: string): CountryData | undefined {
        return this.countryRenderer.getRegionByISO2(iso2);
    }

    /**
     * Get country data by index
     */
    getCountryByIndex(index: number): CountryData | undefined {
        return this.countryRenderer.getRegionByIndex(index);
    }

    /**
     * Get all countries
     */
    getAllCountries(): CountryData[] {
        return this.countryRenderer.getRegionsData();
    }

    /**
     * Get the altitude at the given coordinates (land vs ocean)
     */
    getAltitudeAtLatLon(lat: number, lon: number): number {
        const country = this.countryPicker.getCountryAt({ lat, lon });
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
    enterRegionMode(iso2: string): void {
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
        const provinceCount = this.provinceController.getRegionCount();
        if (provinceCount === 0) {
            console.warn(`enterRegionMode: no provinces loaded yet for ${iso2}`);
            return;
        }

        // Enable province face mesh and border mesh
        const provinceMesh = this.provinceController.getRenderer().getMergedMesh();
        console.log(`[enterRegionMode] provinceMesh=${provinceMesh ? provinceMesh.name : 'NULL'}, provinceBorderMesh=${this.provinceBorderMesh ? this.provinceBorderMesh.name : 'NULL'}`);
        if (provinceMesh) {
            provinceMesh.setEnabled(true);
            console.log(`[enterRegionMode] Face mesh enabled, isEnabled=${provinceMesh.isEnabled()}, vertices=${provinceMesh.getTotalVertices()}`);
        } else {
            console.warn(`[enterRegionMode] Province face mesh is NULL - provinces not loaded yet!`);
        }
        if (this.provinceBorderMesh) this.provinceBorderMesh.setEnabled(true);

        // Set all provinces belonging to this country to normal altitude, hide others
        const defaultAltitude = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
        console.log(`[enterRegionMode] defaultAltitude=${defaultAltitude} (REGION_ALTITUDE=${REGION_ALTITUDE}, ANIMATION_AMPLITUDE=${ANIMATION_AMPLITUDE})`);
        const allProvinces = this.provinceController.getAllRegions();
        let matchCount = 0;
        for (const province of allProvinces) {
            if (province.parentRegionIndex === parentIndex) {
                this.provinceAnimationTexture!.setAltitude(province.index, defaultAltitude);
                matchCount++;
            } else {
                this.provinceAnimationTexture!.setAltitude(province.index, 0);
            }
        }
        this.provinceAnimationTexture!.update();
        console.log(`[enterRegionMode] Set ${matchCount}/${allProvinces.length} provinces to altitude ${defaultAltitude} (parentIndex=${parentIndex})`);
        // Log first few province parentRegionIndex values for verification
        for (let i = 0; i < Math.min(5, allProvinces.length); i++) {
            console.log(`  province[${i}] name=${allProvinces[i].name} parentRegionIndex=${allProvinces[i].parentRegionIndex} index=${allProvinces[i].index}`);
        }

        // Hide the parent country: push altitude to 0 (recedes into globe) and grey it out
        this.animationTexture.setAltitude(parentIndex, 0);
        this.animationTexture.update();
        this.setCountryState(parentIndex, STATE_DISABLED);

        // Switch active controller so hit-testing goes through provinces
        this.activeController = this.provinceController;
        this.regionModeISO2 = iso2;
        this.regionModeParentIndex = parentIndex;

        console.log(`[enterRegionMode] Done. ${matchCount} provinces active, parentIndex=${parentIndex}`);
    }

    /**
     * Exit province mode, returning to country view.
     */
    exitRegionMode(): void {
        if (this.regionModeISO2 === null) return;

        // Restore parent country altitude and state
        if (this.regionModeParentIndex >= 0) {
            const defaultAltitude = REGION_ALTITUDE / ANIMATION_AMPLITUDE;
            this.animationTexture.setAltitude(this.regionModeParentIndex, defaultAltitude);
            this.animationTexture.update();
            this.setCountryState(this.regionModeParentIndex, STATE_NORMAL);
        }

        // Hide all province meshes
        const allProvinces = this.provinceController.getAllRegions();
        for (const province of allProvinces) {
            this.provinceAnimationTexture!.setAltitude(province.index, 0);
        }
        this.provinceAnimationTexture!.update();

        const provinceMesh = this.provinceController.getRenderer().getMergedMesh();
        if (provinceMesh) provinceMesh.setEnabled(false);
        if (this.provinceBorderMesh) this.provinceBorderMesh.setEnabled(false);

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
     * Get all regions from the active controller (countries or provinces).
     */
    getAllActiveRegions(): CountryData[] {
        return this.activeController.getAllRegions();
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

        // Hide/show small country marker based on state
        if (this.smallCountryMarkers.has(countryIndex)) {
            if (state === STATE_NORMAL) {
                this.showSmallCountryMarker(countryIndex);
            } else {
                this.hideSmallCountryMarker(countryIndex);
            }
        }
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
    animateCountryAltitude(countryIndex: number, targetAltitude: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.countryAnimator.animateAltitude(countryIndex, targetAltitude, durationMs, easing);
    }

    /**
     * Animate a country's blend factor over time
     * @param countryIndex Country index
     * @param targetBlend Target blend (0 = full state effect, 1 = normal appearance)
     * @param durationMs Animation duration in milliseconds
     */
    animateCountryBlend(countryIndex: number, targetBlend: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.countryAnimator.animateBlend(countryIndex, targetBlend, durationMs, easing);
    }

    // =========================================================================
    // Public API - Country Expansion (small countries)
    // =========================================================================

    /**
     * Set the expansion factor for a country (instant)
     * @param countryIndex Country index
     * @param expansion Expansion factor (1.0 = normal, >1 = magnified)
     */
    setCountryExpansion(countryIndex: number, expansion: number): void {
        this.countryAnimator.setExpansion(countryIndex, expansion);
        this.animationTexture.update();
    }

    /**
     * Get the current expansion factor for a country
     */
    getCountryExpansion(countryIndex: number): number {
        return this.countryAnimator.getExpansion(countryIndex);
    }

    /**
     * Animate a country's expansion factor over time
     * @param countryIndex Country index
     * @param targetExpansion Target expansion (1.0 = normal, >1 = magnified)
     * @param durationMs Animation duration in milliseconds
     */
    animateCountryExpansion(countryIndex: number, targetExpansion: number, durationMs: number, easing?: (t: number) => number): Promise<void> {
        return this.countryAnimator.animateExpansion(countryIndex, targetExpansion, durationMs, easing);
    }

    /**
     * Check if a country is classified as small (needs magnification)
     */
    isSmallCountry(countryIndex: number): boolean {
        const country = this.countryRenderer.getRegionByIndex(countryIndex);
        return country ? checkSmallCountry(country.iso2) : false;
    }

    /**
     * Hide the small country marker for a given country index
     */
    hideSmallCountryMarker(countryIndex: number): void {
        const markerId = this.smallCountryMarkers.get(countryIndex);
        if (markerId !== undefined && this.smallMarkerPool) {
            this.smallMarkerPool.hideMarker(markerId);
        }
    }

    /**
     * Show the small country marker for a given country index
     */
    showSmallCountryMarker(countryIndex: number): void {
        const markerId = this.smallCountryMarkers.get(countryIndex);
        if (markerId !== undefined && this.smallMarkerPool) {
            this.smallMarkerPool.showMarker(markerId);
        }
    }

    /**
     * Hide all small country markers
     */
    hideAllSmallCountryMarkers(): void {
        if (!this.smallMarkerPool) return;
        for (const markerId of this.smallCountryMarkers.values()) {
            this.smallMarkerPool.hideMarker(markerId);
        }
    }

    /**
     * Show all small country markers
     */
    showAllSmallCountryMarkers(): void {
        if (!this.smallMarkerPool) return;
        for (const markerId of this.smallCountryMarkers.values()) {
            this.smallMarkerPool.showMarker(markerId);
        }
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

        const countryData = this.countryRenderer.getRegionByIndex(countryIndex);
        if (!countryData) return;

        const polygonsData = this.countryRenderer.getPolygonsData();
        const borderPointArrays = countryData.polygonIndices.map(
            idx => polygonsData[idx].borderPoints
        );

        if (countryData.centroid && this.smallOutlineMaterial) {
            this.outlineRenderer.showOutline(
                countryIndex, borderPointArrays, this.smallOutlineMaterial,
                SMALL_OUTLINE_TUBE_RADIUS, countryData.centroid
            );
        } else {
            this.outlineRenderer.showOutline(countryIndex, borderPointArrays, this.outlineMaterial);
        }
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

        toggleColliderDebug(this.scene, this.countryPicker, surfaceMeshes);
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
        this.countryRenderer.dispose();
        this.borderRenderer.dispose();
        this.outlineRenderer.dispose();
        this.skybox.dispose();
        this.animationTexture.dispose();

        if (this.markerPool) {
            this.markerPool.dispose();
        }
        if (this.smallMarkerPool) {
            this.smallMarkerPool.dispose();
        }

        this.scene.dispose();
        this.engine.dispose();
    }
}
