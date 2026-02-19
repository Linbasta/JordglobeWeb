# Remaining Work - Country Animations Branch

## Current Status

✅ **Province segment borders WORKING** - Fixed region mapping bug (iso2 vs numeric ID)
✅ **Province outlines WORKING** - Use correct animation texture
✅ **Province quiz system COMPLETE** - Full quiz support with animations, hover, disabled states
✅ **Active region API** - Unified system for countries and provinces
✅ **CLAUDE.md updated** - Added quiz vs test page definitions
✅ **Test quiz working** - test-province-quiz.html verified (5 states, 45 disabled)

## Completed Tasks (Latest Session)

### ✅ Province Quiz Implementation

**What was implemented:**
1. **Active Region API** - Generic methods that route to country/province controllers
   - `getActiveRegionState()`, `setActiveRegionBlend()`, `setActiveRegionAltitude()`
   - `getActiveRegionPolygons()`, `getActivePicker()`
   - `animateActiveRegionBlend()` - Fixed blend animation for provinces

2. **Unified Animations** - All 7 animation functions work for both countries and provinces
   - `animateCorrectRegion()`, `animateWrongRegion()`, `animateShowCorrectRegion()`
   - `animateToClearedAfterRevealRegion()`, `animateToDisabledRegion()`
   - `setRegionDisabledImmediate()`, `animateToNormalRegion()`

3. **Province Question Type** - Added to quiz-types.ts
   ```typescript
   answer: 'province'
   provinceId: number
   countryISO2: string  // Which country the province belongs to
   ```

4. **Quiz Runner Support**
   - `EnterRegionMode` / `ExitRegionMode` step operations
   - Province answer handling with correct/wrong animations
   - Disabled province filtering (only quiz provinces are clickable)

5. **Pin Manager Fix** - Uses callback to get active picker (routes to provinces in region mode)

6. **Hover/Selection Fix** - Region selection uses active region API for state/altitude

**Test Results:**
- ✅ 5-state US quiz working (California, Texas, Florida, New York, Alaska)
- ✅ 45 other states disabled and greyed out (matching Northern Europe medal behavior)
- ✅ Hover highlights correct provinces
- ✅ Click detection works for provinces
- ✅ Wrong answer animation: arc + camera fly + reveal correct province
- ✅ Correct provinces grey out after being revealed (blend animation working)
- ✅ All animations identical to country quiz behavior

**Commit:** `e8c9245` - "Add province quiz support with unified region animation system"

## Immediate Next Steps

### 1. ✅ Refactor Quiz System - Remove Auto Name Resolution (COMPLETE)

**Commit:** `c1c42c0` - "Remove auto name resolution from quiz system"

**What was done:**
- Removed auto-resolution code from `start-quiz-game.ts`
- Updated `country-quiz.html` with explicit country name mapping
- Updated file comment to reflect new behavior
- Verified all quiz files have explicit prompts

**Benefits:**
- More explicit and predictable
- Simpler code (no special cases)
- Questions are self-contained

### 2. ✅ Create Production US States Quiz (COMPLETE)

**Commit:** `36030d6` - "Add production US States quiz with all 50 states"

**What was created:**
- `us-states-quiz.html` - Complete 50-state quiz
- Extracted all state names and IDs from `public/provinces/US.json`
- States 0-49 (Alabama through Wyoming)
- Percentage score shown on completion

**To play:**
```
http://localhost:4817/us-states-quiz.html
```

**Data structure:**
- All 50 states with correct IDs and names
- Uses province quiz system (enters region mode for US)
- Identical pattern to other quiz pages

## Later Steps (Major Refactoring)

### 3. Full Rename (CountryData → RegionData)

**Motivation:** "We should not make use of iso2, we should have a common id field instead"

**What to rename:**
- `CountryData` → `RegionData`
- `countryIndex` → `regionIndex`
- `countryISO2` → `regionId` (or keep for backward compat)
- Update all references throughout codebase

**Files affected:** Many files in `/src/earth-globe/`

**Approach:**
- Do one rename at a time
- Commit after each rename to track progress
- Test after each step

### 4. Unify ID Field

**Current:**
- Countries: `iso2` field (string like "US", "SE")
- Provinces: numeric `id` field (0-49)

**Goal:**
- Single `id` field for both
- Consistent data structure
- Eliminates bugs like the segment mapping issue we just fixed

**Approach:**
- Decide on ID format (string? number? both?)
- Update data structures
- Update all lookups and comparisons
- May need migration/conversion code

### 5. Import All Province Medals

**Current medal system:**
- Location: `/public/medals.json`
- Types: `"countries"`, `"capitals"`, `"locations"`
- Format:
```json
{
  "id": 0,
  "name": "Africa Countries",
  "type": "countries",
  "questionIds": ["ZA", "NG", "EG", ...]
}
```

**Add province medals:**
- Add new type: `"provinces"`
- Import province medal data
- Format:
```json
{
  "id": X,
  "name": "US States - Northeast",
  "type": "provinces",
  "questionIds": [31, 20, 6, ...]  // Province IDs
}
```

**Source data locations:**
- `data/legacy/medal_definitions.json` - Legacy medal data with BossType="Provinces"
- `data/legacy/medal_format.md` - Documentation of legacy medal format
- `data/legacy/locations_en.json` - Location/province names and IDs

**What's needed:**
- Extract province medals from legacy data (filter by BossType="Provinces")
- Convert to new format (questionIds, type, etc.)
- Update medal system to support `type: "provinces"`
- Update medal UI to handle province questions
- Enter region mode when playing province medals

## Known Issues

None currently! Province system is working.

## Notes

- **Quiz = Pin placement UI** (never direct clicking!)
- **Test page = One-off functionality testing** (any UI is fine)
- Always check CLAUDE.md before creating quizzes
- Wait for user verification before committing
