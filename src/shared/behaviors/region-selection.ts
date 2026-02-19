/**
 * Country Selection — hover feedback (altitude raise + outline)
 *
 * Module-level state + plain functions. No class, no callbacks, no animation loop.
 * Uses the globe API directly for altitude/outline/state.
 */

import type { EarthGlobeAPI, RegionPolygon, LatLon } from '../../earth-globe';
import { STATE_CLEARED, STATE_DISABLED } from '../../earth-globe';

const ALT_DEFAULT = 0.4;
const ALT_SELECTED = 0.5;

let selectedIndex = -1;

export function handleHover(globe: EarthGlobeAPI, country: RegionPolygon | null, _latLon: LatLon): void {
    // Deselect previous if different
    if (selectedIndex >= 0 && (!country || country.regionIndex !== selectedIndex)) {
        globe.clearCountryOutline();
        const state = globe.getActiveRegionState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            globe.setActiveRegionAltitude(selectedIndex, ALT_DEFAULT);
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
    if (selectedIndex >= 0) {
        globe.clearCountryOutline();
    }
    selectedIndex = -1;
}
