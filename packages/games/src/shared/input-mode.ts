/**
 * Input mode — cursor (hover/click) vs pin (drag-and-place).
 *
 * Default per device:
 *   desktop (hover + fine pointer) → cursor
 *   touch / coarse pointer         → pin
 *
 * The user can override via the settings menu; the choice is persisted in
 * localStorage. The mode is read once at startup and cached, so changes
 * require a page reload to take effect.
 */

const STORAGE_KEY = 'input-mode';

export type InputMode = 'cursor' | 'pin';

let cachedDesktop: boolean | null = null;
let cachedMode: InputMode | null = null;

export function isDesktopInput(): boolean {
    if (cachedDesktop !== null) return cachedDesktop;
    cachedDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return cachedDesktop;
}

export function getInputMode(): InputMode {
    if (cachedMode !== null) return cachedMode;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'cursor' || stored === 'pin') {
            cachedMode = stored;
            return stored;
        }
    } catch {
        // localStorage unavailable — fall through to default
    }
    cachedMode = isDesktopInput() ? 'cursor' : 'pin';
    return cachedMode;
}

export function setInputMode(mode: InputMode): void {
    cachedMode = mode;
    try {
        localStorage.setItem(STORAGE_KEY, mode);
    } catch {
        // ignore
    }
}

export function useCursorMode(): boolean {
    return getInputMode() === 'cursor';
}
