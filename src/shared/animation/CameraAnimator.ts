/**
 * Camera Animator Module
 * Handles smooth camera animations for ArcRotateCamera
 */

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { getConfig } from '../config/GlobalConfig';
import { easedValue, getEasingFunction } from '../utils/Easing';
import { CAMERA_LOWER_RADIUS, CAMERA_UPPER_RADIUS, EARTH_RADIUS } from '../../earth-globe';
import type { CountryPolygon, LatLon } from '../../earth-globe';
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

export class CameraAnimator {
    private camera: ArcRotateCamera;

    constructor(camera: ArcRotateCamera) {
        this.camera = camera;
    }

    /**
     * Convert lat/lon to camera alpha/beta angles
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @returns Object with alpha (horizontal) and beta (vertical) angles in radians
     */
    private latLonToAlphaBeta(lat: number, lon: number): { alpha: number; beta: number } {
        // Alpha: horizontal rotation (longitude)
        const alpha = lon * (Math.PI / 180);

        // Beta: vertical rotation (measured from top/north pole)
        // Beta = 0 is looking down from north pole
        // Beta = PI is looking up from south pole
        // Beta = PI/2 is looking at equator
        const beta = Math.PI / 2 - (lat * Math.PI / 180);

        return { alpha, beta };
    }

    /**
     * Project world positions to screen space (X and Y coordinates)
     */
    private projectWorldToScreenXY(
        latLons: (LatLon | { lat: number, lon: number, altitude?: number })[],
        alpha: number,
        beta: number,
        radius: number
    ): { x: number, y: number }[] {
        const scene = this.camera.getScene();
        const engine = scene.getEngine();
        const target = this.camera.target;

        // Calculate camera position
        const cameraX = target.x + radius * Math.sin(beta) * Math.cos(alpha);
        const cameraY = target.y + radius * Math.cos(beta);
        const cameraZ = target.z + radius * Math.sin(beta) * Math.sin(alpha);
        const cameraPos = new Vector3(cameraX, cameraY, cameraZ);

        const viewMatrix = Matrix.LookAtLH(cameraPos, target, Vector3.Up());
        const projectionMatrix = this.camera.getProjectionMatrix();
        const transformMatrix = viewMatrix.multiply(projectionMatrix);

        const viewport = this.camera.viewport.toGlobal(
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
     * Shows where the solver thinks the points are
     */
    private drawProjectionDebug(
        projectedPoints: { screenX: number, screenY: number, lat: number, lon: number }[],
        viewportRegion?: ViewportRegion
    ): void {
        const scene = this.camera.getScene();
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
     * @param lat Latitude in degrees
     * @param lon Longitude in degrees
     * @param targetRadius Target camera radius (zoom distance)
     * @param duration Animation duration in milliseconds
     * @param alphaOffset Optional horizontal angle offset in radians (positive = rotate right)
     * @param betaOffset Optional vertical angle offset in radians (positive = rotate down)
     * @returns Promise that resolves when animation completes
     */
    async animateToLocation(
        lat: number,
        lon: number,
        targetRadius: number,
        duration: number,
        alphaOffset: number = 0,
        betaOffset: number = 0
    ): Promise<void> {
        let { alpha: targetAlpha, beta: targetBeta } = this.latLonToAlphaBeta(lat, lon);

        // Apply offsets if provided
        targetAlpha += alphaOffset;
        targetBeta += betaOffset;

        // Store starting values
        const startAlpha = this.camera.alpha;
        const startBeta = this.camera.beta;
        const startRadius = this.camera.radius;

        // Calculate deltas (handle alpha wrapping around 2*PI)
        let deltaAlpha = targetAlpha - startAlpha;
        // Normalize to shortest rotation path
        if (deltaAlpha > Math.PI) deltaAlpha -= 2 * Math.PI;
        if (deltaAlpha < -Math.PI) deltaAlpha += 2 * Math.PI;

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
                this.camera.alpha = startAlpha + deltaAlpha * progress;
                this.camera.beta = startBeta + deltaBeta * progress;
                this.camera.radius = startRadius + deltaRadius * progress;

                if (rawProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure we end exactly at target
                    this.camera.alpha = targetAlpha;
                    this.camera.beta = targetBeta;
                    this.camera.radius = targetRadius;
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
     * - With viewport region: 3D grid search over (alpha, beta, radius) to center within region
     *
     * @param polygons All polygons belonging to the country (for multi-part countries like Russia)
     * @param countryName Name of the country for logging
     * @param duration Animation duration in milliseconds
     * @param margin UNUSED - kept for API compatibility
     * @param viewportRegion Optional viewport region constraint (normalized 0-1 coordinates)
     * @param maxIterations UNUSED - kept for API compatibility
     * @returns Promise that resolves when animation completes
     */
    async frameCountry(
        polygons: CountryPolygon[],
        countryName: string,
        duration: number,
        margin: number = 0.8,
        viewportRegion?: ViewportRegion,
        maxIterations: number = 100
    ): Promise<void> {
        if (polygons.length === 0) {
            console.error('No polygons provided for framing');
            return;
        }

        const COUNTRY_ALTITUDE = 0.1; // Countries are rendered ~0.1 units above sea level due to shader displacement

        // STEP 1: Collect all points from all polygons
        const allPoints: LatLon[] = [];
        for (const polygon of polygons) {
            allPoints.push(...polygon.points);
        }

        console.log(`\n=== Framing ${countryName} (${allPoints.length} points) ===`);

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
        const { alpha: baseAlpha, beta: baseBeta } = this.latLonToAlphaBeta(center.lat, center.lon);

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

        // ====================
        // NO VIEWPORT REGION: Simple binary search on radius only
        // ====================
        if (!viewportRegion) {
            console.log(`No viewport region - using simple binary search on radius`);

            let minRadius = CAMERA_LOWER_RADIUS;
            let maxRadius = 10.0;
            const TARGET_FILL = 0.95; // Fill 95% of screen
            const ITERATIONS = 20;

            for (let iter = 0; iter < ITERATIONS; iter++) {
                const testRadius = (minRadius + maxRadius) / 2;

                // Project all points at center position (no offsets!)
                const projectedXY = this.projectWorldToScreenXY(
                    allPoints.map(p => ({ ...p, altitude: COUNTRY_ALTITUDE })),
                    baseAlpha, // No alpha offset
                    baseBeta,  // No beta offset
                    testRadius
                );

                // Get bounding box
                const xs = projectedXY.map(p => p.x);
                const ys = projectedXY.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                // Check if all points fit on screen [0, 1]
                const allFit = minX >= 0 && maxX <= 1 && minY >= 0 && maxY <= 1;

                if (!allFit) {
                    // Doesn't fit - zoom out
                    minRadius = testRadius;
                    console.log(`  Iter ${iter + 1}: radius=${testRadius.toFixed(4)} - doesn't fit, zooming out`);
                } else {
                    // Fits! Check fill ratio
                    const width = maxX - minX;
                    const height = maxY - minY;
                    const fillRatio = Math.min(width, height); // Most constrained dimension

                    console.log(`  Iter ${iter + 1}: radius=${testRadius.toFixed(4)} - fits, fill=${(fillRatio * 100).toFixed(1)}%`);

                    if (fillRatio >= TARGET_FILL) {
                        // Good enough!
                        bestSolution = { alpha: baseAlpha, beta: baseBeta, radius: testRadius };
                        break;
                    } else {
                        // Can zoom in more
                        maxRadius = testRadius;
                    }
                }
            }

            // Use the last valid solution
            if (!bestSolution) {
                bestSolution = { alpha: baseAlpha, beta: baseBeta, radius: minRadius };
            }

            const solveTime = performance.now() - startSolveTime;
            console.log(`Binary search complete in ${solveTime.toFixed(1)}ms`);
        }

        // ====================
        // WITH VIEWPORT REGION: 3D grid search over (alpha, beta, radius)
        // ====================
        else {
            console.log(`Viewport region specified - using 3D grid search`);

            // Grid dimensions - higher resolution for better centering
            const ALPHA_SAMPLES = 60;   // Horizontal rotation samples (finer for X centering)
            const BETA_SAMPLES = 60;    // Vertical angle samples (finer for Y centering)
            const RADIUS_SAMPLES = 50;  // Zoom level samples
            const ALPHA_RANGE = 15 * (Math.PI / 180); // ±15 degrees horizontal
            const BETA_RANGE = 30 * (Math.PI / 180);  // ±30 degrees vertical
            const MIN_RADIUS = CAMERA_LOWER_RADIUS; // Respect camera limits!
            const MAX_RADIUS = 10.0;

            // For large countries, only use a sample of points for the grid search
            const MAX_SAMPLE_POINTS = 100;
            const samplePoints = allPoints.length > MAX_SAMPLE_POINTS
                ? allPoints.filter((_, i) => i % Math.ceil(allPoints.length / MAX_SAMPLE_POINTS) === 0)
                : allPoints;

            console.log(`Using ${samplePoints.length} of ${allPoints.length} points for grid search`);

            // Track best solution for grid search
            let gridBestSolution: {
                alpha: number;
                beta: number;
                radius: number;
                score: number;
            } | null = null;

            let checksPerformed = 0;
            const TOTAL_CHECKS = ALPHA_SAMPLES * BETA_SAMPLES * RADIUS_SAMPLES;

            console.log(`Starting 3D grid search: ${ALPHA_SAMPLES} alpha × ${BETA_SAMPLES} beta × ${RADIUS_SAMPLES} radius = ${TOTAL_CHECKS} combinations`);

        // Iterate over all combinations
        for (let alphaIdx = 0; alphaIdx < ALPHA_SAMPLES; alphaIdx++) {
            // Sample alpha from (baseAlpha - 15°) to (baseAlpha + 15°)
            const alphaProgress = alphaIdx / (ALPHA_SAMPLES - 1);
            const alpha = baseAlpha - ALPHA_RANGE + (2 * ALPHA_RANGE * alphaProgress);

            for (let betaIdx = 0; betaIdx < BETA_SAMPLES; betaIdx++) {
                // Sample beta from (baseBeta - 30°) to (baseBeta + 30°)
                const betaProgress = betaIdx / (BETA_SAMPLES - 1);
                const beta = baseBeta - BETA_RANGE + (2 * BETA_RANGE * betaProgress);

                for (let radiusIdx = 0; radiusIdx < RADIUS_SAMPLES; radiusIdx++) {
                    // Sample radius from MAX_RADIUS down to MIN_RADIUS
                    const radiusProgress = radiusIdx / (RADIUS_SAMPLES - 1);
                    const radius = MAX_RADIUS - (MAX_RADIUS - MIN_RADIUS) * radiusProgress;

                    checksPerformed++;

                    // Project SAMPLE points with altitude = 0.1
                    const projectedXY = this.projectWorldToScreenXY(
                        samplePoints.map(p => ({ ...p, altitude: COUNTRY_ALTITUDE })),
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

                    // Calculate BOUNDING BOX center (not center of mass!)
                    const minX = Math.min(...projectedXY.map(p => p.x));
                    const maxX = Math.max(...projectedXY.map(p => p.x));
                    const minY = Math.min(...projectedXY.map(p => p.y));
                    const maxY = Math.max(...projectedXY.map(p => p.y));

                    const bboxCenterX = (minX + maxX) / 2;
                    const bboxCenterY = (minY + maxY) / 2;

                    // Check if bounding box center is within 1% of viewport center
                    const centerErrorX = Math.abs(bboxCenterX - viewportCenterX);
                    const centerErrorY = Math.abs(bboxCenterY - viewportCenterY);
                    const maxCenterError = 0.01; // 1% tolerance for tight centering

                    if (centerErrorX > maxCenterError || centerErrorY > maxCenterError) continue;

                    // Valid solution! Score = radius (lower is better = more zoomed in)
                    const score = radius;

                    if (gridBestSolution === null || score < gridBestSolution.score) {
                        gridBestSolution = { alpha, beta, radius, score };
                    }

                    // Log progress every 50000 samples
                    if (checksPerformed % 50000 === 0) {
                        const progress = (checksPerformed / TOTAL_CHECKS * 100).toFixed(1);
                        const elapsed = performance.now() - startSolveTime;
                        console.log(`Progress: ${progress}% (${checksPerformed}/${TOTAL_CHECKS}) - ${elapsed.toFixed(0)}ms elapsed - Best radius: ${gridBestSolution?.radius.toFixed(4) ?? 'none'}`);
                    }
                }
            }
        }

            const solveTime = performance.now() - startSolveTime;

            if (!gridBestSolution) {
                console.error(`No valid solution found after ${checksPerformed} checks in ${solveTime.toFixed(1)}ms`);
                return;
            }

            // Assign to bestSolution
            bestSolution = {
                alpha: gridBestSolution.alpha,
                beta: gridBestSolution.beta,
                radius: gridBestSolution.radius
            };

            console.log(`\n=== Grid Search Solution Found ===`);
            console.log(`Checked ${checksPerformed} combinations in ${solveTime.toFixed(1)}ms`);
            console.log(`Best: alpha=${(bestSolution.alpha * 180 / Math.PI).toFixed(2)}°, beta=${(bestSolution.beta * 180 / Math.PI).toFixed(2)}°, radius=${bestSolution.radius.toFixed(4)}`);
        }

        // ====================
        // FINAL CHECK: Verify we have a solution
        // ====================
        if (!bestSolution) {
            console.error(`No valid solution found`);
            return;
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
        await this.animateToLocation(
            center.lat,
            center.lon,
            bestSolution.radius,
            duration,
            bestSolution.alpha - baseAlpha, // Alpha offset from base
            bestSolution.beta - baseBeta    // Beta offset from base
        );

        // STEP 7: Wait a frame for camera to settle, then verify projection
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Re-project all points with the ACTUAL camera position
        console.log(`\n=== Verifying projection with actual camera state ===`);
        console.log(`Camera: alpha=${(this.camera.alpha * 180 / Math.PI).toFixed(2)}°, beta=${(this.camera.beta * 180 / Math.PI).toFixed(2)}°, radius=${this.camera.radius.toFixed(4)}`);

        const verifiedProjection = this.projectWorldToScreenXY(
            allPoints.map(p => ({ ...p, altitude: COUNTRY_ALTITUDE })),
            this.camera.alpha,
            this.camera.beta,
            this.camera.radius
        );

        const verifiedPoints: ProjectedPointData[] = verifiedProjection.map((p, i) => ({
            screenX: p.x,
            screenY: p.y,
            lat: allPoints[i].lat,
            lon: allPoints[i].lon
        }));

        // Draw debug visualization with VERIFIED projections
        this.drawProjectionDebug(verifiedPoints, viewportRegion);
    }

    /**
     * Reset camera to default position
     * @param duration Animation duration in milliseconds
     */
    async reset(duration: number = 1000): Promise<void> {
        // Default position: looking at globe from distance
        return this.animateToLocation(0, 0, 10, duration);
    }

    /**
     * Camera shake effect for wrong answers
     * @param duration Duration in ms (default 300)
     * @param intensity Shake intensity (default 0.02)
     */
    async cameraShake(duration: number = 300, intensity: number = 0.02): Promise<void> {
        const camera = this.camera;
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
}

/**
 * Zoom-Based Value Calculator
 *
 * Provides dynamic interpolation between two values based on camera zoom level.
 * Useful for scaling UI elements, speeds, and other parameters based on camera distance.
 */
export class ZoomBasedValue {
    private camera: ArcRotateCamera;

    constructor(camera: ArcRotateCamera) {
        this.camera = camera;
    }

    /**
     * Get an interpolated value based on current camera zoom
     * @param closeValue Value when camera is zoomed in (close to globe)
     * @param farValue Value when camera is zoomed out (far from globe)
     * @param easingName Name of easing function (default: 'OutSine')
     * @returns Interpolated value based on current camera distance
     */
    getValue(closeValue: number, farValue: number, easingName: string = 'OutSine'): number {
        const config = getConfig();
        const threshold = config.zoom.threshold;

        // Get current camera distance
        const currentDistance = this.camera.radius;

        // Get easing function
        const easing = getEasingFunction(easingName);

        // Interpolate: CAMERA_LOWER_RADIUS = close, threshold = far
        return easedValue(currentDistance, CAMERA_LOWER_RADIUS, threshold, closeValue, farValue, easing);
    }

    /**
     * Get the normalized zoom scale (0-1)
     * 0 = camera at globe surface, 1 = camera at threshold distance or beyond
     */
    getZoomScale(): number {
        const config = getConfig();
        const threshold = config.zoom.threshold;
        const scale = this.camera.radius / threshold;
        return Math.max(0, Math.min(1, scale));
    }
}
