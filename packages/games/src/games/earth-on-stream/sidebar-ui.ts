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

    const hintMode: HintMode = roundNumber <= 4 ? 'scrambled' : roundNumber <= 10 ? 'partial' : 'none';

    const sortedIndices = locations
        .map((_, i) => i)
        .sort((a, b) => locations[a].location.name.length - locations[b].location.name.length);

    rowEls = new Array(locations.length);
    for (const i of sortedIndices) {
        const row = createRow(locations[i].location.name, NAME_COL_WIDTH, locations[i].location.type, hintMode);
        rowEls[i] = row;
        sidebarEl.appendChild(row);
    }

    panel.appendChild(sidebarEl);
}

type HintMode = 'scrambled' | 'partial' | 'none';

function pickRevealIndices(name: string): Set<number> {
    const letterIndices: number[] = [];
    for (let i = 0; i < name.length; i++) {
        if (name[i] !== ' ') letterIndices.push(i);
    }
    const count = Math.max(1, Math.round(letterIndices.length * 0.1));
    for (let i = letterIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letterIndices[i], letterIndices[j]] = [letterIndices[j], letterIndices[i]];
    }
    return new Set(letterIndices.slice(0, count));
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

function createRow(name: string, nameColWidth: number, type: LocationType, hintMode: HintMode): HTMLDivElement {
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

    const scrambled = hintMode === 'scrambled' ? scrambleName(name) : null;
    const revealed = hintMode === 'partial' ? pickRevealIndices(name) : null;

    const letters = document.createElement('div');
    letters.className = 'letter-cells';
    letters.style.cssText = 'display:flex;gap:2px;flex-wrap:nowrap;';
    let charIdx = 0;
    for (const ch of name) {
        const cell = document.createElement('span');
        if (ch === ' ') {
            cell.style.cssText = 'width:10px;';
        } else {
            const isRevealed = revealed?.has(charIdx);
            const displayCh = scrambled ? scrambled[charIdx] : ch;
            const color = scrambled ? 'color:rgba(255,255,255,0.4);'
                : isRevealed ? 'color:rgba(255,255,255,0.5);'
                : 'color:transparent;';
            cell.style.cssText =
                'width:26px;height:30px;flex:0 0 26px;display:inline-flex;align-items:center;' +
                'justify-content:center;border:2px solid rgba(255,255,255,0.25);' +
                'border-radius:4px;font-size:14px;font-weight:700;' +
                'font-family:monospace;text-transform:uppercase;' +
                'transition:all 0.25s ease;background:rgba(255,255,255,0.05);' + color;
            cell.textContent = displayCh;
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
        row.style.borderLeft = '';
        row.dataset.guessed = '1';
        if (index === highlightedIndex && focusEl) focusEl.style.opacity = '0';

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

let highlightedIndex = -1;
let focusEl: HTMLDivElement | null = null;

function updateFocusDisplay(index: number): void {
    const row = rowEls[index];
    if (!row || row.dataset.guessed) {
        if (focusEl) focusEl.style.opacity = '0';
        return;
    }

    if (!focusEl) {
        const parent = document.getElementById('globe-area');
        if (!parent) return;
        focusEl = document.createElement('div');
        focusEl.style.cssText =
            'position:absolute;top:56px;left:50%;transform:translateX(-50%);z-index:55;' +
            'display:flex;flex-direction:column;align-items:center;gap:6px;' +
            'padding:12px 20px;border-radius:12px;' +
            'background:rgba(10,10,20,0.8);backdrop-filter:blur(8px);' +
            'border:1px solid rgba(255,255,255,0.15);' +
            'box-shadow:0 4px 20px rgba(0,0,0,0.5);' +
            'transition:opacity 0.25s;pointer-events:none;';
        parent.appendChild(focusEl);
    }

    focusEl.style.opacity = '1';

    const typeLabel = row.querySelector('div')!;
    const letterCells = row.querySelector('.letter-cells')!;

    focusEl.innerHTML = '';

    const typeClone = document.createElement('div');
    typeClone.style.cssText =
        'font-size:14px;font-weight:600;text-transform:uppercase;' +
        'letter-spacing:1px;color:#999;';
    typeClone.textContent = typeLabel.textContent;
    focusEl.appendChild(typeClone);

    const cellsClone = letterCells.cloneNode(true) as HTMLElement;
    cellsClone.style.cssText = 'display:flex;gap:4px;flex-wrap:nowrap;';
    const clonedCells = Array.from(cellsClone.querySelectorAll('span'));
    for (const span of clonedCells) {
        if (span.style.width === '10px') {
            span.style.width = '20px';
        } else if (span.dataset.real) {
            span.style.width = '52px';
            span.style.height = '60px';
            span.style.flex = '0 0 52px';
            span.style.fontSize = '28px';
        }
    }
    focusEl.appendChild(cellsClone);
}

export function highlightRow(index: number): void {
    if (highlightedIndex >= 0 && rowEls[highlightedIndex]) {
        const prev = rowEls[highlightedIndex];
        if (!prev.dataset.guessed) {
            prev.style.background = '';
            prev.style.borderLeft = '';
        }
    }
    highlightedIndex = index;
    const row = rowEls[index];
    if (row && !row.dataset.guessed) {
        row.style.background = 'rgba(255,255,255,0.07)';
        row.style.borderLeft = '3px solid rgba(255,255,255,0.5)';
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    updateFocusDisplay(index);
}

export function disposeSidebar(): void {
    if (sidebarEl) {
        sidebarEl.remove();
        sidebarEl = null;
        roundLabelEl = null;
        scoreEl = null;
        counterEl = null;
        rowEls = [];
        highlightedIndex = -1;
    }
    if (focusEl) {
        focusEl.remove();
        focusEl = null;
    }
    const panel = document.getElementById('side-panel');
    if (panel) panel.style.width = '0';
}
