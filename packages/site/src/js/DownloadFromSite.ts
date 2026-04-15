export const STORE_URLS = {
    android: "https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo",
    ios: "https://apps.apple.com/app/id1599500931",
    universal: "jordglobe://open"
} as const;

function isIOS(userAgent: string): boolean {
    return /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid(userAgent: string): boolean {
    return /Android/.test(userAgent);
}

function handleUniversalLink(isiOS: boolean): Promise<boolean> {
    return new Promise((resolve) => {
        const fallbackTimer = setTimeout(() => {
            resolve(false);
        }, 2000);

        window.addEventListener('blur', () => {
            clearTimeout(fallbackTimer);
            resolve(true);
        }, { once: true });

        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(fallbackTimer);
                resolve(true);
            }
        }, { once: true });

        window.location.href = STORE_URLS.universal;
    });
}

export async function getDownloadUrl(userAgent: string, fromSite: boolean = false): Promise<string> {
    console.log('userAgent:', userAgent);
    const isiOS = isIOS(userAgent);
    const isAndroidDevice = isAndroid(userAgent);

    // Only try universal links if coming from a mobile device and not directly from site
    if ((isiOS || isAndroidDevice) && !fromSite) {
        try {
            const appOpened = await handleUniversalLink(isiOS);
            if (appOpened) {
                return STORE_URLS.universal;
            }
        } catch (e) {
            console.warn('Universal link handling failed:', e);
        }
    }

    // Fallback to appropriate store
    if (isiOS) {
        return STORE_URLS.ios;
    } else if (isAndroidDevice || fromSite) {
        return STORE_URLS.android;
    }


    return '/';
}
