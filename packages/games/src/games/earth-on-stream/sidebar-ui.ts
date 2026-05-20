import type { RoundLocation } from './game-state';

let sidebarEl: HTMLDivElement | null = null;
let counterEl: HTMLDivElement | null = null;
let rowEls: HTMLDivElement[] = [];

export function createSidebar(locations: RoundLocation[]): void {
    disposeSidebar();

    sidebarEl = document.createElement('div');
    sidebarEl.style.cssText =
        'position:fixed;right:0;top:0;height:100%;width:280px;' +
        'background:rgba(10,10,20,0.75);z-index:50;' +
        'display:flex;flex-direction:column;padding:16px 12px;' +
        'box-sizing:border-box;gap:10px;overflow-y:auto;' +
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
        'font-family:system-ui,-apple-system,sans-serif;';

    counterEl = document.createElement('div');
    counterEl.style.cssText =
        'color:#aaa;font-size:14px;text-align:center;padding-bottom:8px;' +
        'border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;';
    updateCounter(0, locations.length);
    sidebarEl.appendChild(counterEl);

    rowEls = [];
    for (const rl of locations) {
        const row = createRow(rl.location.name);
        rowEls.push(row);
        sidebarEl.appendChild(row);
    }

    document.body.appendChild(sidebarEl);
}

function createRow(name: string): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText =
        'display:flex;gap:3px;flex-wrap:wrap;justify-content:center;' +
        'padding:8px 4px;border-radius:6px;' +
        'transition:background 0.4s;';

    for (const ch of name) {
        const cell = document.createElement('span');
        if (ch === ' ') {
            cell.style.cssText = 'width:10px;';
        } else {
            cell.style.cssText =
                'width:26px;height:30px;display:inline-flex;align-items:center;' +
                'justify-content:center;border:2px solid rgba(255,255,255,0.25);' +
                'border-radius:4px;color:transparent;font-size:14px;font-weight:700;' +
                'font-family:monospace;text-transform:uppercase;' +
                'transition:all 0.25s ease;background:rgba(255,255,255,0.05);';
            cell.textContent = ch;
        }
        row.appendChild(cell);
    }
    return row;
}

export function revealLocation(index: number): Promise<void> {
    return new Promise((resolve) => {
        const row = rowEls[index];
        if (!row) {
            resolve();
            return;
        }

        row.style.background = 'rgba(76,175,80,0.15)';

        const cells = row.querySelectorAll('span');
        let delay = 0;
        let lastLetterDelay = 0;

        cells.forEach((cell) => {
            const span = cell as HTMLSpanElement;
            if (!span.textContent || span.style.width === '10px') return;

            lastLetterDelay = delay;
            setTimeout(() => {
                span.style.color = '#fff';
                span.style.borderColor = 'rgba(76,175,80,0.8)';
                span.style.background = 'rgba(76,175,80,0.35)';
                span.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    span.style.transform = 'scale(1)';
                }, 150);
            }, delay);

            delay += 50;
        });

        setTimeout(resolve, lastLetterDelay + 200);
    });
}

export function updateCounter(found: number, total: number): void {
    if (counterEl) {
        counterEl.textContent = `${found} / ${total} found`;
    }
}

export function showCompletion(): void {
    if (!sidebarEl) return;

    const banner = document.createElement('div');
    banner.style.cssText =
        'color:#4CAF50;font-size:18px;font-weight:700;text-align:center;' +
        'padding:16px 8px;margin-top:auto;' +
        'border-top:1px solid rgba(255,255,255,0.1);';
    banner.textContent = 'Round Complete!';
    sidebarEl.appendChild(banner);
}

export function disposeSidebar(): void {
    if (sidebarEl) {
        sidebarEl.remove();
        sidebarEl = null;
        counterEl = null;
        rowEls = [];
    }
}
