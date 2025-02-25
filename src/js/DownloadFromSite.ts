export const STORE_URLS = {
    android: "https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo",
    ios: "https://apps.apple.com/app/id1599500931"
} as const;

export function getDownloadUrl(userAgent: string, fromSite: boolean = false): string {
    if (/android/i.test(userAgent)) {
        return STORE_URLS.android;
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return STORE_URLS.ios;
    } else if (fromSite) {
        return STORE_URLS.android;
    }
    return '/';
}
