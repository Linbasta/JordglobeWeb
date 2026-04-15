/**
 * Performance overlay — FPS / frame-time telemetry
 *
 * Module-level ring buffer, no classes.
 * Guarded by import.meta.env.DEV at the call site so this entire
 * module is tree-shaken from production builds.
 */

const BUFFER_SIZE = 120;
const frameTimes = new Float64Array(BUFFER_SIZE);
let head = 0;
let sampleCount = 0;
let lastTimestamp = -1;

let overlay: HTMLDivElement | null = null;
let visible = false;

function ensureOverlay(): HTMLDivElement {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.style.cssText =
        'position:fixed;top:8px;left:8px;z-index:99999;' +
        'font:12px/1.4 monospace;color:#0f0;background:rgba(0,0,0,0.65);' +
        'padding:6px 10px;border-radius:4px;pointer-events:none;display:none;';
    document.body.appendChild(overlay);
    return overlay;
}

/** Call once per frame with performance.now(). */
export function tickPerf(now: number): void {
    if (lastTimestamp >= 0) {
        const dt = now - lastTimestamp;
        frameTimes[head] = dt;
        head = (head + 1) % BUFFER_SIZE;
        if (sampleCount < BUFFER_SIZE) sampleCount++;
    }
    lastTimestamp = now;

    if (visible) updateText();
}

export function togglePerfOverlay(): void {
    const el = ensureOverlay();
    visible = !visible;
    el.style.display = visible ? 'block' : 'none';
}

function updateText(): void {
    if (!overlay || sampleCount === 0) return;

    let sum = 0;
    let worst = 0;
    for (let i = 0; i < sampleCount; i++) {
        const v = frameTimes[i];
        sum += v;
        if (v > worst) worst = v;
    }

    const avgMs = sum / sampleCount;
    const fps = 1000 / avgMs;

    overlay.textContent =
        `FPS  ${fps.toFixed(0)}\n` +
        `avg  ${avgMs.toFixed(1)} ms\n` +
        `worst ${worst.toFixed(1)} ms`;
}
