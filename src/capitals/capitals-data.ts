/**
 * Capitals Quiz - Data
 *
 * Capital city locations for quiz questions.
 */

export interface CapitalData {
    name: string;
    countryName: string;
    countryISO2: string;
    lat: number;
    lon: number;
}

/**
 * European capital cities
 */
export const EUROPEAN_CAPITALS: CapitalData[] = [
    // Nordic countries
    { name: 'Stockholm', countryName: 'Sweden', countryISO2: 'SE', lat: 59.3293, lon: 18.0686 },
    { name: 'Oslo', countryName: 'Norway', countryISO2: 'NO', lat: 59.9139, lon: 10.7522 },
    { name: 'Helsinki', countryName: 'Finland', countryISO2: 'FI', lat: 60.1699, lon: 24.9384 },
    { name: 'Copenhagen', countryName: 'Denmark', countryISO2: 'DK', lat: 55.6761, lon: 12.5683 },
    { name: 'Reykjavik', countryName: 'Iceland', countryISO2: 'IS', lat: 64.1466, lon: -21.9426 },

    // Western Europe
    { name: 'London', countryName: 'United Kingdom', countryISO2: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Dublin', countryName: 'Ireland', countryISO2: 'IE', lat: 53.3498, lon: -6.2603 },
    { name: 'Paris', countryName: 'France', countryISO2: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Madrid', countryName: 'Spain', countryISO2: 'ES', lat: 40.4168, lon: -3.7038 },
    { name: 'Lisbon', countryName: 'Portugal', countryISO2: 'PT', lat: 38.7223, lon: -9.1393 },

    // Central Europe
    { name: 'Berlin', countryName: 'Germany', countryISO2: 'DE', lat: 52.5200, lon: 13.4050 },
    { name: 'Amsterdam', countryName: 'Netherlands', countryISO2: 'NL', lat: 52.3676, lon: 4.9041 },
    { name: 'Brussels', countryName: 'Belgium', countryISO2: 'BE', lat: 50.8503, lon: 4.3517 },
    { name: 'Luxembourg', countryName: 'Luxembourg', countryISO2: 'LU', lat: 49.6116, lon: 6.1319 },
    { name: 'Bern', countryName: 'Switzerland', countryISO2: 'CH', lat: 46.9480, lon: 7.4474 },
    { name: 'Vienna', countryName: 'Austria', countryISO2: 'AT', lat: 48.2082, lon: 16.3738 },

    // Southern Europe
    { name: 'Rome', countryName: 'Italy', countryISO2: 'IT', lat: 41.9028, lon: 12.4964 },
    { name: 'Athens', countryName: 'Greece', countryISO2: 'GR', lat: 37.9838, lon: 23.7275 },
    { name: 'Valletta', countryName: 'Malta', countryISO2: 'MT', lat: 35.8989, lon: 14.5146 },
    { name: 'Nicosia', countryName: 'Cyprus', countryISO2: 'CY', lat: 35.1856, lon: 33.3823 },

    // Eastern Europe
    { name: 'Warsaw', countryName: 'Poland', countryISO2: 'PL', lat: 52.2297, lon: 21.0122 },
    { name: 'Prague', countryName: 'Czech Republic', countryISO2: 'CZ', lat: 50.0755, lon: 14.4378 },
    { name: 'Bratislava', countryName: 'Slovakia', countryISO2: 'SK', lat: 48.1486, lon: 17.1077 },
    { name: 'Budapest', countryName: 'Hungary', countryISO2: 'HU', lat: 47.4979, lon: 19.0402 },
    { name: 'Bucharest', countryName: 'Romania', countryISO2: 'RO', lat: 44.4268, lon: 26.1025 },
    { name: 'Sofia', countryName: 'Bulgaria', countryISO2: 'BG', lat: 42.6977, lon: 23.3219 },

    // Baltics
    { name: 'Tallinn', countryName: 'Estonia', countryISO2: 'EE', lat: 59.4370, lon: 24.7536 },
    { name: 'Riga', countryName: 'Latvia', countryISO2: 'LV', lat: 56.9496, lon: 24.1052 },
    { name: 'Vilnius', countryName: 'Lithuania', countryISO2: 'LT', lat: 54.6872, lon: 25.2797 },
];
