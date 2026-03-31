const GAMES = [
    { id: 'us-states-quiz', title: 'US States Quiz', description: 'Find all 50 US states on the map', url: '/medals#133-united-states-of-america-states' },
    { id: 'flag-quiz', title: 'Flags of the World', description: 'Identify countries by their flags', url: '/medals#189-the-world-flags' },
    { id: 'country-quiz', title: 'Countries of the World', description: 'Test your geography knowledge', url: '/medals#64-the-world-countries' },
    { id: 'eurovision', title: 'Eurovision', description: 'Guess which country each Eurovision song represents', url: '/eurovision.html' },
];

// Module state
let userId = '';
let scores: Record<string, number> = {};
let userVotes: Record<string, number> = {};

function getUserId(): string {
    const KEY = 'minigames_user_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
    }
    return id;
}

async function fetchVotes(): Promise<void> {
    const res = await fetch(`/api/votes?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();
    scores = data.scores;
    userVotes = data.userVotes;
}

async function submitVote(gameId: string, vote: number): Promise<void> {
    const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, user_id: userId, vote }),
    });
    const data = await res.json();
    scores[gameId] = data.score;
}

function handleVote(gameId: string, direction: 1 | -1): void {
    const current = userVotes[gameId] ?? 0;
    // Toggle: if same direction, go to 0; otherwise set new direction
    const newVote = current === direction ? 0 : direction;
    const oldScore = scores[gameId] ?? 0;

    // Optimistic update
    userVotes[gameId] = newVote;
    scores[gameId] = oldScore - current + newVote;
    renderCards();

    // Fire and forget, then reconcile with server score
    submitVote(gameId, newVote).then(() => renderCards());
}

function createCard(game: typeof GAMES[number]): HTMLElement {
    const card = document.createElement('div');
    card.className = 'game-card';

    const score = scores[game.id] ?? 0;
    const vote = userVotes[game.id] ?? 0;

    card.innerHTML = `
        <div class="vote-section">
            <button class="vote-btn ${vote === 1 ? 'active-up' : ''}" data-game="${game.id}" data-dir="1">\u25B2</button>
            <span class="vote-score">${score}</span>
            <button class="vote-btn ${vote === -1 ? 'active-down' : ''}" data-game="${game.id}" data-dir="-1">\u25BC</button>
        </div>
        <div class="game-info">
            <div class="game-title">${game.title}</div>
            <div class="game-description">${game.description}</div>
            <a class="play-link" href="${game.url}">Play</a>
        </div>
    `;

    // Wire up vote buttons
    card.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const el = e.currentTarget as HTMLElement;
            const gameId = el.dataset.game!;
            const dir = Number(el.dataset.dir) as 1 | -1;
            handleVote(gameId, dir);
        });
    });

    return card;
}

function renderCards(): void {
    const list = document.querySelector('.game-list')!;
    list.innerHTML = '';

    // Sort by score descending, then by original order for ties
    const sorted = [...GAMES].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

    for (const game of sorted) {
        list.appendChild(createCard(game));
    }
}

async function init(): Promise<void> {
    userId = getUserId();
    await fetchVotes();
    renderCards();
}

init();
