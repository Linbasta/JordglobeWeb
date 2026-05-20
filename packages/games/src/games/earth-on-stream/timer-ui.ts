let containerEl: HTMLDivElement | null = null;
let barEl: HTMLDivElement | null = null;
let animFrameId: number | null = null;
let startTime = 0;
let duration = 0;
let onExpire: (() => void) | null = null;
let paused = false;
let remaining = 0;

export function createTimer(seconds: number, onTimeUp: () => void, rightMargin: number = 0): void {
    disposeTimer();

    duration = seconds * 1000;
    remaining = duration;
    onExpire = onTimeUp;

    containerEl = document.createElement('div');
    containerEl.style.cssText =
        `position:fixed;top:0;left:0;right:${rightMargin}px;height:6px;z-index:60;` +
        'background:rgba(255,255,255,0.1);';

    barEl = document.createElement('div');
    barEl.style.cssText =
        'height:100%;width:100%;background:#4CAF50;' +
        'transition:background 0.3s;';

    containerEl.appendChild(barEl);
    document.body.appendChild(containerEl);

    startTime = performance.now();
    paused = false;
    tick();
}

function tick() {
    if (paused || !barEl) return;

    const elapsed = performance.now() - startTime;
    const left = remaining - elapsed;
    const fraction = Math.max(0, left / duration);

    barEl.style.width = `${fraction * 100}%`;

    if (fraction < 0.25) {
        barEl.style.background = '#f44336';
    } else if (fraction < 0.5) {
        barEl.style.background = '#FF9800';
    }

    if (left <= 0) {
        barEl.style.width = '0%';
        animFrameId = null;
        onExpire?.();
        return;
    }

    animFrameId = requestAnimationFrame(tick);
}

export function pauseTimer(): void {
    if (paused || !barEl) return;
    paused = true;
    remaining = Math.max(0, remaining - (performance.now() - startTime));
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
}

export function resumeTimer(): void {
    if (!paused || !barEl) return;
    paused = false;
    startTime = performance.now();
    tick();
}

export function disposeTimer(): void {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    if (containerEl) {
        containerEl.remove();
        containerEl = null;
        barEl = null;
    }
    onExpire = null;
    paused = false;
}
