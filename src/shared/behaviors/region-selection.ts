/**
 * Country Selection — hover feedback (altitude raise + outline)
 *
 * Module-level state + plain functions. No class, no callbacks, no animation loop.
 * Uses the globe API directly for altitude/outline/state.
 */

import type { EarthGlobeAPI, RegionPolygon, LatLon } from '../../earth-globe';
import { STATE_CLEARED, STATE_DISABLED } from '../../earth-globe';

const ALT_DEFAULT_COUNTRY = 0.4;   // Default altitude for countries
const ALT_DEFAULT_PROVINCE = 0.2;  // Default altitude for provinces
const ALT_SELECTED = 0.5;

let selectedIndex = -1;

/**
 * Get the correct default altitude based on current mode (country vs province)
 */
function getDefaultAltitude(globe: EarthGlobeAPI): number {
    return globe.isInRegionMode() ? ALT_DEFAULT_PROVINCE : ALT_DEFAULT_COUNTRY;
}

export function handleHover(globe: EarthGlobeAPI, country: RegionPolygon | null, _latLon: LatLon): void {
    const defaultAlt = getDefaultAltitude(globe);

    // Deselect previous if different
    if (selectedIndex >= 0 && (!country || country.regionIndex !== selectedIndex)) {
        globe.clearCountryOutline();
        const state = globe.getActiveRegionState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            globe.setActiveRegionAltitude(selectedIndex, defaultAlt);
        }
        // Small country expansion only applies in country mode, not province mode
        if (!globe.isInRegionMode() && globe.isSmallCountry(selectedIndex)) {
            globe.animateCountryExpansion(selectedIndex, 1.0, 300);
            if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
                globe.showSmallCountryMarker(selectedIndex);
            }
        }
        selectedIndex = -1;
    }

    if (!country) return;

    const state = globe.getActiveRegionState(country.regionIndex);
    if (state === STATE_DISABLED || state === STATE_CLEARED) return;

    selectedIndex = country.regionIndex;
    globe.showCountryOutline(country.regionIndex);
    globe.setActiveRegionAltitude(country.regionIndex, ALT_SELECTED);
    // Small country expansion only applies in country mode, not province mode
    if (!globe.isInRegionMode() && globe.isSmallCountry(country.regionIndex)) {
        globe.animateCountryExpansion(country.regionIndex, 5.0, 300);
        globe.hideSmallCountryMarker(country.regionIndex);
    }
}

export function clearSelection(globe: EarthGlobeAPI): void {
    const defaultAlt = getDefaultAltitude(globe);
    if (selectedIndex >= 0) {
        globe.clearCountryOutline();
        const state = globe.getActiveRegionState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            globe.setActiveRegionAltitude(selectedIndex, defaultAlt);
        }
        // Small country expansion only applies in country mode, not province mode
        if (!globe.isInRegionMode() && globe.isSmallCountry(selectedIndex)) {
            globe.animateCountryExpansion(selectedIndex, 1.0, 300);
            if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
                globe.showSmallCountryMarker(selectedIndex);
            }
        }
    }
    selectedIndex = -1;
}
