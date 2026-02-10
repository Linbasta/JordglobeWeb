# Province Implementation Plan

## Context

We're adding provinces (states/regions) to the Babylon.js globe. The goal is both visual display (province borders visible when zoomed in) and quiz mode (identify provinces by clicking). Province polygon data will be exported from our existing Unity project. ~50 major countries will have province data.

The current system renders countries as merged triangulated meshes with per-vertex `countryIndex` attributes. An animation texture (1024x1) stores RGBA state per country. Borders are tube meshes. A grid-based picker handles hit detection.

---

## Phase 1: Data Pipeline

**Goal**: Get province polygon data into the project and generate province border segments.

### 1a. Define province data format

Create `public/provinces/{ISO2}.json` — one file per country:
```json
{
  "country": "US",
  "provinces": [
    { "id": "US-CA", "name": "California", "paths": "[[[lat,lon],...],...]" }
  ]
}
```
`paths` uses the same JSON-stringified polygon format as `countries-enriched.json`.

### 1b. Export from Unity

Write `scripts/export-provinces.ts` to convert the Unity export into per-country JSON files. The exact converter depends on what format the Unity export produces — likely a JSON dump of `LocationM` objects with `Id`, `Name`, `CountryCodes`, `Paths`.

### 1c. Generate province segments

Write `scripts/generate-province-segments.ts` — reuses the edge-matching algorithm from `scripts/generate-segments.ts` but operates within one country's provinces. Output: `public/province-segments/{ISO2}.json` with same segment format (but `provinces` field instead of `countries`).

### 1d. CLI test

Write `scripts/test-province-data.ts` — loads one province file, prints polygon counts, runs segment generation, verifies output.

**Files to create:**
- `scripts/export-provinces.ts`
- `scripts/generate-province-segments.ts`
- `scripts/test-province-data.ts`
- `public/provinces/` directory
- `public/province-segments/` directory

**Verify**: `npm run test:province-data` prints stats for a sample country.

---

## Phase 2: Province Renderer

**Goal**: Load province data on demand, triangulate, create meshes, render on the globe.

### 2a. Types

Add to `src/earth-globe/types.ts`:
```typescript
interface ProvinceJSON {
    id: string;       // "US-CA"
    name: string;
    paths: string;    // same format as CountryJSON.paths
}

interface ProvinceFileJSON {
    country: string;
    provinces: ProvinceJSON[];
}
```

### 2b. Province renderer module

Create `src/earth-globe/province-renderer.ts` with module-level state:

```
ProvinceState (per loaded country):
  - countryISO2: string
  - provinces: array of { id, name, localIndex, polygonIndices }
  - mergedMesh: Mesh | null         (all province surfaces)
  - mergedSegments: Mesh | null     (province border tubes)
  - animationTexture: AnimationTexture (separate, 256-wide)
  - picker: CountryPicker           (reuse existing class)
```

Key functions:
- `loadProvinces(scene, iso2)` — fetch JSON, triangulate polygons using existing CDT2D pipeline, create per-province meshes, merge into single mesh with `provinceIndex` vertex attribute, create province border tubes, set up picker
- `disposeProvinces(state)` — dispose all meshes and textures
- `showProvinces(state)` / `hideProvinces(state)` — toggle visibility

Province meshes render at `COUNTRY_ALTITUDE + 0.001` (tiny offset above country surface to avoid Z-fighting). Province borders use thinner tubes (`PROVINCE_TUBE_RADIUS = 0.001`).

Reuses existing infrastructure:
- `triangulation.ts` — CDT2D triangulation (same as countries)
- `geo-math.ts` — latLonToSphere coordinate conversion
- `AnimationTexture` — separate 256-wide instance for provinces
- `CountryPicker` — separate instance with province polygons
- `ShaderFactory` — same shaders, bound to province animation texture
- `CountryAnimator` — works with any AnimationTexture

### 2c. Constants

Add to `src/earth-globe/constants.ts`:
- `PROVINCE_TUBE_RADIUS = 0.001`
- `PROVINCE_ANIMATION_TEXTURE_WIDTH = 256`
- `PROVINCE_ALTITUDE_OFFSET = 0.001`

**Files to create:** `src/earth-globe/province-renderer.ts`
**Files to modify:** `src/earth-globe/types.ts`, `src/earth-globe/constants.ts`

**Verify**: CLI test triangulates provinces for one country, prints mesh stats.

---

## Phase 3: Globe Integration

**Goal**: Wire province rendering into `EarthGlobe`. Enter/exit province view.

### 3a. EarthGlobe API additions

Add to `src/earth-globe/earth-globe.ts`:

```typescript
// State
private activeProvinceState: ProvinceState | null = null;
private provinceCache: Map<string, ProvinceState> = new Map();

// Public API
enterProvinceView(iso2: string): Promise<void>
exitProvinceView(): void
isInProvinceView(): boolean
getActiveProvinceCountry(): string | null
getProvinceAt(lat, lon): { id, name, localIndex } | null
```

`enterProvinceView(iso2)` flow:
1. Exit current province view if active
2. Load provinces (or use cache)
3. Show province meshes + borders
4. Province picker becomes active

`exitProvinceView()` flow:
1. Hide province meshes + borders
2. Clear province picker state
3. Set activeProvinceState to null (keep in cache)

### 3b. Province animation API

Mirror the country animation API for provinces:
- `setProvinceAltitude / animateProvinceAltitude`
- `setProvinceState / setProvinceBlend / animateProvinceBlend`
- `showProvinceOutline / clearProvinceOutline`

These delegate to the province state's `AnimationTexture` and `CountryAnimator`.

### 3c. Province animator tick

In the render loop, tick the province animator when province view is active.

**Files to modify:** `src/earth-globe/earth-globe.ts`, `src/earth-globe/types.ts` (EarthGlobeAPI), `src/earth-globe/index.ts` (exports)

**Verify**: Browser test — click a country, call `enterProvinceView("SE")`, see province borders and meshes appear. Hover shows province names. `exitProvinceView()` cleans up.

---

## Phase 4: Quiz Integration

**Goal**: Add province question type to the quiz system.

### 4a. Province question type

Add to `src/shared/quiz/quiz-types.ts`:
```typescript
type ProvinceQuestion = {
    type: "province"
    provinceId: string      // "US-CA"
    countryISO2: string     // "US"
    prompt: string          // "Where is California?"
}

// Extend Question union
type Question = CountryQuestion | LocationQuestion | AlternativeQuestion | ProvinceQuestion
```

### 4b. Province step operations

Add new StepOp values:
- `EnterProvinceView` — enter province view for a country
- `ExitProvinceView` — return to country view
- `DisableNonGameProvinces` — gray out non-quiz provinces
- `WaitProvinceClick` — wait for province selection
- `AnimateProvinceCorrect` / `AnimateProvinceWrongReveal` / `AnimateProvinceWrongShake`

### 4c. Quiz flow

Add province question step generation in `src/shared/quiz/quiz-flow.ts`. Flow mirrors country questions:
1. EnterProvinceView (with country ISO2)
2. DisableNonGameProvinces
3. ShowQuestion
4. WaitProvinceClick
5. Correct/Wrong animation
6. ShowResult
7. ExitProvinceView (at game end or country switch)

### 4d. Quiz runner

Add handlers for province steps in `src/shared/quiz/quiz-runner.ts`. Province click handler uses `globe.getProvinceAt()` instead of `globe.getCountryAtLatLon()`.

**Files to modify:**
- `src/shared/quiz/quiz-types.ts`
- `src/shared/quiz/quiz-flow.ts`
- `src/shared/quiz/quiz-runner.ts`

**Verify**: Create a test quiz with 3-5 Swedish provinces. Full flow works: enter province view, question shown, click province, correct/wrong animation, score tracking.

---

## Phase 5: Polish

- **Province border fade**: Borders fade out when camera is far, fade in when close
- **Cache management**: Keep loaded province meshes in memory for repeat visits
- **Province outline**: Tube outline around hovered/selected province (reuse `OutlineRenderer`)
- **Camera transition**: Smooth zoom into country when entering province view
- **Mixed quiz**: Support quizzes mixing country + province questions with automatic view transitions

---

## File Summary

| New files | Purpose |
|-----------|---------|
| `scripts/export-provinces.ts` | Unity export converter |
| `scripts/generate-province-segments.ts` | Province border segment generator |
| `scripts/test-province-data.ts` | CLI data verification test |
| `src/earth-globe/province-renderer.ts` | Province mesh creation, merging, lifecycle |
| `public/provinces/*.json` | Province polygon data (~50 files) |
| `public/province-segments/*.json` | Province border segments (~50 files) |

| Modified files | Changes |
|----------------|---------|
| `src/earth-globe/types.ts` | ProvinceJSON, ProvinceFileJSON types; EarthGlobeAPI extensions |
| `src/earth-globe/constants.ts` | Province tube radius, texture width, altitude offset |
| `src/earth-globe/earth-globe.ts` | Province view entry/exit, animation API, render loop tick |
| `src/earth-globe/index.ts` | Export province types and functions |
| `src/shared/quiz/quiz-types.ts` | ProvinceQuestion, province StepOps |
| `src/shared/quiz/quiz-flow.ts` | Province question step generation |
| `src/shared/quiz/quiz-runner.ts` | Province step execution handlers |
| `package.json` | Province-related npm scripts |

| Reused as-is | Role |
|--------------|------|
| `triangulation.ts` | CDT2D triangulation |
| `geo-math.ts` | Coordinate conversion |
| `AnimationTexture` | Per-province state texture (new instance, same class) |
| `CountryAnimator` | Province animation ticking (new instance, same class) |
| `CountryPicker` | Province point-in-polygon lookup (new instance, same class) |
| `ShaderFactory` | Province shader materials (same shaders, different texture bindings) |
| `OutlineRenderer` | Province selection outline |
