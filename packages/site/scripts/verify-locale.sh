#!/usr/bin/env bash
# Verifies that a locale is correctly wired across the monorepo.
# Run from repo root: bash packages/site/scripts/verify-locale.sh <xx>
# Or to verify every non-default locale: bash packages/site/scripts/verify-locale.sh
#
# Each check prints PASS/FAIL on its own line. Exits 0 only if every check passes.

if [[ ! -f packages/site/astro.config.mjs ]]; then
    echo "Run from the repo root (packages/site/ not found)" >&2
    exit 2
fi

# All locales registered in siteSettings.json.ts (used by cross-locale JSON checks).
# macOS bash 3.2 has no `mapfile`, so use a portable read loop.
ALL_LOCALES=()
while IFS= read -r loc; do
    ALL_LOCALES+=("$loc")
done < <(
    grep -oE '"[a-z]{2}"' packages/site/src/config/siteSettings.json.ts \
        | tr -d '"' \
        | sort -u
)

LOCALES=("$@")
if [[ ${#LOCALES[@]} -eq 0 ]]; then
    # No arg: verify every non-default registered locale.
    LOCALES=()
    for loc in "${ALL_LOCALES[@]}"; do
        [[ "$loc" != "en" ]] && LOCALES+=("$loc")
    done
fi

FAIL=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; FAIL=1; }

# Cross-locale checks (run once, not per locale)

echo "== Cross-locale checks =="

# Country code parity: every locale's block has the same 249 ISO-2 codes as en.
python3 - <<'PY' && pass "country-names: every locale has the same 249 ISO-2 codes" || fail "country-names: locale codes differ from en (see python output above)"
import re, sys
text = open('packages/games/src/shared/i18n/country-names.ts').read()
blocks = {}
for m in re.finditer(r'^    ([a-z]{2}): \{([^}]*)\}', text, re.M | re.S):
    blocks[m.group(1)] = sorted(re.findall(r'^        ([A-Z]{2}):', m.group(2), re.M))
en = set(blocks.get('en', []))
if not en:
    print("  could not find en block"); sys.exit(1)
ok = True
for loc, codes in blocks.items():
    diff = (en - set(codes)) | (set(codes) - en)
    if diff:
        print(f"  {loc} differs from en: {sorted(diff)}")
        ok = False
sys.exit(0 if ok else 1)
PY

# games-seo.json: parses, every game has every registered locale.
python3 - <<PY && pass "shared/games-seo.json: every game has every locale block" || fail "shared/games-seo.json: missing/extra locale blocks"
import json, sys
d = json.load(open('shared/games-seo.json'))
expected = set("${ALL_LOCALES[@]}".split())
ok = True
for game_id, meta in d['games'].items():
    locale_keys = set(meta.keys()) - {'baseUrlOverride', 'image', 'genre'}
    missing = expected - locale_keys
    extra = locale_keys - expected
    if missing or extra:
        print(f"  {game_id}: missing={sorted(missing)} extra={sorted(extra)}")
        ok = False
sys.exit(0 if ok else 1)
PY

# Card-link pattern: every non-default locale's gamesData.json.ts must use suffix pattern.
# Regression test for the /es/ → / bounce bug.
PREFIX_HITS=$(grep -E 'link:.*`/[a-z]{2}/games/\$\{id\}/`' packages/site/src/config/*/gamesData.json.ts || true)
if [[ -z "$PREFIX_HITS" ]]; then
    pass "gamesData link: suffix pattern /games/\${id}/xx/ used everywhere"
else
    fail "gamesData link: prefix pattern detected — these locales will bounce to /:"
    echo "$PREFIX_HITS" | sed 's/^/        /'
fi

# Per-locale checks

for XX in "${LOCALES[@]}"; do
    echo
    echo "== $XX =="

    # Locale wiring
    grep -q "\"$XX\"" packages/site/astro.config.mjs && pass "astro.config.mjs i18n.locales += $XX" || fail "astro.config.mjs missing $XX"
    grep -q "\"$XX\"" packages/site/src/config/siteSettings.json.ts && pass "siteSettings.json.ts locales += $XX" || fail "siteSettings.json.ts missing $XX in locales"
    grep -qE "^\s*$XX:\s*\"" packages/site/src/config/siteSettings.json.ts && pass "siteSettings.json.ts localeMap/languageSwitcherMap += $XX" || fail "siteSettings.json.ts missing $XX entries"
    grep -q "'$XX'" packages/site/src/config/translationData.json.ts && pass "translationData.json.ts has $XX in supportedLangs/modulesMap" || fail "translationData.json.ts missing $XX"
    grep -qE "^\s*$XX:\s*\{" packages/site/src/config/translationData.json.ts && pass "translationData.json.ts has $XX block in textTranslations/routeTranslations" || fail "translationData.json.ts missing $XX block"

    # Site config dir
    for f in siteData navData faqData gamesData testimonialData; do
        if [[ -f "packages/site/src/config/$XX/$f.json.ts" ]]; then
            pass "src/config/$XX/$f.json.ts exists"
        else
            fail "src/config/$XX/$f.json.ts MISSING"
        fi
    done

    # Resolve aboutKey from translationData.json.ts so the about page filename is verifiable.
    ABOUT_KEY=$(python3 -c "
import re
text = open('packages/site/src/config/translationData.json.ts').read()
m = re.search(r'$XX:\s*\{[^}]*aboutKey:\s*\"([^\"]+)\"', text, re.S)
print(m.group(1) if m else '')
")
    if [[ -n "$ABOUT_KEY" ]]; then
        pass "routeTranslations.$XX.aboutKey = $ABOUT_KEY"
    else
        fail "routeTranslations.$XX.aboutKey is missing"
    fi

    # Site pages dir — including about page named after aboutKey.
    EXPECTED_PAGES=("index" "404" "download" "downloadfromsite" "duel" "gdpr" "medal" "play" "__catchall__")
    for p in "${EXPECTED_PAGES[@]}"; do
        if [[ -f "packages/site/src/pages/$XX/$p.astro" ]]; then
            pass "src/pages/$XX/$p.astro exists"
        else
            fail "src/pages/$XX/$p.astro MISSING"
        fi
    done
    if [[ -f "packages/site/src/pages/$XX/[...page].astro" ]]; then
        pass "src/pages/$XX/[...page].astro exists"
    else
        fail "src/pages/$XX/[...page].astro MISSING"
    fi
    if [[ -n "$ABOUT_KEY" ]]; then
        if [[ -f "packages/site/src/pages/$XX/$ABOUT_KEY.astro" ]]; then
            pass "src/pages/$XX/$ABOUT_KEY.astro exists (matches aboutKey)"
            # Regression test: about page must be the thin AboutPage wrapper, not the markdown template.
            if grep -q "AboutPage" "packages/site/src/pages/$XX/$ABOUT_KEY.astro"; then
                pass "src/pages/$XX/$ABOUT_KEY.astro uses <AboutPage /> wrapper"
            else
                fail "src/pages/$XX/$ABOUT_KEY.astro does NOT use <AboutPage /> wrapper (would 500 in prod build)"
            fi
        else
            fail "src/pages/$XX/$ABOUT_KEY.astro MISSING (filename must match aboutKey)"
        fi
    fi

    # Card link uses suffix pattern.
    if grep -q "link: \`/games/\${id}/$XX/\`" "packages/site/src/config/$XX/gamesData.json.ts" 2>/dev/null; then
        pass "src/config/$XX/gamesData.json.ts link uses suffix pattern"
    else
        fail "src/config/$XX/gamesData.json.ts link does NOT use /games/\${id}/$XX/ pattern"
    fi

    # Shared quiz UI strings.
    grep -qE "^\s*$XX:\s*\{" packages/games/src/shared/i18n/shared-defaults.ts && pass "shared-defaults.ts has $XX block" || fail "shared-defaults.ts missing $XX block"
    grep -qE "^\s*$XX:\s*\{" packages/games/src/shared/i18n/country-names.ts && pass "country-names.ts has $XX block" || fail "country-names.ts missing $XX block"

    # Per-game i18n bundles.
    for game in euro-music-quiz euro-winners-2000s game-quiz quiz; do
        f="packages/games/src/games/$game/i18n.ts"
        if grep -q "code: '$XX'" "$f"; then
            pass "$game/i18n.ts availableLocales += $XX"
        else
            fail "$game/i18n.ts missing { code: '$XX', ... }"
        fi
    done

    # Per-game manifest SEO.
    for game in euro-music-quiz euro-winners-2000s game-quiz; do
        f="packages/games/src/games/$game/manifest.ts"
        if grep -qE "^\s*$XX:\s*\{" "$f"; then
            pass "$game/manifest.ts locales.$XX block"
        else
            fail "$game/manifest.ts missing locales.$XX"
        fi
    done

    # Quiz manifests TYPE_LABEL.
    UPPER=$(echo "$XX" | tr '[:lower:]' '[:upper:]')
    if grep -q "TYPE_LABEL_$UPPER" packages/games/src/games/quiz/quiz-manifests.ts; then
        pass "quiz-manifests.ts has TYPE_LABEL_$UPPER"
    else
        fail "quiz-manifests.ts missing TYPE_LABEL_$UPPER"
    fi
    if grep -q "locales.$XX" packages/games/src/games/quiz/quiz-manifests.ts; then
        pass "quiz-manifests.ts seoForQuiz writes locales.$XX"
    else
        fail "quiz-manifests.ts seoForQuiz does not write locales.$XX"
    fi
done

echo
if [[ $FAIL -eq 0 ]]; then
    echo "All checks passed."
    exit 0
else
    echo "Some checks failed (see FAIL lines above)."
    exit 1
fi
