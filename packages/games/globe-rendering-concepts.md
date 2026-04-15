# Globe Rendering Concepts

This document defines the core rendering layers and geographic concepts used in the merged_countries globe implementation.

---

## Visual Layers (Bottom to Top)

```
┌─────────────────────────────────────────┐
│  5. Outline      (dynamic selection)    │
├─────────────────────────────────────────┤
│  4. RegionBorder (shared boundaries)    │
├─────────────────────────────────────────┤
│  3. RegionSurface (visible land)        │
├─────────────────────────────────────────┤
│  2. RegionSoil   (side walls/depth)     │
├─────────────────────────────────────────┤
│  1. Globe Base   (sphere background)    │
└─────────────────────────────────────────┘
```

---

## Rendering Layer Definitions

### RegionSurface

The **top face** of a country - the primary visual element users see and interact with.

**Characteristics:**
- Triangulated 3D mesh generated from lat/lon boundary points
- Created using Delaunay triangulation with enclave hole support
- Rendered at earth surface level (altitude 0 in mesh; shader handles displacement)
- Provides interactive, colored representation for click, hover, and selection

**Key files:**
- `Assets/_3rd-Party/GeoWpm/GeoWpmMeshGeneration.cs:162-271` - `GeoGenerateRegionSurface()` method
- `Assets/_shaders/RegionSurface.shader` - Main surface shader

---

### RegionSoil

The **side walls** that create depth beneath a region's surface, extending downward from the outline.

**Characteristics:**
- Creates vertical "soil wall" from earth surface down ~50km
- Top vertices at earth surface (topRatio = 1.0)
- Bottom vertices fixed 50km below (bottomRatio = 0.933)
- Creates the illusion of regions "sitting above" the globe

**How it differs from Surface:**
| Aspect | Surface | Soil |
|--------|---------|------|
| Position | Top face | Side walls |
| Purpose | Visual land appearance | 3D depth effect |
| Construction | Triangulated polygon | Vertical quads from outline |

**Key files:**
- `Assets/_3rd-Party/GeoWpm/GeoWpmMeshGeneration.cs:236-251` - Soil generation setup
- `Assets/_3rd-Party/GeoWpm/GeoWpmMeshGeneration.cs:290-390` - `CreateSoil()` method
- `Assets/_shaders/RegionSoil.shader` - Soil shader

---

### RegionBorder

**Pre-computed static lines** representing where two regions share a boundary.

**Characteristics:**
- Simplified line segments (country-to-country or province-to-province)
- Pre-computed offline and stored in binary files
- Loaded at startup via `BorderSaveLoadUtil2`
- Converted to line meshes at runtime via `BorderMeshGenerator`
- Can be animated based on segment mappings

**Border Types:**
1. **Country borders** - Shared boundaries between countries (animated)
2. **Province borders** - Shared boundaries within countries
3. **Region group borders** - Special regions (deserts, mountains, etc.)

**Key files:**
- `Assets/_3rd-Party/GeoWpm/RegionBorderC.cs` - Full border management
- `Assets/_3rd-Party/GeoWpm/BorderSegment.cs` - Border segment structure
- `Assets/_3rd-Party/GeoWpm/BorderMeshGenerator.cs` - Mesh generation
- `Assets/_shaders/SharedBorderAnimated.shader` - Animated border shader
- `Assets/_shaders/SharedBorderStatic.shader` - Static border shader

---

### Outline

**Dynamic per-selection boundary** generated on-the-fly when a region is selected.

**Characteristics:**
- Generated from soil mesh boundary vertices using `PathGenerator`
- Only one region can have an active outline at a time
- Thick path mesh with high-quality corner rounding
- Updates only when user selects a different region

**How it differs from Border:**
| Aspect | Border | Outline |
|--------|--------|---------|
| When created | Startup (static) | On selection (dynamic) |
| What it shows | Shared edges between regions | Single region's perimeter |
| Count | Many (all shared boundaries) | One (current selection) |
| Purpose | Show relationships | Highlight selection |

**Key files:**
- `Assets/_3rd-Party/GeoWpm/OutlineController.cs` - Full outline management
- `Assets/_3rd-Party/GeoWpm/PathGenerator.cs` - Path mesh generation
- `Assets/_shaders/RegionOutline.shader` - Outline shader

---

## Geographic Hierarchy

```
Continent (e.g., "Europe", "Asia")
    └── Country (ISO2: "FR", "US", "JP")
            └── Province (e.g., "California", "Île-de-France", "Tokyo")
                    └── Location (cities, landmarks: "Paris", "San Francisco")
```

### Countries

Sovereign or dependent territories identified by ISO2 codes.

**Characteristics:**
- Contain one or more `RegionPartM` objects (geographic subdivisions)
- Support continent assignment and sovereignty flag
- Primary gameplay unit for country-based games

**Key files:**
- `Assets/_scripts/_core/_models/_geo/CountryDatabase.cs` - Country data
- `Assets/_scripts/_core/_models/_geo/ContinentCountriesDatabase.cs` - Continent mapping

---

### Provinces

Administrative subdivisions within countries.

**Characteristics:**
- Used in advanced gameplay modes
- Support province borders (separate from country borders)
- Can be filtered and shown separately via `RegionBorderC`

**Key files:**
- `Assets/_3rd-Party/GeoWpm/ProvinceFrontierController.cs` - Province border rendering

---

### Locations

Specific places: cities, landmarks, mountains, lakes, regions of interest.

**Characteristics:**
- Have lat/lon coordinates and optional polygon paths
- Can belong to multiple countries (international locations)
- Have `parentId` field referencing country or continent
- Include metadata: type, population, wiki links, tags, region groups

**Data structure:**
```
LocationData {
    id
    nameEn
    lat, lon
    countryIso2s[]
    locationType
    population
    wikidataId
}
```

**Key files:**
- `Assets/_scripts/_core/_models/_geo/LocationData.cs` - Location structure
- `Assets/_scripts/_core/_models/_geo/LocationDatabase.cs` - Location lookup

---

## LowResCollider (Lofi Colliders)

**Fast hit detection** using circles instead of mesh colliders.

```
┌──────────────────────────────┐
│  Country Shape               │
│    ┌───┐                     │
│    │ ○ │  ← Circle approximates
│    └───┘    region for fast  │
│             raycasting       │
└──────────────────────────────┘
```

**Characteristics:**
- Each region has `CircleCollider[]` array approximating its shape
- Enables responsive click/hover without expensive mesh collision
- Scale adjusts based on zoom level (`LowResColliderScaleRange`)

**Structure:**
```
LowResCollider {
    Id
    CircleCollider[]
    IsSurrounded
}

LowResProvinceCollider extends LowResCollider {
    Name
}

CircleCollider {
    center
    radius
}
```

**Key files:**
- `Assets/_scripts/_core/_util/LowResConfig.cs:10-43` - Collider definitions
- `Assets/_scripts/_core/_models/_geo/Region.cs:55` - `LowResCollider` property

---

## Merged Mesh Architecture

All regions are combined into merged meshes for performance:

### Animation Texture System

**Country Animation Texture (RGBA channels):**
| Channel | Data | Range |
|---------|------|-------|
| R | Altitude | 0-1 (normalized to min/max range) |
| G | State | 0.0=Normal, 0.25=Disabled, 0.5=Cleared, 0.75=Locked, 1.0=Unlockable |
| B | Blend | 0-1 (state transition interpolation) |
| A | Expansion | 1.0=normal, 3.0+=expanded (small countries) |

**Border Animation Texture (R16F):**
- Single channel altitude data for animated borders

### Merged Meshes

Four merged meshes for LOD optimization:
1. `MergedRegionsSmall` - Low-poly for small countries
2. `MergedRegionsRegular` - High-poly for normal countries
3. `MergedSoilsSmall` - Soil layer (small)
4. `MergedSoilsRegular` - Soil layer (regular)

**Key files:**
- `Assets/_3rd-Party/GeoWpm/MergedMeshAnimationController.cs` - Animation hub
- `Assets/_3rd-Party/GeoWpm/RegionMesh.cs` - Region state machine
- `Assets/_3rd-Party/GeoWpm/MapMeshData.cs` - Prebaked mesh storage

---

## Region States

```
Normal      → Default playable state
Locked      → Unavailable (red rim)
Disabled    → Hidden from gameplay (desaturated)
Selected    → Highlighted with outline (elevated)
Cleared     → Successfully completed (tinted, lowered)
Unlockable  → Available to unlock (green rim)
```

---

## Small Country Expansion Animation

Small countries (e.g., Luxembourg, Monaco, Vatican) receive special expansion animation when selected to improve visibility.

### Identification

Countries are classified as "small" via a configuration list:

```csharp
// MapConfig.cs
public string[] SmallMarkerCountries;  // ISO2 codes like "LU", "MC", "VA"
```

### Expansion Factor (`_k`)

Each small country has a pre-calculated expansion factor:
- **Small countries:** `_k = 3.0` (default, 3x expansion)
- **Non-small countries:** `_k = 1.0` (no expansion)

The factor can be pre-calculated during mesh generation for custom per-country values.

### Animation Flow

```
1. User clicks small country
   └── RegionMesh.SetSelectedState()
       ├── HideMarker()           // Hide the pin/marker indicator
       ├── SetAltitude()          // Raise country up
       ├── ShowOutline()          // Show selection outline
       └── AnimateExpansion(true) // Start expansion animation

2. DOTween animates expansion: 1.0 → _k (e.g., 3.0)
   └── Each frame: _animController.SetCountryExpansion(iso2, value)
       └── Updates A channel in animation texture

3. Shader reads A channel and applies expansion from pivot:
   └── finalPos = (vertex - pivot) * expansionFactor + pivot

4. On deselect:
   └── AnimateExpansion(false) contracts _k → 1.0
       └── ShowMarker() restores the pin indicator
```

### Shader Logic (`CountryTransformations.hlsl`)

Expansion **only activates when altitude > normal altitude**:

```hlsl
if (animValue <= _NormalAltitude) {
    actualExpansion = 1.0;  // No expansion at or below normal
} else {
    actualExpansion = expansionFactor;  // Expand when raised
}

// Apply expansion from pivot point
float3 finalPos = (vertexAtAltitude - pivotAtAltitude) * actualExpansion + pivotAtAltitude;
```

### SmallCountryMarker Relationship

| State | Marker | Country Mesh |
|-------|--------|--------------|
| Not selected | Visible (pin/circle) | Normal size |
| Selected | Hidden | Expanded (_k factor) |
| Deselected | Visible again | Contracts back to 1.0 |

### Configuration

```csharp
// AnimationConfig.cs
SmallCountryExpansionDuration = 0.3f;  // Animation duration in seconds
SmallCountryExpansionEase;              // DOTween ease type (e.g., OutQuad)
```

### Key Files

| File | Purpose |
|------|---------|
| `Assets/_3rd-Party/GeoWpm/RegionMesh.cs` | `AnimateExpansion()` method, state transitions |
| `Assets/_3rd-Party/GeoWpm/MergedMeshAnimationController.cs` | `SetCountryExpansion()` updates A channel |
| `Assets/_shaders/CountryTransformations.hlsl` | GPU expansion from pivot |
| `Assets/_3rd-Party/GeoWpm/SmallCountryMarkerC.cs` | Marker show/hide logic |
| `Assets/_scripts/_core/_util/MapConfig.cs` | `SmallMarkerCountries` list |
| `Assets/_scripts/_core/_util/AnimationConfig.cs` | Duration and easing settings |

---

## Key Relationships Summary

1. **Surface + Soil** = A region's complete 3D visual representation
2. **Borders** connect neighboring regions visually (static, shared edges)
3. **Outlines** highlight the currently selected region (dynamic, full perimeter)
4. **LowResColliders** enable fast user interaction with all layers
5. **Animation Textures** drive state changes without mesh regeneration
