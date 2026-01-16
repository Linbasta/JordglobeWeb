#!/usr/bin/env node
/**
 * Test script for Tanzania triangulation
 * Diagnoses why triangles are spanning across Lake Victoria
 */

import * as fs from 'fs';
import * as path from 'path';
import { cdt2d, filterTriangles } from '../src/cdt2d';

interface Point2D {
    x: number;
    y: number;
}

interface LatLonPoint {
    lat: number;
    lon: number;
}

// Point-in-polygon test
function pointInPolygon2D(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// Generate interior Steiner points
function generateInteriorPoints(latLonPoints: LatLonPoint[], gridSpacing: number = 5): LatLonPoint[] {
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    for (const p of latLonPoints) {
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
        minLon = Math.min(minLon, p.lon);
        maxLon = Math.max(maxLon, p.lon);
    }

    const poly2D = latLonPoints.map(p => ({ x: p.lon, y: p.lat }));
    const interiorPoints: LatLonPoint[] = [];

    for (let lat = minLat + gridSpacing; lat < maxLat; lat += gridSpacing) {
        for (let lon = minLon + gridSpacing; lon < maxLon; lon += gridSpacing) {
            const testPoint = { x: lon, y: lat };
            if (pointInPolygon2D(testPoint, poly2D)) {
                interiorPoints.push({ lat, lon });
            }
        }
    }

    return interiorPoints;
}

// Main
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const inputFile = path.join(__dirname, '../public/countries.json');

console.log('=== Tanzania Triangulation Test ===\n');

// Load countries and find Tanzania
const countries = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
const tanzania = countries.find((c: any) => c.iso2 === 'TZ');

if (!tanzania) {
    console.error('Tanzania not found!');
    process.exit(1);
}

console.log(`Country: ${tanzania.name_en} (${tanzania.iso2})`);

const paths = JSON.parse(tanzania.paths) as number[][][];
console.log(`Number of paths: ${paths.length}`);

const polygon = paths[0];
console.log(`Main polygon points: ${polygon.length}`);

// Convert to lat/lon points
const latLonPoints: LatLonPoint[] = polygon.map(([lat, lon]) => ({ lat, lon }));

// Check for duplicate consecutive points
let duplicates = 0;
for (let i = 0; i < latLonPoints.length; i++) {
    const next = (i + 1) % latLonPoints.length;
    if (latLonPoints[i].lat === latLonPoints[next].lat &&
        latLonPoints[i].lon === latLonPoints[next].lon) {
        duplicates++;
        console.log(`  Duplicate at ${i}-${next}: (${latLonPoints[i].lat}, ${latLonPoints[i].lon})`);
    }
}
console.log(`Duplicate consecutive points: ${duplicates}`);

// Convert to 2D for triangulation (lon = x, lat = y)
const points2D = latLonPoints.map(p => ({ x: p.lon, y: p.lat }));

// Generate Steiner points (try 2 degree spacing)
const steinerPoints = generateInteriorPoints(latLonPoints, 2);

// Add hardcoded Steiner points in Lake Victoria region
// These are in the concave area that needs better triangulation
const hardcodedSteiners: LatLonPoint[] = [
    { lat: -1.5, lon: 33.0 },   // In the lake concavity
    { lat: -2.0, lon: 32.5 },   // In the lake concavity
    { lat: -1.2, lon: 32.0 },   // Near the lake shore
];

// Check which hardcoded points are actually inside Tanzania
const poly2DCheck = latLonPoints.map(p => ({ x: p.lon, y: p.lat }));
for (const hp of hardcodedSteiners) {
    const isInside = pointInPolygon2D({ x: hp.lon, y: hp.lat }, poly2DCheck);
    console.log(`Hardcoded (${hp.lat.toFixed(2)}, ${hp.lon.toFixed(2)}): inside=${isInside}`);
    if (isInside) {
        steinerPoints.push(hp);
    }
}

console.log(`\nSteiner points generated: ${steinerPoints.length}`);
for (const sp of steinerPoints) {
    console.log(`  Steiner: lat=${sp.lat.toFixed(2)}, lon=${sp.lon.toFixed(2)}`);
}

// Prepare for CDT
const allPoints: [number, number][] = [
    ...points2D.map(p => [p.x, p.y] as [number, number]),
    ...steinerPoints.map(p => [p.lon, p.lat] as [number, number])
];

// Create boundary edges
const edges: [number, number][] = [];
for (let i = 0; i < points2D.length; i++) {
    edges.push([i, (i + 1) % points2D.length]);
}

console.log(`\nTotal vertices: ${allPoints.length}`);
console.log(`Boundary edges: ${edges.length}`);

// Run CDT
console.log('\nRunning CDT...');
let triangles = cdt2d(allPoints, edges);
console.log(`CDT produced ${triangles.length} triangles (before filtering)`);

// Get boundary for filtering
const boundary: [number, number][] = points2D.map(p => [p.x, p.y]);

// Filter triangles (pass boundary vertex count for midpoint check on non-adjacent edges)
console.log('\nFiltering triangles...');
const boundaryVertexCount = points2D.length;
const filteredTriangles = filterTriangles(allPoints, triangles, boundary, undefined, boundaryVertexCount);
console.log(`After filtering: ${filteredTriangles.length} triangles`);

// Analyze triangles - find ones with long edges
console.log('\n=== Triangle Analysis ===');

function distance(p1: [number, number], p2: [number, number]): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

// Find triangles with unusually long edges
const edgeLengths: number[] = [];
for (const tri of filteredTriangles) {
    const a = allPoints[tri[0]];
    const b = allPoints[tri[1]];
    const c = allPoints[tri[2]];
    edgeLengths.push(distance(a, b), distance(b, c), distance(c, a));
}

edgeLengths.sort((a, b) => a - b);
const median = edgeLengths[Math.floor(edgeLengths.length / 2)];
const max = edgeLengths[edgeLengths.length - 1];
console.log(`Edge lengths: median=${median.toFixed(2)}, max=${max.toFixed(2)}`);

// Find triangles with edges > 3x median (suspicious)
const threshold = median * 5;
console.log(`\nTriangles with edge length > ${threshold.toFixed(2)} (5x median):`);

let suspiciousCount = 0;
for (const tri of filteredTriangles) {
    const a = allPoints[tri[0]];
    const b = allPoints[tri[1]];
    const c = allPoints[tri[2]];

    const ab = distance(a, b);
    const bc = distance(b, c);
    const ca = distance(c, a);
    const maxEdge = Math.max(ab, bc, ca);

    if (maxEdge > threshold) {
        suspiciousCount++;
        console.log(`  Triangle ${tri.join('-')}: max edge = ${maxEdge.toFixed(2)}`);
        console.log(`    A: (${a[0].toFixed(2)}, ${a[1].toFixed(2)})`);
        console.log(`    B: (${b[0].toFixed(2)}, ${b[1].toFixed(2)})`);
        console.log(`    C: (${c[0].toFixed(2)}, ${c[1].toFixed(2)})`);

        // Calculate centroid
        const centroid: [number, number] = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
        console.log(`    Centroid: (${centroid[0].toFixed(2)}, ${centroid[1].toFixed(2)})`);
    }
}

console.log(`\nSuspicious triangles: ${suspiciousCount}`);

// Check if suspicious triangles have edges that should be on the boundary but aren't
console.log('\n=== Edge Analysis for Suspicious Triangles ===');
for (const tri of filteredTriangles) {
    const a = allPoints[tri[0]];
    const b = allPoints[tri[1]];
    const c = allPoints[tri[2]];

    const ab = distance(a, b);
    const bc = distance(b, c);
    const ca = distance(c, a);
    const maxEdge = Math.max(ab, bc, ca);

    if (maxEdge > threshold) {
        // Check which vertices are boundary vs Steiner
        const aIsBoundary = tri[0] < points2D.length;
        const bIsBoundary = tri[1] < points2D.length;
        const cIsBoundary = tri[2] < points2D.length;

        console.log(`  Triangle ${tri.join('-')}:`);
        console.log(`    Vertex types: A=${aIsBoundary ? 'boundary' : 'steiner'}, B=${bIsBoundary ? 'boundary' : 'steiner'}, C=${cIsBoundary ? 'boundary' : 'steiner'}`);

        // If two boundary vertices are connected but not adjacent in boundary, that's the problem
        if (aIsBoundary && bIsBoundary) {
            const diff = Math.abs(tri[0] - tri[1]);
            const adjacent = diff === 1 || diff === points2D.length - 1;
            if (!adjacent && ab > threshold) {
                console.log(`    PROBLEM: A-B connects non-adjacent boundary points ${tri[0]} and ${tri[1]}, dist=${ab.toFixed(2)}`);
            }
        }
        if (bIsBoundary && cIsBoundary) {
            const diff = Math.abs(tri[1] - tri[2]);
            const adjacent = diff === 1 || diff === points2D.length - 1;
            if (!adjacent && bc > threshold) {
                console.log(`    PROBLEM: B-C connects non-adjacent boundary points ${tri[1]} and ${tri[2]}, dist=${bc.toFixed(2)}`);
            }
        }
        if (cIsBoundary && aIsBoundary) {
            const diff = Math.abs(tri[2] - tri[0]);
            const adjacent = diff === 1 || diff === points2D.length - 1;
            if (!adjacent && ca > threshold) {
                console.log(`    PROBLEM: C-A connects non-adjacent boundary points ${tri[2]} and ${tri[0]}, dist=${ca.toFixed(2)}`);
            }
        }
    }
}

// Lake Victoria approximate region
console.log('\n=== Lake Victoria Region ===');
console.log('Approximate bounds: lat [-3, -0.5], lon [31.5, 34.5]');

// Check which boundary points are in the Lake Victoria region
const lakeVictoriaPoints: number[] = [];
for (let i = 0; i < latLonPoints.length; i++) {
    const p = latLonPoints[i];
    if (p.lat >= -3 && p.lat <= -0.5 && p.lon >= 31.5 && p.lon <= 34.5) {
        lakeVictoriaPoints.push(i);
    }
}
console.log(`Boundary points in Lake Victoria region: ${lakeVictoriaPoints.length}`);
for (const i of lakeVictoriaPoints) {
    const p = latLonPoints[i];
    console.log(`  Point ${i}: (${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})`);
}

// Test the edge-crossing check from cdt2d
console.log('\n=== Testing Edge-Boundary Crossing ===');

// Check if segment intersects boundary (proper intersection)
function orient2d(a: [number, number], b: [number, number], c: [number, number]): number {
    return (a[1] - c[1]) * (b[0] - c[0]) - (a[0] - c[0]) * (b[1] - c[1]);
}

function segmentsIntersect(a1: [number, number], a2: [number, number], b1: [number, number], b2: [number, number]): boolean {
    const d1 = orient2d(b1, b2, a1);
    const d2 = orient2d(b1, b2, a2);
    const d3 = orient2d(a1, a2, b1);
    const d4 = orient2d(a1, a2, b2);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    return false;
}

function edgeCrossesBoundary(p1: [number, number], p2: [number, number], boundary: [number, number][]): boolean {
    const n = boundary.length;
    for (let i = 0; i < n; i++) {
        const b1 = boundary[i];
        const b2 = boundary[(i + 1) % n];

        if (segmentsIntersect(p1, p2, b1, b2)) {
            return true;
        }
    }
    return false;
}

// Test problematic triangle 2-21-7
const point2 = allPoints[2] as [number, number];
const point7 = allPoints[7] as [number, number];
const point21 = allPoints[21] as [number, number];

console.log(`Point 2: (${point2[0].toFixed(4)}, ${point2[1].toFixed(4)})`);
console.log(`Point 7: (${point7[0].toFixed(4)}, ${point7[1].toFixed(4)})`);
console.log(`Point 21: (${point21[0].toFixed(4)}, ${point21[1].toFixed(4)})`);

const boundaryPoints = allPoints.slice(0, points2D.length) as [number, number][];

// Check if midpoints are in polygon
function pointInPoly(point: [number, number], polygon: [number, number][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

const mid27: [number, number] = [(point2[0] + point7[0]) / 2, (point2[1] + point7[1]) / 2];
const mid721: [number, number] = [(point7[0] + point21[0]) / 2, (point7[1] + point21[1]) / 2];
const mid212: [number, number] = [(point21[0] + point2[0]) / 2, (point21[1] + point2[1]) / 2];

console.log(`\nMidpoint 2-7: (${mid27[0].toFixed(2)}, ${mid27[1].toFixed(2)}) in polygon: ${pointInPoly(mid27, boundaryPoints)}`);
console.log(`Midpoint 7-21: (${mid721[0].toFixed(2)}, ${mid721[1].toFixed(2)}) in polygon: ${pointInPoly(mid721, boundaryPoints)}`);
console.log(`Midpoint 21-2: (${mid212[0].toFixed(2)}, ${mid212[1].toFixed(2)}) in polygon: ${pointInPoly(mid212, boundaryPoints)}`);

// More detailed: which boundary segments does edge 2-21 intersect?
console.log('\nChecking edge 2-21 against all boundary segments:');
for (let i = 0; i < boundaryPoints.length; i++) {
    const b1 = boundaryPoints[i];
    const b2 = boundaryPoints[(i + 1) % boundaryPoints.length];
    if (segmentsIntersect(point2, point21, b1, b2)) {
        console.log(`  Intersects segment ${i}-${(i + 1) % boundaryPoints.length}`);
        console.log(`    b1: (${b1[0].toFixed(4)}, ${b1[1].toFixed(4)})`);
        console.log(`    b2: (${b2[0].toFixed(4)}, ${b2[1].toFixed(4)})`);
    }
}

// Check triangles in Lake Victoria region
console.log('\n=== Triangles touching Lake Victoria region ===');
const lakeRegion = { minLat: -3, maxLat: -0.5, minLon: 31.5, maxLon: 34.5 };

for (const tri of filteredTriangles) {
    const a = allPoints[tri[0]];
    const b = allPoints[tri[1]];
    const c = allPoints[tri[2]];

    // Check if any vertex is in lake region
    const inLake = (p: [number, number]) =>
        p[1] >= lakeRegion.minLat && p[1] <= lakeRegion.maxLat &&
        p[0] >= lakeRegion.minLon && p[0] <= lakeRegion.maxLon;

    if (inLake(a) || inLake(b) || inLake(c)) {
        console.log(`  Triangle ${tri.join('-')}:`);
        console.log(`    A(${tri[0]}): (${a[0].toFixed(2)}, ${a[1].toFixed(2)}) ${inLake(a) ? 'IN LAKE' : ''}`);
        console.log(`    B(${tri[1]}): (${b[0].toFixed(2)}, ${b[1].toFixed(2)}) ${inLake(b) ? 'IN LAKE' : ''}`);
        console.log(`    C(${tri[2]}): (${c[0].toFixed(2)}, ${c[1].toFixed(2)}) ${inLake(c) ? 'IN LAKE' : ''}`);

        // Calculate centroid
        const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
        console.log(`    Centroid: (${centroid[0].toFixed(2)}, ${centroid[1].toFixed(2)}) ${inLake(centroid as [number, number]) ? 'IN LAKE' : ''}`);
    }
}

console.log('\n=== Done ===');
