/**
 * Temporary dev tool for calibrating orbit sensitivity at different zoom levels.
 * Press S in dev mode to toggle. Lock sensitivity, adjust with slider, log data points.
 */
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { zoom } from '../../earth-globe/constants';

let panel: HTMLDivElement | null = null;
let camera: ArcRotateCamera | null = null;
let rafId = 0;

// DOM refs
let radiusEl: HTMLSpanElement;
let sensitivityEl: HTMLSpanElement;
let slider: HTMLInputElement;
let lockBtn: HTMLButtonElement;

const logged: { radius: number; sensitivity: number }[] = [];

function createPanel(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'sensitivity-calibrator';
    div.style.cssText = `
        position: fixed; top: 10px; left: 10px; z-index: 99999;
        background: rgba(0,0,0,0.85); color: #0f0; font: 13px monospace;
        padding: 12px 16px; border-radius: 6px; min-width: 260px;
        user-select: none;
    `;

    div.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold; color:#fff">Orbit Sensitivity Calibrator</div>
        <div>Radius: <span id="sc-radius">-</span></div>
        <div>Sensitivity: <span id="sc-sensitivity">-</span></div>
        <div style="margin-top:8px">
            <input id="sc-slider" type="range" min="100" max="8000" step="50" value="2000"
                   style="width:100%; accent-color:#0f0" disabled>
        </div>
        <div style="margin-top:8px; display:flex; gap:6px">
            <button id="sc-lock" style="flex:1; padding:4px 8px; cursor:pointer">Lock</button>
            <button id="sc-log" style="flex:1; padding:4px 8px; cursor:pointer">Log</button>
        </div>
        <div id="sc-points" style="margin-top:8px; font-size:11px; color:#888; max-height:120px; overflow-y:auto"></div>
    `;

    document.body.appendChild(div);

    radiusEl = div.querySelector('#sc-radius')!;
    sensitivityEl = div.querySelector('#sc-sensitivity')!;
    slider = div.querySelector('#sc-slider') as HTMLInputElement;
    lockBtn = div.querySelector('#sc-lock') as HTMLButtonElement;

    // Lock/unlock toggle
    lockBtn.addEventListener('click', () => {
        if (zoom.orbitOverride === null) {
            // Lock at current value
            const current = camera!.angularSensibilityX;
            zoom.orbitOverride = current;
            slider.value = String(current);
            slider.disabled = false;
            lockBtn.textContent = 'Unlock';
            lockBtn.style.background = '#600';
        } else {
            // Unlock
            zoom.orbitOverride = null;
            slider.disabled = true;
            lockBtn.textContent = 'Lock';
            lockBtn.style.background = '';
        }
    });

    // Slider adjusts override
    slider.addEventListener('input', () => {
        if (zoom.orbitOverride !== null) {
            zoom.orbitOverride = Number(slider.value);
        }
    });

    // Log current data point
    const logBtn = div.querySelector('#sc-log') as HTMLButtonElement;
    const pointsEl = div.querySelector('#sc-points') as HTMLDivElement;
    logBtn.addEventListener('click', () => {
        const point = {
            radius: Math.round(camera!.radius * 100) / 100,
            sensitivity: Math.round(camera!.angularSensibilityX),
        };
        logged.push(point);
        console.log('Sensitivity data point:', point);
        console.log('All points so far:', JSON.stringify(logged));
        pointsEl.innerHTML = logged
            .map(p => `r=${p.radius} → s=${p.sensitivity}`)
            .join('<br>');
    });

    return div;
}

function tick() {
    if (!camera || !panel) return;
    radiusEl.textContent = camera.radius.toFixed(2);
    sensitivityEl.textContent = Math.round(camera.angularSensibilityX).toString();
    rafId = requestAnimationFrame(tick);
}

export function toggleSensitivityCalibrator(cam: ArcRotateCamera): void {
    if (panel) {
        // Destroy
        cancelAnimationFrame(rafId);
        zoom.orbitOverride = null;
        panel.remove();
        panel = null;
        camera = null;
        return;
    }

    camera = cam;
    panel = createPanel();
    tick();
}
