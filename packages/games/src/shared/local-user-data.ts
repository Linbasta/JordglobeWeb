/**
 * localStorage keys that hold per-user state and must be wiped on sign-out so
 * the next user on the same browser doesn't inherit them.
 *
 * Device-level keys (analytics consent, locale, tutorial-seen, banner-dismissed)
 * are intentionally NOT in this list — they survive sign-out.
 */
const USER_DATA_PREFIXES = [
    'jordglobe_username_',  // username-cache.ts
    'pb_',                  // result-overlay.ts (personal-best per quiz)
]

export function clearLocalUserData(): void {
    try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && USER_DATA_PREFIXES.some(p => k.startsWith(p))) keys.push(k)
        }
        keys.forEach(k => localStorage.removeItem(k))
    } catch {
        // localStorage unavailable (private browsing, disabled, etc.)
    }
}
