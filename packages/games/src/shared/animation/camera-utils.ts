/**
 * Camera Animation Module
 * Plain functions for smooth camera animations on ArcRotateCamera
 */

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { easedValue, getEasingFunction } from '../utils/easing';
import { CAMERA_LOWER_RADIUS, AUTO_FRAME_MIN_RADIUS, CAMERA_UPPER_RADIUS, EARTH_RADIUS, ANIMATION_AMPLITUDE, zoom } from '../../earth-globe';
import { ALTITUDE_NORMAL } from '../../earth-globe/constants';
import type { RegionPolygon, LatLon } from '../../earth-globe';
import { cartesianToLatLon, latLonToSphere } from '../../earth-globe';

/**
 * Defines a rectangular region of the viewport where content should be framed
 * All values are normalized (0-1) relative to screen dimensions
 */
export interface ViewportRegion {
    x: number;      // Left edge (0 = left edge, 0.5 = center, 1 = right edge)
    y: number;      // Top edge (0 = top edge, 0.5 = center, 1 = bottom edge)
    width: number;  // Width as fraction of screen width (e.g., 0.5 = half width)
    height: number; // Height as fraction of screen height (e.g., 0.6 = 60% height)
}

/**
 * Easing function for smooth animations (ease-in-out cubic)
 */
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Convert lat/lon to camera alpha/beta angles
 */
function latLonToAlphaBeta(lat: number, lon: number): { alpha: number; beta: number } {
    const alpha = lon * (Math.PI / 180);
    const beta = Math.PI / 2 - (lat * Math.PI / 180);
    return { alpha, beta };
}

/**
 * Project world positions to screen space (X and Y coordinates)
 */
function projectWorldToScreenXY(
    camera: ArcRotateCamera,
    latLons: (LatLon | { lat: number, lon: number, altitude?: number })[],
    alpha: number,
    beta: number,
    radius: number
): { x: number, y: number }[] {
    const scene = camera.getScene();
    const engine = scene.getEngine();
    const target = camera.target;

    // Calculate camera position
    const cameraX = target.x + radius * Math.sin(beta) * Math.cos(alpha);
    const cameraY = target.y + radius * Math.cos(beta);
    const cameraZ = target.z + radius * Math.sin(beta) * Math.sin(alpha);
    const cameraPos = new Vector3(cameraX, cameraY, cameraZ);

    const viewMatrix = Matrix.LookAtLH(cameraPos, target, Vector3.Up());
    const projectionMatrix = camera.getProjectionMatrix();
    const transformMatrix = viewMatrix.multiply(projectionMatrix);

    const viewport = camera.viewport.toGlobal(
        engine.getRenderWidth(),
        engine.getRenderHeight()
    );

    const results: { x: number, y: number }[] = [];
    for (const latLon of latLons) {
        const altitude = 'altitude' in latLon ? (latLon.altitude || 0) : 0;
        const worldPos = latLonToSphere(latLon.lat, latLon.lon, altitude);

        const screenPos = Vector3.Project(
            worldPos,
            Matrix.Identity(),
            transformMatrix,
            viewport
        );

        // Convert to normalized 0-1 coordinates
        const normalizedX = screenPos.x / engine.getRenderWidth();
        const normalizedY = screenPos.y / engine.getRenderHeight();

        results.push({ x: normalizedX, y: normalizedY });
    }

    return results;
}

/**
 * Draw 2D debug visualization of projected points on screen
 */
function drawProjectionDebug(
    camera: ArcRotateCamera,
    projectedPoints: { screenX: number, screenY: number, lat: number, lon: number }[],
    viewportRegion?: ViewportRegion
): void {
    const scene = camera.getScene();
    const engine = scene.getEngine();

    // Remove old debug canvas if it exists
    const oldCanvas = document.getElementById('projectionDebugCanvas');
    if (oldCanvas) oldCanvas.remove();

    // Create a 2D canvas overlay
    const canvas = document.createElement('canvas');
    canvas.id = 'projectionDebugCanvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1000';
    canvas.width = engine.getRenderWidth();
    canvas.height = engine.getRenderHeight();
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw viewport bounds (green box)
    if (viewportRegion) {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            viewportRegion.x * canvas.width,
            viewportRegion.y * canvas.height,
            viewportRegion.width * canvas.width,
            viewportRegion.height * canvas.height
        );
    }

    // Draw calculated bounding box (cyan)
    if (projectedPoints.length > 0) {
        const minX = Math.min(...projectedPoints.map(p => p.screenX));
        const maxX = Math.max(...projectedPoints.map(p => p.screenX));
        const minY = Math.min(...projectedPoints.map(p => p.screenY));
        const maxY = Math.max(...projectedPoints.map(p => p.screenY));

        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            minX * canvas.width,
            minY * canvas.height,
            (maxX - minX) * canvas.width,
            (maxY - minY) * canvas.height
        );

        // Draw bounding box center (LARGE YELLOW CROSSHAIR)
        const bboxCenterPixelX = ((minX + maxX) / 2) * canvas.width;
        const bboxCenterPixelY = ((minY + maxY) / 2) * canvas.height;

        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        const crosshairSize = 20;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(bboxCenterPixelX - crosshairSize, bboxCenterPixelY);
        ctx.lineTo(bboxCenterPixelX + crosshairSize, bboxCenterPixelY);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(bboxCenterPixelX, bboxCenterPixelY - crosshairSize);
        ctx.lineTo(bboxCenterPixelX, bboxCenterPixelY + crosshairSize);
        ctx.stroke();

        // Draw viewport center (LARGE MAGENTA CROSSHAIR)
        const viewportCenterX = viewportRegion ? (viewportRegion.x + viewportRegion.width / 2) : 0.5;
        const viewportCenterY = viewportRegion ? (viewportRegion.y + viewportRegion.height / 2) : 0.5;
        const viewportCenterPixelX = viewportCenterX * canvas.width;
        const viewportCenterPixelY = viewportCenterY * canvas.height;

        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 3;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(viewportCenterPixelX - crosshairSize, viewportCenterPixelY);
        ctx.lineTo(viewportCenterPixelX + crosshairSize, viewportCenterPixelY);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(viewportCenterPixelX, viewportCenterPixelY - crosshairSize);
        ctx.lineTo(viewportCenterPixelX, viewportCenterPixelY + crosshairSize);
        ctx.stroke();

        // Draw extreme points
        // Red = topmost (min Y)
        const topPoint = projectedPoints.reduce((min, p) => p.screenY < min.screenY ? p : min);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(topPoint.screenX * canvas.width, topPoint.screenY * canvas.height, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Green = bottommost (max Y)
        const bottomPoint = projectedPoints.reduce((max, p) => p.screenY > max.screenY ? p : max);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bottomPoint.screenX * canvas.width, bottomPoint.screenY * canvas.height, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Black dots = sample of ~20 perimeter points
        const sampleSize = Math.min(20, projectedPoints.length);
        const step = Math.floor(projectedPoints.length / sampleSize);
        ctx.fillStyle = 'black';
        for (let i = 0; i < projectedPoints.length; i += step) {
            const p = projectedPoints[i];
            ctx.beginPath();
            ctx.arc(p.screenX * canvas.width, p.screenY * canvas.height, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Calculate and log bounding box center
        const bboxCenterX = (minX + maxX) / 2;
        const bboxCenterY = (minY + maxY) / 2;

        console.log(`\n=== 2D Debug Visualization ===`);
        console.log(`Bounding box: X=[${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y=[${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);
        console.log(`Bbox center: (${bboxCenterX.toFixed(4)}, ${bboxCenterY.toFixed(4)}) - YELLOW CROSSHAIR`);
        console.log(`Viewport center: (${viewportRegion ? (viewportRegion.x + viewportRegion.width / 2).toFixed(4) : '0.5000'}, ${viewportRegion ? (viewportRegion.y + viewportRegion.height / 2).toFixed(4) : '0.5000'}) - MAGENTA CROSSHAIR`);
        console.log(`Red dot (top): screen Y=${topPoint.screenY.toFixed(4)}, lat=${topPoint.lat.toFixed(2)}°, lon=${topPoint.lon.toFixed(2)}°`);
        console.log(`Green dot (bottom): screen Y=${bottomPoint.screenY.toFixed(4)}, lat=${bottomPoint.lat.toFixed(2)}°, lon=${bottomPoint.lon.toFixed(2)}°`);
        console.log(`Cyan box: calculated bounding box of all projected points`);
        console.log(`Lime box: target viewport region`);
        console.log(`Black dots: sample of ${sampleSize} points around country perimeter`);
        console.log(`\nGoal: Yellow crosshair should overlap with Magenta crosshair`);
    }
}

/**
 * Animate camera to look at a specific location with a given zoom
 */
export async function animateToLocation(
    camera: ArcRotateCamera,
    lat: number,
    lon: number,
    targetRadius: number,
    duration: number,
    alphaOffset: number = 0,
    betaOffset: number = 0
): Promise<void> {
    let { alpha: targetAlpha, beta: targetBeta } = latLonToAlphaBeta(lat, lon);

    // Apply offsets if provided
    targetAlpha += alphaOffset;
    targetBeta += betaOffset;

    // Store starting values
    const startAlpha = camera.alpha;
    const startBeta = camera.beta;
    const startRadius = camera.radius;

    // Calculate deltas (handle alpha wrapping around 2*PI)
    // camera.alpha can accumulate far beyond [0, 2π] from user spinning,
    // so a single ±2π correction isn't enough — use full modular normalization
    let deltaAlpha = targetAlpha - startAlpha;
    deltaAlpha -= Math.round(deltaAlpha / (2 * Math.PI)) * (2 * Math.PI);

    const deltaBeta = targetBeta - startBeta;
    const deltaRadius = targetRadius - startRadius;

    return new Promise((resolve) => {
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const rawProgress = Math.min(1, elapsed / duration);

            // Apply easing
            const progress = easeInOutCubic(rawProgress);

            // Update camera properties
            camera.alpha = startAlpha + deltaAlpha * progress;
            camera.beta = startBeta + deltaBeta * progress;
            camera.radius = startRadius + deltaRadius * progress;

            if (rawProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at target
                camera.alpha = targetAlpha;
                camera.beta = targetBeta;
                camera.radius = targetRadius;
                resolve();
            }
        };

        requestAnimationFrame(animate);
    });
}

/**
 * Animate camera to frame a country perfectly in view
 *
 * Uses two different algorithms:
 * - No viewport region: Simple binary search on radius (camera points at center)
 * - With viewport region: Smart initialization + two-stage grid search
 */
export async function frameCountry(
    camera: ArcRotateCamera,
    globe: any,
    polygons: RegionPolygon[],
    countryName: string,
    duration: number,
    margin: number = 0.8,
    viewportRegion?: ViewportRegion,
    maxIterations: number = 100,
    gridConfig?: {
        coarseGridSize?: number;
        fineGridSize?: number;
        alphaRangeDegrees?: number;
        betaRangeDegrees?: number;
        showDebugVisualization?: boolean;
        overrideAltitude?: number;
    }
): Promise<{
    iterations: number;
    finalError: number;
    solveTime: number;
    converged: boolean;
}> {
    if (polygons.length === 0) {
        console.error('No polygons provided for framing');
        return {
            iterations: 0,
            finalError: 1.0,
            solveTime: 0,
            converged: false
        };
    }

    // Get country index from first polygon (all polygons belong to same country)
    const countryIndex = polygons[0].regionIndex;

    // Get altitude to use for framing
    const altitudeNormalized = gridConfig?.overrideAltitude !== undefined
        ? gridConfig.overrideAltitude
        : (globe?.getCountryController().getAltitude(countryIndex) ?? ALTITUDE_NORMAL);
    const actualAltitude = altitudeNormalized * ANIMATION_AMPLITUDE;

    const altitudeSource = gridConfig?.overrideAltitude !== undefined ? 'override' : 'current';
    console.log(`\n=== Framing ${countryName} (altitude: ${actualAltitude.toFixed(4)}, source: ${altitudeSource}) ===`);

    // STEP 1: Collect all points from all polygons
    const allPoints: LatLon[] = [];
    for (const polygon of polygons) {
        allPoints.push(...polygon.points);
    }

    console.log(`Points: ${allPoints.length}, normalized altitude: ${altitudeNormalized.toFixed(2)}, world altitude: ${actualAltitude.toFixed(4)}`);

    // STEP 2: Calculate spherical center using 3D averaging (handles antimeridian)
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const point of allPoints) {
        const latRad = point.lat * (Math.PI / 180);
        const lonRad = point.lon * (Math.PI / 180);

        const x = Math.cos(latRad) * Math.cos(lonRad);
        const y = Math.sin(latRad);
        const z = Math.cos(latRad) * Math.sin(lonRad);

        sumX += x;
        sumY += y;
        sumZ += z;
    }

    const length = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
    const center = cartesianToLatLon(sumX / length, sumY / length, sumZ / length);

    console.log(`Center: lat=${center.lat.toFixed(2)}°, lon=${center.lon.toFixed(2)}°`);

    // STEP 3: Get base camera angles for looking at country center
    const { alpha: baseAlpha, beta: baseBeta } = latLonToAlphaBeta(center.lat, center.lon);

    // STEP 4: Define viewport bounds
    const viewportLeft = viewportRegion?.x ?? 0;
    const viewportTop = viewportRegion?.y ?? 0;
    const viewportWidth = viewportRegion?.width ?? 1;
    const viewportHeight = viewportRegion?.height ?? 1;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenterX = viewportLeft + viewportWidth / 2;
    const viewportCenterY = viewportTop + viewportHeight / 2;

    console.log(`Viewport: left=${viewportLeft.toFixed(4)}, top=${viewportTop.toFixed(4)}, right=${viewportRight.toFixed(4)}, bottom=${viewportBottom.toFixed(4)}, center=(${viewportCenterX.toFixed(4)}, ${viewportCenterY.toFixed(4)})`);

    // STEP 5: Choose algorithm based on whether viewport region is specified
    const startSolveTime = performance.now();

    let bestSolution: {
        alpha: number;
        beta: number;
        radius: number;
    } | null = null;

    let stats = {
        iterations: 0,
        finalError: 0,
        solveTime: 0,
        converged: false
    };

    // Helper: Binary search for optimal radius given viewport bounds
    const binarySearchRadius = (
        alpha: number,
        beta: number,
        vLeft: number,
        vTop: number,
        vRight: number,
        vBottom: number
    ): number => {
        let minRadius = AUTO_FRAME_MIN_RADIUS;
        let maxRadius = 10.0;
        const TARGET_FILL = 0.95;
        const MAX_ITERATIONS = 20;
        const vWidth = vRight - vLeft;
        const vHeight = vBottom - vTop;

        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
            stats.iterations++;
            const testRadius = (minRadius + maxRadius) / 2;

            const projectedXY = projectWorldToScreenXY(
                camera,
                allPoints.map(p => ({ ...p, altitude: actualAltitude })),
                alpha,
                beta,
                testRadius
            );

            const xs = projectedXY.map(p => p.x);
            const ys = projectedXY.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Check if all points fit in viewport bounds
            const allFit = minX >= vLeft && maxX <= vRight && minY >= vTop && maxY <= vBottom;

            if (!allFit) {
                minRadius = testRadius;
            } else {
                const width = maxX - minX;
                const height = maxY - minY;
                const fillRatio = Math.min(width / vWidth, height / vHeight);

                if (fillRatio >= TARGET_FILL) {
                    return testRadius;
                } else {
                    maxRadius = testRadius;
                }
            }
        }

        return minRadius;
    };

    // ====================
    // NO VIEWPORT REGION: Simple binary search on radius only
    // ====================
    if (!viewportRegion) {
        console.log(`No viewport region - using binary search on radius`);

        const optimalRadius = binarySearchRadius(baseAlpha, baseBeta, 0, 0, 1, 1);
        bestSolution = { alpha: baseAlpha, beta: baseBeta, radius: optimalRadius };
        stats.converged = true;

        stats.solveTime = performance.now() - startSolveTime;
        stats.finalError = 0;
        console.log(`Binary search complete in ${stats.solveTime.toFixed(1)}ms - radius=${optimalRadius.toFixed(4)}`);
    }

    // ====================
    // WITH VIEWPORT REGION: Two-stage coarse-to-fine grid search
    // ====================
    else {
        console.log(`Viewport region specified - using two-stage grid search`);

        // For large countries, only use a sample of points for the grid search
        const MAX_SAMPLE_POINTS = 100;
        const samplePoints = allPoints.length > MAX_SAMPLE_POINTS
            ? allPoints.filter((_, i) => i % Math.ceil(allPoints.length / MAX_SAMPLE_POINTS) === 0)
            : allPoints;

        console.log(`Using ${samplePoints.length} of ${allPoints.length} points for grid search`);

        // SMART INITIALIZATION: Reduce search space before brute force
        console.log(`\n=== Smart Initialization ===`);

        // Step 1: Binary search for optimal radius (for viewport SIZE, not position)
        const centeredLeft = 0.5 - viewportWidth / 2;
        const centeredTop = 0.5 - viewportHeight / 2;
        const centeredRight = centeredLeft + viewportWidth;
        const centeredBottom = centeredTop + viewportHeight;

        const optimalRadius = binarySearchRadius(baseAlpha, baseBeta,
            centeredLeft, centeredTop, centeredRight, centeredBottom);
        console.log(`  Optimal radius for viewport size: ${optimalRadius.toFixed(4)}`);

        // Step 2: Calculate camera angle adjustments based on viewport offset
        const screenCenterX = 0.5;
        const screenCenterY = 0.5;
        const offsetX = viewportCenterX - screenCenterX;
        const offsetY = viewportCenterY - screenCenterY;

        const alphaAdjustment = offsetX * 0.3;
        const betaAdjustment = -offsetY * 0.5;

        const smartAlpha = baseAlpha + alphaAdjustment;
        const smartBeta = baseBeta + betaAdjustment;

        console.log(`  Viewport offset: (${(offsetX * 100).toFixed(1)}%, ${(offsetY * 100).toFixed(1)}%)`);
        console.log(`  Camera adjustments: alpha ${alphaAdjustment >= 0 ? '+' : ''}${(alphaAdjustment * 180 / Math.PI).toFixed(2)}°, beta ${betaAdjustment >= 0 ? '+' : ''}${(betaAdjustment * 180 / Math.PI).toFixed(2)}°`);

        // Step 3: Narrow search ranges around smart estimate
        const alphaRangeDeg = gridConfig?.alphaRangeDegrees ?? 5;
        const betaRangeDeg = gridConfig?.betaRangeDegrees ?? 10;
        const ALPHA_RANGE = alphaRangeDeg * (Math.PI / 180);
        const BETA_RANGE = betaRangeDeg * (Math.PI / 180);

        // Search radius ±20% around optimal
        const RADIUS_RANGE_FRACTION = 0.20;
        const MIN_RADIUS = Math.max(AUTO_FRAME_MIN_RADIUS, optimalRadius * (1 - RADIUS_RANGE_FRACTION));
        const MAX_RADIUS = Math.min(10.0, optimalRadius * (1 + RADIUS_RANGE_FRACTION));

        console.log(`  Search ranges: alpha ${(smartAlpha * 180 / Math.PI).toFixed(2)}° ± ${alphaRangeDeg}°, beta ${(smartBeta * 180 / Math.PI).toFixed(2)}° ± ${betaRangeDeg}°, radius [${MIN_RADIUS.toFixed(2)}, ${MAX_RADIUS.toFixed(2)}]`);
        console.log(`=== Starting Grid Search ===\n`);

        let checksPerformed = 0;

        // Helper function for grid search
        const searchGrid = (
            alphaCenter: number,
            alphaRange: number,
            alphaSamples: number,
            betaCenter: number,
            betaRange: number,
            betaSamples: number,
            minRadius: number,
            maxRadius: number,
            radiusSamples: number,
            maxCenterError: number,
            stageName: string
        ): { alpha: number; beta: number; radius: number; score: number } | null => {
            let bestSolution: { alpha: number; beta: number; radius: number; score: number } | null = null;
            const stageStartChecks = checksPerformed;

            for (let alphaIdx = 0; alphaIdx < alphaSamples; alphaIdx++) {
                const alphaProgress = alphaSamples === 1 ? 0.5 : alphaIdx / (alphaSamples - 1);
                const alpha = alphaCenter - alphaRange + (2 * alphaRange * alphaProgress);

                for (let betaIdx = 0; betaIdx < betaSamples; betaIdx++) {
                    const betaProgress = betaSamples === 1 ? 0.5 : betaIdx / (betaSamples - 1);
                    const beta = betaCenter - betaRange + (2 * betaRange * betaProgress);

                    // Iterate radius from SMALL to LARGE (zoom in to zoom out)
                    for (let radiusIdx = radiusSamples - 1; radiusIdx >= 0; radiusIdx--) {
                        const radiusProgress = radiusSamples === 1 ? 0.5 : radiusIdx / (radiusSamples - 1);
                        const radius = maxRadius - (maxRadius - minRadius) * radiusProgress;

                        checksPerformed++;

                        // Project SAMPLE points with actual country altitude
                        const projectedXY = projectWorldToScreenXY(
                            camera,
                            samplePoints.map(p => ({ ...p, altitude: actualAltitude })),
                            alpha,
                            beta,
                            radius
                        );

                        // Check if ALL sample points are inside viewport
                        const allInside = projectedXY.every(p =>
                            p.x >= viewportLeft &&
                            p.x <= viewportRight &&
                            p.y >= viewportTop &&
                            p.y <= viewportBottom
                        );

                        if (!allInside) continue;

                        // Calculate BOUNDING BOX center
                        const minX = Math.min(...projectedXY.map(p => p.x));
                        const maxX = Math.max(...projectedXY.map(p => p.x));
                        const minY = Math.min(...projectedXY.map(p => p.y));
                        const maxY = Math.max(...projectedXY.map(p => p.y));

                        const bboxCenterX = (minX + maxX) / 2;
                        const bboxCenterY = (minY + maxY) / 2;

                        // Check if bounding box center is within tolerance
                        const centerErrorX = Math.abs(bboxCenterX - viewportCenterX);
                        const centerErrorY = Math.abs(bboxCenterY - viewportCenterY);

                        if (centerErrorX > maxCenterError || centerErrorY > maxCenterError) continue;

                        // Valid solution! Score = radius (lower is better = more zoomed in)
                        const score = radius;

                        if (bestSolution === null || score < bestSolution.score) {
                            bestSolution = { alpha, beta, radius, score };
                        }
                    }
                }
            }

            const stageChecks = checksPerformed - stageStartChecks;
            console.log(`  ${stageName}: ${stageChecks.toLocaleString()} checks, best radius: ${bestSolution?.radius.toFixed(4) ?? 'none'}`);
            return bestSolution;
        };

        // STAGE 1: Coarse grid search with loose tolerance
        const COARSE_GRID_SIZE = gridConfig?.coarseGridSize ?? 6;
        const coarseChecks = COARSE_GRID_SIZE ** 3;
        console.log(`Stage 1: Coarse search (${COARSE_GRID_SIZE}×${COARSE_GRID_SIZE}×${COARSE_GRID_SIZE} = ${coarseChecks.toLocaleString()} checks)...`);

        let gridBestSolution = searchGrid(
            smartAlpha, ALPHA_RANGE, COARSE_GRID_SIZE,
            smartBeta, BETA_RANGE, COARSE_GRID_SIZE,
            MIN_RADIUS, MAX_RADIUS, COARSE_GRID_SIZE,
            0.05,
            'Coarse'
        );

        // STAGE 2: Fine refinement around coarse solution
        if (gridBestSolution) {
            const FINE_GRID_SIZE = gridConfig?.fineGridSize ?? 6;
            const fineChecks = FINE_GRID_SIZE ** 3;
            console.log(`Stage 2: Fine refinement (${FINE_GRID_SIZE}×${FINE_GRID_SIZE}×${FINE_GRID_SIZE} = ${fineChecks.toLocaleString()} checks)...`);

            const FINE_RANGE_FRACTION = 0.30;
            const fineAlphaRange = ALPHA_RANGE * FINE_RANGE_FRACTION;
            const fineBetaRange = BETA_RANGE * FINE_RANGE_FRACTION;
            const fineRadiusRange = (MAX_RADIUS - MIN_RADIUS) * FINE_RANGE_FRACTION;

            const fineMinRadius = Math.max(MIN_RADIUS, gridBestSolution.radius - fineRadiusRange);
            const fineMaxRadius = Math.min(MAX_RADIUS, gridBestSolution.radius + fineRadiusRange);

            const fineResult = searchGrid(
                gridBestSolution.alpha, fineAlphaRange, FINE_GRID_SIZE,
                gridBestSolution.beta, fineBetaRange, FINE_GRID_SIZE,
                fineMinRadius, fineMaxRadius, FINE_GRID_SIZE,
                0.01,
                'Fine'
            );

            if (fineResult) {
                gridBestSolution = fineResult;
            }
        }

        // FALLBACK: If smart initialization failed, retry with wider ranges
        if (!gridBestSolution) {
            console.warn(`⚠ Smart initialization failed to find solution. Retrying with 3x wider ranges...`);

            const FALLBACK_ALPHA_RANGE = ALPHA_RANGE * 3;
            const FALLBACK_BETA_RANGE = BETA_RANGE * 3;
            const FALLBACK_MIN_RADIUS = AUTO_FRAME_MIN_RADIUS;
            const FALLBACK_MAX_RADIUS = 10.0;

            gridBestSolution = searchGrid(
                smartAlpha, FALLBACK_ALPHA_RANGE, COARSE_GRID_SIZE,
                smartBeta, FALLBACK_BETA_RANGE, COARSE_GRID_SIZE,
                FALLBACK_MIN_RADIUS, FALLBACK_MAX_RADIUS, COARSE_GRID_SIZE,
                0.05,
                'Fallback Coarse'
            );

            if (gridBestSolution) {
                console.log(`✓ Fallback succeeded`);
                const FINE_GRID_SIZE = gridConfig?.fineGridSize ?? 6;
                const FINE_RANGE_FRACTION = 0.30;
                const fineAlphaRange = FALLBACK_ALPHA_RANGE * FINE_RANGE_FRACTION;
                const fineBetaRange = FALLBACK_BETA_RANGE * FINE_RANGE_FRACTION;
                const fineRadiusRange = (FALLBACK_MAX_RADIUS - FALLBACK_MIN_RADIUS) * FINE_RANGE_FRACTION;

                const fineMinRadius = Math.max(FALLBACK_MIN_RADIUS, gridBestSolution.radius - fineRadiusRange);
                const fineMaxRadius = Math.min(FALLBACK_MAX_RADIUS, gridBestSolution.radius + fineRadiusRange);

                const fineResult = searchGrid(
                    gridBestSolution.alpha, fineAlphaRange, FINE_GRID_SIZE,
                    gridBestSolution.beta, fineBetaRange, FINE_GRID_SIZE,
                    fineMinRadius, fineMaxRadius, FINE_GRID_SIZE,
                    0.01,
                    'Fallback Fine'
                );

                if (fineResult) {
                    gridBestSolution = fineResult;
                }
            }
        }

        stats.solveTime = performance.now() - startSolveTime;
        stats.iterations = checksPerformed;

        if (!gridBestSolution) {
            console.error(`❌ No valid solution found after ${checksPerformed} checks in ${stats.solveTime.toFixed(1)}ms`);
            stats.converged = false;
            stats.finalError = 1.0;
            return stats;
        }

        // Assign to bestSolution
        bestSolution = {
            alpha: gridBestSolution.alpha,
            beta: gridBestSolution.beta,
            radius: gridBestSolution.radius
        };

        // Calculate final centering error
        const finalProjection = projectWorldToScreenXY(
            camera,
            samplePoints.map(p => ({ ...p, altitude: actualAltitude })),
            bestSolution.alpha,
            bestSolution.beta,
            bestSolution.radius
        );
        const finalXs = finalProjection.map(p => p.x);
        const finalYs = finalProjection.map(p => p.y);
        const finalBboxCenterX = (Math.min(...finalXs) + Math.max(...finalXs)) / 2;
        const finalBboxCenterY = (Math.min(...finalYs) + Math.max(...finalYs)) / 2;
        const errorX = Math.abs(finalBboxCenterX - viewportCenterX);
        const errorY = Math.abs(finalBboxCenterY - viewportCenterY);
        stats.finalError = Math.max(errorX, errorY);
        stats.converged = stats.finalError <= 0.01;

        console.log(`\n=== Grid Search Solution Found ===`);
        console.log(`Checked ${checksPerformed} combinations in ${stats.solveTime.toFixed(1)}ms`);
        console.log(`Best: alpha=${(bestSolution.alpha * 180 / Math.PI).toFixed(2)}°, beta=${(bestSolution.beta * 180 / Math.PI).toFixed(2)}°, radius=${bestSolution.radius.toFixed(4)}`);
        console.log(`Final centering error: ${(stats.finalError * 100).toFixed(2)}%`);
    }

    // ====================
    // FINAL CHECK: Verify we have a solution
    // ====================
    if (!bestSolution) {
        console.error(`No valid solution found`);
        stats.converged = false;
        stats.finalError = 1.0;
        return stats;
    }

    console.log(`\n=== Solution Found ===`);
    console.log(`Best: alpha=${(bestSolution.alpha * 180 / Math.PI).toFixed(2)}°, beta=${(bestSolution.beta * 180 / Math.PI).toFixed(2)}°, radius=${bestSolution.radius.toFixed(4)}`);

    // Store projected point data for debug visualization
    interface ProjectedPointData {
        screenX: number;
        screenY: number;
        lat: number;
        lon: number;
    }

    // STEP 6: Animate to the solution
    await animateToLocation(
        camera,
        center.lat,
        center.lon,
        bestSolution.radius,
        duration,
        bestSolution.alpha - baseAlpha,
        bestSolution.beta - baseBeta
    );

    // STEP 7: Wait a frame for camera to settle, then verify projection
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Re-project all points with the ACTUAL camera position
    console.log(`\n=== Verifying projection with actual camera state ===`);
    console.log(`Camera: alpha=${(camera.alpha * 180 / Math.PI).toFixed(2)}°, beta=${(camera.beta * 180 / Math.PI).toFixed(2)}°, radius=${camera.radius.toFixed(4)}`);

    const verifiedProjection = projectWorldToScreenXY(
        camera,
        allPoints.map(p => ({ ...p, altitude: actualAltitude })),
        camera.alpha,
        camera.beta,
        camera.radius
    );

    const verifiedPoints: ProjectedPointData[] = verifiedProjection.map((p, i) => ({
        screenX: p.x,
        screenY: p.y,
        lat: allPoints[i].lat,
        lon: allPoints[i].lon
    }));

    // Draw debug visualization with VERIFIED projections (if enabled)
    if (gridConfig?.showDebugVisualization) {
        drawProjectionDebug(camera, verifiedPoints, viewportRegion);
    }

    // Return performance stats
    return stats;
}

/**
 * Frame arbitrary lat/lon points by flying the camera to show them all.
 * Thin wrapper around the same spherical-center + binary-search-radius logic
 * used by frameCountry, but without polygons or viewport regions.
 *
 * Returns false (and skips animation) if points span more than MAX_ANGULAR_SPREAD_DEG.
 */
const MAX_ANGULAR_SPREAD_DEG = 90

export async function frameLocations(
    camera: ArcRotateCamera,
    points: LatLon[],
    duration: number,
    margin: number = 0.8,
    viewportRegion?: ViewportRegion
): Promise<boolean> {
    if (points.length === 0) return false

    // Single point: just fly there at a reasonable zoom
    if (points.length === 1) {
        const alphaOffset = viewportRegion
            ? (viewportRegion.x + viewportRegion.width / 2 - 0.5) * 0.3
            : 0
        const betaOffset = viewportRegion
            ? -(viewportRegion.y + viewportRegion.height / 2 - 0.5) * 0.5
            : 0
        await animateToLocation(camera, points[0].lat, points[0].lon, 5.0, duration, alphaOffset, betaOffset)
        return true
    }

    // Spherical center via 3D averaging (handles antimeridian)
    let sumX = 0, sumY = 0, sumZ = 0
    for (const p of points) {
        const latRad = p.lat * (Math.PI / 180)
        const lonRad = p.lon * (Math.PI / 180)
        sumX += Math.cos(latRad) * Math.cos(lonRad)
        sumY += Math.sin(latRad)
        sumZ += Math.cos(latRad) * Math.sin(lonRad)
    }
    const length = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ)
    const center = cartesianToLatLon(sumX / length, sumY / length, sumZ / length)

    // Check angular spread — skip if too wide to frame meaningfully
    const centerLatRad = center.lat * (Math.PI / 180)
    const centerLonRad = center.lon * (Math.PI / 180)
    let maxAngle = 0
    for (const p of points) {
        const latRad = p.lat * (Math.PI / 180)
        const lonRad = p.lon * (Math.PI / 180)
        // Dot product on unit sphere
        const dot =
            Math.cos(centerLatRad) * Math.cos(centerLonRad) * Math.cos(latRad) * Math.cos(lonRad) +
            Math.sin(centerLatRad) * Math.sin(latRad) +
            Math.cos(centerLatRad) * Math.sin(centerLonRad) * Math.cos(latRad) * Math.sin(lonRad)
        const angle = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI)
        if (angle > maxAngle) maxAngle = angle
    }

    if (maxAngle > MAX_ANGULAR_SPREAD_DEG) {
        // Points too spread out to frame tightly — stay zoomed out, aim at densest cluster
        const t0 = performance.now()
        const CLUSTER_DEG = 70
        const angDist = (a: LatLon, b: LatLon): number => {
            const la = a.lat * (Math.PI / 180), oa = a.lon * (Math.PI / 180)
            const lb = b.lat * (Math.PI / 180), ob = b.lon * (Math.PI / 180)
            const d = Math.cos(la) * Math.cos(oa) * Math.cos(lb) * Math.cos(ob)
                + Math.sin(la) * Math.sin(lb)
                + Math.cos(la) * Math.sin(oa) * Math.cos(lb) * Math.sin(ob)
            return Math.acos(Math.min(1, Math.max(-1, d))) * (180 / Math.PI)
        }
        let bestIdx = 0, bestCount = 0
        for (let i = 0; i < points.length; i++) {
            let count = 0
            for (let j = 0; j < points.length; j++) {
                if (angDist(points[i], points[j]) <= CLUSTER_DEG) count++
            }
            if (count > bestCount) { bestCount = count; bestIdx = i }
        }
        const target = points[bestIdx]
        const alphaOffset = viewportRegion
            ? (viewportRegion.x + viewportRegion.width / 2 - 0.5) * 0.3
            : 0
        const betaOffset = viewportRegion
            ? -(viewportRegion.y + viewportRegion.height / 2 - 0.5) * 0.5
            : 0
        console.log(`frameLocations: spread ${maxAngle.toFixed(1)}° > ${MAX_ANGULAR_SPREAD_DEG}° — aiming at densest point (${target.lat.toFixed(1)}, ${target.lon.toFixed(1)}) zoomed out, n=${points.length}, cluster took ${(performance.now() - t0).toFixed(2)}ms`)
        await animateToLocation(camera, target.lat, target.lon, 10.0, duration, alphaOffset, betaOffset)
        return true
    }

    // Binary search for radius that fits all points with margin
    const { alpha: baseAlpha, beta: baseBeta } = latLonToAlphaBeta(center.lat, center.lon)

    // Viewport bounds for containment check and fill ratio
    const vLeft = viewportRegion?.x ?? 0
    const vTop = viewportRegion?.y ?? 0
    const vWidth = viewportRegion?.width ?? 1
    const vHeight = viewportRegion?.height ?? 1
    const vRight = vLeft + vWidth
    const vBottom = vTop + vHeight

    let minRadius = AUTO_FRAME_MIN_RADIUS
    let maxRadius = 10.0
    const MAX_ITERATIONS = 20

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        const testRadius = (minRadius + maxRadius) / 2

        const projected = projectWorldToScreenXY(camera, points, baseAlpha, baseBeta, testRadius)
        const xs = projected.map(p => p.x)
        const ys = projected.map(p => p.y)
        const pMinX = Math.min(...xs)
        const pMaxX = Math.max(...xs)
        const pMinY = Math.min(...ys)
        const pMaxY = Math.max(...ys)

        const allFit = pMinX >= vLeft && pMaxX <= vRight && pMinY >= vTop && pMaxY <= vBottom

        if (!allFit) {
            minRadius = testRadius
        } else {
            const width = pMaxX - pMinX
            const height = pMaxY - pMinY
            const fillRatio = Math.min(width / vWidth, height / vHeight)

            if (fillRatio >= margin) {
                maxRadius = testRadius
                break
            } else {
                maxRadius = testRadius
            }
        }
    }

    const radius = (minRadius + maxRadius) / 2

    // Camera offset to center content in viewport region
    const alphaOffset = viewportRegion
        ? (viewportRegion.x + viewportRegion.width / 2 - 0.5) * 0.3
        : 0
    const betaOffset = viewportRegion
        ? -(viewportRegion.y + viewportRegion.height / 2 - 0.5) * 0.5
        : 0

    await animateToLocation(camera, center.lat, center.lon, radius, duration, alphaOffset, betaOffset)
    return true
}

/**
 * Camera shake effect for wrong answers
 */
export async function cameraShake(camera: ArcRotateCamera, duration: number = 300, intensity: number = 0.02): Promise<void> {
    const originalAlpha = camera.alpha;
    const originalBeta = camera.beta;

    const startTime = performance.now();

    return new Promise((resolve) => {
        const shake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                camera.alpha = originalAlpha;
                camera.beta = originalBeta;
                resolve();
                return;
            }

            // Decay shake over time
            const decay = 1 - progress;
            const offsetAlpha = (Math.random() - 0.5) * intensity * decay;
            const offsetBeta = (Math.random() - 0.5) * intensity * decay;

            camera.alpha = originalAlpha + offsetAlpha;
            camera.beta = originalBeta + offsetBeta;

            requestAnimationFrame(shake);
        };
        shake();
    });
}

/**
 * Get an interpolated value based on current camera zoom level.
 * Replaces the ZoomBasedValue class.
 */
export function getZoomValue(camera: ArcRotateCamera, closeValue: number, farValue: number, easingName: string = 'Linear'): number {
    const easing = getEasingFunction(easingName);
    return easedValue(camera.radius, CAMERA_LOWER_RADIUS, zoom.threshold, closeValue, farValue, easing);
}
