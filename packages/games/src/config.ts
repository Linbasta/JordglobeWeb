/**
 * Environment Configuration
 * Auto-detects dev vs production and provides correct URLs
 */

export interface EnvironmentConfig {
    isDevelopment: boolean;
    isProduction: boolean;
    websocketUrl: string;
    baseUrl: string;
    apiUrl: string;
    streamServerUrl: string;
}

/**
 * Build-time gated: `import.meta.env.DEV` is replaced with a literal boolean by
 * Vite, so the dead branch (and any URLs inside it) is stripped from the prod
 * bundle. The dev API URL comes from `.env.local` (gitignored) — never source.
 */
function detectEnvironment(): EnvironmentConfig {
    const hostname = window.location.hostname;
    const port = window.location.port;

    if (import.meta.env.DEV) {
        return {
            isDevelopment: true,
            isProduction: false,
            websocketUrl: `ws://${hostname}:3003`,
            baseUrl: `http://${hostname}:${port || 4817}`,
            apiUrl: import.meta.env.PUBLIC_DEV_API_URL || 'http://127.0.0.1:8000/graphql',
            streamServerUrl: `http://${hostname}:3004`,
        };
    }

    return {
        isDevelopment: false,
        isProduction: true,
        websocketUrl: `wss://${hostname}`,
        baseUrl: `https://${hostname}`,
        apiUrl: 'https://api.jordglobe.com/graphql',
        streamServerUrl: 'https://stream.jordglobe.com',
    };
}

// Export singleton config
export const config = detectEnvironment();

// For debugging
if (config.isDevelopment) {
    console.log('[Config] Running in DEVELOPMENT mode');
    console.log('[Config] WebSocket URL:', config.websocketUrl);
    console.log('[Config] Base URL:', config.baseUrl);
} else {
    console.log('[Config] Running in PRODUCTION mode');
    console.log('[Config] WebSocket URL:', config.websocketUrl);
    console.log('[Config] Base URL:', config.baseUrl);
}
