# Province Implementation Plan

## Context

We're adding provinces (states/regions) to the Babylon.js globe. Province polygon data is already available in `data/legacy/locations_en.json` (exported from our Unity project). 32 countries have province data (715 provinces total).

Province data serves **two distinct rendering modes**:

### Mode A: Static Border Overlay (location questions)

When `answer` is `"location-guess"` or `"location-alternatives"`, the globe landmass is static. Province borders are drawn on top as a visual reference — no province surfaces, no animation texture, no picking. Just border quad strips with a simple shader and zoom-based alpha fade.

### Mode B: Province Quiz (answer: "province")

When `answer` is `"province"` (e.g., a US states medal), provinces **replace** their parent country and behave identically to countries — same animation texture, same altitude (`COUNTRY_ALTITUDE`), extruded border walls, segment tubes, picking, outlines. The parent country is hidden; all other countries remain visible.

### Current Architecture (relevant modules)

| Module | Style | Notes |
|--------|-------|-------|
| `country-renderer.ts` | Class | Triangulates, merges, manages country meshes |
| `border-renderer.ts` | Class | Extruded walls + segment tubes |
| `animation-texture.ts` | Class | 1024x1 RGBA texture, hardcodes `ANIMATION_TEXTURE_WIDTH` |
| `country-animator.ts` | Class | Promise-based animation ticking |
| `country-picker.ts` | Class | Grid-based spatial index (10° cells) |
| `shader-factory.ts` | Class | Creates materials, binds animation texture |
| `outline-renderer.ts` | Class | Tube outline around selected country |
| `triangulation.ts` | Functions | CDT2D — works for any polygon data |
| `geo-math.ts` | Functions | Coordinate conversion, PIP, interior points |

### Unity MapConfig.asset Values

Province-specific config from Unity that we should match:
- `ProvinceBorderThicknessZoomedOut: 0.001`
- `ProvinceBorderThicknessZoomedIn: 0.0001`
- `ProvinceBorderAlphaZoomedOut: 0` (invisible when far)
- `ProvinceBorderAlphaZoomedIn: 1` (visible when close)
- `ProvinceSegmentExtensionFactor: 0`

---

## Implementation Strategy

### Proof of Concept Approach

This plan follows a **validate-then-scale** strategy:

1. **Phase 0**: Migrate country borders to quad strips first — this proves the quad strip technique works and benefits both countries and provinces
2. **Phase 1-5**: Implement full province system using **US states only** (50 states) as proof of concept
3. **Phase 6**: Once US states work end-to-end, scale to all 32 countries (715 provinces)
4. **Phase 7**: Import medal data for all province quizzes

### Why US States First?

- **Manageable scope**: 50 states vs. 715 provinces — easier to debug and iterate
- **Familiar geography**: Easier to spot data/rendering issues
- **Integer IDs**: Replace bulky UUIDs with 0-49 integers — simpler, smaller files
- **Test page**: `test-us-states.html` provides clear validation checkpoint
- **Risk mitigation**: Discover integration issues before processing 715 provinces

### Two Rendering Modes

**Mode A: Static Province Borders** (Phase 2)
- Visual overlay for location questions
- No surface meshes, just border quad strips
- Zoom-based alpha fade (invisible far, visible close)
- Simple static shader

**Mode B: Province Quiz** (Phase 3)
- Full country-like rendering
- Replaces parent country during quiz
- Animated borders with texture lookup
- Picker, animations, outlines — same as countries

Both modes share the quad strip mesh format from Phase 0.

---

## Phase 0: Migrate to Quad Strip Borders

**Goal**: Replace current tube-based segment borders with Unity-style quad strips. This is cleaner, more performant, and sets foundation for province borders.

### Current State
- Segment borders use `MeshBuilder.CreateTube()` with 8-sided tessellation
- Heavy geometry (8 vertices per segment point)
- Uses `animated.vertex.glsl` with normal-based thickness scaling

### Target State
- Quad strips with bitangent expansion (2 vertices per segment point)
- Pre-scaled tangent attribute (±0.5)
- Vertex shader applies thickness multiplicatively
- Same visual result, ~4x fewer vertices

### Implementation Steps

**0a. Create quad strip mesh generator**
- Add `createQuadStripBorder()` method to `BorderRenderer`
- For each edge (p0 → p1):
  - Compute bitangent: `normalize(cross(lineDir, surfaceNormal))`
  - Create 4 vertices: p0 ± bitangent×0.5, p1 ± bitangent×0.5
  - Store bitangent direction in `tangent` attribute (vec4, pre-scaled to ±0.5)
- Two triangles per edge (quad strip)

**0b. Create quad strip animated shader**
- New vertex shader: `border-quad.vertex.glsl`
- Reads animation from texture (like current `animated.vertex.glsl`)
- Applies multiplicative altitude: `pos * (1 + animValue * amplitude)`
- Adds Z-fighting offset: `pos += normalize(pos) * 0.001`
- Expands thickness: `pos += tangent.xyz * lineThickness`
- Fragment shader: reuse `border.fragment.glsl`

**0c. Replace tube rendering in `renderSegmentBorders()`**
- Replace `MeshBuilder.CreateTube()` calls with `createQuadStripBorder()`
- Remove UV fixing hack (no longer needed)
- Keep animation index mapping logic unchanged

**0d. Add thickness uniform to shader material**
- Add `lineThickness` uniform to shader material setup
- Set to current tube radius value for visual parity

**0e. Test with existing country quiz**
- Visual check: borders look identical
- Performance check: lower vertex count
- Animation check: borders animate with countries

**Files to create:**
- `src/earth-globe/shaders/border-quad.vertex.glsl`

**Files to modify:**
- `src/earth-globe/border-renderer.ts` (add quad strip generator, replace tube code)
- `src/earth-globe/shader-factory.ts` (bind lineThickness uniform)

**Verify**: Load country quiz, check segment borders animate correctly with fewer vertices.

---

## Phase 1: US States Proof of Concept - Data Pipeline

**Goal**: Extract US provinces only and generate segments. This is our proof of concept before scaling to all 32 countries.

### 1a. Source data

Province data lives in `data/legacy/locations_en.json` — a flat array of all locations. Provinces are entries with `"locationType": "Province"`.

Source entry format (example: Alabama):
```json
{
  "id": "5db71ac4-29df-4570-8004-76e91208a177",
  "nameEn": "Alabama",
  "countryIso2s": ["US"],
  "locationType": "Province",
  "paths": "[[[30.328..., -87.427...], ...]]",
  "lat": 0, "lon": 0,
  "parentId": null, "regionGroupId": null, "tags": []
}
```

Key observations:
- **715 provinces** across **32 countries** (US: 50, TR: 80, GB: 73, JP: 47, etc.)
- **Paths format is identical** to `countries-enriched.json` — JSON-stringified `[[[lat, lon], ...], ...]`
- **IDs are UUIDs**, not ISO 3166-2 codes (e.g., `"5db71ac4-..."` not `"US-AL"`)
- **`lat`/`lon` are always 0** — no centroid provided, must compute from paths if needed
- **Multi-polygon**: some provinces have multiple polygons (Alaska: 6, California: 4, Hawaii: 5, Michigan: 2, etc.)
- **Zero empty paths** — all 715 provinces have polygon data

Province counts by country:
```
TR:80  GB:73  US:50  JP:47  IN:36  CN:33  MX:32  BR:27  UA:27  CH:26
AR:23  SE:21  IT:20  ES:19  FI:18  DE:16  PL:16  GR:14  CZ:14  CA:13
FR:13  NL:12  GE:11  BE:10  ZW:10  ZM:10  ZA:9   SK:8   KE:8   PT:7
AU:7   DK:5
```

### 1b. Extract US provinces only

Write `scripts/extract-us-provinces.ts` — reads `data/legacy/locations_en.json`, filters by `locationType === "Province"` AND `countryIso2s === ["US"]`, writes to `public/provinces/US.json`.

**IMPORTANT**: Replace bulky UUID strings with integer IDs (0-49) to reduce file size.

Output format:
```json
{
  "country": "US",
  "provinces": [
    { "id": 0, "name": "Alabama", "paths": "[[[lat,lon],...],...]" },
    { "id": 1, "name": "Alaska", "paths": "[[[lat,lon],...],...]" }
  ]
}
```

This is a simple filter+convert — no coordinate conversion needed since the paths format is already identical to the country data.

### 1c. Generate US province segments

Write `scripts/generate-us-segments.ts` — reuses the edge-matching algorithm from `scripts/generate-segments.ts` but operates on US provinces only. Output: `public/province-segments/US.json` with same segment format (but `provinces` field instead of `countries`).

### 1d. CLI test

Write `scripts/test-us-provinces.ts` — loads US province file, prints stats (50 states, polygon counts), verifies segment generation works.

**Files to create:**
- `scripts/extract-us-provinces.ts`
- `scripts/generate-us-segments.ts`
- `scripts/test-us-provinces.ts`
- `public/provinces/US.json`
- `public/province-segments/US.json`

**Verify**:
- CLI: `npm run test:us-provinces` prints stats for 50 states

---

## Phase 2: Static Province Borders (Mode A)

**Goal**: Render province borders as a visual overlay for location questions.

### Reference: Unity SharedBorderStatic shader

The Unity shader (`SharedBorderStatic.shader`) reveals the border mesh format:

- **Not tubes** — borders are flat quad strips with vertex-shader thickness expansion
- Each vertex stores: `position` (sphere point) + `tangent` (pre-scaled bitangent direction, ±0.5)
- Vertex shader: applies multiplicative altitude (`pos * (1 + altitudeOffset)`), adds `normalize(pos) * 0.001` Z-fighting offset, then expands by `tangent * lineThickness`
- Fragment shader: solid color with `color.a *= lineAlpha` — no lighting, no texture sampling
- Renders as transparent (`Blend SrcAlpha OneMinusSrcAlpha`, `ZWrite Off`)

This is cheaper than the tube approach used for country borders (no 8-sided tessellation — just 2 triangles per segment edge).

**Shared mesh format**: The quad strip mesh generation here is **reused by Mode B** (animated province borders in Phase 3). The mesh format is identical — position + tangent with ±0.5 bitangent. Mode B adds `objectIndex` in UV0.x for per-segment animation texture lookup, but the underlying geometry is the same.

### 2a. Province border mesh generation

For each border segment (sequence of points), generate a quad strip:
- For each edge (p0 → p1), compute the bitangent: `normalize(cross(lineDir, surfaceNormal))`
- Create 4 vertices per edge: p0 ± bitangent×0.5, p1 ± bitangent×0.5
- Store bitangent direction in the `tangent` vertex attribute (pre-scaled to ±0.5)
- The shader multiplies tangent by `_LineThickness` to control width at runtime

### 2b. Province border shader (Babylon.js port)

Port the Unity shader to Babylon.js GLSL:

**Vertex shader** (`province-border.vertex.glsl`):
```glsl
attribute vec3 position;  // Sphere point
attribute vec4 tangent;   // Pre-scaled bitangent (±0.5)

uniform float altitudeOffset;  // e.g. COUNTRY_ALTITUDE
uniform float lineThickness;   // zoom-interpolated
uniform mat4 worldViewProjection;

void main() {
    // Multiplicative altitude
    vec3 pos = position * (1.0 + altitudeOffset);

    // Z-fighting offset (push outward along normal)
    vec3 normal = normalize(position);
    pos += normal * 0.001;

    // Thickness expansion
    pos += tangent.xyz * lineThickness;

    gl_Position = worldViewProjection * vec4(pos, 1.0);
}
```

**Fragment shader** (`province-border.fragment.glsl`):
```glsl
uniform vec4 borderColor;
uniform float lineAlpha;

void main() {
    gl_FragColor = vec4(borderColor.rgb, borderColor.a * lineAlpha);
}
```

### 2c. Province border renderer module

Create `src/earth-globe/province-border-renderer.ts` — loads province segment data and generates quad strip meshes. No animation texture, no surface meshes, no picker.

Module-level state:
```
ProvinceBorderState (per loaded country):
  - countryISO2: string
  - borderMesh: Mesh | null        (merged quad strips)
  - material: ShaderMaterial | null
  - isVisible: boolean
```

Key functions:
- `loadProvinceBorders(scene, iso2): Promise<ProvinceBorderState>` — fetch province segment JSON, generate quad strip vertices with bitangent in tangent attribute, merge into single mesh, create shader material
- `disposeProvinceBorders(state)` — dispose mesh + material
- `showProvinceBorders(state)` / `hideProvinceBorders(state)` — toggle visibility
- `updateProvinceBorderUniforms(state, cameraDistance)` — lerp `lineThickness` and `lineAlpha` based on zoom, set uniforms on material

### 2d. Zoom-based constants

Add to `src/earth-globe/constants.ts`:
```typescript
// Province borders (from Unity MapConfig)
const PROVINCE_BORDER_THICKNESS_CLOSE = 0.0001;
const PROVINCE_BORDER_THICKNESS_FAR = 0.001;
const PROVINCE_BORDER_ALPHA_CLOSE = 1.0;
const PROVINCE_BORDER_ALPHA_FAR = 0.0;
```

And add to the `zoom` object:
```typescript
provinceBorderThicknessClose: PROVINCE_BORDER_THICKNESS_CLOSE,
provinceBorderThicknessFar: PROVINCE_BORDER_THICKNESS_FAR,
provinceBorderAlphaClose: PROVINCE_BORDER_ALPHA_CLOSE,
provinceBorderAlphaFar: PROVINCE_BORDER_ALPHA_FAR,
```

**Files to create:**
- `src/earth-globe/province-border-renderer.ts`
- `src/earth-globe/shaders/province-border.vertex.glsl`
- `src/earth-globe/shaders/province-border.fragment.glsl`

**Files to modify:** `src/earth-globe/constants.ts`

**Verify**: Browser test — load province borders for US, zoom in/out, borders fade in when close and disappear when far.

---

## Phase 3: Province Quiz Renderer (Mode B)

**Goal**: Load province data on demand, triangulate, create full country-like meshes that replace the parent country.

### 3a. Types

Add to `src/earth-globe/types.ts`:
```typescript
interface ProvinceJSON {
    id: number;       // Integer ID (0-49 for US states)
    name: string;     // "Alabama"
    paths: string;    // same format as CountryJSON.paths
}

interface ProvinceFileJSON {
    country: string;  // ISO2: "US"
    provinces: ProvinceJSON[];
}

interface ProvinceData {
    id: number;               // Integer from source data
    name: string;
    localIndex: number;       // 0-based within this country
    polygonIndices: number[];  // indices into the province polygonsData array
}
```

### 3b. AnimationTexture width parameter

`AnimationTexture` currently hardcodes `ANIMATION_TEXTURE_WIDTH` (1024). Add an optional `width` parameter to the constructor so provinces can use a smaller 256-wide texture:

```typescript
constructor(scene: Scene, width: number = ANIMATION_TEXTURE_WIDTH)
```

### 3c. Province quiz renderer module

Create `src/earth-globe/province-quiz-renderer.ts` with module-level state (data-oriented style):

```
ProvinceQuizState (per loaded country):
  - countryISO2: string
  - provinces: ProvinceData[]
  - polygonsData: PolygonData[]            (triangulated meshes)
  - mergedMesh: Mesh | null                (all province surfaces)
  - mergedExtrudedBorders: Mesh | null     (extruded border walls)
  - mergedSegmentBorders: Mesh | null      (segment border quad strips — animated shader)
  - animationTexture: AnimationTexture     (separate, 256-wide)
  - animator: CountryAnimator              (separate instance)
  - picker: CountryPicker                  (separate instance)
  - isVisible: boolean
```

Key functions:
- `loadProvinceQuiz(scene, shaderFactory, iso2): Promise<ProvinceQuizState>` — fetch JSON, triangulate polygons using existing CDT2D pipeline, create per-province meshes with `provinceIndex` vertex attribute, create extruded border walls + segment border quad strips (animated), merge everything, set up picker
- `disposeProvinceQuiz(state)` — dispose all meshes and textures
- `showProvinceQuiz(state)` / `hideProvinceQuiz(state)` — toggle visibility
- `tickProvinceAnimator(state)` — tick the province animator (called from render loop)

Province meshes render at `COUNTRY_ALTITUDE` (same as countries — no Z-fighting because the parent country is hidden). Province borders include:
- **Extruded border walls** — reuse existing code from `border-renderer.ts`
- **Segment border quad strips** — reuse the quad strip mesh generator from Phase 0 (`createQuadStripBorder()` in `border-renderer.ts`), adding `objectIndex` attribute in UV0.x for animation:
  - `objectIndex` stored in UV0.x (segment's index into the province animation texture)
  - Vertex shader: **reuse `border-quad.vertex.glsl` from Phase 0**, just bind province animation texture instead of country texture
  - Per-frame CPU sync: segment altitude = max(altitude of adjacent provinces), written to animation texture. If all adjacent provinces are disabled, segment altitude = 0 (hidden). This follows the same pattern as `CountryAnimator.update()` via `segmentCountryMap`.

Key vertex shader difference (animated vs static):
```glsl
// Static: uniform float altitudeOffset;
// Animated: reads per-segment altitude from texture
float texCoord = (objectIndex + 0.5) / animationTextureWidth;
float animValue = texture2D(animationTexture, vec2(texCoord, 0.5)).r;
float displacement = 1.0 + (animValue * animationAmplitude);
vec3 pos = position * displacement;
```

### 3d. Constants

Add to `src/earth-globe/constants.ts`:
```typescript
const PROVINCE_ANIMATION_TEXTURE_WIDTH = 256;
```

Reuses existing infrastructure:
- `triangulation.ts` — CDT2D triangulation (same as countries)
- `geo-math.ts` — latLonToSphere coordinate conversion
- `AnimationTexture` — separate 256-wide instance (with new width parameter)
- `CountryPicker` — separate instance with province polygons
- `ShaderFactory` — same shaders, bound to province animation texture
- `CountryAnimator` — separate instance for provinces

**Files to create:**
- `src/earth-globe/province-quiz-renderer.ts`

**Files to modify:**
- `src/earth-globe/types.ts` (add Province types)
- `src/earth-globe/constants.ts` (add PROVINCE_ANIMATION_TEXTURE_WIDTH)
- `src/earth-globe/animation-texture.ts` (width parameter)

**Shaders to reuse:**
- Reuse `border-quad.vertex.glsl` from Phase 0 for animated province borders (just bind different texture)

**Verify**: CLI test triangulates provinces for one country, prints mesh stats.

---

## Phase 4: Globe Integration

**Goal**: Wire both province rendering modes into `EarthGlobe`.

### 4a. EarthGlobe API additions

Add to `src/earth-globe/earth-globe.ts`:

```typescript
// State
private activeProvinceQuiz: ProvinceQuizState | null = null;
private provinceQuizCache: Map<string, ProvinceQuizState> = new Map();
private activeProvinceBorders: ProvinceBorderState | null = null;
private provinceBorderCache: Map<string, ProvinceBorderState> = new Map();

// Mode B: Province quiz — replaces parent country
enterProvinceQuiz(iso2: string): Promise<void>
exitProvinceQuiz(): void
isInProvinceQuiz(): boolean
getActiveProvinceCountry(): string | null
getProvinceAt(lat: number, lon: number): ProvinceData | null

// Mode A: Static province borders — visual overlay
showProvinceBorders(iso2: string): Promise<void>
hideProvinceBorders(): void
```

`enterProvinceQuiz(iso2)` flow:
1. Exit current province quiz if active
2. Load province quiz state (or use cache)
3. Hide the parent country (set country mesh invisible / state)
4. Show province meshes + borders at `COUNTRY_ALTITUDE`
5. Province picker becomes active for `getProvinceAt()`

`exitProvinceQuiz()` flow:
1. Hide province meshes + borders
2. Restore parent country visibility
3. Set activeProvinceQuiz to null (keep in cache)

`showProvinceBorders(iso2)` flow:
1. Load province border state (or use cache)
2. Show border mesh overlay

`hideProvinceBorders()` flow:
1. Hide border mesh

### 4b. Province quiz animation API

Add to `EarthGlobeAPI` interface — mirror the country animation API for provinces (Mode B only):
- `setProvinceAltitude(localIndex, value)` / `animateProvinceAltitude(localIndex, target, duration, easing?)`
- `setProvinceState(localIndex, state)` / `setProvinceBlend(localIndex, blend)` / `animateProvinceBlend(localIndex, target, duration, easing?)`
- `showProvinceOutline(localIndex)` / `clearProvinceOutline()`

These delegate to the active province quiz state's `AnimationTexture`, `CountryAnimator`, and `OutlineRenderer`.

### 4c. Render loop additions

In the render loop (`beforeRender`):
- When province quiz is active: tick the province animator, update the province animation texture
- When province borders are visible: update border alpha based on camera distance

**Files to create:**
- `public/test-us-states.html` — Test page for US states quiz

**Files to modify:**
- `src/earth-globe/earth-globe.ts`
- `src/earth-globe/types.ts` (EarthGlobeAPI)
- `src/earth-globe/index.ts` (exports)

### 4d. Create US states test page

Now that `enterProvinceQuiz()` is implemented, create the browser test page:

Write `public/test-us-states.html` — minimal test page that:
- Loads the globe
- Calls `globe.enterProvinceQuiz("US")`
- Shows clickable US states
- Logs click events to console

This is the proof of concept - when this works, we know the full pipeline is correct.

**Verify**:
- Browser: `globe.enterProvinceQuiz("US")` hides US, shows state meshes that animate like countries
- Browser: `globe.showProvinceBorders("US")` shows static borders that fade with zoom
- Browser: Click US states, verify `globe.getProvinceAt()` returns correct province

---

## Phase 5: Quiz Integration

**Goal**: Add province question type to the quiz system.

### 5a. Province answer type

Extend the existing flat `Question` type in `src/shared/quiz/quiz-types.ts` — don't create a separate type:

```typescript
// Add to AnswerTag union
type AnswerTag = "country" | "location-guess" | "location-alternatives" | "province"

// Add optional fields to existing Question type
type Question = {
    present: PresentTag
    answer: AnswerTag
    prompt: string

    // ... existing fields ...

    // answer: "province"
    provinceId?: number      // Integer ID (0-49 for US states)
    countryISO2?: string     // "US" (parent country to hide/replace)
}
```

### 5b. Province step operations

Add new `StepOp` values:
```typescript
EnterProvinceQuiz = "enter_province_quiz"
ExitProvinceQuiz = "exit_province_quiz"
DisableNonGameProvinces = "disable_non_game_provinces"
WaitProvinceClick = "wait_province_click"
AnimateProvinceCorrect = "animate_province_correct"
AnimateProvinceWrongReveal = "animate_province_wrong_reveal"
AnimateProvinceWrongShake = "animate_province_wrong_shake"
```

And corresponding `Step` union members with the data each step needs.

### 5c. Province borders for location questions

For `answer: "location-guess"` and `"location-alternatives"` questions, optionally show province borders as a visual aid. This uses Mode A (`showProvinceBorders`). The quiz flow may add a step to show/hide province borders if the question's country has province data available.

### 5d. Quiz flow

Add province question step generation in `src/shared/quiz/quiz-flow.ts`. Flow mirrors country questions:
1. `EnterProvinceQuiz` (with country ISO2 — hides parent country, shows provinces)
2. `DisableNonGameProvinces`
3. `ShowQuestion`
4. `WaitProvinceClick`
5. Correct/Wrong animation (`AnimateProvinceCorrect` / `AnimateProvinceWrongReveal`)
6. `ShowResult`
7. `ExitProvinceQuiz` (at game end or country switch — restores parent country)

Smart grouping: when consecutive province questions are in the same country, skip exit/re-enter. Only transition when the country changes.

### 5e. Quiz runner

Add handlers for province steps in `src/shared/quiz/quiz-runner.ts`. Province click handler uses `globe.getProvinceAt()` instead of `globe.getCountryAtLatLon()`.

`submitProvinceAnswer(provinceLocalIndex)` — new submission function parallel to `submitCountryAnswer()`.

**Files to modify:**
- `src/shared/quiz/quiz-types.ts`
- `src/shared/quiz/quiz-flow.ts`
- `src/shared/quiz/quiz-runner.ts`

**Verify**: Create a test quiz with 3-5 US states. Full flow works: US country hidden, states appear as country-like meshes, question shown, click state, correct/wrong animation, score tracking. Other countries remain visible.

---

## Phase 6: Scale to All Provinces

**Goal**: Now that US states work end-to-end, scale up to all 32 countries with province data (715 total provinces).

### 6a. Update extraction script

Modify `scripts/extract-us-provinces.ts` → `scripts/extract-provinces.ts`:
- Remove US-only filter
- Process all 32 countries with province data
- Output 32 files: `public/provinces/{ISO2}.json`
- Assign integer IDs per country (0-indexed within each country)

### 6b. Generate all province segments

Modify `scripts/generate-us-segments.ts` → `scripts/generate-province-segments.ts`:
- Process all 32 countries
- Output 32 files: `public/province-segments/{ISO2}.json`

### 6c. Test sampling

Test a few diverse countries to verify data quality:
- TR (80 provinces - largest)
- GB (73 provinces)
- JP (47 provinces - island nation)
- CH (26 provinces - small landlocked)

**Files to create:**
- `scripts/extract-provinces.ts` (generalized version)
- `scripts/generate-province-segments.ts` (generalized version)
- `public/provinces/*.json` (32 files total)
- `public/province-segments/*.json` (32 files total)

**Verify**: CLI test prints stats for all 32 countries. Spot-check a few in browser with test pages.

---

## Phase 7: Import Province Medal Data

**Goal**: Add medal definitions for province quizzes (e.g., "US States Master").

### 7a. Medal data structure

Province medals reference the parent country's ISO2 code. Example:

```json
{
  "id": "us-states",
  "name": "US States Master",
  "description": "Name all 50 US states",
  "countryISO2": "US",
  "medalType": "province",
  "bronzeThreshold": 30,
  "silverThreshold": 40,
  "goldThreshold": 50
}
```

### 7b. Import from Unity

Extract province medal data from Unity project and convert to JSON format.
Store in `data/medals/province-medals.json`.

### 7c. Medal loader

Update medal loading system to support province medals.
When loading a province medal, generate questions for all provinces in that country.

**Files to create:**
- `data/medals/province-medals.json`

**Files to modify:**
- Medal loader module (wherever medals are loaded)

**Verify**: Load a province medal, verify question generation works for all 32 countries.

---

## Phase 8: Polish

- **Province outline**: Tube outline around hovered/selected province (reuse `OutlineRenderer`)
- **Camera transition**: Smooth zoom into country when entering province quiz
- **Mixed quiz**: Support quizzes mixing country + province questions with automatic view transitions
- **Cache eviction**: If memory becomes an issue, evict oldest province state (LRU)
- **Performance optimization**: Monitor memory usage with all province data loaded

---

## File Summary

### Phase 0: Quad Strip Migration

| New files | Purpose |
|-----------|---------|
| `src/earth-globe/shaders/border-quad.vertex.glsl` | Quad strip animated border shader with tangent expansion |

| Modified files | Changes |
|----------------|---------|
| `src/earth-globe/border-renderer.ts` | Add quad strip generator, replace tube rendering |
| `src/earth-globe/shader-factory.ts` | Support quad border material with lineThickness uniform |

### Phase 1: US States Data

| New files | Purpose |
|-----------|---------|
| `scripts/extract-us-provinces.ts` | Extract US provinces only, assign integer IDs |
| `scripts/generate-us-segments.ts` | Generate US province border segments |
| `scripts/test-us-provinces.ts` | CLI verification for US data |
| `public/provinces/US.json` | 50 US states with integer IDs |
| `public/province-segments/US.json` | US state border segments |

### Phase 2-5: Province Rendering & Quiz Integration

| New files | Purpose |
|-----------|---------|
| `src/earth-globe/province-border-renderer.ts` | Mode A: quad strip mesh generation + zoom uniform updates |
| `src/earth-globe/shaders/province-border.vertex.glsl` | Static province border: altitude + Z-offset + tangent expansion |
| `src/earth-globe/shaders/province-border.fragment.glsl` | Solid color with alpha uniform |
| `src/earth-globe/province-quiz-renderer.ts` | Mode B: full country-like province meshes |
| `public/test-us-states.html` | Browser test page for US states quiz (Phase 4) |

**Shaders reused from Phase 0:**
| Shader | How it's reused |
|--------|----------------|
| `border-quad.vertex.glsl` | Used for animated province borders (Mode B) - same shader, different texture binding |

### Phase 6: Scale to All Provinces

| New files | Purpose |
|-----------|---------|
| `scripts/extract-provinces.ts` | Extract all 32 countries with provinces |
| `scripts/generate-province-segments.ts` | Generate segments for all countries |
| `public/provinces/*.json` | 32 province data files |
| `public/province-segments/*.json` | 32 segment files |

### Phase 7: Medal Import

| New files | Purpose |
|-----------|---------|
| `data/medals/province-medals.json` | Province medal definitions |

### Modified Files (across all phases)

| Modified files | Changes |
|----------------|---------|
| `src/earth-globe/animation-texture.ts` | Add optional `width` parameter to constructor (Phase 3) |
| `src/earth-globe/types.ts` | ProvinceJSON, ProvinceData types; EarthGlobeAPI extensions (Phase 3-4) |
| `src/earth-globe/constants.ts` | Province constants + zoom values (Phase 2-3) |
| `src/earth-globe/earth-globe.ts` | Province quiz entry/exit, border overlay, animation API, render loop (Phase 4) |
| `src/earth-globe/index.ts` | Export province types and functions (Phase 4) |
| `src/shared/quiz/quiz-types.ts` | `"province"` answer tag, province StepOps + Steps (Phase 5) |
| `src/shared/quiz/quiz-flow.ts` | Province question step generation (Phase 5) |
| `src/shared/quiz/quiz-runner.ts` | Province step execution handlers (Phase 5) |
| `package.json` | Province-related npm scripts (Phase 1, 6) |

### Reused Infrastructure

| Module | How it's reused |
|--------|----------------|
| `triangulation.ts` | CDT2D triangulation for province polygons (Mode B) |
| `geo-math.ts` | Coordinate conversion (latLonToSphere) |
| `border-renderer.ts` | Extruded border walls + quad strip segments (both countries and provinces) |
| `CountryPicker` | Separate instance for province point-in-polygon lookup (Mode B) |
| `CountryAnimator` | Separate instance for province animations, segment syncing pattern (Mode B) |
| `AnimationTexture` | Separate 256-wide instance for provinces (Mode B) |
| `ShaderFactory` | Same shaders, bound to province animation texture (Mode B) |
| `OutlineRenderer` | Province selection outline (Mode B) |
