# Hover Bug Investigation

## Current Status

**Date**: 2026-02-20
**Branch**: `country_animations`
**Last clean commit**: `218943d` (Phase 3: Unify segment loading)

## The Bug

**Symptom**: When dragging the mouse/pin over multiple countries or provinces, they stay elevated (altitude 0.5) instead of returning to their default altitude when the mouse moves away.

**Expected behavior**: Only the currently hovered region should be elevated. Previous regions should return to default altitude (0.4 for countries, 0.2 for provinces).

## Investigation Timeline

1. **Phase 5 work**: We completed Phase 5 (Expose Controllers, Deprecate Routing) with all tests passing (62/62)
2. **Bug discovered**: User noticed hover bug during Phase 5 testing
3. **Initial hypothesis**: Thought Phase 5 controller changes caused it
4. **Reverted Phase 5**: Used `git stash` to remove all Phase 5 changes
5. **Bug still present**: User confirmed bug exists even with clean Phase 3 code

## Conclusion

**The bug was NOT introduced by Phase 5.** It either:
- Existed before Phase 3 (older bug that went unnoticed)
- Was introduced in Phase 3 or earlier commits
- Is an environmental issue (browser cache, etc.)

## Phase 5 Status

All Phase 5 changes are **stashed** but **complete and tested**:
- Added `getCountryController()`, `getProvinceController()`, `getActiveController()` to API
- Marked 20+ routing methods as `@deprecated`
- Updated `region-animations.ts` to use controller API (tried both approaches)
- Updated `region-selection.ts` (tried both controller and routing approaches)
- All Phase 0 tests pass (62/62)

**Stash contents**: Run `git stash list` and `git stash show` to see changes

## Files Involved in Hover Behavior

- `src/shared/behaviors/region-selection.ts` - handleHover() and clearSelection()
- `src/earth-globe/earth-globe.ts` - setActiveRegionAltitude() routing method
- `src/earth-globe/region-controller.ts` - setAltitude() implementation

## Next Steps

1. **Add logging** to region-selection.ts to trace altitude changes
2. **Check git history** - find when hover deselection last worked correctly
3. **Inspect browser console** - look for errors or unexpected state
4. **Test in different mode** - does bug occur in both country and province mode?
5. **Hard refresh** browser (Cmd+Shift+R) to clear any cached code

## Recommended Git Commands

```bash
# See stashed Phase 5 changes
git stash list
git stash show

# Restore Phase 5 if bug is fixed independently
git stash pop

# Find when hover last worked (if ever)
git log --oneline --all | grep -i "hover\|selection\|altitude"
git show c709d33  # This commit fixed province deselection altitude
```

## Key Code Location

The hover deselection logic is in `src/shared/behaviors/region-selection.ts:28-42`:

```typescript
// Deselect previous if different
if (selectedIndex >= 0 && (!country || country.regionIndex !== selectedIndex)) {
    globe.clearCountryOutline();
    const state = globe.getActiveRegionState(selectedIndex);
    if (state !== STATE_CLEARED && state !== STATE_DISABLED) {
        globe.setActiveRegionAltitude(selectedIndex, defaultAlt);  // ← Should reset altitude
    }
    // ... small country expansion code ...
    selectedIndex = -1;
}
```

This code **should** be resetting the altitude but apparently isn't working.
