# Architecture Improvements Plan

## Executive Summary

**Current State**: The region unification is **complete**. Countries and provinces now use a single `RegionController` abstraction with zero duplication in animation, border rendering, and segment loading.

**Remaining Work**: Three optional improvements to further refine the architecture:
1. **Quick Win**: Consolidate direct renderer/picker usage (~2-3 hours)
2. **Feature Gap**: Small province expansion support (~10-12 hours, complex)
3. **Polish**: Generalize marker system (~4-5 hours)

---

## Achievements (Phases 1-6 Complete) ✅

### What Works Now

✅ **Controller Independence** - Each controller owns its AnimationTexture, renderer, animator, picker
✅ **Zero API Duplication** - No routing methods (`setCountryX` vs `setProvinceX`)
✅ **Unified Loaders** - Single `loadSegments()` with format parameter
✅ **Unified Borders** - Single `BorderRenderer` for both countries and provinces
✅ **Clean Public API** - All code uses `getActiveController()` directly
✅ **Full Feature Parity** - Animation, borders, segments, outlines work identically

### Code Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Animation API duplication | 3x (country, province, routing) | 1x | **-67%** |
| Border renderer systems | 2 (separate) | 1 (unified) | **-50%** |
| Segment loader functions | 2 | 1 | **-50%** |
| Routing methods in EarthGlobe | ~36 | **0** | **-100%** |
| `isInRegionMode()` calls | Many | **6** (all legitimate) | Minimal |

### Developer Experience

✅ **Single mental model** - "A region has altitude, state, blend" works universally
✅ **Add feature once** - New features automatically work for both countries and provinces
✅ **Fix bugs once** - No duplicate code paths to maintain
✅ **Clear API** - `controller.setAltitude()` instead of `globe.setActiveRegionAltitude()`

---

## Improvement 1: Consolidate Renderer/Picker Usage

**Status**: 🟡 Optional - Low priority cleanup

**Current Issue**: EarthGlobe still holds direct references to renderer/picker alongside controllers:

```typescript
// earth-globe.ts:107, 125
private countryRenderer: RegionRenderer;  // TODO: Remove after migration complete
private countryPicker: RegionPicker;     // TODO: Remove after migration complete
```

**Usage Analysis**:
- `countryRenderer`: 12 direct references
- `countryPicker`: 5 direct references
- These duplicate functionality already in `countryController`

### Changes

**1.1 - Replace direct renderer access**

```typescript
// BEFORE
return this.countryRenderer.getRegionByISO2(iso2);

// AFTER
return this.countryController.getRegionByISO2(iso2);
```

**Locations to update**:
- `getCountryByISO2()` - line 670
- `getCountryByIndex()` - line 677
- `getAllCountries()` - line 684
- `isSmallCountry()` - line 883
- `constructor()` - merge logic (lines 252, 269, 271, 274, 282, 310, 324)
- `dispose()` - line 1179

**1.2 - Replace direct picker access**

```typescript
// BEFORE
const country = this.countryPicker.getCountryAt({ lat, lon });

// AFTER
const country = this.countryController.getRegionAt({ lat, lon });
```

**Locations to update**:
- `getCountryAtLatLon()` - line 634
- `getAltitudeAtLatLon()` - line 691
- `constructor()` - collider registration (line 243)
- `setupCamera()` - collider multiplier (line 481)

**1.3 - Remove fields**

```typescript
// DELETE these from EarthGlobe:
// private countryRenderer: RegionRenderer;
// private countryPicker: RegionPicker;
```

### Benefits

- ✅ Reinforces "controller owns everything" architecture
- ✅ Removes 2 private fields from EarthGlobe
- ✅ Single source of truth for renderer/picker access
- ✅ Easier to understand data flow

### Test Verification

Run existing tests:
- `npm run test:country-province-parity`
- `npm run test:province-quiz-behavior`
- Manual quiz testing (country-quiz.html, capitals-quiz.html)

**Estimated Time**: 2-3 hours

---

## Improvement 2: Small Province Expansion

**Status**: 🔴 Complex - Requires deep shader/rendering understanding

**Goal**: Make small provinces (e.g., Rhode Island, Delaware, Singapore equivalent) expand on hover, just like small countries.

### Background: What Works for Countries

Small country expansion uses a sophisticated multi-system pipeline:

#### 1. **Dual Shader System**

**Two separate vertex shaders**:
- `animated.vertex.glsl` - Regular countries (reads altitude from R channel)
- `animated-small.vertex.glsl` - Small countries (reads altitude + expansion from RGBA)

```glsl
// animated-small.vertex.glsl (simplified)
vec4 animData = texture2D(animationTexture, vec2(u, 0.5));
float altitude = animData.r;
float expansion = animData.a * 4.0;  // Stored as expansion/4.0

// Expand from centroid
vec3 expandedPos = mix(pivotPoint, worldPosition, expansion);
```

#### 2. **Polygon Classification**

During region loading, polygons are marked as small:

```typescript
// Must happen BEFORE mergeRegions() call
for (const country of countries) {
    for (const polygonIndex of country.polygonIndices) {
        if (isSmallCountry(country)) {
            polygonsData[polygonIndex].isSmall = true;
        }
    }
}

// Material pipeline buckets polygons by shader
renderer.mergeRegions(regularMaterial, smallMaterial);
// ↑ Scans polygon.isSmall flag to assign correct material
```

#### 3. **Centroid Computation**

Small countries compute a pivot point for expansion:

```typescript
// During loading (region-renderer.ts or similar)
if (polygon.isSmall) {
    regionData.centroid = computeCentroid(polygon.borderPoints);
}
```

**Shader receives centroid as vertex attribute**:
```glsl
attribute vec3 countryPivot;  // Expansion origin
```

#### 4. **Animation Texture Encoding**

RGBA texture stores 4 channels:
- **R**: Altitude (0.0 - 1.0)
- **G**: State (STATE_NORMAL, STATE_DISABLED, STATE_CLEARED)
- **B**: Blend (color lerp factor)
- **A**: Expansion (stored as `expansion / 4.0` to fit in 0-1 range)

```typescript
// region-animator.ts
setExpansion(index: number, value: number): void {
    const offset = index * 4;
    this.data[offset + 3] = value / 4.0;  // Alpha channel
}
```

#### 5. **Segment Border Synchronization**

**Border segments use separate shader** (`border-quad.vertex.glsl`):
- Animates with **altitude only**, not expansion
- This is correct - borders raise/lower but don't magnify
- Prevents visual artifacts where borders grow disproportionately

#### 6. **Marker System**

Small countries show icon markers above their centroid:

```typescript
// When hovering small country
hideSmallCountryMarker(countryIndex);  // Hide icon
animateExpansion(countryIndex, 5.0, 300);  // Magnify region
```

### What's Broken for Provinces

Attempted quick fix for Rhode Island expansion **failed**. Root causes:

#### 1. **Wrong Shader** 🔴

**Current**:
```typescript
// Province rendering uses single shader for all
provinceController.mergeRegions(provinceMaterial, provinceMaterial);
//                               ^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^
//                               both same - no small shader!
```

**Required**:
```typescript
const provinceMaterial = shaderFactory.createCountryShaderMaterial();
const provinceSmallMaterial = shaderFactory.createSmallCountryShaderMaterial();
provinceController.mergeRegions(provinceMaterial, provinceSmallMaterial);
```

#### 2. **Polygon Classification Timing** 🔴

**Current**: `polygon.isSmall` flag is **never set** for provinces

**Required**: Must identify and mark small provinces during loading:
```typescript
// In province loading code (BEFORE mergeRegions)
for (const province of provinces) {
    if (isSmallProvince(province, allProvinces)) {  // Need this function
        for (const polygonIndex of province.polygonIndices) {
            polygonsData[polygonIndex].isSmall = true;
        }
    }
}
```

#### 3. **Missing Centroids** 🔴

**Current**: Small provinces don't compute `centroid`

**Impact**:
- `countryPivot` vertex attribute is undefined
- Shader uses `(0,0,0)` as expansion origin (center of Earth!)
- Wrong expansion behavior

**Required**: Compute centroids for small provinces during loading

#### 4. **Animation Texture Encoding** 🟡

**Uncertain**: Need to verify:
- Does province animation texture encode expansion correctly?
- Is alpha channel written for provinces?
- Does small province shader read expansion value?

#### 5. **Segment Border Shader** 🟡

**Uncertain**: Need to verify:
- Do province segments use correct shader?
- Do they animate with altitude (not expansion)?
- Are segment animation indices correct?

#### 6. **Marker System** 🔴

**Current**: Province markers don't exist

**Required**:
- Extend `LocationMarkerPool` to support provinces
- Add `hideSmallProvinceMarker()` / `showSmallProvinceMarker()` methods
- Province marker pool needs to be created in `enterRegionMode()`

### Root Cause Analysis

The small region expansion system is **deeply integrated** into the rendering pipeline. It's not a surface-level feature - it touches:

1. **Shader compilation** (2 separate shaders)
2. **Vertex attribute generation** (`countryPivot`)
3. **Material bucketing** during merge
4. **Animation texture format** (RGBA vs R)
5. **Marker system integration**
6. **Polygon classification** during loading

**This is a 6+ subsystem change**, not a simple flag flip.

### Implementation Plan

#### Phase A: Research & Verification (3-4 hours)

**A.1 - Shader Pipeline Audit**

1. Read shader source files:
   - `animated.vertex.glsl` (regular)
   - `animated-small.vertex.glsl` (small)
   - `border-quad.vertex.glsl` (segments)

2. Understand vertex attribute flow:
   - How is `countryPivot` generated?
   - Where is it assigned to vertices?
   - How does it reach the shader?

3. Document expansion formula:
   - How does shader use `countryPivot`?
   - What's the expansion scale factor?
   - Why divide by 4.0?

**A.2 - Material System Deep Dive**

1. Understand `mergeRegions()` in `region-renderer.ts`:
   - How does it bucket polygons by `isSmall` flag?
   - When is `polygon.isSmall` set for countries?
   - Where does vertex attribute assignment happen?

2. Trace material compilation:
   - `shaderFactory.createCountryShaderMaterial()` vs `createSmallCountryShaderMaterial()`
   - Which uniforms/attributes differ?
   - How are animation textures bound?

**A.3 - Animation Texture Verification**

1. Check `RegionAnimator`:
   - Does `setExpansion()` work correctly?
   - Is alpha channel written to texture?
   - How is data uploaded to GPU?

2. Test expansion encoding:
   - Write test: set expansion to 5.0, verify alpha = 1.25 (5.0/4.0)
   - Verify texture update triggers shader read

**A.4 - Centroid Computation**

1. Find where country centroids are computed
2. Understand centroid algorithm (weighted average? geometric center?)
3. Identify where to add province centroid computation

**A.5 - Small Region Detection**

1. Read `small-countries.ts`:
   - How does `isSmallCountry()` work?
   - What threshold is used? (area-based? perimeter?)
   - Can we reuse for provinces?

2. Create `isSmallProvince()`:
   ```typescript
   export function isSmallProvince(province: RegionData, allProvinces: RegionData[]): boolean {
       // Same area-based logic as countries
       return calculateArea(province) < SMALL_REGION_THRESHOLD;
   }
   ```

#### Phase B: Implementation (6-8 hours)

**B.1 - Add Small Province Detection**

```typescript
// small-regions.ts (rename from small-countries.ts)
export function isSmallRegion(region: RegionData, allRegions: RegionData[]): boolean {
    // Unified small region detection (countries and provinces)
    const area = calculateRegionArea(region);
    return area < SMALL_REGION_THRESHOLD;
}
```

**B.2 - Mark Small Provinces During Loading**

```typescript
// In province loading code (earth-globe.ts or region-controller.ts)
async loadFromItems(...) {
    // ... load provinces ...

    const provinces = this.renderer.getRegionsData();
    const polygonsData = this.renderer.getPolygonsData();

    // Mark small provinces BEFORE mergeRegions
    for (const province of provinces) {
        if (isSmallRegion(province, provinces)) {
            // Compute centroid
            province.centroid = computeCentroid(province, polygonsData);

            // Mark polygons as small
            for (const polygonIndex of province.polygonIndices) {
                polygonsData[polygonIndex].isSmall = true;
            }
        }
    }

    // NOW merge with dual materials
    const provinceMaterial = this.provinceShaderFactory.createCountryShaderMaterial(texture);
    const provinceSmallMaterial = this.provinceShaderFactory.createSmallCountryShaderMaterial(texture);
    this.renderer.mergeRegions(provinceMaterial, provinceSmallMaterial);
}
```

**B.3 - Create Small Province Material**

```typescript
// shader-factory.ts
createSmallCountryShaderMaterial(texture: Texture): ShaderMaterial {
    // This already exists for countries - verify it works with provinces
    // May need to adjust namePrefix handling
}
```

**B.4 - Add Province Marker Pool**

```typescript
// earth-globe.ts
private smallProvinceMarkers: Map<number, number> = new Map();

// In enterRegionMode() - create marker pool for provinces
if (!this.provinceMarkerPool) {
    this.provinceMarkerPool = new LocationMarkerPool(this.scene, {
        maxMarkers: 50,
        modelPath: '/models/location-pin.glb',
        defaultScale: 0.05
    });
}

hideSmallProvinceMarker(provinceIndex: number): void {
    const markerId = this.smallProvinceMarkers.get(provinceIndex);
    if (markerId !== undefined && this.provinceMarkerPool) {
        this.provinceMarkerPool.hide(markerId);
    }
}
```

**B.5 - Verify Segment Shader**

```typescript
// Check province segment borders use correct shader
// Should animate with altitude only (not expansion)
// Verify in border-renderer.ts or segment loading code
```

**B.6 - Update Region Selection**

```typescript
// region-selection.ts
export function handleHover(globe: EarthGlobeAPI, region: RegionPolygon | null, latLon: LatLon): void {
    const controller = globe.getActiveController();

    // Check if small region (works for both countries and provinces)
    if (globe.isSmallRegion(region.regionIndex)) {
        controller.animateExpansion(region.regionIndex, 5.0, 300);

        // Hide marker (works for both)
        if (globe.isInRegionMode()) {
            globe.hideSmallProvinceMarker(region.regionIndex);
        } else {
            globe.hideSmallCountryMarker(region.regionIndex);
        }
    }
}
```

#### Phase C: Testing & Refinement (1-2 hours)

**C.1 - Manual Testing**

1. Load US provinces
2. Hover over Rhode Island (index 39)
3. Verify:
   - ✓ Expansion animation triggers
   - ✓ Region magnifies from correct center
   - ✓ Expansion is smooth (not extreme)
   - ✓ Border walls behave correctly
   - ✓ Segment borders follow altitude (not expansion)
   - ✓ Marker icon hides

**C.2 - Visual Debugging**

If expansion looks wrong:
- Check centroid computation (add debug sphere at centroid)
- Verify `countryPivot` vertex attribute (console log in shader?)
- Check expansion scale (too extreme = wrong divisor)
- Compare to working country (e.g., Vatican City)

**C.3 - Automated Testing**

Add test for small province expansion:
```typescript
// scripts/test-small-province-expansion.ts
console.log('Testing small province expansion...');

// 1. Detect small provinces
const rhodeIsland = provinces.find(p => p.name === 'Rhode Island');
assert(isSmallRegion(rhodeIsland, provinces), 'Rhode Island should be small');

// 2. Verify centroid exists
assert(rhodeIsland.centroid !== null, 'Small province has centroid');

// 3. Verify expansion works
controller.setExpansion(rhodeIsland.regionIndex, 5.0);
const expansion = controller.getExpansion(rhodeIsland.regionIndex);
assert(expansion === 5.0, 'Expansion set correctly');
```

### Risks

1. **Shader complexity** - May need to modify shaders if province uniforms differ
2. **Vertex attribute mismatch** - `countryPivot` name might be hardcoded for countries
3. **Performance** - Dual material pipeline increases draw calls (negligible impact expected)
4. **Visual quality** - Expansion might look wrong for irregularly-shaped provinces

### Success Criteria

✅ Small provinces (Rhode Island, Delaware) expand on hover
✅ Expansion origin is correct (visual center of province)
✅ Expansion scale matches small countries (not too extreme)
✅ Border walls render correctly during expansion
✅ Segment borders animate with altitude only
✅ Marker icons hide/show correctly
✅ No performance regression

**Estimated Time**: 10-12 hours (3-4 research + 6-8 implementation + 1-2 testing)

---

## Improvement 3: Generalize Marker System

**Status**: 🟡 Optional - Nice to have

**Goal**: Move small region marker management into `RegionController` instead of EarthGlobe.

### Current Architecture

```typescript
// earth-globe.ts
private smallCountryMarkers: Map<number, number> = new Map();

hideSmallCountryMarker(countryIndex: number): void {
    // Hardcoded for countries only
}
```

### Proposed Architecture

```typescript
// region-controller.ts
export class RegionController {
    private smallRegionMarkers: Map<number, number> = new Map();
    private markerPool: LocationMarkerPool | null = null;

    initMarkerPool(pool: LocationMarkerPool): void {
        this.markerPool = pool;
    }

    hideSmallRegionMarker(regionIndex: number): void {
        const markerId = this.smallRegionMarkers.get(regionIndex);
        if (markerId !== undefined && this.markerPool) {
            this.markerPool.hide(markerId);
        }
    }

    showSmallRegionMarker(regionIndex: number): void {
        const markerId = this.smallRegionMarkers.get(regionIndex);
        if (markerId !== undefined && this.markerPool) {
            this.markerPool.show(markerId);
        }
    }

    isSmallRegion(regionIndex: number): boolean {
        return this.smallRegionMarkers.has(regionIndex);
    }
}
```

### Benefits

- ✅ Consistent with "controller owns everything" principle
- ✅ Enables small province markers without EarthGlobe changes
- ✅ Cleaner separation of concerns
- ✅ Both controllers can manage markers independently

### Changes Required

1. Move `smallRegionMarkers` map to `RegionController`
2. Add `initMarkerPool()` to pass marker pool reference
3. Move marker methods to `RegionController`
4. Update region-selection.ts to use `controller.hideSmallRegionMarker()`

**Estimated Time**: 4-5 hours

---

## Testing Strategy

### Regression Testing

After each improvement, run:

```bash
# Automated tests
npm run test:country-province-parity
npm run test:province-quiz-behavior
npm run test:province-segments

# Manual tests
open http://localhost:4817/country-quiz.html
open http://localhost:4817/capitals-quiz.html
```

**Verify**:
- ✓ Country quizzes work normally
- ✓ Province quizzes work normally
- ✓ Animations are smooth
- ✓ No console errors
- ✓ No visual regressions

### Performance Monitoring

```typescript
// Check FPS before/after changes
// Should remain at 60 FPS
```

---

## Timeline Estimate

| Improvement | Complexity | Time | Priority |
|-------------|-----------|------|----------|
| **1. Consolidate Renderer/Picker** | Low | 2-3 hours | Optional |
| **2. Small Province Expansion** | High | 10-12 hours | Medium |
| **3. Generalize Marker System** | Medium | 4-5 hours | Optional |

**Total**: 16-20 hours if doing all improvements

---

## Recommended Approach

### Option A: Focus on Small Province Expansion

**Rationale**: This is the only **functional gap** in feature parity. The other improvements are cleanup/polish.

**Timeline**:
1. Complete Phase A research (3-4 hours)
2. Review findings, adjust implementation plan
3. Complete Phase B implementation (6-8 hours)
4. Complete Phase C testing (1-2 hours)
5. **Total: 10-14 hours**

### Option B: Quick Wins First

**Rationale**: Build confidence with low-risk changes before tackling complex shader work.

**Timeline**:
1. Improvement 1: Consolidate renderer/picker (2-3 hours)
2. Test and verify
3. Improvement 2: Small province expansion (10-12 hours)
4. **Total: 12-15 hours**

### Option C: Leave As-Is

**Rationale**: Current architecture is clean and working. Small province expansion is a **nice-to-have**, not critical.

**Decision point**: Do users expect small provinces to expand on hover?
- If **yes** → Tackle Improvement 2
- If **no** → Architecture is complete

---

## Notes

- **Handmade Philosophy**: Don't over-engineer. Only implement what's needed.
- **No backward compatibility needed**: Exploratory phase allows clean breaks
- **Tests are critical**: Phase C verification prevents regressions
- **User feedback drives priority**: If small province expansion isn't requested, defer it

---

## Success Criteria (When Complete)

✅ **Zero TODOs** in earth-globe.ts
✅ **Full feature parity** - Countries and provinces behave identically
✅ **Single mental model** - All region operations work universally
✅ **Clean architecture** - Controller owns all its dependencies
✅ **No duplication** - Fix once, works everywhere
✅ **Tests pass** - All automated tests continue passing
