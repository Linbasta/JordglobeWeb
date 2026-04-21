/**
 * GDPR Consent Banner
 *
 * Minimal cookie consent banner for analytics tracking.
 * Shows once, stores choice in localStorage, never appears again.
 */

const CONSENT_KEY = 'analytics_consent';

type ConsentState = 'granted' | 'denied' | null;

/** Check if user has granted analytics consent */
export function hasAnalyticsConsent(): boolean {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
}

/** Check if user has made any consent choice */
export function hasConsentChoice(): boolean {
    return localStorage.getItem(CONSENT_KEY) !== null;
}

/** Get current consent state */
export function getConsentState(): ConsentState {
    return localStorage.getItem(CONSENT_KEY) as ConsentState;
}

/** Show consent banner if user hasn't made a choice yet */
export function showConsentBannerIfNeeded(onConsent?: (granted: boolean) => void): void {
    if (hasConsentChoice()) {
        // Already made a choice, trigger callback with current state
        onConsent?.(hasAnalyticsConsent());
        return;
    }

    const banner = document.createElement('div');
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #222;
        color: #fff;
        padding: 16px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    `;

    const text = document.createElement('span');
    text.innerHTML = 'We use cookies for analytics and YouTube embeds. See our <a href="https://jordglobe.com/gdpr-web" target="_blank" rel="noopener noreferrer" style="color: #aaa; text-decoration: underline;">privacy policy</a>.';
    text.style.textAlign = 'center';

    const btnStyle = `
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        min-width: 80px;
    `;

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accept';
    acceptBtn.style.cssText = btnStyle + 'background: #4CAF50; color: #fff;';

    const declineBtn = document.createElement('button');
    declineBtn.textContent = 'Decline';
    declineBtn.style.cssText = btnStyle + 'background: #666; color: #fff;';

    const handleChoice = (granted: boolean) => {
        localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
        banner.remove();
        onConsent?.(granted);
    };

    acceptBtn.addEventListener('click', () => handleChoice(true));
    declineBtn.addEventListener('click', () => handleChoice(false));

    banner.appendChild(text);
    banner.appendChild(acceptBtn);
    banner.appendChild(declineBtn);
    document.body.appendChild(banner);
}
