# Architecture Improvements Plan

## Executive Summary

**Current State**: The region unification is **complete**. Countries and provinces now use a single `RegionController` abstraction with zero duplication in animation, border rendering, and segment loading.

**Improvements 1 & 3**: ✅ **COMPLETE** - Renderer/picker consolidation and marker system generalization are done.

**Remaining Work**: One optional improvement to achieve full feature parity:
1. **Feature Gap**: Small province expansion support (~10-12 hours, complex)

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

**Status**: ✅ **COMPLETE**

**Completion Evidence**:
- ✅ No `countryRenderer` or `countryPicker` fields in earth-globe.ts
- ✅ All methods delegate to controllers:
  - `getCountryByISO2()` → `countryController.getRegionByISO2()` (earth-globe.ts:668)
  - `getCountryByIndex()` → `countryController.getRegionByIndex()` (earth-globe.ts:675)
  - `getAllCountries()` → `countryController.getAllRegions()` (earth-globe.ts:682)
- ✅ No TODO comments about "Remove after migration"
- ✅ Controller owns renderer and picker completely

### Implementation Summary

All direct `countryRenderer` and `countryPicker` references have been removed from EarthGlobe. Methods now delegate to `countryController.getRenderer()` and `countryController.getPicker()` as needed. This reinforces the "controller owns everything" architecture and eliminates duplicate references.

**Benefits Achieved**:
- ✅ Single source of truth for renderer/picker access
- ✅ Cleaner EarthGlobe class (removed 2 private fields)
- ✅ Consistent with controller ownership model

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

**Status**: ✅ **COMPLETE**

**Completion Evidence**:
- ✅ `RegionController` owns `smallRegionMarkers` map (region-controller.ts:53)
- ✅ All marker methods moved to `RegionController`:
  - `initMarkerPool()` (region-controller.ts:340)
  - `registerSmallRegionMarker()` (region-controller.ts:347)
  - `hideSmallRegionMarker()` (region-controller.ts:361)
  - `showSmallRegionMarker()` (region-controller.ts:371)
  - `hideAllSmallRegionMarkers()` (region-controller.ts:381)
- ✅ No `smallCountryMarkers` or `smallProvinceMarkers` in EarthGlobe
- ✅ Both controllers can manage markers independently

### Implementation Summary

Marker management has been fully moved to `RegionController`. Each controller now owns its own `smallRegionMarkers` map and provides methods to hide/show markers. The marker pool is passed via `initMarkerPool()` during initialization. This enables both country and province controllers to manage small region markers independently without EarthGlobe needing separate code paths.

**Benefits Achieved**:
- ✅ Consistent with "controller owns everything" principle
- ✅ Both controllers can manage markers independently
- ✅ Cleaner separation of concerns
- ✅ Enables small province markers without EarthGlobe changes

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

| Improvement | Complexity | Time | Status |
|-------------|-----------|------|--------|
| **1. Consolidate Renderer/Picker** | Low | 2-3 hours | ✅ **COMPLETE** |
| **2. Small Province Expansion** | High | 10-12 hours | 🔴 Remaining |
| **3. Generalize Marker System** | Medium | 4-5 hours | ✅ **COMPLETE** |

**Remaining Work**: 10-12 hours (Improvement 2 only)

---

## Recommended Approach

With Improvements 1 and 3 complete, there are now two options:

### Option A: Implement Small Province Expansion

**Rationale**: This is the only remaining **functional gap** in feature parity between countries and provinces.

**Timeline**:
1. Complete Phase A research (3-4 hours) - Understand shader pipeline, materials, centroids
2. Review findings, adjust implementation plan
3. Complete Phase B implementation (6-8 hours) - Add small province detection, dual shaders, markers
4. Complete Phase C testing (1-2 hours) - Manual and automated testing
5. **Total: 10-14 hours**

**Outcome**: Full feature parity - small provinces (Rhode Island, Delaware) expand on hover like small countries do.

### Option B: Leave As-Is

**Rationale**: Current architecture is clean and working. Small province expansion is a **nice-to-have**, not critical.

**Decision point**: Do users expect small provinces to expand on hover?
- If **yes** → Implement Option A
- If **no** → Architecture is complete ✅

---

## Notes

- **Handmade Philosophy**: Don't over-engineer. Only implement what's needed.
- **No backward compatibility needed**: Exploratory phase allows clean breaks
- **Tests are critical**: Phase C verification prevents regressions
- **User feedback drives priority**: If small province expansion isn't requested, defer it

---

## Success Criteria

### Achieved ✅

✅ **Zero TODOs** in earth-globe.ts
✅ **Single mental model** - All region operations work universally
✅ **Clean architecture** - Controller owns all its dependencies
✅ **No duplication** - Fix once, works everywhere
✅ **Tests pass** - All automated tests continue passing
✅ **Renderer/Picker consolidation** - All access goes through controllers
✅ **Marker system generalized** - Both controllers manage markers independently

### Remaining (Optional)

🔴 **Full feature parity** - Small provinces don't yet expand on hover (Improvement 2)
