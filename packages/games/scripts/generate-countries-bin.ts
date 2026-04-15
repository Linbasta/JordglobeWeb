#!/usr/bin/env tsx
/**
 * Generate countries-enriched.bin from countries-enriched.json
 *
 * Binary format (little-endian):
 *   Header:  [magic:u32 "GEOC"] [version:u16] [countryCount:u16]
 *   Per country:
 *     [iso2:2 bytes] [nameLen:u8] [name:utf8] [flags:u8] [polyCount:u16] [holesCount:u8] [lakesCount:u8]
 *     Holes table:  [polyIdx:u8] [count:u8] [iso2 codes: 2 bytes each]...
 *     Lakes table:  [polyIdx:u8] [count:u8] [lakePolyIdx:u8]...
 *     Polygons:     [pointCount:u16] [lat:f32 lon:f32]...
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const MAGIC = 0x47454F43; // "GEOC"
const VERSION = 1;

interface RawCountry {
    name_en: string;
    iso2: string;
    paths: string;
    holes?: Record<string, string[]>;
    lakes?: Record<string, number[]>;
    skipHole?: boolean;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(scriptDir, '../public/countries-enriched.json');
const outPath = resolve(scriptDir, '../public/countries-enriched.bin');

const countries: RawCountry[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// First pass: compute total buffer size
let totalSize = 8; // header
let totalPoints = 0;
let totalPolygons = 0;

for (const c of countries) {
    const nameBytes = Buffer.byteLength(c.name_en, 'utf-8');
    totalSize += 2 + 1 + nameBytes + 1 + 2 + 1 + 1; // iso2 + nameLen + name + flags + polyCount + holesCount + lakesCount

    // Holes table
    if (c.holes) {
        for (const [, iso2List] of Object.entries(c.holes)) {
            totalSize += 1 + 1 + iso2List.length * 2; // polyIdx + count + iso2 codes
        }
    }

    // Lakes table
    if (c.lakes) {
        for (const [, lakeIndices] of Object.entries(c.lakes)) {
            totalSize += 1 + 1 + lakeIndices.length; // polyIdx + count + indices
        }
    }

    // Polygons
    const paths: number[][][] = JSON.parse(c.paths);
    for (const polygon of paths) {
        totalSize += 2 + polygon.length * 8; // pointCount + lat/lon float32 pairs
        totalPoints += polygon.length;
        totalPolygons++;
    }
}

// Second pass: write binary
const buf = Buffer.alloc(totalSize);
let offset = 0;

// Header
buf.writeUInt32LE(MAGIC, offset); offset += 4;
buf.writeUInt16LE(VERSION, offset); offset += 2;
buf.writeUInt16LE(countries.length, offset); offset += 2;

for (const c of countries) {
    // ISO2
    buf.write(c.iso2, offset, 2, 'ascii'); offset += 2;

    // Name
    const nameBytes = Buffer.byteLength(c.name_en, 'utf-8');
    buf.writeUInt8(nameBytes, offset); offset += 1;
    buf.write(c.name_en, offset, nameBytes, 'utf-8'); offset += nameBytes;

    // Flags
    const flags = (c.skipHole ? 1 : 0);
    buf.writeUInt8(flags, offset); offset += 1;

    // Polygon count
    const paths: number[][][] = JSON.parse(c.paths);
    buf.writeUInt16LE(paths.length, offset); offset += 2;

    // Holes/Lakes counts
    const holesEntries = c.holes ? Object.entries(c.holes) : [];
    const lakesEntries = c.lakes ? Object.entries(c.lakes) : [];
    buf.writeUInt8(holesEntries.length, offset); offset += 1;
    buf.writeUInt8(lakesEntries.length, offset); offset += 1;

    // Holes table
    for (const [polyIdx, iso2List] of holesEntries) {
        buf.writeUInt8(Number(polyIdx), offset); offset += 1;
        buf.writeUInt8(iso2List.length, offset); offset += 1;
        for (const iso2 of iso2List) {
            buf.write(iso2, offset, 2, 'ascii'); offset += 2;
        }
    }

    // Lakes table
    for (const [polyIdx, lakeIndices] of lakesEntries) {
        buf.writeUInt8(Number(polyIdx), offset); offset += 1;
        buf.writeUInt8(lakeIndices.length, offset); offset += 1;
        for (const idx of lakeIndices) {
            buf.writeUInt8(idx, offset); offset += 1;
        }
    }

    // Polygons
    for (const polygon of paths) {
        buf.writeUInt16LE(polygon.length, offset); offset += 2;
        for (const [lat, lon] of polygon) {
            buf.writeFloatLE(lat, offset); offset += 4;
            buf.writeFloatLE(lon, offset); offset += 4;
        }
    }
}

if (offset !== totalSize) {
    console.error(`Size mismatch: expected ${totalSize}, wrote ${offset}`);
    process.exit(1);
}

writeFileSync(outPath, buf);

const jsonSize = readFileSync(jsonPath).length;
console.log(`=== countries-enriched.bin ===`);
console.log(`Countries: ${countries.length}`);
console.log(`Polygons:  ${totalPolygons}`);
console.log(`Points:    ${totalPoints}`);
console.log(`JSON size: ${(jsonSize / 1024).toFixed(1)} KB`);
console.log(`BIN size:  ${(totalSize / 1024).toFixed(1)} KB`);
console.log(`Ratio:     ${(totalSize / jsonSize * 100).toFixed(1)}%`);
