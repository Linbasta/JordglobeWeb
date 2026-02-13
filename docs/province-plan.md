# Province Implementation Plan

## Context

We're adding provinces (states/regions) to the Babylon.js globe. Province polygon data is already available in `data/legacy/locations_en.json` (exported from our Unity project). 32 countries have province data (715 provinces total).

Province data serves **two distinct rendering modes**:

### Mode A: Static Border Overlay (location questions)

When `answer` is `"location-guess"` or `"location-alternatives"`, the globe landmass is static. Province borders are drawn on top as a visual reference — no province surfaces, no animation texture, no picking. Just border tubes with a simple shader and zoom-based alpha fade.

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

## Phase 1: Data Pipeline

**Goal**: Extract province polygon data from the legacy locations file and generate province border segments.

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

### 1b. Extract provinces

Write `scripts/extract-provinces.ts` — reads `data/legacy/locations_en.json`, filters by `locationType === "Province"`, groups by `countryIso2s`, and writes per-country JSON files to `public/provinces/{ISO2}.json`.

Output format:
```json
{
  "country": "US",
  "provinces": [
    { "id": "5db71ac4-...", "name": "Alabama", "paths": "[[[lat,lon],...],...]" }
  ]
}
```

This is a simple filter+group — no coordinate conversion needed since the paths format is already identical to the country data.

### 1c. Generate province segments

Write `scripts/generate-province-segments.ts` — reuses the edge-matching algorithm from `scripts/generate-segments.ts` but operates within one country's provinces. Output: `public/province-segments/{ISO2}.json` with same segment format (but `provinces` field instead of `countries`).

### 1d. CLI test

Write `scripts/test-province-data.ts` — loads one province file, prints polygon counts, runs segment generation, verifies output.

**Files to create:**
- `scripts/extract-provinces.ts`
- `scripts/generate-province-segments.ts`
- `scripts/test-province-data.ts`
- `public/provinces/` directory
- `public/province-segments/` directory

**Verify**: `npm run test:province-data` prints stats for a sample country.

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

**Verify**: Browser test — load province borders for SE, zoom in/out, borders fade in when close and disappear when far.

---

## Phase 3: Province Quiz Renderer (Mode B)

**Goal**: Load province data on demand, triangulate, create full country-like meshes that replace the parent country.

### 3a. Types

Add to `src/earth-globe/types.ts`:
```typescript
interface ProvinceJSON {
    id: string;       // UUID from Unity: "5db71ac4-29df-4570-8004-76e91208a177"
    name: string;     // "Alabama"
    paths: string;    // same format as CountryJSON.paths
}

interface ProvinceFileJSON {
    country: string;  // ISO2: "US"
    provinces: ProvinceJSON[];
}

interface ProvinceData {
    id: string;           // UUID from source data
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
- **Segment border quad strips** — same mesh format as Mode A (position + tangent with ±0.5 bitangent), but with an **animated vertex shader**:
  - `objectIndex` stored in UV0.x (segment's index into the province animation texture)
  - Vertex shader samples per-segment altitude from the animation texture
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
- `src/earth-globe/shaders/province-border-animated.vertex.glsl` (extends static shader with animation texture lookup — fragment shader is the same solid color)

**Files to modify:** `src/earth-globe/types.ts`, `src/earth-globe/constants.ts`, `src/earth-globe/animation-texture.ts` (width parameter)

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

**Files to modify:** `src/earth-globe/earth-globe.ts`, `src/earth-globe/types.ts` (EarthGlobeAPI), `src/earth-globe/index.ts` (exports)

**Verify**: Browser test — `globe.enterProvinceQuiz("US")` hides US, shows state meshes that animate like countries. `globe.showProvinceBorders("SE")` shows static borders that fade with zoom.

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
    provinceId?: string      // UUID: "5db71ac4-29df-4570-8004-76e91208a177"
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

## Phase 6: Polish

- **Province outline**: Tube outline around hovered/selected province (reuse `OutlineRenderer`)
- **Camera transition**: Smooth zoom into country when entering province quiz
- **Mixed quiz**: Support quizzes mixing country + province questions with automatic view transitions
- **Cache eviction**: If memory becomes an issue, evict oldest province state (LRU)
- **Province borders in location quiz**: Decide which countries show province borders for location questions

---

## File Summary

| New files | Purpose |
|-----------|---------|
| `scripts/extract-provinces.ts` | Filter+group provinces from `locations_en.json` |
| `scripts/generate-province-segments.ts` | Province border segment generator |
| `scripts/test-province-data.ts` | CLI data verification test |
| `src/earth-globe/province-border-renderer.ts` | Mode A: quad strip mesh generation + zoom uniform updates |
| `src/earth-globe/shaders/province-border.vertex.glsl` | Altitude + Z-offset + tangent-based thickness expansion |
| `src/earth-globe/shaders/province-border.fragment.glsl` | Solid color with alpha uniform |
| `src/earth-globe/province-quiz-renderer.ts` | Mode B: full country-like province meshes |
| `src/earth-globe/shaders/province-border-animated.vertex.glsl` | Animated border: per-segment altitude from texture lookup |
| `public/provinces/*.json` | Province polygon data (~50 files) |
| `public/province-segments/*.json` | Province border segments (~50 files) |

| Modified files | Changes |
|----------------|---------|
| `src/earth-globe/animation-texture.ts` | Add optional `width` parameter to constructor |
| `src/earth-globe/types.ts` | ProvinceJSON, ProvinceFileJSON, ProvinceData types; EarthGlobeAPI extensions |
| `src/earth-globe/constants.ts` | Province constants + zoom values |
| `src/earth-globe/earth-globe.ts` | Province quiz entry/exit, border overlay, animation API, render loop |
| `src/earth-globe/index.ts` | Export province types and functions |
| `src/shared/quiz/quiz-types.ts` | `"province"` answer tag, province StepOps + Steps |
| `src/shared/quiz/quiz-flow.ts` | Province question step generation |
| `src/shared/quiz/quiz-runner.ts` | Province step execution handlers |
| `package.json` | Province-related npm scripts |

| Reused as-is | Role |
|--------------|------|
| `triangulation.ts` | CDT2D triangulation (Mode B only) |
| `geo-math.ts` | Coordinate conversion |
| `CountryPicker` | Province point-in-polygon lookup (Mode B, new instance) |
| `ShaderFactory` | Province shader materials (Mode B, same shaders, different texture) |
| `CountryAnimator` | Province animator (Mode B, new instance) — segment syncing pattern (max of adjacent, expansion hiding) reused for province segments |
| `OutlineRenderer` | Province selection outline (Mode B) |
