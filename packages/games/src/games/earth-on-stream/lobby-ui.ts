import type { Continent } from './locations';

export interface LobbyOptions {
    onStart: (continent: Continent) => void;
    defaultContinent?: Continent;
    getHighestRound?: (continent: Continent) => number;
}

const CONTINENT_LABELS: Record<Continent, string> = {
    'world': 'World',
    'europe': 'Europe',
    'asia': 'Asia',
    'africa': 'Africa',
    'north-america': 'N. America',
    'south-america': 'S. America',
    'oceania': 'Oceania',
};

let overlayEl: HTMLDivElement | null = null;

export function showLobby(opts: LobbyOptions): void {
    disposeLobby();

    let selected: Continent = opts.defaultContinent ?? 'world';

    overlayEl = document.createElement('div');
    overlayEl.style.cssText =
        'position:fixed;inset:0;z-index:100;display:flex;align-items:center;' +
        'justify-content:center;background:rgba(0,0,0,0.6);' +
        'font-family:system-ui,-apple-system,sans-serif;';

    const card = document.createElement('div');
    card.style.cssText =
        'background:rgba(20,20,30,0.95);border-radius:16px;padding:40px 48px;' +
        'text-align:center;color:#fff;min-width:400px;max-width:540px;' +
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
        'border:1px solid rgba(255,255,255,0.1);';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:32px;font-weight:700;margin-bottom:8px;color:#fff;';
    title.textContent = 'Earth on Stream';
    card.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:14px;color:#888;margin-bottom:32px;';
    subtitle.textContent = 'Choose a region';
    card.appendChild(subtitle);

    const chipContainer = document.createElement('div');
    chipContainer.style.cssText =
        'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px;';

    const chips: HTMLButtonElement[] = [];

    for (const [continent, label] of Object.entries(CONTINENT_LABELS)) {
        const chip = document.createElement('button');
        chip.style.cssText =
            'padding:8px 18px;border-radius:20px;font-size:14px;font-weight:500;' +
            'cursor:pointer;transition:all 0.15s;font-family:system-ui,sans-serif;';
        chip.textContent = label;
        chip.dataset.continent = continent;
        chips.push(chip);

        chip.onclick = () => {
            selected = continent as Continent;
            updateChips();
            updateBest();
        };

        chipContainer.appendChild(chip);
    }

    function updateChips(): void {
        for (const chip of chips) {
            if (chip.dataset.continent === selected) {
                chip.style.background = '#4CAF50';
                chip.style.color = '#fff';
                chip.style.border = '1px solid #4CAF50';
            } else {
                chip.style.background = 'transparent';
                chip.style.color = '#ccc';
                chip.style.border = '1px solid rgba(255,255,255,0.2)';
            }
        }
    }

    const bestLine = document.createElement('div');
    bestLine.style.cssText = 'font-size:15px;color:#888;margin-bottom:24px;min-height:20px;';

    function updateBest(): void {
        if (!opts.getHighestRound) {
            bestLine.style.display = 'none';
            return;
        }
        const best = opts.getHighestRound(selected);
        if (best > 0) {
            bestLine.textContent = `Best: Round ${best}`;
            bestLine.style.color = '#4CAF50';
        } else {
            bestLine.textContent = '';
        }
    }

    updateChips();
    updateBest();
    card.appendChild(chipContainer);
    card.appendChild(bestLine);

    const startBtn = document.createElement('button');
    startBtn.style.cssText =
        'padding:14px 48px;font-size:18px;font-weight:600;border:none;' +
        'border-radius:28px;color:#fff;cursor:pointer;' +
        'background:#4CAF50;transition:transform 0.15s;' +
        'font-family:system-ui,sans-serif;';
    startBtn.textContent = 'Start Game';
    startBtn.onmouseenter = () => (startBtn.style.transform = 'scale(1.05)');
    startBtn.onmouseleave = () => (startBtn.style.transform = 'scale(1)');
    startBtn.onclick = () => {
        disposeLobby();
        opts.onStart(selected);
    };
    card.appendChild(startBtn);

    overlayEl.appendChild(card);
    document.body.appendChild(overlayEl);
}

export function disposeLobby(): void {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
    }
}
