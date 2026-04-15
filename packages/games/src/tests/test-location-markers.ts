/**
 * Test page for Location Markers (Pooled)
 * Places hockey puck markers at various capital cities using the pooled marker system
 * All markers are batched for optimal rendering performance
 */

import { EarthGlobe } from '../earth-globe';

const globe = new EarthGlobe({ canvasId: 'renderCanvas' });
(window as any).earthGlobe = globe;

// Capital cities to mark
const capitals = [
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686 },
];

const markerIds: number[] = [];

// Wait for globe to initialize
setTimeout(() => {
    const statusEl = document.getElementById('status');

    console.log('Acquiring markers from pool...');

    // Acquire a marker for each capital
    capitals.forEach((capital) => {
        const markerId = globe.acquireMarker(capital.lat, capital.lon);

        if (markerId !== -1) {
            markerIds.push(markerId);
            console.log(`Acquired marker ${markerId} for ${capital.name} (${capital.lat}, ${capital.lon})`);
        } else {
            console.error(`Failed to acquire marker for ${capital.name}`);
        }
    });

    // Get pool stats
    const stats = globe.getMarkerPoolStats();
    if (stats) {
        console.log(`Marker pool: ${stats.inUse}/${stats.total} in use, ${stats.available} available`);

        if (statusEl) {
            statusEl.innerHTML = `
                Placed ${markerIds.length} markers<br>
                Pool: ${stats.inUse}/${stats.total} in use, ${stats.available} available<br>
                <small>All markers batched for optimal rendering</small>
            `;
        }
    }
}, 2000);
