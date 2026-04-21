# Party Server

WebSocket server for JordGlobe party/multiplayer games. Deployed separately to Cloud Run.

## Architecture

```
Static Client (Firebase Hosting)  <-->  Party Server (Cloud Run)
       /games/party/*                    wss://party-server.run.app
```

## Development

```bash
# From monorepo root
pnpm dev:party

# Or from this directory
npm run dev
```

Dev server runs on `ws://localhost:3003`

## Production

```bash
npm start
```

Production server runs on port 8080 (or `$PORT` env var).

## Cloud Run Deployment

```bash
# Build and deploy
gcloud run deploy party-server \
  --source . \
  --region europe-north1 \
  --allow-unauthenticated \
  --min-instances 1
```

Set `--min-instances 1` to avoid WebSocket disconnections from cold starts.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `BASIC_AUTH_USER` | Optional basic auth username | - |
| `BASIC_AUTH_PASSWORD` | Optional basic auth password | - |

## API Endpoints

### REST
- `GET /health` - Health check
- `GET /api/votes?user_id=X` - Get votes
- `POST /api/vote` - Submit vote
- `GET /api/record?quiz_id=X` - Get record
- `POST /api/record` - Submit record

### WebSocket Messages

**Client -> Server:**
- `host-connect` - Host connects, optionally sends `joinUrl`
- `join { name }` - Player joins with username
- `start-game { maxRounds }` - First player starts game
- `submit-answer { lat, lng }` - Submit answer
- `next-round` - First player advances round
- `reset-game` - Reset all state

**Server -> Client:**
- `host-info { joinUrl, players }` - Host connection info
- `joined { name, isFirst, players }` - Player joined
- `player-list { players }` - Updated player list
- `game-start { maxRounds }` - Game started
- `question { question, round, maxRounds }` - New question
- `player-answered { playerName }` - Player submitted answer
- `reveal { correct, results, players }` - Round results
- `final-results { players }` - Game over

## File Structure

```
src/
├── server.mjs      # Production server
├── dev.mjs         # Development server
├── database.mjs    # SQLite persistence
└── data/
    ├── cities.mjs  # City locations + distance calc
    └── videos.mjs  # Eurovision video data
```
