import { asset } from '../../shared/asset-path';

export type LocationType = 'city' | 'landmark';

export interface StreamLocation {
    name: string;
    lat: number;
    lon: number;
    aliases?: string[];
    difficulty: 1 | 2 | 3;
    type: LocationType;
    capital: boolean;
}

export interface LocationSet {
    id: string;
    label: string;
    locations: StreamLocation[];
}

const LOCATION_ALIASES: Record<string, string[]> = {
    'Giza pyramid complex': ['Pyramids of Giza', 'Giza', 'Great Pyramid', 'Pyramids'],
    'Great Wall of China': ['Great Wall'],
    'Sydney Opera House': ['Opera House'],
    'Washington, D.C.': ['Washington', 'Washington DC'],
    'Santiago de Chile': ['Santiago'],
    'Luxembourg City': ['Luxembourg'],
    'Kuwait City': ['Kuwait'],
    'Guatemala City': ['Guatemala'],
    'Panama City': ['Panama'],
    'Mexico City': ['Mexico'],
    'Ho Chi Minh City': ['Saigon'],
    'Acropolis of Athens': ['Acropolis'],
    'Brandenburg Gate': ['Brandenburger Tor'],
    'The Little Mermaid': ['Little Mermaid'],
    'Leaning Tower of Pisa': ['Tower of Pisa', 'Pisa'],
    'Christ the Redeemer': ['Cristo Redentor'],
    'Mount Everest': ['Everest'],
    'Kilimanjaro': ['Mount Kilimanjaro'],
    'Uluru': ['Ayers Rock'],
    'Sagrada Família': ['Sagrada Familia'],
    'Colosseum': ['Coliseum'],
    'Chichen Itza': ['Chichen'],
    'Hagia Sophia': ['Aya Sofya'],
    'Golden Gate Bridge': ['Golden Gate'],
    'Great Sphinx of Giza': ['Sphinx', 'Great Sphinx'],
    'Niagara Falls': ['Niagara'],
    'Victoria Falls': ['Mosi-oa-Tunya'],
    'Frankfurt am Main': ['Frankfurt'],
};

export const POINTS_BY_DIFFICULTY: Record<1 | 2 | 3, number> = {
    1: 100,
    2: 200,
    3: 300,
};

interface RawEntry {
    n: string;
    lat: number;
    lon: number;
    d: 1 | 2 | 3;
    t: 'c' | 'l';
    cap?: 1;
}

export async function loadAllLocations(): Promise<LocationSet> {
    const res = await fetch(asset('stream-locations.json'));
    const data: RawEntry[] = await res.json();

    const locations: StreamLocation[] = data.map((entry) => {
        const loc: StreamLocation = {
            name: entry.n,
            lat: entry.lat,
            lon: entry.lon,
            difficulty: entry.d,
            type: entry.t === 'l' ? 'landmark' : 'city',
            capital: entry.cap === 1,
        };

        const aliases = LOCATION_ALIASES[entry.n];
        if (aliases) loc.aliases = aliases;

        return loc;
    });

    return { id: 'all-locations', label: 'All Locations', locations };
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickFromPool(locations: StreamLocation[], difficulty: 1 | 2 | 3, n: number): StreamLocation[] {
    const pool = shuffle(locations.filter((l) => l.difficulty === difficulty));
    return pool.slice(0, n);
}

function randBetween(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function getDifficultiesForRound(round: number): (1 | 2 | 3)[] {
    if (round <= 1) return [1];
    if (round === 2) return [1, 2];
    if (round === 3) return [2];
    if (round === 4) return [2, 3];
    return [3];
}

export function pickRoundForSession(set: LocationSet, count: number, roundNumber: number): StreamLocation[] {
    const allowed = getDifficultiesForRound(roundNumber);
    const pool = shuffle(set.locations.filter((l) => allowed.includes(l.difficulty)));

    if (pool.length >= count) return pool.slice(0, count);

    const names = new Set(pool.map((l) => l.name));
    const fill = shuffle(set.locations.filter((l) => !names.has(l.name)));
    return shuffle([...pool, ...fill.slice(0, count - pool.length)]);
}

export function getRoundGoal(roundNumber: number): number {
    return 300 + roundNumber * 100;
}

export type Continent = 'world' | 'europe' | 'asia' | 'africa' | 'north-america' | 'south-america' | 'oceania';

interface BoundingBox {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
}

const CONTINENT_BOUNDS: Record<Exclude<Continent, 'world'>, BoundingBox[]> = {
    'europe': [{ latMin: 34, latMax: 72, lonMin: -25, lonMax: 50 }],
    'asia': [
        { latMin: -12, latMax: 80, lonMin: 50, lonMax: 180 },
        { latMin: 0, latMax: 45, lonMin: 25, lonMax: 50 },
    ],
    'africa': [{ latMin: -35, latMax: 38, lonMin: -18, lonMax: 55 }],
    'north-america': [{ latMin: 5, latMax: 85, lonMin: -170, lonMax: -50 }],
    'south-america': [{ latMin: -57, latMax: 15, lonMin: -82, lonMax: -34 }],
    'oceania': [
        { latMin: -48, latMax: 2, lonMin: 100, lonMax: 180 },
        { latMin: -48, latMax: 2, lonMin: -180, lonMax: -130 },
    ],
};

export function filterByContinent(set: LocationSet, continent: Continent): LocationSet {
    if (continent === 'world') return set;
    const bounds = CONTINENT_BOUNDS[continent];
    const filtered = set.locations.filter((loc) =>
        bounds.some((b) => loc.lat >= b.latMin && loc.lat <= b.latMax && loc.lon >= b.lonMin && loc.lon <= b.lonMax),
    );
    return { id: `${set.id}-${continent}`, label: continent, locations: filtered };
}
