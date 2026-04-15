       9 +/// <summary>
      10 +/// Exported medal definitions from GEO2020.
      11 +///
      12 +/// The JSON has two top-level arrays:
      13 +///
      14 +/// "Medals" — flat list of every medal definition.
      15 +///   Each entry is a self-contained quiz/challenge ("question pack") the player can attempt.
      16 +///   Fields:
      17 +///     QuestionPackId   — Unique string ID for this medal (e.g. "us-states", "world-flags").
      18 +///     Name             — Display name shown in the UI.
      19 +///     BossType         — Game mode as a string. Determines how the quiz plays:
      20 +///                          "Regions"    — tap the correct region on the map
      21 +///                          "Countries"  — tap the correct country on the map
      22 +///                          "Provinces"  — tap the correct province/state on the map
      23 +///                          "Flags"      — identify the correct flag
      24 +///                          "Capitals"   — locate the capital city on the map
      25 +///                          "Cities"     — locate a city on the map
      26 +///                          "Locations"  — locate a point of interest on the map
      27 +///                          "Space"      — identify planets/moons in the solar system
      28 +///                          "Letters"    — letter-based quiz mode
      29 +///     IsOneOff         — If true, the medal has no spaced-repetition cooldown; it can be
      30 +///                        replayed immediately. Used for special/bonus medals.
      31 +///     ShowProvinces    — If true, province borders are drawn on the map during this quiz.
      32 +///     RegionTooltip    — If true, a tooltip with the region name is shown on hover/tap.
      33 +///     CustomZoomMin    — Minimum camera zoom level for this medal's map view.
      34 +///                        -1 means "use the default zoom" (sentinel for null).
      35 +///     EnabledCountryIso2s — ISO 3166-1 alpha-2 country codes that are highlighted/interactive
      36 +///                           on the map for this medal. null if not country-scoped.
      37 +///     QuestionIds      — Ordered list of question IDs in this medal's quiz.
      38 +///                        These reference questions defined elsewhere in the content system.
      39 +///     FrameRegionIds   — Region IDs used to frame the camera view for this medal.
      40 +///                        null if the medal doesn't define a custom frame.
      41 +///
      42 +/// "Menu" — recursive tree describing the medal menu hierarchy.
      43 +///   Mirrors the in-app navigation: continent → country/sub-region → individual medals.
      44 +///   8 root items: North America, South America, Europe, Africa, Asia, Oceania, World, Solar System.
      45 +///   Each node has:
      46 +///     Name    — Display name for this menu entry.
      47 +///     MedalId — If this node is a leaf (playable medal), the QuestionPackId. Empty string if
      48 +///               this node is a category/folder.
      49 +///     SubMenu — Child nodes. null if this is a leaf medal with no children.
      50 +///   A node can have BOTH a MedalId and a SubMenu (e.g. "Europe" is itself a playable medal
      51 +///   AND contains sub-regions like Italy, Germany, etc.).
      52 +/// </summary>
