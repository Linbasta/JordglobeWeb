import { config } from '../../config';

const TWITCH_CLIENT_ID = 'uazkf6crnp6yyje6uo8ke7akya993a';
const SCOPES = 'chat:read';

const LS_ACCESS_TOKEN = 'eos_access_token';
const LS_TWITCH_LOGIN = 'eos_twitch_login';
const LS_DISPLAY_NAME = 'eos_display_name';
const LS_SESSION_KEY = 'eos_session_key';

export interface TwitchAuth {
    accessToken: string;
    twitchLogin: string;
    displayName: string;
    sessionKey: string;
}

function getRedirectUri(): string {
    return `${config.baseUrl}/games/earth-on-stream`;
}

export function startOAuthFlow(): void {
    const params = new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: SCOPES,
    });
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params}`;
}

export async function handleOAuthRedirect(): Promise<TwitchAuth | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return null;

    window.history.replaceState({}, '', window.location.pathname);

    const res = await fetch(`${config.streamServerUrl}/api/twitch/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: getRedirectUri() }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const auth: TwitchAuth = {
        accessToken: data.access_token,
        twitchLogin: data.twitch_login,
        displayName: data.display_name,
        sessionKey: data.session_key,
    };

    storeAuth(auth);
    return auth;
}

export async function refreshToken(): Promise<string | null> {
    const sessionKey = localStorage.getItem(LS_SESSION_KEY);
    if (!sessionKey) return null;

    const res = await fetch(`${config.streamServerUrl}/api/twitch/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_key: sessionKey }),
    });

    if (!res.ok) {
        disconnect();
        return null;
    }

    const data = await res.json();
    localStorage.setItem(LS_ACCESS_TOKEN, data.access_token);
    return data.access_token;
}

export function getStoredAuth(): TwitchAuth | null {
    const accessToken = localStorage.getItem(LS_ACCESS_TOKEN);
    const twitchLogin = localStorage.getItem(LS_TWITCH_LOGIN);
    const displayName = localStorage.getItem(LS_DISPLAY_NAME);
    const sessionKey = localStorage.getItem(LS_SESSION_KEY);

    if (!accessToken || !twitchLogin || !displayName || !sessionKey) return null;
    return { accessToken, twitchLogin, displayName, sessionKey };
}

export function isConnected(): boolean {
    return getStoredAuth() !== null;
}

export function disconnect(): void {
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_TWITCH_LOGIN);
    localStorage.removeItem(LS_DISPLAY_NAME);
    localStorage.removeItem(LS_SESSION_KEY);
}

function storeAuth(auth: TwitchAuth): void {
    localStorage.setItem(LS_ACCESS_TOKEN, auth.accessToken);
    localStorage.setItem(LS_TWITCH_LOGIN, auth.twitchLogin);
    localStorage.setItem(LS_DISPLAY_NAME, auth.displayName);
    localStorage.setItem(LS_SESSION_KEY, auth.sessionKey);
}
