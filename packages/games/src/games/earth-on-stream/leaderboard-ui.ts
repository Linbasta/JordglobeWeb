import type { LeaderboardEntry } from './game-state';

export interface LeaderboardOptions {
    roundNumber: number;
    score: number;
    goal: number;
    goalMet: boolean;
    players: LeaderboardEntry[];
    onAction: () => void;
}

let overlayEl: HTMLDivElement | null = null;

export function showLeaderboard(opts: LeaderboardOptions): void {
    disposeLeaderboard();

    overlayEl = document.createElement('div');
    overlayEl.style.cssText =
        'position:fixed;inset:0;z-index:100;display:flex;align-items:center;' +
        'justify-content:center;background:rgba(0,0,0,0.6);' +
        'font-family:system-ui,-apple-system,sans-serif;';

    const card = document.createElement('div');
    card.style.cssText =
        'background:rgba(20,20,30,0.95);border-radius:16px;padding:36px 44px;' +
        'text-align:center;color:#fff;min-width:380px;max-width:500px;' +
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
        'border:1px solid rgba(255,255,255,0.1);';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:26px;font-weight:700;margin-bottom:6px;';
    if (opts.goalMet) {
        title.textContent = `Round ${opts.roundNumber} Complete!`;
        title.style.color = '#4CAF50';
    } else {
        title.textContent = 'Session Over';
        title.style.color = '#f44336';
    }
    card.appendChild(title);

    const scoreLine = document.createElement('div');
    scoreLine.style.cssText = 'font-size:16px;color:#aaa;margin-bottom:24px;';
    scoreLine.textContent = `Score: ${opts.score} / ${opts.goal}`;
    card.appendChild(scoreLine);

    if (opts.players.length > 0) {
        card.appendChild(buildTable(opts.players));
    }

    const btn = document.createElement('button');
    btn.style.cssText =
        'margin-top:24px;padding:12px 32px;font-size:16px;font-weight:600;border:none;' +
        'border-radius:24px;color:#fff;cursor:pointer;transition:transform 0.15s;';
    if (opts.goalMet) {
        btn.textContent = 'Next Round';
        btn.style.background = '#4CAF50';
    } else {
        btn.textContent = 'New Session';
        btn.style.background = '#2196F3';
    }
    btn.onmouseenter = () => (btn.style.transform = 'scale(1.05)');
    btn.onmouseleave = () => (btn.style.transform = 'scale(1)');
    btn.onclick = () => {
        disposeLeaderboard();
        opts.onAction();
    };
    card.appendChild(btn);

    overlayEl.appendChild(card);
    document.body.appendChild(overlayEl);
}

function buildTable(players: LeaderboardEntry[]): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText =
        'text-align:left;border-radius:8px;overflow:hidden;' +
        'border:1px solid rgba(255,255,255,0.1);';

    const header = document.createElement('div');
    header.style.cssText =
        'display:grid;grid-template-columns:32px 1fr 80px 80px;padding:8px 12px;' +
        'background:rgba(255,255,255,0.06);font-size:11px;font-weight:600;' +
        'color:#888;text-transform:uppercase;letter-spacing:0.5px;';
    header.innerHTML = '<span>#</span><span>Player</span><span style="text-align:right">Round</span><span style="text-align:right">Total</span>';
    wrapper.appendChild(header);

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const row = document.createElement('div');
        row.style.cssText =
            'display:grid;grid-template-columns:32px 1fr 80px 80px;padding:8px 12px;' +
            'font-size:14px;border-top:1px solid rgba(255,255,255,0.05);';

        if (i === 0) {
            row.style.background = 'rgba(76,175,80,0.1)';
        }

        const rank = document.createElement('span');
        rank.style.cssText = 'color:#888;font-weight:600;';
        rank.textContent = `${i + 1}`;

        const name = document.createElement('span');
        name.style.cssText = 'font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        name.textContent = p.username;
        if (i === 0) name.style.color = '#4CAF50';

        const roundPts = document.createElement('span');
        roundPts.style.cssText = 'text-align:right;color:#ccc;';
        roundPts.textContent = `${p.roundPoints}`;

        const totalPts = document.createElement('span');
        totalPts.style.cssText = 'text-align:right;color:#fff;font-weight:600;';
        totalPts.textContent = `${p.totalPoints}`;

        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(roundPts);
        row.appendChild(totalPts);
        wrapper.appendChild(row);
    }

    return wrapper;
}

export function disposeLeaderboard(): void {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
    }
}
