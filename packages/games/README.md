# JordGlobe Games

Interactive 3D geography quiz games built with Babylon.js and TypeScript.

## Features

- 3D Earth sphere with high-resolution texture
- Interactive camera controls (drag to rotate, scroll to zoom)
- Country border visualization (tube and extruded borders)
- Neighbor detection algorithm
- TypeScript with full type safety
- Vite for fast development and hot module reload
- Real-time FPS counter
- Toggle controls for different border types

## Tech Stack

- **Babylon.js** - 3D rendering engine
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool with HMR
- **Earcut** - Polygon triangulation

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The app will open automatically at **http://localhost:4817**

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deploying the Eurovision Quiz to Firebase Hosting

The Eurovision quiz is deployed standalone to the `jordglobegl-dev` Firebase Hosting site (within the `geotest-319417` project), served from a Firebase custom domain at **https://eurovision.jordglobe.com/** (default Firebase URL: `https://jordglobegl-dev.web.app/`).

The deploy artifact lives in a self-contained `dist-eurovision/` folder, populated from an explicit allow-list of files defined in `scripts/build-eurovision-deploy.mjs`. This ensures only the files Eurovision actually needs are uploaded — adding new quizzes or assets to the project won't accidentally leak into this deploy.

### One-time setup

```bash
npm install -g firebase-tools
firebase login
firebase projects:list   # confirm geotest-319417 is listed
```

The custom domain `eurovision.jordglobe.com` is configured in Firebase Console → Hosting → `jordglobegl-dev` site → Add custom domain. Requires a TXT record for verification and an A record (Firebase provides exact values). SSL is auto-provisioned.

### Deploy

```bash
npm run deploy:firebase
```

This runs `npm run build:eurovision-deploy` (which injects SEO meta tags, builds the page, and stages `dist-eurovision/`) and then `firebase deploy --only hosting`. The site goes live at https://eurovision.jordglobe.com/ (custom domain) and https://jordglobegl-dev.web.app/ (default Firebase URL).

### Preview channel (optional)

To test on a temporary URL without touching the live site:

```bash
npm run build:eurovision-deploy
firebase hosting:channel:deploy preview-eurovision
```

Firebase prints a preview URL that's isolated from production and expires after 7 days by default.

### Adding a new asset to the deploy

If a runtime 404 appears in DevTools after a deploy, the missing file isn't in the allow-list. Add it to `ALLOW_LIST` in `scripts/build-eurovision-deploy.mjs` and re-run `npm run deploy:firebase`. The build script also runs a drift check on the JS bundle and warns about asset references it doesn't recognize.

### Firestore note

Quiz records are written to Firestore in the same `geotest-319417` project (database `webversion`, collection `records/eurovision`). No separate Firestore setup is needed for the Firebase Hosting deploy — the client SDK config in `src/shared/firebase.ts` is already correct.

### SEO

The Eurovision page has its own canonical URL (`https://eurovision.jordglobe.com/`) configured via the `baseUrlOverride` field in `seo-config.ts`. The deploy generates a small `sitemap.xml` and `robots.txt` scoped to the subdomain — these are NOT the shared `jordglobe.com` versions in `public/`. The `inject-seo` script runs automatically as part of `npm run build:eurovision-deploy` and rewrites the meta tags + `<title>` in `eurovision.html` from `seo-config.ts`.

### Run Neighbor Detection Test

Test the neighbor detection algorithm from CLI:

```bash
npm test
```

## Project Structure

```
packages/games/
├── src/
│   ├── main.ts              # Main application code
│   └── types/
│       └── earcut.d.ts      # Type definitions for earcut
├── public/
│   ├── 4K_WorldTexture.png  # Earth texture
│   └── countries.json       # Country boundary data
├── index.html               # Entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Controls

- **Mouse Drag**: Rotate camera around the Earth
- **Mouse Wheel**: Zoom in/out
- **Touch**: Full touch support on mobile devices
- **UI Toggles**: Enable/disable tube borders and extruded borders

## How It Works

1. The application loads the Earth texture and creates a sphere mesh
2. Country data is loaded from `countries.json` containing lat/lon coordinates
3. For each country:
   - Coordinates are converted from lat/lon to 3D sphere surface points
   - Polygons are triangulated using the Earcut algorithm
   - Custom meshes are created and positioned on the sphere
   - Each country is assigned a unique color for visibility
   - Border lines (tubes) and extruded borders (3D walls) are created
4. After all countries are loaded, neighbor detection runs:
   - Countries sharing border points are identified
   - Neighbor indices are stored in each country's data
5. The camera allows orbital rotation and zoom controls

## Neighbor Detection

Countries are analyzed to detect neighbors based on shared border points. Access neighbor data in the browser console:

```javascript
// After page loads, access the globe instance
earthGlobe.countriesData[0].neighbour_indices  // Array of neighbor indices
```

### Programmatic Border Control

Disable specific country borders:

```javascript
// Disable extruded border for country at index 5
earthGlobe.countriesData[5].extrudedBorder?.setEnabled(false);

// Disable all borders for a country and its neighbors
const countryIndex = 184; // China
earthGlobe.countriesData[countryIndex].extrudedBorder?.setEnabled(false);
earthGlobe.countriesData[countryIndex].neighbour_indices.forEach(i => {
    earthGlobe.countriesData[i].extrudedBorder?.setEnabled(false);
});
```

## Data Format

The `countries.json` file contains country data in the following format:
```json
[
  {
    "iso2": "US",
    "name": "United States",
    "name_en": "United States",
    "continent": "North America",
    "is_sovereign": true,
    "paths": "[[[lat1,lon1],[lat2,lon2],...]]"
  }
]
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Texture not loading
Make sure `4K_WorldTexture.png` is in the same directory as `index.html`.

### Countries not appearing
Check the browser console for errors. Make sure `countries.json` is accessible and properly formatted.

### Blank page
1. Open browser console (F12) to check for errors
2. Make sure you're using a local web server (not opening file directly)
3. Clear browser cache and reload

### Performance issues
If the application runs slowly:
- Try using a smaller texture file
- Reduce the number of countries loaded
- Close other browser tabs

## License

This is a demonstration project. Feel free to use and modify as needed.
