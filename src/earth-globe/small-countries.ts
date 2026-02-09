/**
 * Classification of small countries that need magnification on the globe.
 * Island nations, micro-states, and other countries too small to see/click.
 */

const SMALL_COUNTRY_CODES = new Set([
    'MT', // Malta
    'SG', // Singapore
    'BH', // Bahrain
    'MV', // Maldives
    'MC', // Monaco
    'VA', // Vatican City
    'SM', // San Marino
    'LI', // Liechtenstein
    'LU', // Luxembourg
    'AD', // Andorra
    'GI', // Gibraltar
    'BN', // Brunei
]);

export function isSmallCountry(iso2: string): boolean {
    return SMALL_COUNTRY_CODES.has(iso2);
}

export function getSmallCountryCodes(): ReadonlySet<string> {
    return SMALL_COUNTRY_CODES;
}
