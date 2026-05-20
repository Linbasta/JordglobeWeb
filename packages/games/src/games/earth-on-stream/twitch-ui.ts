const TWITCH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`;

let containerEl: HTMLDivElement | null = null;

export interface TwitchUICallbacks {
    onConnect: () => void;
    onDisconnect: () => void;
}

let callbacks: TwitchUICallbacks | null = null;

export function createTwitchUI(cbs: TwitchUICallbacks): void {
    disposeTwitchUI();
    callbacks = cbs;

    containerEl = document.createElement('div');
    containerEl.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:50;';

    document.body.appendChild(containerEl);
    renderDisconnected();
}

export function setTwitchConnected(channel: string): void {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const pill = document.createElement('div');
    pill.style.cssText =
        'display:inline-flex;align-items:center;gap:8px;' +
        'padding:8px 16px;border-radius:20px;' +
        'background:rgba(10,10,20,0.8);color:#fff;' +
        'font-family:system-ui,sans-serif;font-size:13px;' +
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
        'border:1px solid rgba(145,70,255,0.3);';

    const dot = document.createElement('span');
    dot.style.cssText =
        'width:8px;height:8px;border-radius:50%;background:#4CAF50;flex-shrink:0;';
    pill.appendChild(dot);

    const label = document.createElement('span');
    label.innerHTML = `${TWITCH_ICON}${channel}`;
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
    disconnectBtn.onclick = () => callbacks?.onDisconnect();
    pill.appendChild(disconnectBtn);

    containerEl.appendChild(pill);
}

export function setTwitchDisconnected(): void {
    if (!containerEl) return;
    renderDisconnected();
}

export function disposeTwitchUI(): void {
    if (containerEl) {
        containerEl.remove();
        containerEl = null;
    }
    callbacks = null;
}

function renderDisconnected(): void {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const btn = document.createElement('button');
    btn.style.cssText =
        'display:inline-flex;align-items:center;gap:6px;' +
        'padding:12px 24px;border:none;border-radius:24px;' +
        'background:#9146FF;color:#fff;font-size:15px;font-weight:600;' +
        'cursor:pointer;font-family:system-ui,sans-serif;' +
        'transition:transform 0.15s,background 0.15s;';
    btn.innerHTML = `${TWITCH_ICON}Connect to Twitch`;
    btn.onmouseenter = () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.background = '#7c3aed';
    };
    btn.onmouseleave = () => {
        btn.style.transform = 'scale(1)';
        btn.style.background = '#9146FF';
    };
    btn.onclick = () => callbacks?.onConnect();

    containerEl.appendChild(btn);
}
