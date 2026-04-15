/**
 * Load countries from binary format (countries-enriched.bin)
 *
 * Format: see scripts/generate-countries-bin.ts for layout.
 */

import type { CountryBinData } from './types';

const MAGIC = 0x47454F43; // "GEOC"
const EXPECTED_VERSION = 1;

export async function loadCountriesBin(url: string): Promise<CountryBinData[]> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    let offset = 0;

    // Header
    const magic = view.getUint32(offset, true); offset += 4;
    if (magic !== MAGIC) throw new Error(`Invalid magic: 0x${magic.toString(16)}`);
    const version = view.getUint16(offset, true); offset += 2;
    if (version !== EXPECTED_VERSION) throw new Error(`Unsupported version: ${version}`);
    const countryCount = view.getUint16(offset, true); offset += 2;

    const countries: CountryBinData[] = new Array(countryCount);

    for (let i = 0; i < countryCount; i++) {
        // ISO2
        const iso2 = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1));
        offset += 2;

        // Name
        const nameLen = view.getUint8(offset); offset += 1;
        const name_en = decoder.decode(new Uint8Array(arrayBuffer, offset, nameLen));
        offset += nameLen;

        // Flags
        const flags = view.getUint8(offset); offset += 1;
        const skipHole = (flags & 1) !== 0;

        // Polygon count
        const polyCount = view.getUint16(offset, true); offset += 2;

        // Holes/Lakes counts
        const holesCount = view.getUint8(offset); offset += 1;
        const lakesCount = view.getUint8(offset); offset += 1;

        // Holes table
        let holes: Record<number, string[]> | undefined;
        if (holesCount > 0) {
            holes = {};
            for (let h = 0; h < holesCount; h++) {
                const polyIdx = view.getUint8(offset); offset += 1;
                const count = view.getUint8(offset); offset += 1;
                const iso2List: string[] = new Array(count);
                for (let c = 0; c < count; c++) {
                    iso2List[c] = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1));
                    offset += 2;
                }
                holes[polyIdx] = iso2List;
            }
        }

        // Lakes table
        let lakes: Record<number, number[]> | undefined;
        if (lakesCount > 0) {
            lakes = {};
            for (let l = 0; l < lakesCount; l++) {
                const polyIdx = view.getUint8(offset); offset += 1;
                const count = view.getUint8(offset); offset += 1;
                const indices: number[] = new Array(count);
                for (let c = 0; c < count; c++) {
                    indices[c] = view.getUint8(offset); offset += 1;
                }
                lakes[polyIdx] = indices;
            }
        }

        // Polygons
        const paths: number[][][] = new Array(polyCount);
        for (let p = 0; p < polyCount; p++) {
            const pointCount = view.getUint16(offset, true); offset += 2;
            const polygon: number[][] = new Array(pointCount);
            for (let pt = 0; pt < pointCount; pt++) {
                const lat = view.getFloat32(offset, true); offset += 4;
                const lon = view.getFloat32(offset, true); offset += 4;
                polygon[pt] = [lat, lon];
            }
            paths[p] = polygon;
        }

        const country: CountryBinData = { name_en, iso2, paths };
        if (holes) country.holes = holes;
        if (lakes) country.lakes = lakes;
        if (skipHole) country.skipHole = true;
        countries[i] = country;
    }

    return countries;
}
