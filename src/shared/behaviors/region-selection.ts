/**
 * Country Selection — hover feedback (altitude raise + outline)
 *
 * Module-level state + plain functions. No class, no callbacks, no animation loop.
 * Uses the globe API directly for altitude/outline/state.
 */

import type { EarthGlobeAPI, RegionPolygon, LatLon } from '../../earth-globe';
import { STATE_CLEARED, STATE_DISABLED } from '../../earth-globe';
import { ALTITUDE_NORMAL, ALTITUDE_HOVER, ALTITUDE_HOVER_ARCHIPELAGO } from '../../earth-globe/constants';

let selectedIndex = -1;
let savedAltitude = -1;     // Save the original altitude before elevating
let selectedIso2: string | null = null;  // Track ISO2 for archipelago overlay

/**
 * Check if the currently selected country is an archipelago
 */
function isSelectedArchipelago(globe: EarthGlobeAPI): boolean {
    return selectedIso2 !== null && globe.countryHasArchipelagoOverlay(selectedIso2);
}

/**
 * Deselect the current selection (restore altitude, hide overlay, show marker)
 */
function deselectCurrent(globe: EarthGlobeAPI): void {
    if (selectedIndex < 0) return;

    const controller = globe.getActiveController();
    const wasArchipelago = isSelectedArchipelago(globe);

    globe.clearCountryOutline();

    // Hide archipelago overlay
    if (wasArchipelago && selectedIso2) {
        globe.hideArchipelagoOverlayForCountry(selectedIso2);
    }

    const state = controller.getState(selectedIndex);
    if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
        // Restore the original saved altitude, or use default if we don't have one
        const restoreAlt = savedAltitude >= 0 ? savedAltitude : ALTITUDE_NORMAL;
        controller.setAltitude(selectedIndex, restoreAlt);
    }

    // Small region expansion - but NOT for archipelago countries (they use overlay instead)
    if (controller.isSmallRegion(selectedIndex) && !wasArchipelago) {
        controller.animateExpansion(selectedIndex, 1.0, 300);
        if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
            controller.showSmallRegionMarker(selectedIndex);
        }
    }

    selectedIndex = -1;
    savedAltitude = -1;
    selectedIso2 = null;
}

export function handleHover(globe: EarthGlobeAPI, country: RegionPolygon | null, _latLon: LatLon): void {
    const controller = globe.getActiveController();

    // Deselect previous if different
    if (selectedIndex >= 0 && (!country || country.regionIndex !== selectedIndex)) {
        deselectCurrent(globe);
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
    selectedIso2 = country.id;  // For countries, id is the ISO2 code
    globe.showCountryOutline(country.regionIndex);

    // Check if this is an archipelago country
    const isArchipelago = globe.countryHasArchipelagoOverlay(country.id);

    // Use higher altitude for archipelago countries to make them more prominent
    const hoverAltitude = isArchipelago ? ALTITUDE_HOVER_ARCHIPELAGO : ALTITUDE_HOVER;
    controller.setAltitude(country.regionIndex, hoverAltitude);

    // Show archipelago overlay for scattered island nations
    if (isArchipelago) {
        globe.showArchipelagoOverlayForCountry(country.id);
    }

    // Small region expansion - but NOT for archipelago countries (they use overlay instead)
    if (controller.isSmallRegion(country.regionIndex) && !isArchipelago) {
        const expansion = controller.getExpansionFactor(country.regionIndex);
        controller.animateExpansion(country.regionIndex, expansion, 300);
        controller.hideSmallRegionMarker(country.regionIndex);
    }
}

export function clearSelection(globe: EarthGlobeAPI): void {
    deselectCurrent(globe);
}
