# JordGlobe Games

Interactive 3D geography quiz games built with Babylon.js, TypeScript, and Astro.

## Tech Stack

- **Babylon.js** - 3D rendering engine
- **TypeScript** - Type-safe JavaScript
- **Astro** - Static site generator with component islands
- **Firebase** - Analytics and Firestore for records

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Start the Astro dev server:

```bash
pnpm dev:games
```

The app runs at **http://localhost:4818/games/**

### Build for Production

```bash
pnpm build:games
```

Output in `dist/`. The build script (`scripts/build-prod.sh`) automatically excludes dev pages.

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
packages/games/
├── src/
│   ├── games/              # Production games
│   │   └── [id]/
│   │       ├── manifest.ts
│   │       ├── GameRoot.astro
│   │       ├── i18n.ts
│   │       └── assets/
│   ├── experiments/        # WIP games (dev-only)
│   ├── dev-tests/          # Test pages (dev-only)
│   ├── pages/              # Astro routes
│   ├── layouts/            # Astro layouts
│   ├── earth-globe/        # Globe rendering engine
│   ├── solo/               # Solo quiz game logic
│   ├── party/              # Multiplayer game logic
│   └── shared/             # Shared utilities
├── public-prod/            # Production assets (ships to prod)
├── public-dev/             # Dev-only assets
├── scripts/                # Build and utility scripts
└── astro.config.mjs        # Astro configuration
```

## Adding a New Game

1. Create `src/games/[id]/` with:
   - `manifest.ts` - Game metadata (`id`, `published`, `image`, `i18n`, `locales`)
   - `GameRoot.astro` - Canvas and bootstrap script
   - `i18n.ts` - Translations
   - `assets/` - Game-specific assets (use `?url` imports)

2. Register in `src/games/manifests.ts`

3. Add OG image to `public-prod/[id]/`

4. Set `published: true` when ready for production

## URLs

- Production games: `/games/[id]/`
- Experiments (dev): `/games/experiments/[id]/`
- Test pages (dev): `/games/dev/test/[name]/`

## Controls

- **Mouse Drag**: Rotate camera around the Earth
- **Mouse Wheel**: Zoom in/out
- **Touch**: Full touch support on mobile devices

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
