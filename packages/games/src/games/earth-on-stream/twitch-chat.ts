import { refreshToken } from './twitch-auth';

type MessageCallback = (username: string, text: string) => void;

let ws: WebSocket | null = null;
let onMessage: MessageCallback | null = null;
let currentToken: string | null = null;
let currentChannel: string | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalClose = false;

export function connectChat(
    token: string,
    channel: string,
    callback: MessageCallback,
): void {
    disconnectChat();
    intentionalClose = false;
    currentToken = token;
    currentChannel = channel;
    onMessage = callback;
    reconnectAttempts = 0;
    openConnection();
}

export function disconnectChat(): void {
    intentionalClose = true;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
    onMessage = null;
    currentToken = null;
    currentChannel = null;
}

export function isChatConnected(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN;
}

function openConnection(): void {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    ws.onopen = () => {
        ws!.send(`PASS oauth:${currentToken}`);
        ws!.send(`NICK ${currentChannel}`);
        ws!.send('CAP REQ :twitch.tv/tags');
        ws!.send(`JOIN #${currentChannel}`);
        reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
        const lines = (event.data as string).split('\r\n');
        for (const line of lines) {
            if (!line) continue;
            if (line.startsWith('PING')) {
                ws?.send('PONG :tmi.twitch.tv');
                continue;
            }
            handleIrcLine(line);
        }
    };

    ws.onclose = () => {
        ws = null;
        if (!intentionalClose && currentToken && currentChannel) {
            scheduleReconnect();
        }
    };

    ws.onerror = () => {
        ws?.close();
    };
}

function handleIrcLine(line: string): void {
    // Detect auth failure
    if (line.includes(':tmi.twitch.tv NOTICE * :Login authentication failed')) {
        handleAuthFailure();
        return;
    }

    // Parse PRIVMSG: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
    const privmsgMatch = line.match(/^(@\S+\s)?:\S+\sPRIVMSG\s#\S+\s:(.+)$/);
    if (!privmsgMatch) return;

    const tags = privmsgMatch[1] || '';
    const text = privmsgMatch[2];

    const displayNameMatch = tags.match(/display-name=([^;]*)/);
    const username = displayNameMatch?.[1] || 'anonymous';

    onMessage?.(username, text);
}

async function handleAuthFailure(): Promise<void> {
    if (intentionalClose) return;
    ws?.close();
    ws = null;

    const newToken = await refreshToken();
    if (newToken) {
        currentToken = newToken;
        reconnectAttempts = 0;
        openConnection();
    }
}

function scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!intentionalClose) openConnection();
    }, delay);
}
