# Region Refactor Plan

Starting point: commit `435a6139c31d3390790701a4c04188a107379bbb`
(Countries working, province border overlay working, province quiz NOT yet implemented)

## Core Idea

Replace all country-specific classes with generic `Region*` equivalents.
`EarthGlobe` gets two instances of `RegionController`: `countryController` and `provinceController`.
The flat `EarthGlobeAPI` is preserved - methods delegate to the right controller internally.

**No interface-with-multiple-implementations.** Two instances of the same class, different data.

```
RegionController
  ├── RegionRenderer    (was CountryRenderer)
  ├── RegionAnimator    (was CountryAnimator)
  └── RegionPicker      (was CountryPicker)

EarthGlobe
  ├── countryController: RegionController
  ├── provinceController: RegionController
  └── activeController: RegionController   ← routes hover/click here
```

---

## Data Model

```typescript
type RegionType = 'country' | 'province';

interface RegionData {
    type: RegionType;
    name: string;
    index: number;           // local index (0-based within this controller)
    polygonIndices: number[];
    parentRegionIndex?: number;  // if set: hide this index in parent controller when active
    centroid: Vector3 | null;    // for small-region expansion
    // country-only:
    iso2?: string;
    neighbourCountries?: NeighborInfo[];
}

interface RegionPolygon {
    name: string;
    regionIndex: number;
    polygonIndex: number;
    points: LatLon[];
    bbox: BoundingBox;
}
```

A `Region` can have a `parentRegionIndex`. When `provinceController` becomes active for US,
it sets `countryController.setRegionState(usIndex, STATE_HIDDEN)`. When deactivated, it
restores the country. No special-casing needed - it's just an index into the other controller.

---

## Phase 1 — Rename and wrap into RegionController (countries still work)

**Goal:** Pure refactor. Zero behavior change. Country quiz passes after this phase.

### 1a. Rename files and classes

| Old | New |
|-----|-----|
| `country-renderer.ts` | `region-renderer.ts` → class `RegionRenderer` |
| `country-animator.ts` | `region-animator.ts` → class `RegionAnimator` |
| `country-picker.ts` | `region-picker.ts` → class `RegionPicker` |
| `country-selection.ts` | `region-selection.ts` (module functions) |
| `country-animations.ts` | `region-animations.ts` (module functions) |

Update all import sites. No logic changes yet.

### 1b. Create RegionController

New file: `src/earth-globe/region-controller.ts`

```typescript
export class RegionController {
    readonly type: RegionType;
    private renderer: RegionRenderer;
    private animator: RegionAnimator;
    private picker: RegionPicker;

    constructor(type: RegionType, scene, shaderFactory, animTexWidth) { ... }

    async load(data: RegionJSON[], segmentData: SegmentData): Promise<void> { ... }

    // Forwarding methods used by EarthGlobe flat API:
    getRegionAt(latLon): RegionData | null
    getRegionByIndex(i): RegionData | null
    getAllRegions(): RegionData[]
    setAltitude(i, v), animateAltitude(i, v, dur, easing?)
    setState(i, s), getState(i)
    setBlend(i, v), animateBlend(i, v, dur, easing?)
    setExpansion(i, v), animateExpansion(i, v, dur, easing?)
    showOutline(i), clearOutline()
    tick(deltaTime)
    setVisible(visible: boolean)
    setActive(active: boolean)   // routes hover/click events here
}
```

### 1c. Wire EarthGlobe

```typescript
private countryController: RegionController;
private activeController: RegionController;
```

All existing `EarthGlobeAPI` methods delegate to `this.countryController` (unchanged behavior).

**Checkpoint:** Run country quiz. Everything works as before.

---

## Phase 2 — Province static border test page

**Goal:** Verify the static border shaders from Phase 2 (Mode A) work correctly before
adding interactive provinces on top.

Create `public/test-all-province-borders.html`:
- Loads the globe normally (all countries visible)
- Loads province border overlays for **every** country that has a province file in `public/provinces/`
- Renders all province borders simultaneously on top of the globe
- Tests zoom-based alpha (borders fade in when zoomed close)

This page exercises:
- Province border shader correctness
- Multiple simultaneous overlays
- No interaction needed - just visual verification

**Checkpoint:** User opens the page, confirms borders render correctly at different zoom levels.

---

## Phase 3 — Province data pipeline

**Goal:** Load all province data at startup, build the second RegionController.

### 3a. Generalize data format

Define `RegionJSON` that both countries and provinces satisfy:

```typescript
interface RegionJSON {
    name: string;
    paths: string;                       // coordinate arrays, same format as countries
    holes?: Record<number, number[]>;    // polygon index → list of contained region indices (enclaves)
    lakes?: Record<number, number[]>;    // polygon index → list of lake polygon indices
    skipHole?: boolean;
    parentRegionIndex?: number;          // provinces: index of parent country in countryController
}
```

Provinces have the same topology problems as countries:
- **Lakes** — a polygon of province X that lies inside another polygon of province X
  (e.g. Swiss cantons around Lake Geneva/Bodensee)
- **Enclaves** — all polygons of province X lie inside a polygon of province Y
  (e.g. a canton exclave fully surrounded by another canton)

`RegionRenderer` handles holes/lakes identically for both types. The geometry is the same;
only the political label differs.

### 3b. Data pipeline

Raw data lives in `data/legacy/locations_en.json`. The pipeline for each country ISO2:

```
locations_en.json
  → extract-provinces.ts --country=CH   → public/provinces/CH-raw.json
  → enrich-regions.ts --country=CH      → public/provinces/CH.json  (holes + lakes added)
  → generate-segments.ts --country=CH   → public/province-segments/CH.json
```

**`extract-provinces.ts`** (generic rewrite of `extract-us-provinces.ts`):
- Accepts `--country=XX` argument
- Filters `locations_en.json` by `locationType === 'Province'` and `countryIso2s[0] === XX`
- Sorts alphabetically, assigns integer IDs 0-based
- Outputs raw province file (no holes/lakes yet)

**`enrich-regions.ts`** (generic rewrite of `enrich-countries.ts`):
- Accepts `--country=XX` argument (or `--countries` for the full country pass)
- Runs identical algorithms: duplicate removal, lake detection, enclave detection
- For provinces, enclave holes reference **province integer index** rather than ISO2 string
- Outputs enriched file with `holes` and `lakes` fields populated

**`generate-province-index.ts`** (new):
- Scans `public/provinces/` for all `*.json` files (excluding `*-raw.json`)
- Writes `public/provinces/index.json`: array of ISO2 codes
- Run once after adding any new country's province data

```json
// public/provinces/index.json
["CH", "US"]
```

npm scripts:
```json
"extract-provinces": "tsx scripts/extract-provinces.ts",
"enrich-provinces": "tsx scripts/enrich-regions.ts",
"generate-segments": "tsx scripts/generate-segments.ts",
"generate-province-index": "tsx scripts/generate-province-index.ts"
```

### 3c. Load at startup

In `EarthGlobe.initialize()`:
1. Fetch `public/provinces/index.json` to get list of available ISO2 codes
2. Fetch all `public/provinces/{ISO2}.json` files in parallel
3. Build `provinceController` from combined data
4. Initially hidden (`setVisible(false)`)

**Checkpoint:** CLI test: `npm run test:regions` - verifies both controllers load without errors,
correct region counts, correct parent indices.

---

## Phase 4 — Active controller switching

**Goal:** `EarthGlobe` can switch which controller receives input.

```typescript
// New API methods (flat, as before):
enterRegionMode(iso2: string): void   // activate provinces for a country
exitRegionMode(): void                // back to country mode
isInRegionMode(): boolean
```

`enterRegionMode('US')`:
1. Find province regions where `parentRegionIndex === usCountryIndex`
2. `provinceController.setVisible(true)` for those regions only
3. `countryController.setState(usCountryIndex, STATE_HIDDEN)`
4. `activeController = provinceController`

`exitRegionMode()`:
1. `provinceController.setVisible(false)`
2. `countryController.setState(usCountryIndex, STATE_NORMAL)`
3. `activeController = countryController`

Hover/click events in `EarthGlobe` always dispatch to `activeController`.

**Checkpoint:** Manual test on `test-all-province-borders.html` (click to enter/exit province mode for a country).

---

## Phase 5 — Generalize region-selection and region-animations

**Goal:** `region-selection.ts` and `region-animations.ts` work against `activeController`,
no country/province branching.

### 5a. region-selection.ts

Currently has `if (globe.isInProvinceQuiz())` branching. Replace with:

```typescript
// region-selection.ts
export function handleHover(globe: EarthGlobeAPI, region: RegionData, latLon: LatLon) {
    // Works against globe.activeController - no branching needed
}
```

### 5b. region-animations.ts

Currently has paired functions `animateCorrect / animateProvinceCorrect` that call a shared
generic. Collapse to single functions:

```typescript
export function animateCorrect(globe, regionIndex, controller: RegionController)
export function animateWrong(globe, regionIndex, controller: RegionController)
export function animateShowCorrect(...)
// etc.
```

Quiz code passes `globe.activeController` — no quiz-side branching needed.

**Checkpoint:** Country quiz still passes. All animation tests pass.

---

## Phase 6 — Quiz integration

**Goal:** Quiz system uses generic region API. Province questions work end-to-end.

### 6a. quiz-types.ts

No change needed. Keep `answer: 'province'` type. Quiz runner needs to know which
controller to use - it reads it from `globe.activeController`.

### 6b. quiz-flow.ts

Replace `EnterProvinceQuiz / ExitProvinceQuiz` step ops with:
```typescript
EnterRegionMode   // calls globe.enterRegionMode(iso2)
ExitRegionMode    // calls globe.exitRegionMode()
DisableNonGameRegions  // replaces both DisableNonGameCountries + DisableNonGameProvinces
```

`generateQuizSteps()` inserts `EnterRegionMode` when a province question is detected.

### 6c. quiz-runner.ts

Replace province-specific cases with generic region cases.
`WaitPinPlacement` uses `globe.activeController.getRegionAt(latLon)` regardless of type.

### 6d. Small regions

`RegionPicker` supports the same 3-tier collision system as the current `CountryPicker`:
- Tier 1: Grid-based PIP
- Tier 2: Override colliders (surrounded regions)
- Tier 3: Catch colliders (proximity circles with multiplier)

Small provinces (e.g. Rhode Island, Luxembourg canton) get the same expansion/catch behavior
as small countries. `RegionRenderer` passes `isSmall` flag based on bounding box area,
same threshold as countries.

**Checkpoint:** Full province quiz (US states, 5-question test). All animations play correctly.
Country quiz still passes.

---

## Phase 7 — Province data for additional countries

**Goal:** Add Switzerland as proof that holes/lakes work for provinces.

Run the full pipeline for CH:
```
npm run extract-provinces -- --country=CH
npm run enrich-provinces -- --country=CH
npm run generate-segments -- --country=CH
npm run generate-province-index
```

The enrichment step should detect lake polygons for cantons bordering Lake Geneva and
Lake Bodensee (Vaud, Geneva, Thurgau, etc.) and write them into `holes`/`lakes` fields.
The renderer then punches holes correctly during triangulation.

**Checkpoint:** CLI test shows correct canton counts (26). Visual test: no triangulation
artifacts on lake-border cantons. Country quiz still passes.

---

## Key Invariants to Preserve

1. **Segment border animation sync** — `RegionAnimator` keeps `setSegmentRegionMap()` so
   border quad strips animate with their parent region (altitude, state).

2. **Animation texture layout** — Countries: width 256. Provinces: configurable (512 for US).
   `RegionController` takes `animTexWidth` as constructor param.

3. **Merging strategy** — `RegionRenderer` merges all region polygons into ONE mesh (+ one
   for small regions). Same as current country approach. This is critical for GPU performance.

4. **Flat EarthGlobeAPI** — All methods stay on `EarthGlobe`. Nothing is exposed through
   controllers directly to game code.

5. **No startup delay** — Province data loads at startup alongside countries. No lazy loading.

---

## Files Created/Renamed in Full

| Action | File |
|--------|------|
| Rename | `src/earth-globe/country-renderer.ts` → `region-renderer.ts` |
| Rename | `src/earth-globe/country-animator.ts` → `region-animator.ts` |
| Rename | `src/earth-globe/country-picker.ts` → `region-picker.ts` |
| Rename | `src/shared/behaviors/country-selection.ts` → `region-selection.ts` |
| Rename | `src/shared/animation/country-animations.ts` → `region-animations.ts` |
| New | `src/earth-globe/region-controller.ts` |
| New | `public/test-all-province-borders.html` (Phase 2) |
| New | `scripts/extract-provinces.ts` (replaces `extract-us-provinces.ts`) |
| New | `scripts/enrich-regions.ts` (replaces `enrich-countries.ts`) |
| New | `scripts/generate-province-index.ts` |
| Generated | `public/provinces/index.json` |
| Generated | `public/provinces/CH.json` (Phase 7) |
| Generated | `public/province-segments/CH.json` (Phase 7) |

`types.ts` gains `RegionData`, `RegionPolygon`, `RegionJSON` and deprecates the parallel
`CountryData/CountryPolygon/CountryJSON` / `ProvinceData` types.

---

## Checkpoints Summary

| Phase | Checkpoint |
|-------|-----------|
| 1 | Country quiz passes |
| 2 | Province border overlay visual test |
| 3 | CLI test: both controllers load, correct counts |
| 4 | Manual: enter/exit province mode hides/shows country |
| 5 | Country quiz still passes |
| 6 | Province quiz end-to-end (5 US states) |
| 7 | Swiss canton test: holes/lakes triangulate correctly |
