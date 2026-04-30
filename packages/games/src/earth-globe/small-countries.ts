/**
 * Classification of small countries that need magnification on the globe.
 * Island nations, micro-states, and other countries too small to see/click.
 */

const SMALL_COUNTRY_CODES = new Set([
    // Original 12
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
    // 69 from Unity MapConfig SmallMarkerCountries
    'AG', // Antigua and Barbuda
    'AI', // Anguilla
    'AS', // American Samoa
    'AW', // Aruba
    'AX', // Åland Islands
    'BB', // Barbados
    'BL', // Saint Barthélemy
    'BM', // Bermuda
    'BQ', // Bonaire
    'BV', // Bouvet Island
    'CC', // Cocos Islands
    'CK', // Cook Islands
    'CV', // Cape Verde
    'CW', // Curaçao
    'CX', // Christmas Island
    'DM', // Dominica
    'FJ', // Fiji
    'FK', // Falkland Islands
    'FM', // Micronesia
    'FO', // Faroe Islands
    'GD', // Grenada
    'GG', // Guernsey
    'GP', // Guadeloupe
    'GS', // South Georgia
    'GU', // Guam
    'HK', // Hong Kong
    'HM', // Heard Island
    'IM', // Isle of Man
    'IO', // British Indian Ocean Territory
    'JE', // Jersey
    'JM', // Jamaica
    'KI', // Kiribati
    'KM', // Comoros
    'KN', // Saint Kitts and Nevis
    'KY', // Cayman Islands
    'LC', // Saint Lucia
    'MF', // Saint Martin
    'MH', // Marshall Islands
    'MO', // Macao
    'MP', // Northern Mariana Islands
    'MQ', // Martinique
    'MS', // Montserrat
    'MU', // Mauritius
    'NF', // Norfolk Island
    'NR', // Nauru
    'NU', // Niue
    'PF', // French Polynesia
    'PM', // Saint Pierre and Miquelon
    'PN', // Pitcairn Islands
    'PR', // Puerto Rico
    'PW', // Palau
    'RE', // Réunion
    'SC', // Seychelles
    'SH', // Saint Helena
    'ST', // São Tomé and Príncipe
    'SX', // Sint Maarten
    'TC', // Turks and Caicos
    'TF', // French Southern Territories
    'TK', // Tokelau
    'TO', // Tonga
    'TT', // Trinidad and Tobago
    'TV', // Tuvalu
    'UM', // US Minor Outlying Islands
    'VC', // Saint Vincent and the Grenadines
    'VG', // British Virgin Islands
    'VI', // US Virgin Islands
    'WF', // Wallis and Futuna
    'WS', // Samoa
    'YT', // Mayotte
]);

export function isSmallCountry(iso2: string): boolean {
    return SMALL_COUNTRY_CODES.has(iso2);
}

export function getSmallCountryCodes(): ReadonlySet<string> {
    return SMALL_COUNTRY_CODES;
}

const SURROUNDED_COUNTRY_CODES = new Set([
    'VA', // Vatican City (surrounded by Italy)
    'SM', // San Marino (surrounded by Italy)
    'LS', // Lesotho (surrounded by South Africa)
    'LI', // Liechtenstein (surrounded by Switzerland/Austria)
    'LU', // Luxembourg (surrounded by Belgium/Germany/France)
    'AD', // Andorra (surrounded by France/Spain)
]);

export function isSurroundedCountry(iso2: string): boolean {
    return SURROUNDED_COUNTRY_CODES.has(iso2);
}

/**
 * Small provinces that need magnification.
 * Format: "COUNTRY-ID" where ID is the province number.
 */
const SMALL_PROVINCE_IDS = new Set<string>([]);

/**
 * Check if a province ID represents a small province
 * @param provinceId Format: "COUNTRY-ID" (e.g., "US-39")
 */
export function isSmallProvince(provinceId: string): boolean {
    return SMALL_PROVINCE_IDS.has(provinceId);
}
