/**
 * Resolve a local asset path against Vite's configured BASE_URL.
 *
 * Vite's `base` config rewrites href/src attributes and module imports during
 * build, but it does NOT touch plain string literals in JS source. Wrap any
 * hardcoded local-asset path in `asset(...)` so the same source works when
 * deployed standalone (base "/") or embedded under a subpath like
 * "/games/euro-music-quiz/".
 *
 * Accepts either leading-slash or bare forms:
 *   asset('/foo.png') and asset('foo.png') both resolve to BASE_URL + 'foo.png'.
 */
export function asset(path: string): string {
    const base = import.meta.env.BASE_URL;
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return base + clean;
}

/**
 * The BASE_URL itself (always has a trailing slash). Useful for APIs that
 * take a rootUrl + filename pair (e.g. Babylon's SceneLoader.ImportMeshAsync).
 */
export const BASE_URL = import.meta.env.BASE_URL;
