import type { RoundLocation } from './game-state';
import type { LocationType } from './locations';

let sidebarEl: HTMLDivElement | null = null;
let roundLabelEl: HTMLDivElement | null = null;
let scoreEl: HTMLDivElement | null = null;
let counterEl: HTMLDivElement | null = null;
let rowEls: HTMLDivElement[] = [];

export function createSidebar(locations: RoundLocation[], roundNumber: number, roundGoal: number): void {
    disposeSidebar();

    const NAME_COL_WIDTH = 100;
    const maxRowWidth = Math.max(...locations.map((rl) => {
        const name = rl.location.name;
        const chars = [...name];
        let width = 0;
        for (const ch of chars) {
            width += ch === ' ' ? 10 : 30;
        }
        width += (chars.length - 1) * 2;
        return width;
    }));
    const sidebarWidth = NAME_COL_WIDTH + maxRowWidth + 56;

    const panel = document.getElementById('side-panel')!;
    panel.style.width = `${sidebarWidth}px`;

    sidebarEl = document.createElement('div');
    sidebarEl.style.cssText =
        'height:100%;background:rgba(10,10,20,0.85);' +
        'display:flex;flex-direction:column;padding:16px 12px;' +
        'box-sizing:border-box;gap:10px;overflow-y:auto;' +
        'font-family:system-ui,-apple-system,sans-serif;';

    roundLabelEl = document.createElement('div');
    roundLabelEl.style.cssText =
        'color:#fff;font-size:16px;font-weight:700;text-align:center;' +
        'text-transform:uppercase;letter-spacing:1px;';
    roundLabelEl.textContent = `Round ${roundNumber}`;
    sidebarEl.appendChild(roundLabelEl);

    scoreEl = document.createElement('div');
    scoreEl.style.cssText =
        'color:#4CAF50;font-size:20px;font-weight:700;text-align:center;';
    updateScore(0, roundGoal);
    sidebarEl.appendChild(scoreEl);

    counterEl = document.createElement('div');
    counterEl.style.cssText =
        'color:#aaa;font-size:13px;text-align:center;padding-bottom:8px;' +
        'border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;';
    updateCounter(0, locations.length);
    sidebarEl.appendChild(counterEl);

    const showScrambled = roundNumber <= 4;

    const sortedIndices = locations
        .map((_, i) => i)
        .sort((a, b) => locations[a].location.name.length - locations[b].location.name.length);

    rowEls = new Array(locations.length);
    for (const i of sortedIndices) {
        const row = createRow(locations[i].location.name, NAME_COL_WIDTH, locations[i].location.type, showScrambled);
        rowEls[i] = row;
        sidebarEl.appendChild(row);
    }

    panel.appendChild(sidebarEl);
}

function scrambleName(name: string): string {
    const words = name.split(' ');
    return words
        .map((word) => {
            const chars = [...word];
            for (let i = chars.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join('');
        })
        .join(' ');
}

function createRow(name: string, nameColWidth: number, type: LocationType, showScrambled: boolean): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText =
        'display:flex;flex-direction:column;gap:2px;' +
        'padding:8px 4px;border-radius:6px;' +
        'transition:background 0.4s;';

    const typeLabel = document.createElement('div');
    typeLabel.style.cssText =
        `margin-left:${nameColWidth}px;font-size:9px;font-weight:600;` +
        'text-transform:uppercase;letter-spacing:0.8px;color:#666;';
    typeLabel.textContent = type === 'landmark' ? 'Landmark' : 'City';
    row.appendChild(typeLabel);

    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex;flex-wrap:nowrap;align-items:center;';

    const nameSlot = document.createElement('span');
    nameSlot.className = 'name-slot';
    nameSlot.style.cssText =
        `width:${nameColWidth}px;flex:0 0 ${nameColWidth}px;` +
        'color:transparent;font-size:12px;font-weight:600;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    inner.appendChild(nameSlot);

    const scrambled = showScrambled ? scrambleName(name) : null;

    const letters = document.createElement('div');
    letters.className = 'letter-cells';
    letters.style.cssText = 'display:flex;gap:2px;flex-wrap:nowrap;';
    let charIdx = 0;
    for (const ch of name) {
        const cell = document.createElement('span');
        if (ch === ' ') {
            cell.style.cssText = 'width:10px;';
        } else {
            const scrambledCh = scrambled ? scrambled[charIdx] : ch;
            cell.style.cssText =
                'width:26px;height:30px;flex:0 0 26px;display:inline-flex;align-items:center;' +
                'justify-content:center;border:2px solid rgba(255,255,255,0.25);' +
                'border-radius:4px;font-size:14px;font-weight:700;' +
                'font-family:monospace;text-transform:uppercase;' +
                'transition:all 0.25s ease;background:rgba(255,255,255,0.05);' +
                (scrambled ? 'color:rgba(255,255,255,0.4);' : 'color:transparent;');
            cell.textContent = scrambledCh;
            cell.dataset.real = ch;
        }
        charIdx++;
        letters.appendChild(cell);
    }
    inner.appendChild(letters);
    row.appendChild(inner);

    return row;
}

export function revealLocation(index: number, username: string): Promise<void> {
    return new Promise((resolve) => {
        const row = rowEls[index];
        if (!row) {
            resolve();
            return;
        }

        row.style.background = 'rgba(76,175,80,0.15)';

        const lettersDiv = row.querySelector('.letter-cells')!;
        const cells = lettersDiv.querySelectorAll('span');
        let delay = 0;
        let lastLetterDelay = 0;

        cells.forEach((cell) => {
            const span = cell as HTMLSpanElement;
            if (!span.dataset.real || span.style.width === '10px') return;

            lastLetterDelay = delay;
            setTimeout(() => {
                span.textContent = span.dataset.real!;
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

        setTimeout(() => {
            const nameSlot = row.querySelector('.name-slot') as HTMLSpanElement;
            if (nameSlot) {
                nameSlot.textContent = username;
                nameSlot.style.color = '#4CAF50';
            }
            resolve();
        }, lastLetterDelay + 200);
    });
}

export function updateScore(score: number, goal: number): void {
    if (scoreEl) {
        scoreEl.textContent = `${score} / ${goal}`;
        if (score >= goal) {
            scoreEl.style.color = '#4CAF50';
        } else {
            scoreEl.style.color = score > 0 ? '#fff' : '#888';
        }
    }
}

export function updateCounter(found: number, total: number): void {
    if (counterEl) {
        counterEl.textContent = `${found} / ${total} found`;
    }
}

export function disposeSidebar(): void {
    if (sidebarEl) {
        sidebarEl.remove();
        sidebarEl = null;
        roundLabelEl = null;
        scoreEl = null;
        counterEl = null;
        rowEls = [];
    }
    const panel = document.getElementById('side-panel');
    if (panel) panel.style.width = '0';
}
