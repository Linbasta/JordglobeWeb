import type { Continent } from './locations';
import { TWITCH_ICON } from './twitch-ui';

export interface LobbyOptions {
    onStart: (continent: Continent) => void;
    defaultContinent?: Continent;
    getHighestRound?: (continent: Continent) => number;
    twitchConnected: boolean;
    twitchChannel?: string;
    onTwitchConnect: () => void;
    onTwitchDisconnect: () => void;
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

    const connected = opts.twitchConnected;
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
    title.style.cssText = 'font-size:32px;font-weight:700;margin-bottom:16px;color:#fff;';
    title.textContent = 'Earth on Stream';
    card.appendChild(title);

    // --- Twitch section ---
    const twitchSection = document.createElement('div');
    twitchSection.style.cssText = 'margin-bottom:24px;';

    if (connected && opts.twitchChannel) {
        const pill = document.createElement('div');
        pill.style.cssText =
            'display:inline-flex;align-items:center;gap:8px;' +
            'padding:8px 16px;border-radius:20px;' +
            'background:rgba(10,10,20,0.8);color:#fff;' +
            'font-size:13px;' +
            'border:1px solid rgba(145,70,255,0.3);';

        const dot = document.createElement('span');
        dot.style.cssText =
            'width:8px;height:8px;border-radius:50%;background:#4CAF50;flex-shrink:0;';
        pill.appendChild(dot);

        const label = document.createElement('span');
        label.innerHTML = `${TWITCH_ICON}${opts.twitchChannel}`;
        pill.appendChild(label);

        const sep = document.createElement('span');
        sep.style.cssText = 'width:1px;height:14px;background:rgba(255,255,255,0.2);';
        pill.appendChild(sep);

        const disconnectBtn = document.createElement('button');
        disconnectBtn.textContent = 'Disconnect';
        disconnectBtn.style.cssText =
            'background:none;border:none;color:rgba(255,255,255,0.5);' +
            'font-size:12px;cursor:pointer;padding:0;font-family:system-ui,sans-serif;';
        disconnectBtn.onmouseenter = () => (disconnectBtn.style.color = '#f44336');
        disconnectBtn.onmouseleave = () => (disconnectBtn.style.color = 'rgba(255,255,255,0.5)');
        disconnectBtn.onclick = () => {
            opts.onTwitchDisconnect();
            disposeLobby();
            showLobby({ ...opts, twitchConnected: false, twitchChannel: undefined });
        };
        pill.appendChild(disconnectBtn);

        twitchSection.appendChild(pill);
    } else {
        const connectBtn = document.createElement('button');
        connectBtn.style.cssText =
            'display:inline-flex;align-items:center;gap:6px;' +
            'padding:12px 24px;border:none;border-radius:24px;' +
            'background:#9146FF;color:#fff;font-size:15px;font-weight:600;' +
            'cursor:pointer;font-family:system-ui,sans-serif;' +
            'transition:transform 0.15s,background 0.15s;';
        connectBtn.innerHTML = `${TWITCH_ICON}Connect to Twitch`;
        connectBtn.onmouseenter = () => {
            connectBtn.style.transform = 'scale(1.05)';
            connectBtn.style.background = '#7c3aed';
        };
        connectBtn.onmouseleave = () => {
            connectBtn.style.transform = 'scale(1)';
            connectBtn.style.background = '#9146FF';
        };
        connectBtn.onclick = () => opts.onTwitchConnect();
        twitchSection.appendChild(connectBtn);

        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:13px;color:#888;margin-top:10px;';
        hint.textContent = 'Connect to Twitch to play';
        twitchSection.appendChild(hint);
    }

    card.appendChild(twitchSection);

    // --- Region section ---
    const subtitle = document.createElement('div');
    subtitle.style.cssText = `font-size:14px;color:${connected ? '#888' : '#555'};margin-bottom:16px;`;
    subtitle.textContent = 'Choose a region';
    card.appendChild(subtitle);

    const chipContainer = document.createElement('div');
    chipContainer.style.cssText =
        'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px;';

    const chips: HTMLButtonElement[] = [];

    for (const [continent, label] of Object.entries(CONTINENT_LABELS)) {
        const chip = document.createElement('button');
        chip.style.cssText =
            'padding:8px 18px;border-radius:20px;font-size:14px;font-weight:500;' +
            'transition:all 0.15s;font-family:system-ui,sans-serif;' +
            (connected ? 'cursor:pointer;' : 'cursor:not-allowed;opacity:0.4;');
        chip.textContent = label;
        chip.dataset.continent = continent;
        chip.disabled = !connected;
        chips.push(chip);

        chip.onclick = () => {
            if (!connected) return;
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
                chip.style.color = connected ? '#ccc' : '#666';
                chip.style.border = '1px solid rgba(255,255,255,0.2)';
            }
        }
    }

    const bestLine = document.createElement('div');
    bestLine.style.cssText = 'font-size:15px;color:#888;margin-bottom:24px;min-height:20px;';

    function updateBest(): void {
        if (!opts.getHighestRound || !connected) {
            bestLine.textContent = '';
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
        'border-radius:28px;color:#fff;' +
        'transition:transform 0.15s;' +
        'font-family:system-ui,sans-serif;' +
        (connected
            ? 'background:#4CAF50;cursor:pointer;'
            : 'background:#555;cursor:not-allowed;opacity:0.5;');
    startBtn.textContent = 'Start Game';
    startBtn.disabled = !connected;
    if (connected) {
        startBtn.onmouseenter = () => (startBtn.style.transform = 'scale(1.05)');
        startBtn.onmouseleave = () => (startBtn.style.transform = 'scale(1)');
    }
    startBtn.onclick = () => {
        if (!connected) return;
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
