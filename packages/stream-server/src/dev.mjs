import { createServer } from 'http';
import crypto from 'crypto';
import { upsertSession, getSession, updateRefreshToken } from './database.mjs';
import { exchangeCode, refreshAccessToken } from './twitch-api.mjs';

const PORT = 3004;

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] ${message} ${JSON.stringify(data)}`
    : `[${timestamp}] ${message}`;
  console.log(logLine);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject();
      }
    });
  });
}

async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'healthy' });
    return;
  }

  if (url.pathname === '/api/twitch/token' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }

    const { code, redirect_uri } = body;
    if (!code || !redirect_uri) {
      sendJson(res, 400, { error: 'code and redirect_uri required' });
      return;
    }

    log('Token exchange request', { redirect_uri });

    const result = await exchangeCode(code, redirect_uri);
    if (result.status !== 200) {
      log('Token exchange failed', result.body);
      sendJson(res, result.status, result.body);
      return;
    }

    const { access_token, refresh_token, twitch_id, twitch_login, display_name } = result.body;
    const sessionKey = crypto.randomUUID();

    upsertSession(sessionKey, twitch_id, twitch_login, display_name, refresh_token);
    log('Session created', { twitch_login, display_name });

    sendJson(res, 200, { access_token, twitch_login, display_name, session_key: sessionKey });
    return;
  }

  if (url.pathname === '/api/twitch/refresh' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }

    const { session_key } = body;
    if (!session_key) {
      sendJson(res, 400, { error: 'session_key required' });
      return;
    }

    const session = getSession(session_key);
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }

    log('Token refresh request', { twitch_login: session.twitch_login });

    const result = await refreshAccessToken(session.refresh_token);
    if (result.status !== 200) {
      log('Token refresh failed', result.body);
      sendJson(res, result.status, result.body);
      return;
    }

    updateRefreshToken(session_key, result.body.refresh_token);
    log('Token refreshed', { twitch_login: session.twitch_login });

    sendJson(res, 200, { access_token: result.body.access_token });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

const server = createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  log(`Stream Server (dev) running on http://localhost:${PORT}`);
});
