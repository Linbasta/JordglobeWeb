# Region Unification Plan - Countries & Provinces

## Executive Summary

**Goal**: Eliminate code duplication between countries and provinces by making `RegionController` a truly reusable, independent component.

**Current State**: Countries and provinces share types and some behavior via "active region API" routing, but still have **massive duplication** in:
- Animation textures and methods
- Border rendering systems
- Segment loading logic
- Small region expansion features

**End State**: A single unified architecture where countries and provinces are just two instances of the same `RegionController` abstraction, with no special-case routing logic.

---

## Problem Analysis

### What We've Done (Past 10 Commits)

✅ **Type Unification** - `CountryData` → `RegionData`, `CountryPolygon` → `RegionPolygon`
✅ **ID Field Unification** - `iso2` → `id` (composite IDs for provinces: `"US-0"`, `"US-1"`)
✅ **RegionController Created** - Wraps renderer, animator, picker into one controller
✅ **Active Region API** - Routing methods that delegate based on `isInRegionMode()`
✅ **Province Quiz System** - Working quiz support with animations, hover, disabled states
✅ **Province Deselection Fix** - Correct altitude restore (0.2 for provinces, 0.4 for countries)

### What's Still Wrong - The Duplication

#### 1. **Dual Animation Textures & Duplicate API Methods** (BIGGEST ISSUE)

**Problem**: Every animation method is duplicated:

```typescript
// EarthGlobe has TWO animation textures
private animationTexture: AnimationTexture;           // For countries
private provinceAnimationTexture: AnimationTexture;   // For provinces

// Every method is duplicated:
setCountryAltitude(index, alt)     vs  setProvinceAltitude(index, alt)
getCountryAltitude(index)          vs  getProvinceAltitude(index)
setCountryState(index, state)      vs  setProvinceState(index, state)
getCountryState(index)             vs  getProvinceState(index)
setCountryBlend(index, blend)      vs  setProvinceBlend(index, blend)
getCountryBlend(index)             vs  getProvinceBlend(index, blend)
animateCountryBlend(...)           vs  animateProvinceBlend(...)

// Plus routing methods (Active Region API):
setActiveRegionAltitude() {
    if (isInRegionMode()) setProvinceAltitude() else setCountryAltitude()
}
```

**Why This Is Bad**:
- **3x the code** for every animation operation (country method, province method, routing method)
- **Hard to maintain** - fix a bug in country code, must remember to fix province code
- **Easy to diverge** - methods can accidentally behave differently
- **Violates DRY** - the routing layer is pure boilerplate

**Root Cause**: `RegionController` doesn't own its animation texture. EarthGlobe owns both textures and provides 36+ methods to manipulate them.

#### 2. **Border Rendering Duplication**

**Problem**: Two separate border rendering systems:

```typescript
// Province borders: province-border-renderer.ts
loadProvinceBorders(scene, iso2)
showProvinceBorders(state)
hideProvinceBorders(state)
updateProvinceBorderUniforms(state, camera)

// Country borders: BorderRenderer (in border-renderer.ts)
borderRenderer.renderSegmentBorders(...)
borderRenderer.getMergedSegmentBorders()
```

**Why This Is Bad**:
- Different APIs for the same concept
- Can't treat provinces and countries uniformly
- Province border renderer uses function-based API, country uses class-based

#### 3. **Segment Loading Duplication**

**Problem**: Two nearly-identical functions:

```typescript
// segment-loader.ts
loadSegments(url)           // For countries
loadProvinceSegments(url)   // For provinces - 90% the same code!
```

**Why This Is Bad**:
- Same algorithm, different JSON structure handling
- Bug fixes must be duplicated
- Could be one function with a format parameter

#### 4. **Small Region Features Only Work for Countries**

**Problem**: Expansion and markers only for countries:

```typescript
// region-selection.ts
if (!globe.isInRegionMode() && globe.isSmallCountry(country.regionIndex)) {
    globe.animateCountryExpansion(country.regionIndex, 5.0, 300);
    globe.hideSmallCountryMarker(country.regionIndex);
}
```

**Why This Is Bad**:
- Small provinces (e.g., Rhode Island, Vatican City equivalent) can't use expansion
- Inconsistent behavior - users notice the difference
- Special-case logic scattered everywhere

#### 5. **Controller Switching Instead of Polymorphism**

**Problem**: `activeController` switches instead of unified API:

```typescript
// EarthGlobe
private activeController!: RegionController;  // switches between country/province

// Switching logic in enterRegionMode/exitRegionMode
enterRegionMode(iso2) {
    this.activeController = this.provinceController;
}

exitRegionMode() {
    this.activeController = this.countryController;
}
```

**Why This Is Bad**:
- EarthGlobe still has 36+ duplicate methods despite having controllers
- Controllers can't be used independently
- The API doesn't reflect the architecture

---

## The Root Cause

The architecture treats countries and provinces as **two separate systems** that happen to share some code via routing, rather than **one unified system with two instances of the same abstraction**.

**What we said we wanted**:
> "I want to structure the code so if we refine one, the same behavior applies to the other."

**What we actually have**:
- Routing layer that duplicates every call: `if (inRegionMode) doProvince() else doCountry()`
- Two animation textures owned by EarthGlobe instead of by controllers
- Separate border rendering systems
- Feature parity gaps (small regions only work for countries)

---

## Tests to Write First

**Philosophy**: Write tests that **capture current working behavior** before refactoring. These tests will catch regressions during the unification.

### Test Suite 1: Province Quiz Behavior (`test:province-quiz-behavior`)

**File**: `scripts/test-province-quiz-behavior.ts`

**What to test** (based on fixes from past commits):

1. **Enter/Exit Region Mode**
   - ✓ Entering US region mode enables US provinces
   - ✓ Non-US provinces are disabled (greyed out)
   - ✓ Parent country (US) is hidden (altitude 0, disabled state)
   - ✓ Exiting region mode restores parent country
   - ✓ Exiting region mode hides all provinces

2. **Province Animation**
   - ✓ `animateCorrectRegion()` works for provinces (blend + altitude animation)
   - ✓ `animateWrongRegion()` works for provinces
   - ✓ `animateToDisabledRegion()` works for provinces
   - ✓ `animateToClearedAfterRevealRegion()` works for provinces

3. **Province Deselection Altitude** (commit `c709d33`)
   - ✓ Province hover raises to 0.5
   - ✓ Province hover-away restores to **0.2** (not 0.4!)
   - ✓ Country hover-away restores to **0.4**

4. **Province ID Matching** (commit `0799542`)
   - ✓ Province IDs are composite: `"US-0"`, `"US-1"`, etc.
   - ✓ Segment borders use correct province IDs
   - ✓ Hover/click detection uses province IDs

**How to run**: `npm run test:province-quiz-behavior`

### Test Suite 2: Province Segment Borders (`test:province-segments`)

**File**: `scripts/test-province-segments.ts`

**What to test** (based on commit `ab62398`):

1. **Dynamic Segment Loading**
   - ✓ Entering US region mode loads `/province-segments/US.json`
   - ✓ Segments are cached (second enter doesn't reload)
   - ✓ Province animation texture resizes to include segments
   - ✓ Segment animations sync with province altitudes

2. **Segment Animation Mapping**
   - ✓ Segment borders for province 0 animate with province 0
   - ✓ Shared segments between provinces 0 and 1 animate with both

3. **Correct ID Format**
   - ✓ Segments reference numeric province IDs (0, 1, 2...)
   - ✓ RegionData uses composite IDs (`"US-0"`, `"US-1"`)
   - ✓ Border renderer correctly maps IDs

**How to run**: `npm run test:province-segments`

### Test Suite 3: Country vs Province Parity (`test:country-province-parity`)

**File**: `scripts/test-country-province-parity.ts`

**What to test**:

1. **Animation API Parity**
   - ✓ All 7 animation functions work for countries
   - ✓ All 7 animation functions work for provinces
   - ✓ Animation durations are identical
   - ✓ Easing curves are identical

2. **State Management Parity**
   - ✓ `setState(NORMAL)` works identically
   - ✓ `setState(DISABLED)` works identically
   - ✓ `setState(CLEARED)` works identically
   - ✓ Blend animations work identically

3. **Hover/Selection Parity**
   - ✓ Hover altitude raise (0.5) works for both
   - ✓ Outline rendering works for both
   - ✓ Click detection works for both

**How to run**: `npm run test:country-province-parity`

### Test Suite 4: Medal System Integration (`test:medal-integration`)

**File**: `scripts/test-medal-integration.ts`

**What to test** (based on commit `340dcfc`):

1. **Province Medal Loading**
   - ✓ All 68 province medals load correctly
   - ✓ Province IDs match between medals.json and province data
   - ✓ Medal menu shows correct country groupings

2. **Province Medal Playability**
   - ✓ Entering region mode for medal country works
   - ✓ Medal provinces are enabled, others disabled
   - ✓ Quiz runner handles province questions
   - ✓ Answer validation works

**How to run**: `npm run test:medal-integration`

---

## Multi-Phase Refactoring Plan

### Phase 0: Write Tests (FIRST!)

**Goal**: Lock in current behavior before changing anything.

**Tasks**:
1. ✅ Write `test:province-quiz-behavior` - Province quiz system
2. ✅ Write `test:province-segments` - Segment border loading
3. ✅ Write `test:country-province-parity` - Animation parity
4. ✅ Write `test:medal-integration` - Medal system

**Success Criteria**: All tests pass on current code.

**Estimated Time**: 4-6 hours

---

### Phase 1: Controller Independence - Own Your Texture

**Goal**: Make `RegionController` own its animation texture, removing the first layer of duplication.

#### Changes

**1.1 - RegionController owns AnimationTexture**

```typescript
// region-controller.ts
export class RegionController {
    private animationTexture: AnimationTexture;  // NOW OWNED BY CONTROLLER

    constructor(type: RegionType, scene: Scene, shaderFactory: ShaderFactory) {
        this.animationTexture = new AnimationTexture(scene);
        this.shaderFactory.setAnimationTexture(this.animationTexture.getTexture());
        // ...
    }
}
```

**1.2 - Add public animation methods to RegionController**

```typescript
// region-controller.ts
export class RegionController {
    // Direct access (instant)
    setAltitude(index: number, altitude: number): void {
        this.animator.setAltitude(index, altitude);
        this.animationTexture.update();
    }

    getAltitude(index: number): number {
        return this.animator.getAltitude(index);
    }

    setState(index: number, state: number): void {
        this.animator.setState(index, state);
        this.animationTexture.update();
    }

    getState(index: number): number {
        return this.animator.getState(index);
    }

    setBlend(index: number, blend: number): void {
        this.animator.setBlend(index, blend);
        this.animationTexture.update();
    }

    getBlend(index: number): number {
        return this.animator.getBlend(index);
    }

    // Animated (async)
    animateAltitude(index, target, duration, easing?): Promise<void>
    animateBlend(index, target, duration, easing?): Promise<void>
    animateExpansion(index, target, duration, easing?): Promise<void>
}
```

**1.3 - EarthGlobe delegates to controllers**

```typescript
// earth-globe.ts
export class EarthGlobe {
    // Remove duplicate methods, expose controllers directly
    getCountryController(): RegionController { return this.countryController; }
    getProvinceController(): RegionController { return this.provinceController; }

    // Keep ONLY the routing methods (for backward compat)
    setActiveRegionAltitude(index: number, altitude: number): void {
        this.activeController.setAltitude(index, altitude);
    }

    // REMOVE: setCountryAltitude, setProvinceAltitude (use controller directly)
}
```

**Migration Path**:
- EarthGlobe API stays compatible (routing methods still work)
- New code uses `globe.getCountryController().setAltitude()` directly
- Old code using `globe.setActiveRegionAltitude()` still works
- We can deprecate routing methods later

**Test Verification**: Run all Phase 0 tests - they should still pass.

**Estimated Time**: 6-8 hours

---

### Phase 2: Unified Border Rendering

**Goal**: Remove `province-border-renderer.ts`, use `BorderRenderer` for both countries and provinces.

#### Changes

**2.1 - Extend BorderRenderer to handle province borders**

```typescript
// border-renderer.ts
export class BorderRenderer {
    // Already has:
    renderSegmentBorders(segmentData, regionsData, material, animationIndexOffset)

    // Add province-style static borders:
    renderStaticBorders(segmentData: SegmentData, material: ShaderMaterial): void {
        // Simplified version without animation indices
        // Used for province outline overlays (Mode A borders)
    }
}
```

**2.2 - Replace province-border-renderer.ts calls**

```typescript
// earth-globe.ts - BEFORE
const state = await loadProvinceBorders(this.scene, iso2);
showProvinceBorders(state);

// earth-globe.ts - AFTER
await this.provinceController.loadStaticBorders(`/province-segments/${iso2}.json`);
this.provinceController.showStaticBorders();
```

**2.3 - Delete province-border-renderer.ts**

**Test Verification**: `test:province-segments` should pass.

**Estimated Time**: 4-5 hours

---

### Phase 3: Unified Segment Loading

**Goal**: One segment loader function, not two.

#### Changes

**3.1 - Merge loadSegments and loadProvinceSegments**

```typescript
// segment-loader.ts
export async function loadSegments(
    url: string,
    format: 'country' | 'province' = 'country'
): Promise<SegmentData> {
    const response = await fetch(url);
    const rawData = await response.json();

    let segments2D: Segment2D[];

    if (format === 'province') {
        // Province format: { country: "US", segments: [...] }
        segments2D = rawData.segments.map(seg => ({
            points: seg.points.map(p => ({ lat: p[0], lon: p[1] })),
            regions: seg.provinces.map(id => id.toString()),
            type: seg.type
        }));
    } else {
        // Country format: [...segments...]
        segments2D = rawData.map(seg => ({
            points: seg.points,
            regions: seg.regions || seg.countries,
            type: seg.type
        }));
    }

    // Rest is identical...
}
```

**3.2 - Update callers**

```typescript
// region-controller.ts
async loadSegments(url: string, animationIndexOffset: number): Promise<void> {
    const format = this.type === 'province' ? 'province' : 'country';
    this.segmentData = await loadSegments(url, format);
    // ...
}
```

**3.3 - Delete loadProvinceSegments**

**Test Verification**: `test:province-segments` should pass.

**Estimated Time**: 2-3 hours

---

### Phase 4: Small Regions (Expansion + Markers) — DEFERRED to Phase 7

**Status**: ⏸️ **DEFERRED** - Attempted and reverted. See Phase 7 for detailed analysis.

**Goal**: Small region expansion works for both countries and provinces.

#### Changes

**4.1 - Add small region detection to RegionController**

```typescript
// region-controller.ts
export class RegionController {
    private smallRegionIndices: Set<number> = new Set();

    isSmallRegion(regionIndex: number): boolean {
        return this.smallRegionIndices.has(regionIndex);
    }

    markSmallRegion(regionIndex: number): void {
        this.smallRegionIndices.add(regionIndex);
    }
}
```

**4.2 - Add small region expansion to RegionController**

```typescript
// region-controller.ts
export class RegionController {
    animateExpansion(index: number, target: number, durationMs: number, easing?): Promise<void> {
        return this.animator.animateExpansion(index, target, durationMs, easing);
    }

    setExpansion(index: number, value: number): void {
        this.animator.setExpansion(index, value);
    }
}
```

**4.3 - Update region-selection.ts to work for both**

```typescript
// region-selection.ts
export function handleHover(globe: EarthGlobeAPI, region: RegionPolygon | null, _latLon: LatLon): void {
    const controller = globe.getActiveController();

    if (controller.isSmallRegion(region.regionIndex)) {
        controller.animateExpansion(region.regionIndex, 5.0, 300);
        globe.hideSmallRegionMarker(region.regionIndex);  // Still on EarthGlobe for now
    }
}
```

**4.4 - Detect small provinces**

```typescript
// small-countries.ts → small-regions.ts
export function isSmallRegion(region: RegionData, allRegions: RegionData[]): boolean {
    // Same area-based logic, works for both countries and provinces
}
```

**Test Verification**: Manually test small province expansion (e.g., Rhode Island).

**Estimated Time**: 5-6 hours

---

### Phase 5: Expose Controllers, Deprecate Routing

**Goal**: Public API uses controllers directly. Remove "active region" routing layer.

#### Changes

**5.1 - EarthGlobeAPI exposes controllers**

```typescript
// earth-globe/index.ts
export interface EarthGlobeAPI {
    // New API (direct access)
    getCountryController(): RegionController;
    getProvinceController(): RegionController;
    getActiveController(): RegionController;  // Returns country or province based on mode

    // Deprecated (routing layer - keep for backward compat)
    /** @deprecated Use getActiveController().setAltitude() */
    setActiveRegionAltitude(index: number, altitude: number): void;
    /** @deprecated Use getActiveController().setState() */
    setActiveRegionState(index: number, state: number): void;
    // ... all other routing methods marked deprecated
}
```

**5.2 - Update region-animations.ts**

```typescript
// region-animations.ts - BEFORE
export function animateCorrectRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    globe.setActiveRegionState(regionIndex, STATE_CLEARED);
    // ...
    globe.setActiveRegionAltitude(regionIndex, altitude);
}

// region-animations.ts - AFTER
export function animateCorrectRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_CLEARED);
    // ...
    controller.setAltitude(regionIndex, altitude);
}
```

**5.3 - Update quiz runner, medal system, etc.**

**5.4 - Mark routing methods as deprecated**

**Test Verification**: All Phase 0 tests pass. No console warnings.

**Estimated Time**: 8-10 hours

---

### Phase 6: Remove Deprecated Routing Methods

**Goal**: Clean up EarthGlobe, remove all routing boilerplate.

#### Changes

**6.1 - Remove all deprecated methods**

Delete from `earth-globe.ts`:
- `setCountryAltitude()`, `setProvinceAltitude()`, `setActiveRegionAltitude()`
- `getCountryAltitude()`, `getProvinceAltitude()`, `getActiveRegionAltitude()`
- `setCountryState()`, `setProvinceState()`, `setActiveRegionState()`
- `getCountryState()`, `getProvinceState()`, `getActiveRegionState()`
- `setCountryBlend()`, `setProvinceBlend()`, `setActiveRegionBlend()`
- `getCountryBlend()`, `getProvinceBlend()`, `getActiveRegionBlend()`
- `animateCountryBlend()`, `animateProvinceBlend()`, `animateActiveRegionBlend()`

**Before**: ~1200 lines
**After**: ~800 lines (33% reduction!)

**6.2 - Clean up EarthGlobe fields**

```typescript
// earth-globe.ts
export class EarthGlobe {
    // Remove these:
    // private animationTexture: AnimationTexture;
    // private provinceAnimationTexture: AnimationTexture;
    // private countryRenderer: RegionRenderer;
    // private countryAnimator: RegionAnimator;
    // private countryPicker: RegionPicker;

    // Keep only:
    private countryController: RegionController;
    private provinceController: RegionController;
    private activeController: RegionController;
}
```

**Test Verification**: All Phase 0 tests pass.

**Estimated Time**: 4-5 hours

---

### Phase 7: Small Province Expansion (DEFERRED - Needs Full Analysis)

**Status**: ❌ **NOT READY** - Incomplete understanding of requirements

**History**: This phase was attempted after Phase 3 but failed due to multiple architectural issues. Reverted via git reset to commit 218943d.

#### What Works for Countries

Small country expansion (e.g., Vatican, Singapore, Monaco) uses a sophisticated pipeline:

1. **Shader System**: Two vertex shaders
   - `animated.vertex.glsl`: Regular countries (reads altitude from R channel)
   - `animated-small.vertex.glsl`: Small countries (reads altitude + expansion from RGBA)

2. **Polygon Classification**: During region loading
   - `polygon.isSmall` flag set based on area calculation
   - Flags must be set **before** `mergeRegions()` call
   - Material pipeline: `mergeRegions(regularMaterial, smallMaterial)` buckets polygons

3. **Centroid Computation**
   - Small countries compute `regionData.centroid` for expansion pivot point
   - Centroid becomes `countryPivot` vertex attribute in shader
   - Regular countries have `centroid = null`

4. **Animation Texture Encoding**
   - RGBA texture stores: altitude (R), state (G), blend (B), expansion (A)
   - Expansion stored as `expansion / 4.0` in alpha channel
   - Small shader reads all 4 channels, regular shader reads only R

5. **Segment Border Synchronization**
   - Border segments use `border-quad.vertex.glsl` shader
   - Segments animate with **altitude only**, not expansion
   - This is correct behavior - borders don't magnify, only raise/lower

6. **Marker System**
   - Small countries show/hide marker icons above centroid
   - Marker visibility controlled by `hideSmallCountryMarker()` / `showSmallCountryMarker()`
   - Markers expand/contract with expansion animation

#### What's Broken for Provinces

Attempted quick fix for Rhode Island expansion failed. Multiple issues discovered:

1. **Wrong Shader**: Provinces use regular shader only
   - Current: `mergeRegions(provinceMaterial, provinceMaterial)` (both same)
   - Required: `mergeRegions(provinceMaterial, provinceSmallMaterial)` (two buckets)

2. **Polygon Classification Timing**: `polygon.isSmall` flag not set before merge
   - Must identify small provinces during loading
   - Must set flags before `mergeRegions()` call
   - Current code only marks countries as small

3. **Missing Centroids**: Small provinces don't compute centroids
   - `countryPivot` vertex attribute undefined for provinces
   - Expansion uses (0,0,0) as pivot instead of region center
   - Results in wrong expansion origin

4. **Animation Texture Encoding**: Province texture might not encode expansion correctly
   - Need to verify alpha channel is written for provinces
   - Check if small province shader reads expansion value

5. **Segment Border Shader**: Province segments need altitude animation support
   - Check if province segments use correct shader
   - Verify they animate with altitude (not expansion)

6. **Marker System**: Province markers don't exist yet
   - No equivalent to `hideSmallCountryMarker()` for provinces
   - Marker pool needs province support

#### Root Cause Analysis

The small region expansion system is deeply integrated into the rendering pipeline:
- Shader compilation (2 separate shaders)
- Vertex attribute generation (`countryPivot`)
- Material bucketing during merge
- Animation texture format (RGBA vs R)
- Marker system integration

**This is not a surface-level feature** - it affects 6+ subsystems. A proper implementation requires:
1. Deep understanding of the shader pipeline
2. Vertex attribute generation system
3. Material merging and bucketing logic
4. Animation texture encoding scheme
5. Segment border rendering architecture
6. Marker pool and visibility system

#### Why Deferring

**User feedback**: "I think we should revert and try again later, because this is far from a working solution... Border segments are not following along with the expansion. Which they should and do, which make me suspect you are duplicating a lot of code otherwise it should work as countries do. Also the expansion is to extreme and doesn't even look like the county equivalents. The extruded region wall doesn't seem to behave in the correct way either."

**Analysis**: The user is correct. The quick fix approach was shallow:
- Attempted to add province detection without understanding the full shader pipeline
- Created duplicate materials without proper bucketization
- Didn't verify vertex attributes, centroid computation, segment shaders
- Multiple rendering issues indicate missing architectural understanding

**Proper approach**: After completing Phases 5-6 (controller exposure + routing removal), return to this with:
1. Full shader pipeline audit (both countries and provinces)
2. Vertex attribute comparison (what provinces lack vs countries)
3. Material system deep dive (bucketing, merging, compilation)
4. Animation texture format verification
5. Test all 6 subsystems independently
6. Implement in correct sequence with proper validation

**Estimated Time**: 10-12 hours (after other phases complete)

---

## Success Criteria

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **EarthGlobe methods** | ~120 | ~70 | -42% |
| **EarthGlobe lines** | ~1200 | ~800 | -33% |
| **Animation API duplication** | 3x (country, province, routing) | 1x | -67% |
| **Border renderer systems** | 2 (separate) | 1 (unified) | -50% |
| **Segment loader functions** | 2 | 1 | -50% |

### Functional Goals

✅ **Full parity** - Countries and provinces have identical feature sets
✅ **No routing layer** - Controllers used directly, no `if (inRegionMode)` boilerplate
✅ **Small regions work** - Expansion + markers work for both countries and provinces
✅ **Independent controllers** - Each controller is self-contained and reusable
✅ **Tests pass** - All Phase 0 tests continue passing throughout refactor

### Developer Experience

✅ **Single mental model** - "A region has altitude, state, blend" (same for countries and provinces)
✅ **Add feature once** - New features automatically work for both
✅ **Fix bugs once** - No need to duplicate fixes across country/province code
✅ **Clear API** - `controller.setAltitude()` instead of `globe.setActiveRegionAltitude()`

---

## Risk Mitigation

### Risks

1. **Breaking changes** - Refactoring could break existing quizzes/medals
2. **Performance regression** - Extra indirection could slow rendering
3. **Incomplete migration** - Some code still uses old routing API

### Mitigation Strategies

1. **Write tests first** (Phase 0) - Catch regressions immediately
2. **Incremental migration** - Each phase is independently testable
3. **Backward compatibility** - Keep routing methods as deprecated during migration
4. **Manual testing** - Test quiz pages after each phase
5. **Performance measurement** - Use perf overlay to check FPS before/after

---

## Timeline Estimate

| Phase | Tasks | Time | Cumulative |
|-------|-------|------|------------|
| **Phase 0** | Write 4 test suites | 4-6 hours | 6 hours |
| **Phase 1** | Controller owns texture | 6-8 hours | 14 hours |
| **Phase 2** | Unified border rendering | 4-5 hours | 19 hours |
| **Phase 3** | Unified segment loading | 2-3 hours | 22 hours |
| **Phase 4** | Small regions support | 5-6 hours | 28 hours |
| **Phase 5** | Expose controllers, deprecate routing | 8-10 hours | 38 hours |
| **Phase 6** | Remove deprecated code | 4-5 hours | 43 hours |

**Total: 40-45 hours** (5-6 full work days)

---

## Next Steps

1. **Review this plan** - Discuss with team, adjust phases if needed
2. **Start Phase 0** - Write tests to lock in current behavior
3. **Execute phases sequentially** - Don't skip ahead
4. **Verify at each checkpoint** - Run tests + manual quiz testing
5. **Commit after each phase** - Clear git history of the migration

---

## Notes

- **Handmade Philosophy**: This refactor removes abstraction layers, not adds them. The goal is simpler, more direct code.
- **No backward compatibility shims**: Clean breaks are fine in exploratory phase.
- **Tests are critical**: Without Phase 0 tests, we'll introduce subtle bugs that are hard to catch.
- **User-visible benefit**: After this refactor, small provinces (e.g., Rhode Island, Singapore) will expand on hover just like small countries.
