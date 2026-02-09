/**
 * Global Configuration System
 *
 * Loads and manages application-wide configuration from config.json.
 * Supports hot-reloading for rapid iteration during development.
 */

export interface ZoomBasedConfig {
    closeValue: number;
    farValue: number;
    easing: string;
}

export interface ZoomConfig {
    threshold: number;
    pinScale: ZoomBasedConfig;
    borderThickness: ZoomBasedConfig;
    markerScale: ZoomBasedConfig;
    markerHitRadius: ZoomBasedConfig;
}

export interface GlobalConfig {
    zoom: ZoomConfig;
}

// Default configuration fallback
const DEFAULT_CONFIG: GlobalConfig = {
    zoom: {
        threshold: 20.0,
        pinScale: {
            closeValue: 75,
            farValue: 300,
            easing: 'OutSine'
        },
        borderThickness: {
            closeValue: 0.5,
            farValue: 2.0,
            easing: 'Linear'
        },
        markerScale: {
            closeValue: 1.0,
            farValue: 3.0,
            easing: 'Linear'
        },
        markerHitRadius: {
            closeValue: 0.025,
            farValue: 0.1,
            easing: 'Linear'
        }
    }
};

// Singleton config instance
let currentConfig: GlobalConfig = { ...DEFAULT_CONFIG };

/**
 * Load configuration from config.json
 */
export async function loadConfig(): Promise<GlobalConfig> {
    try {
        const response = await fetch('/config.json');
        if (!response.ok) {
            console.warn('Failed to load config.json, using defaults');
            return DEFAULT_CONFIG;
        }

        const config = await response.json() as GlobalConfig;
        currentConfig = config;
        console.log('Configuration loaded:', config);
        return config;
    } catch (error) {
        console.error('Error loading config.json:', error);
        console.warn('Using default configuration');
        return DEFAULT_CONFIG;
    }
}

/**
 * Reload configuration from config.json
 * Useful for hot-reloading during development
 */
export async function reloadConfig(): Promise<GlobalConfig> {
    console.log('Reloading configuration...');
    const config = await loadConfig();
    console.log('Configuration reloaded successfully');
    return config;
}

/**
 * Get the current configuration
 */
export function getConfig(): GlobalConfig {
    return currentConfig;
}
