import { EUROPEAN_CAPITALS } from '../../capitals/capitals-data';

export interface StreamLocation {
    name: string;
    lat: number;
    lon: number;
    aliases?: string[];
}

export interface LocationSet {
    id: string;
    label: string;
    locations: StreamLocation[];
}

export const EUROPEAN_CAPITALS_SET: LocationSet = {
    id: 'european-capitals',
    label: 'European Capitals',
    locations: EUROPEAN_CAPITALS.map((c) => ({
        name: c.name,
        lat: c.lat,
        lon: c.lon,
    })),
};

export const WORLD_LANDMARKS_SET: LocationSet = {
    id: 'world-landmarks',
    label: 'World Landmarks',
    locations: [
        { name: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342 },
        { name: 'Machu Picchu', lat: -13.1631, lon: -72.5450 },
        { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421 },
        { name: 'Colosseum', lat: 41.8902, lon: 12.4922, aliases: ['Coliseum'] },
        { name: 'Great Wall', lat: 40.4319, lon: 116.5704, aliases: ['Great Wall of China'] },
        { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945 },
        { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445 },
        { name: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105 },
        { name: 'Stonehenge', lat: 51.1789, lon: -1.8262 },
        { name: 'Angkor Wat', lat: 13.4125, lon: 103.8670 },
        { name: 'Mount Fuji', lat: 35.3606, lon: 138.7274, aliases: ['Fuji'] },
        { name: 'Sydney Opera House', lat: -33.8568, lon: 151.2153, aliases: ['Opera House'] },
    ],
};

export const ALL_SETS: LocationSet[] = [EUROPEAN_CAPITALS_SET, WORLD_LANDMARKS_SET];

export function pickRound(set: LocationSet, count: number): StreamLocation[] {
    const shuffled = [...set.locations];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}
