/**
 * Country Selection — hover feedback (altitude raise + outline)
 *
 * Module-level state + plain functions. No class, no callbacks, no animation loop.
 * Uses the globe API directly for altitude/outline/state.
 */

import type { EarthGlobeAPI, RegionPolygon, LatLon } from '../../earth-globe';
import { STATE_CLEARED, STATE_DISABLED } from '../../earth-globe';
import { REGION_ALTITUDE, ANIMATION_AMPLITUDE } from '../../earth-globe/constants';

const ALT_DEFAULT = REGION_ALTITUDE / ANIMATION_AMPLITUDE;  // ~0.2 - same as initialization
const ALT_SELECTED = 0.5;   // Elevated altitude when hovering

let selectedIndex = -1;
let savedAltitude = -1;     // Save the original altitude before elevating

export function handleHover(globe: EarthGlobeAPI, country: RegionPolygon | null, _latLon: LatLon): void {
    const controller = globe.getActiveController();

    // Deselect previous if different
    if (selectedIndex >= 0 && (!country || country.regionIndex !== selectedIndex)) {
        globe.clearCountryOutline();
        const state = controller.getState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            // Restore the original saved altitude, or use default if we don't have one
            const restoreAlt = savedAltitude >= 0 ? savedAltitude : ALT_DEFAULT;
            controller.setAltitude(selectedIndex, restoreAlt);
        }
        // Small country expansion only applies in country mode, not province mode
        if (!globe.isInRegionMode() && globe.isSmallCountry(selectedIndex)) {
            globe.getCountryController().animateExpansion(selectedIndex, 1.0, 300);
            if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
                globe.showSmallCountryMarker(selectedIndex);
            }
        }
        selectedIndex = -1;
        savedAltitude = -1;
    }

    if (!country) return;

    // If we're already on this region, do nothing (don't re-save altitude!)
    if (selectedIndex === country.regionIndex) {
        return;
    }

    const state = controller.getState(country.regionIndex);
    if (state === STATE_DISABLED || state === STATE_CLEARED) {
        return;
    }

    // Save the current altitude BEFORE elevating
    savedAltitude = controller.getAltitude(country.regionIndex);
    selectedIndex = country.regionIndex;
    globe.showCountryOutline(country.regionIndex);
    controller.setAltitude(country.regionIndex, ALT_SELECTED);
    // Small country expansion only applies in country mode, not province mode
    if (!globe.isInRegionMode() && globe.isSmallCountry(country.regionIndex)) {
        globe.getCountryController().animateExpansion(country.regionIndex, 5.0, 300);
        globe.hideSmallCountryMarker(country.regionIndex);
    }
}

export function clearSelection(globe: EarthGlobeAPI): void {
    const controller = globe.getActiveController();

    if (selectedIndex >= 0) {
        globe.clearCountryOutline();
        const state = controller.getState(selectedIndex);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            // Restore the original saved altitude, or use default if we don't have one
            const restoreAlt = savedAltitude >= 0 ? savedAltitude : ALT_DEFAULT;
            controller.setAltitude(selectedIndex, restoreAlt);
        }
        // Small country expansion only applies in country mode, not province mode
        if (!globe.isInRegionMode() && globe.isSmallCountry(selectedIndex)) {
            globe.getCountryController().animateExpansion(selectedIndex, 1.0, 300);
            if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
                globe.showSmallCountryMarker(selectedIndex);
            }
        }
    }
    selectedIndex = -1;
    savedAltitude = -1;
}
