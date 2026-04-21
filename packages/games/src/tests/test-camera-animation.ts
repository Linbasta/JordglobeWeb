import { SoloGameController } from '../solo/solo-game-controller';
import { animateToLocation, frameCountry } from '../shared/animation/camera-utils';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';

let game: any;
let selectedCountry: any = null;
let selectedLatLon: any = null;

function populateCountryDropdown() {
    const globe = game.getGlobe();
    const countries = globe.getAllCountries();

    console.log('Populating dropdown with', countries.length, 'countries');

    const sortedCountries = countries.sort((a: any, b: any) => a.name.localeCompare(b.name));

    const select = document.getElementById('countrySelect') as HTMLSelectElement;
    sortedCountries.forEach((country: any) => {
        const option = document.createElement('option');
        option.value = country.index;
        option.textContent = `${country.name} (${country.iso2})`;
        select.appendChild(option);
    });

    console.log('Dropdown populated with', select.options.length - 1, 'countries');
}

function selectCountry(country: any, latLon: any) {
    selectedCountry = country;
    selectedLatLon = latLon;

    document.getElementById('targetCountry')!.textContent = country.name;
    document.getElementById('targetLatLon')!.textContent = `${latLon.lat.toFixed(2)}, ${latLon.lon.toFixed(2)}`;

    const dropdownValue = country.countryIndex !== undefined ? country.countryIndex : country.index;
    (document.getElementById('countrySelect') as HTMLSelectElement).value = dropdownValue;

    console.log(`Selected: ${country.name} at (${latLon.lat.toFixed(2)}, ${latLon.lon.toFixed(2)})`);
}

function updateCameraInfo(camera: any) {
    document.getElementById('currentRadius')!.textContent = camera.radius.toFixed(2);
    document.getElementById('currentAlpha')!.textContent = camera.alpha.toFixed(2);
    document.getElementById('currentBeta')!.textContent = camera.beta.toFixed(2);
}

game = new SoloGameController('renderCanvas', {
    showCountryLabel: false,
    showHoverLabel: true,
    onReady: async (controller: any) => {
        console.log('Camera animation test ready!');

        populateCountryDropdown();

        controller.getPinManager().onPinPlaced((country: any, latLon: any) => {
            if (country) {
                selectCountry(country, latLon);
            }
        });

        const camera = controller.getGlobe().getCamera();
        setInterval(() => {
            updateCameraInfo(camera);
        }, 100);

        console.log('=== AUTO-FRAMING ALBANIA FOR TESTING ===');

        (document.getElementById('useViewportRegion') as HTMLInputElement).checked = true;
        document.getElementById('viewportRegionControls')!.style.display = 'block';
        (document.getElementById('regionYSlider') as HTMLInputElement).value = '0';
        document.getElementById('regionYValue')!.textContent = '0.00';
        (document.getElementById('regionHeightSlider') as HTMLInputElement).value = '0.4';
        document.getElementById('regionHeightValue')!.textContent = '0.40';
        const maxIterSlider = document.getElementById('maxIterationsSlider') as HTMLInputElement | null;
        if (maxIterSlider) {
            maxIterSlider.value = '20';
            document.getElementById('maxIterationsValue')!.textContent = '20';
        }
        updateViewportOverlay();

        const testCountryISO2 = 'RU';
        const globe = controller.getGlobe();
        const testCountry = globe.getCountryByISO2(testCountryISO2);
        const allPolygons = globe.getCountryPicker().getAllPolygons();
        const testPolygon = allPolygons.find((p: any) => p.countryIndex === testCountry?.index);

        if (testCountry && testPolygon) {
            selectCountry(testCountry, { lat: testPolygon.points[0].lat, lon: testPolygon.points[0].lon });

            await new Promise((resolve) => setTimeout(resolve, 500));

            const testPolygons = allPolygons.filter((p: any) => p.countryIndex === testCountry.index);
            const width = 0.5;
            const height = 0.86;
            const y = 0;
            const x = (1 - width) / 2;

            const viewportRegion = { x, y, width, height };

            console.log(`Auto-framing ${testCountry.name} with viewport region:`, viewportRegion);

            const stats = await frameCountry(
                controller.getGlobe().getCamera(),
                controller.getGlobe(),
                testPolygons,
                testCountry.name,
                1000,
                0.8,
                viewportRegion,
                20
            );

            console.log(`Auto-frame ${testCountry.name} complete:`, stats);

            if (stats) {
                document.getElementById('convergenceIterations')!.textContent = String(stats.iterations);
                document.getElementById('convergenceError')!.textContent = (stats.finalError * 100).toFixed(2) + '%';
                document.getElementById('convergenceSolveTime')!.textContent = stats.solveTime.toFixed(2) + 'ms';
                const statusEl = document.getElementById('convergenceStatus')!;
                statusEl.textContent = stats.converged ? '✓ Converged' : '✗ Not converged';
                statusEl.style.color = stats.converged ? '#4CAF50' : '#f44336';
            }
        }
    },
} as any);

document.getElementById('radiusSlider')!.addEventListener('input', (e) => {
    document.getElementById('radiusValue')!.textContent = (e.target as HTMLInputElement).value;
});

document.getElementById('durationSlider')!.addEventListener('input', (e) => {
    document.getElementById('durationValue')!.textContent = (e.target as HTMLInputElement).value;
});

function updateViewportOverlay() {
    const overlay = document.getElementById('viewportOverlay')!;
    const useRegion = (document.getElementById('useViewportRegion') as HTMLInputElement).checked;

    if (useRegion) {
        const y = parseFloat((document.getElementById('regionYSlider') as HTMLInputElement).value);
        const width = parseFloat((document.getElementById('regionWidthSlider') as HTMLInputElement).value);
        const height = parseFloat((document.getElementById('regionHeightSlider') as HTMLInputElement).value);

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const x = (1 - width) / 2;

        overlay.style.left = (x * screenWidth) + 'px';
        overlay.style.top = (y * screenHeight) + 'px';
        overlay.style.width = (width * screenWidth) + 'px';
        overlay.style.height = (height * screenHeight) + 'px';
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}

document.getElementById('useViewportRegion')!.addEventListener('change', (e) => {
    const controls = document.getElementById('viewportRegionControls')!;
    controls.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
    updateViewportOverlay();
});

document.getElementById('regionYSlider')!.addEventListener('input', (e) => {
    document.getElementById('regionYValue')!.textContent = parseFloat((e.target as HTMLInputElement).value).toFixed(2);
    updateViewportOverlay();
});

document.getElementById('regionWidthSlider')!.addEventListener('input', (e) => {
    document.getElementById('regionWidthValue')!.textContent = parseFloat((e.target as HTMLInputElement).value).toFixed(2);
    updateViewportOverlay();
});

document.getElementById('regionHeightSlider')!.addEventListener('input', (e) => {
    document.getElementById('regionHeightValue')!.textContent = parseFloat((e.target as HTMLInputElement).value).toFixed(2);
    updateViewportOverlay();
});

document.getElementById('performanceMode')!.addEventListener('change', (e) => {
    const customControls = document.getElementById('customGridControls')!;
    const mode = (e.target as HTMLSelectElement).value;

    if (mode === 'custom') {
        customControls.style.display = 'block';
    } else {
        customControls.style.display = 'none';

        const presets: Record<string, { coarse: number; fine: number }> = {
            quality: { coarse: 20, fine: 15 },
            balanced: { coarse: 10, fine: 8 },
            fast: { coarse: 8, fine: 6 },
            ultra: { coarse: 6, fine: 5 },
        };

        if (presets[mode]) {
            (document.getElementById('coarseGridSlider') as HTMLInputElement).value = String(presets[mode].coarse);
            document.getElementById('coarseGridValue')!.textContent = String(presets[mode].coarse);
            document.getElementById('coarseChecks')!.textContent = (presets[mode].coarse ** 3).toLocaleString();

            (document.getElementById('fineGridSlider') as HTMLInputElement).value = String(presets[mode].fine);
            document.getElementById('fineGridValue')!.textContent = String(presets[mode].fine);
            document.getElementById('fineChecks')!.textContent = (presets[mode].fine ** 3).toLocaleString();
        }
    }
});

document.getElementById('coarseGridSlider')!.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    document.getElementById('coarseGridValue')!.textContent = String(value);
    document.getElementById('coarseChecks')!.textContent = (value ** 3).toLocaleString();
});

document.getElementById('fineGridSlider')!.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    document.getElementById('fineGridValue')!.textContent = String(value);
    document.getElementById('fineChecks')!.textContent = (value ** 3).toLocaleString();
});

window.addEventListener('resize', updateViewportOverlay);

document.getElementById('countrySelect')!.addEventListener('change', (e) => {
    console.log('Dropdown changed:', (e.target as HTMLSelectElement).value);
    const countryIndex = parseInt((e.target as HTMLSelectElement).value);
    if (!isNaN(countryIndex)) {
        const globe = game.getGlobe();
        const country = globe.getAllCountries().find((c: any) => c.index === countryIndex);
        console.log('Found country:', country);
        if (country) {
            const allPolygons = globe.getCountryPicker().getAllPolygons();
            const polygon = allPolygons.find((p: any) => p.countryIndex === countryIndex);
            console.log('Found polygon:', polygon);
            if (polygon && polygon.points.length > 0) {
                const firstPoint = polygon.points[0];
                console.log('Selecting country from dropdown:', country.name, firstPoint);
                selectCountry(country, { lat: firstPoint.lat, lon: firstPoint.lon });
            } else {
                console.error('No polygon found for country:', country.name);
            }
        }
    }
});

document.getElementById('animateBtn')!.addEventListener('click', async () => {
    console.log('Animate clicked. selectedCountry:', selectedCountry, 'selectedLatLon:', selectedLatLon);
    if (!selectedCountry || !selectedLatLon) {
        alert('Please select a country first (click on globe or use dropdown)');
        return;
    }

    const targetRadius = parseFloat((document.getElementById('radiusSlider') as HTMLInputElement).value);
    const duration = parseInt((document.getElementById('durationSlider') as HTMLInputElement).value);

    console.log(`Animating to ${selectedCountry.name} at radius ${targetRadius} over ${duration}ms`);

    await animateToLocation(
        game.getGlobe().getCamera(),
        selectedLatLon.lat,
        selectedLatLon.lon,
        targetRadius,
        duration
    );

    console.log('Animation complete!');
});

document.getElementById('frameBtn')!.addEventListener('click', async () => {
    console.log('Frame clicked. selectedCountry:', selectedCountry);
    if (!selectedCountry) {
        alert('Please select a country first (click on globe or use dropdown)');
        return;
    }

    const duration = parseInt((document.getElementById('durationSlider') as HTMLInputElement).value);

    const globe = game.getGlobe();
    const allPolygons = globe.getCountryPicker().getAllPolygons();
    const countryIndex = selectedCountry.countryIndex !== undefined ? selectedCountry.countryIndex : selectedCountry.index;

    const countryPolygons = allPolygons.filter((p: any) => p.countryIndex === countryIndex);

    if (countryPolygons.length === 0) {
        alert('Could not find polygons for country');
        console.error('No polygons found for country:', selectedCountry);
        return;
    }

    let viewportRegion: any = undefined;
    if ((document.getElementById('useViewportRegion') as HTMLInputElement).checked) {
        const width = parseFloat((document.getElementById('regionWidthSlider') as HTMLInputElement).value);
        const height = parseFloat((document.getElementById('regionHeightSlider') as HTMLInputElement).value);
        const y = parseFloat((document.getElementById('regionYSlider') as HTMLInputElement).value);

        const x = (1 - width) / 2;

        viewportRegion = { x, y, width, height };
        console.log('Using viewport region:', viewportRegion);
    }

    let gridConfig: any = undefined;
    if (viewportRegion) {
        const coarseGridSize = parseInt((document.getElementById('coarseGridSlider') as HTMLInputElement).value);
        const fineGridSize = parseInt((document.getElementById('fineGridSlider') as HTMLInputElement).value);
        gridConfig = {
            coarseGridSize,
            fineGridSize,
            showDebugVisualization: true,
        };
    }

    console.log(`Auto-framing ${selectedCountry.name} (${countryPolygons.length} polygons) over ${duration}ms`);
    if (gridConfig) {
        console.log(`Grid config: ${gridConfig.coarseGridSize}×${gridConfig.coarseGridSize}×${gridConfig.coarseGridSize} + ${gridConfig.fineGridSize}×${gridConfig.fineGridSize}×${gridConfig.fineGridSize}`);
    }

    const stats = await frameCountry(
        game.getGlobe().getCamera(),
        game.getGlobe(),
        countryPolygons,
        selectedCountry.name,
        duration,
        0.8,
        viewportRegion,
        100,
        gridConfig
    );

    console.log('Framing complete!', stats);

    if (stats) {
        if (gridConfig) {
            document.getElementById('gridSizes')!.textContent = `${gridConfig.coarseGridSize}×${gridConfig.coarseGridSize}×${gridConfig.coarseGridSize} + ${gridConfig.fineGridSize}×${gridConfig.fineGridSize}×${gridConfig.fineGridSize}`;
        } else {
            document.getElementById('gridSizes')!.textContent = 'Binary search';
        }

        document.getElementById('convergenceIterations')!.textContent = stats.iterations.toLocaleString();

        const errorPercent = stats.finalError * 100;
        const errorEl = document.getElementById('convergenceError')!;
        errorEl.textContent = errorPercent.toFixed(2) + '%';
        if (errorPercent < 1) {
            errorEl.style.color = '#4CAF50';
        } else if (errorPercent < 2) {
            errorEl.style.color = '#FFC107';
        } else {
            errorEl.style.color = '#f44336';
        }

        document.getElementById('convergenceSolveTime')!.textContent = stats.solveTime.toFixed(1) + 'ms';

        if (viewportRegion) {
            const statusEl = document.getElementById('convergenceStatus')!;
            statusEl.textContent = stats.converged ? '✓ Centered' : '✗ Not centered';
            statusEl.style.color = stats.converged ? '#4CAF50' : '#f44336';
        } else {
            const statusEl = document.getElementById('convergenceStatus')!;
            statusEl.textContent = '✓ Complete';
            statusEl.style.color = '#4CAF50';
        }
    } else {
        document.getElementById('gridSizes')!.textContent = '-';
        document.getElementById('convergenceIterations')!.textContent = '-';
        document.getElementById('convergenceError')!.textContent = '-';
        document.getElementById('convergenceSolveTime')!.textContent = '-';
        const statusEl = document.getElementById('convergenceStatus')!;
        statusEl.textContent = '-';
        statusEl.style.color = '#ccc';
    }
});

document.getElementById('resetBtn')!.addEventListener('click', async () => {
    const duration = parseInt((document.getElementById('durationSlider') as HTMLInputElement).value);
    console.log('Resetting camera...');

    await animateToLocation(game.getGlobe().getCamera(), 0, 0, 10, duration);

    console.log('Camera reset!');
});

document.getElementById('logStateBtn')!.addEventListener('click', () => {
    if (!selectedCountry) {
        alert('Please select a country first');
        return;
    }

    const globe = game.getGlobe();
    const camera = globe.getCamera();

    const useRegion = (document.getElementById('useViewportRegion') as HTMLInputElement).checked;
    let viewportRegion: any = null;
    if (useRegion) {
        const width = parseFloat((document.getElementById('regionWidthSlider') as HTMLInputElement).value);
        const height = parseFloat((document.getElementById('regionHeightSlider') as HTMLInputElement).value);
        const y = parseFloat((document.getElementById('regionYSlider') as HTMLInputElement).value);
        const x = (1 - width) / 2;
        viewportRegion = { x, y, width, height };
    }

    const allPolygons = globe.getCountryPicker().getAllPolygons();
    const countryIndex = selectedCountry.countryIndex !== undefined ? selectedCountry.countryIndex : selectedCountry.index;
    const countryPolygons = allPolygons.filter((p: any) => p.countryIndex === countryIndex);

    let minLat = Infinity, maxLat = -Infinity;
    const allLons: number[] = [];
    for (const polygon of countryPolygons) {
        minLat = Math.min(minLat, polygon.bbox.minLat);
        maxLat = Math.max(maxLat, polygon.bbox.maxLat);
        for (const point of polygon.points) {
            allLons.push(point.lon);
        }
    }
    const minLon = Math.min(...allLons);
    const maxLon = Math.max(...allLons);
    const deltaLon = maxLon - minLon;
    const deltaLat = maxLat - minLat;

    const allPoints = countryPolygons.flatMap((p: any) => p.points);
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const point of allPoints) {
        const latRad = point.lat * (Math.PI / 180);
        const lonRad = point.lon * (Math.PI / 180);
        const xc = Math.cos(latRad) * Math.cos(lonRad);
        const yc = Math.sin(latRad);
        const zc = Math.cos(latRad) * Math.sin(lonRad);
        sumX += xc; sumY += yc; sumZ += zc;
    }
    const length = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
    const centerLat = Math.asin(sumY / length) * (180 / Math.PI);
    const centerLon = Math.atan2(sumZ / length, sumX / length) * (180 / Math.PI);

    const scene = camera.getScene();
    const engine = scene.getEngine();

    const worldPos = new Vector3(
        Math.cos(centerLat * Math.PI / 180) * Math.cos(centerLon * Math.PI / 180),
        Math.sin(centerLat * Math.PI / 180),
        Math.cos(centerLat * Math.PI / 180) * Math.sin(centerLon * Math.PI / 180)
    );

    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const screenPos = Vector3.Project(
        worldPos,
        Matrix.Identity(),
        scene.getTransformMatrix(),
        viewport
    );
    const actualScreenY = screenPos.y / engine.getRenderHeight();

    const goodFrameState = {
        timestamp: new Date().toISOString(),
        country: {
            name: selectedCountry.name,
            center: { lat: centerLat.toFixed(4), lon: centerLon.toFixed(4) },
            angularSize: {
                latSpan: deltaLat.toFixed(2) + '°',
                lonSpan: deltaLon.toFixed(2) + '°',
            },
        },
        camera: {
            alpha: (camera.alpha * 180 / Math.PI).toFixed(2) + '°',
            beta: (camera.beta * 180 / Math.PI).toFixed(2) + '°',
            radius: camera.radius.toFixed(4),
            fov: (camera.fov * 180 / Math.PI).toFixed(2) + '°',
        },
        viewport: viewportRegion
            ? {
                  enabled: true,
                  y: viewportRegion.y,
                  height: viewportRegion.height,
                  width: viewportRegion.width,
                  centerY: (viewportRegion.y + viewportRegion.height / 2).toFixed(4),
              }
            : {
                  enabled: false,
              },
        actualScreenPosition: {
            countryCenterY: actualScreenY.toFixed(4),
            countryCenterY_percent: (actualScreenY * 100).toFixed(1) + '%',
        },
        notes: 'Current manual framing - this is what looks good!',
    };

    console.log('═══════════════════════════════════════');
    console.log('📸 GOOD FRAME STATE CAPTURED');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(goodFrameState, null, 2));
    console.log('═══════════════════════════════════════');
});

(window as any).game = game;
