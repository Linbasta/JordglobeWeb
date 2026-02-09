/**
 * Country Selection — hover feedback (altitude raise + outline)
 *
 * Module-level state + plain functions. No class, no callbacks, no animation loop.
 * Uses the globe API directly for altitude/outline/state.
 */

import type { EarthGlobeAPI, CountryPolygon, LatLon } from '../../earth-globe';
import { STATE_CLEARED, STATE_DISABLED } from '../../earth-globe';

const ALT_DEFAULT = 0.4;
const ALT_SELECTED = 0.5;

let selectedIndex = -1;

export function handleHover(globe: EarthGlobeAPI, country: CountryPolygon | null, _latLon: LatLon): void {
    // Deselect previous if different
    if (selectedIndex >= 0 && (!country || country.countryIndex !== selectedIndex)) {
        globe.clearCountryOutline();
        const state = globe.getCountryState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            globe.setCountryAltitude(selectedIndex, ALT_DEFAULT);
        }
        if (globe.isSmallCountry(selectedIndex)) {
            globe.animateCountryExpansion(selectedIndex, 1.0, 300);
            if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
                globe.showSmallCountryMarker(selectedIndex);
            }
        }
        selectedIndex = -1;
    }

    if (!country) return;

    const state = globe.getCountryState(country.countryIndex);
    if (state === STATE_DISABLED || state === STATE_CLEARED) return;

    selectedIndex = country.countryIndex;
    globe.showCountryOutline(country.countryIndex);
    globe.setCountryAltitude(country.countryIndex, ALT_SELECTED);
    if (globe.isSmallCountry(country.countryIndex)) {
        globe.animateCountryExpansion(country.countryIndex, 5.0, 300);
        globe.hideSmallCountryMarker(country.countryIndex);
    }
}

export function clearSelection(globe: EarthGlobeAPI): void {
    if (selectedIndex >= 0) {
        globe.clearCountryOutline();
    }
    selectedIndex = -1;
}
