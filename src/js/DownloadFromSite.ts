import { detect } from 'detect-browser';

export const STORE_URLS = {
    android: "https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo",
    ios: "https://apps.apple.com/app/id1599500931",
    // Universal links (if configured)
    universal: "jordglobe://open"
} as const;

export function getDownloadUrl(userAgent: string, fromSite: boolean = false): string {
    const browser = detect();

    // Try universal link first if on mobile
    if ((browser?.os === 'iOS' || browser?.os === 'Android OS') && !fromSite) {
        try {
            // Attempt to open app first
            window.location.href = STORE_URLS.universal;
            // Wait briefly then redirect to store
            setTimeout(() => {
                if (browser.os === 'iOS') {
                    window.location.href = STORE_URLS.ios;
                } else {
                    window.location.href = STORE_URLS.android;
                }
            }, 500);
            return STORE_URLS.universal;
        } catch (e) {
            console.log('Universal link failed, falling back to store');
        }
    }

    // Direct store links as fallback
    if (browser?.os === 'iOS') {
        return STORE_URLS.ios;
    } else if (browser?.os === 'Android OS') {
        return STORE_URLS.android;
    } else if (fromSite) {
        return STORE_URLS.android;
    }

    return '/';
}
