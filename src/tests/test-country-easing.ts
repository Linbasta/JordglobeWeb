/**
 * Test page for country easing curves
 * Click any country or press "Animate UK" to run the animation with selected easing.
 * Keyframe editor lets you hand-author custom curves by dragging points.
 *
 * Y axis = actual altitude: 0 (globe surface) to 1.0 (max engine altitude).
 * Default OutQuad curve: 0.2 (normal) → 0.1 (cleared).
 * Drag keyframes above 0.2 toward 1.0 for dramatic pop-up effects.
 */

import { EarthGlobe, STATE_NORMAL, STATE_CLEARED } from '../earth-globe';
import { ALTITUDE_NORMAL, ALTITUDE_CLEARED } from '../earth-globe/constants';
import { getEasingFunction } from '../shared/utils/easing';
import { CORRECT_EASING } from '../shared/animation/region-animations';

// DOM elements
const easingSelect = document.getElementById('easing') as HTMLSelectElement;
const durationSlider = document.getElementById('duration') as HTMLInputElement;
const durationValue = document.getElementById('durationValue') as HTMLSpanElement;
const resetButton = document.getElementById('reset') as HTMLButtonElement;
const animateUKButton = document.getElementById('animateUK') as HTMLButtonElement;
const copyEasingButton = document.getElementById('copyEasing') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const editorCanvas = document.getElementById('keyframeEditor') as HTMLCanvasElement;
const ctx = editorCanvas.getContext('2d')!;

// ── Keyframe editor state ──────────────────────────────────────────────

let keyframes: number[] = [];
let dragIndex = -1;
let hoverIndex = -1;

const EDITOR_W = editorCanvas.width;   // 240
const EDITOR_H = editorCanvas.height;  // 140
const PAD_X = 12;
const PAD_Y = 10;
const PLOT_W = EDITOR_W - PAD_X * 2;
const PLOT_H = EDITOR_H - PAD_Y * 2;
const POINT_RADIUS = 4;
const HIT_RADIUS = 8;
const Y_MIN = 0;
const Y_MAX = 1.0;
const Y_RANGE = Y_MAX - Y_MIN; // 1.0

function frameCount(): number {
    return Math.max(2, Math.round(parseInt(durationSlider.value, 10) / 16.67));
}

/** Sample a preset easing into altitude keyframes: ALTITUDE_NORMAL → ALTITUDE_CLEARED */
function sampleEasingIntoKeyframes(easingName: string) {
    const n = frameCount();
    const fn = getEasingFunction(easingName);
    keyframes = new Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        keyframes[i] = ALTITUDE_NORMAL + (ALTITUDE_CLEARED - ALTITUDE_NORMAL) * fn(t);
    }
}

/** Linearly interpolate the keyframe array at normalized t ∈ [0, 1] */
function interpolateKeyframes(kf: number[], t: number): number {
    const n = kf.length - 1;
    if (n <= 0) return kf[0] ?? 0;
    const idx = t * n;
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, n);
    const frac = idx - lo;
    return kf[lo] + (kf[hi] - kf[lo]) * frac;
}

/** Frame-by-frame animation driven by keyframes. Sets altitude + derives blend each frame. */
function animateFromKeyframes(
    api: { setCountryAltitude(idx: number, alt: number): void; setCountryBlend(idx: number, b: number): void },
    idx: number,
    kf: number[],
    duration: number,
): Promise<void> {
    return new Promise((resolve) => {
        const startTime = performance.now();
        function tick() {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / duration);
            const altitude = interpolateKeyframes(kf, t);
            api.setCountryAltitude(idx, altitude);
            // Derive blend from altitude: ALTITUDE_NORMAL → 1.0, ALTITUDE_CLEARED → 0.0
            const blend = Math.max(0, Math.min(1,
                (altitude - ALTITUDE_CLEARED) / (ALTITUDE_NORMAL - ALTITUDE_CLEARED)
            ));
            api.setCountryBlend(idx, blend);
            if (t >= 1) { resolve(); return; }
            requestAnimationFrame(tick);
        }
        tick();
    });
}

// ── Canvas rendering ───────────────────────────────────────────────────

function kfToCanvas(i: number, val: number): [number, number] {
    const n = keyframes.length - 1;
    const x = PAD_X + (n > 0 ? (i / n) * PLOT_W : PLOT_W / 2);
    const y = PAD_Y + ((Y_MAX - val) / Y_RANGE) * PLOT_H;
    return [x, y];
}

function canvasToKfIndex(mx: number, my: number): number {
    let bestDist = HIT_RADIUS;
    let bestIdx = -1;
    for (let i = 0; i < keyframes.length; i++) {
        const [cx, cy] = kfToCanvas(i, keyframes[i]);
        const dist = Math.hypot(mx - cx, my - cy);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }
    return bestIdx;
}

function yToCanvasY(val: number): number {
    return PAD_Y + ((Y_MAX - val) / Y_RANGE) * PLOT_H;
}

function drawEditor() {
    ctx.clearRect(0, 0, EDITOR_W, EDITOR_H);

    // Dashed grid lines at 0, 0.5, 1.0
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (const val of [1.0, 0.5, 0]) {
        const y = yToCanvasY(val);
        ctx.beginPath();
        ctx.moveTo(PAD_X, y);
        ctx.lineTo(PAD_X + PLOT_W, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Stored easing reference curve (dimmed)
    ctx.strokeStyle = '#553300';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < CORRECT_EASING.length; i++) {
        const t = i / (CORRECT_EASING.length - 1);
        const altitude = ALTITUDE_NORMAL + (ALTITUDE_CLEARED - ALTITUDE_NORMAL) * CORRECT_EASING[i];
        const x = PAD_X + t * PLOT_W;
        const y = PAD_Y + ((Y_MAX - altitude) / Y_RANGE) * PLOT_H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (keyframes.length < 2) return;

    // Connecting line
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < keyframes.length; i++) {
        const [x, y] = kfToCanvas(i, keyframes[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Points
    for (let i = 0; i < keyframes.length; i++) {
        const [x, y] = kfToCanvas(i, keyframes[i]);
        const isActive = i === dragIndex || i === hoverIndex;
        ctx.fillStyle = isActive ? '#fff' : '#4fc3f7';
        ctx.beginPath();
        ctx.arc(x, y, isActive ? POINT_RADIUS + 1 : POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1', 2, yToCanvasY(1.0) + 3);
    ctx.fillText('0', 2, yToCanvasY(0) + 3);
}

// ── Mouse interaction ──────────────────────────────────────────────────

function getMousePos(e: MouseEvent): [number, number] {
    const rect = editorCanvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
}

editorCanvas.addEventListener('mousedown', (e) => {
    const [mx, my] = getMousePos(e);
    dragIndex = canvasToKfIndex(mx, my);
});

editorCanvas.addEventListener('mousemove', (e) => {
    const [mx, my] = getMousePos(e);
    if (dragIndex >= 0) {
        // Dragging — update keyframe value
        const rawVal = Y_MAX - ((my - PAD_Y) / PLOT_H) * Y_RANGE;
        keyframes[dragIndex] = Math.max(Y_MIN, Math.min(Y_MAX, rawVal));
        // Switch to Custom when user drags
        if (easingSelect.value !== 'Custom') {
            easingSelect.value = 'Custom';
        }
        drawEditor();
    } else {
        // Hover
        const newHover = canvasToKfIndex(mx, my);
        if (newHover !== hoverIndex) {
            hoverIndex = newHover;
            drawEditor();
        }
    }
});

editorCanvas.addEventListener('mouseup', () => {
    dragIndex = -1;
});

editorCanvas.addEventListener('mouseleave', () => {
    dragIndex = -1;
    hoverIndex = -1;
    drawEditor();
});

// ── Controls wiring ────────────────────────────────────────────────────

// Update duration label and resample keyframes on slider change
durationSlider.addEventListener('input', () => {
    durationValue.textContent = durationSlider.value;
    resampleKeyframes();
});

// When easing dropdown changes, sample that easing into keyframes
easingSelect.addEventListener('change', () => {
    if (easingSelect.value !== 'Custom') {
        sampleEasingIntoKeyframes(easingSelect.value);
        drawEditor();
    }
});

function resampleKeyframes() {
    const newCount = frameCount();
    if (newCount === keyframes.length) return;

    // Resample current curve into new frame count using linear interpolation
    const old = keyframes;
    keyframes = new Array(newCount);
    for (let i = 0; i < newCount; i++) {
        keyframes[i] = interpolateKeyframes(old, i / (newCount - 1));
    }
    drawEditor();
}

function updateStatus(text: string) {
    statusEl.textContent = text;
    console.log(text);
}

// "Copy Easing" — normalize keyframes to 0→1 easing space and copy to clipboard
copyEasingButton.addEventListener('click', () => {
    const range = ALTITUDE_NORMAL - ALTITUDE_CLEARED; // 0.3
    const normalized = keyframes.map(alt =>
        Math.round(((ALTITUDE_NORMAL - alt) / range) * 1000) / 1000
    );
    const text = `[${normalized.join(', ')}]`;
    navigator.clipboard.writeText(text);
    updateStatus(`Copied ${normalized.length} easing values to clipboard`);
});

// ── Initialize ─────────────────────────────────────────────────────────

// Sample the default easing (OutQuad) into altitude keyframes
sampleEasingIntoKeyframes(easingSelect.value);
drawEditor();

const globe = new EarthGlobe({
    canvasId: 'renderCanvas',
    onReady: (api) => {
        // Look up UK
        const uk = api.getCountryByISO2('GB');

        // "Animate UK" button
        animateUKButton.addEventListener('click', async () => {
            if (!uk) {
                updateStatus('Could not find GB');
                return;
            }

            const duration = parseInt(durationSlider.value, 10);
            const easingName = easingSelect.value;

            // Reset UK first: normal state, altitude 0.4, blend 1.0
            api.setCountryState(uk.index, STATE_NORMAL);
            api.setCountryAltitude(uk.index, ALTITUDE_NORMAL);
            api.setCountryBlend(uk.index, 1.0);

            updateStatus(`GB — ${easingName} ${duration}ms`);

            // Set cleared state, then animate from keyframes
            api.setCountryState(uk.index, STATE_CLEARED);
            await animateFromKeyframes(api, uk.index, keyframes, duration);
        });

        // Click handler — animate the clicked country
        api.onCountryClick(async (event) => {
            if (!event.country) return;

            const idx = event.country.regionIndex;
            const name = event.country.name;
            const duration = parseInt(durationSlider.value, 10);
            const easingName = easingSelect.value;

            updateStatus(`${name} — ${easingName} ${duration}ms`);

            // If not Custom, resample the preset into keyframes first
            if (easingSelect.value !== 'Custom') {
                sampleEasingIntoKeyframes(easingSelect.value);
            }

            api.setCountryState(idx, STATE_CLEARED);
            await animateFromKeyframes(api, idx, keyframes, duration);
        });

        // Reset button — restore all countries to normal
        resetButton.addEventListener('click', () => {
            for (const country of api.getAllCountries()) {
                api.setCountryState(country.index, STATE_NORMAL);
                api.setCountryAltitude(country.index, ALTITUDE_NORMAL);
                api.setCountryBlend(country.index, 1.0);
            }
            updateStatus('Reset all countries');
        });

        updateStatus('Ready — click a country or press Animate UK');
    },
});

(window as any).earthGlobe = globe;
