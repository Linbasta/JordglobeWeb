import express from 'express';
import { createServer } from 'http';
import crypto from 'crypto';
import { upsertSession, getSession, updateRefreshToken } from './database.mjs';
import { exchangeCode, refreshAccessToken } from './twitch-api.mjs';

const PORT = process.env.PORT || 8080;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();
const server = createServer(app);

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] ${message} ${JSON.stringify(data)}`
    : `[${timestamp}] ${message}`;
  console.log(logLine);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.post('/api/twitch/token', async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (!code || !redirect_uri) {
    res.status(400).json({ error: 'code and redirect_uri required' });
    return;
  }

  log('Token exchange request', { redirect_uri });

  const result = await exchangeCode(code, redirect_uri);
  if (result.status !== 200) {
    log('Token exchange failed', result.body);
    res.status(result.status).json(result.body);
    return;
  }

  const { access_token, refresh_token, twitch_id, twitch_login, display_name } = result.body;
  const sessionKey = crypto.randomUUID();

  upsertSession(sessionKey, twitch_id, twitch_login, display_name, refresh_token);
  log('Session created', { twitch_login, display_name });

  res.status(200).json({ access_token, twitch_login, display_name, session_key: sessionKey });
});

app.post('/api/twitch/refresh', async (req, res) => {
  const { session_key } = req.body;
  if (!session_key) {
    res.status(400).json({ error: 'session_key required' });
    return;
  }

  const session = getSession(session_key);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  log('Token refresh request', { twitch_login: session.twitch_login });

  const result = await refreshAccessToken(session.refresh_token);
  if (result.status !== 200) {
    log('Token refresh failed', result.body);
    res.status(result.status).json(result.body);
    return;
  }

  updateRefreshToken(session_key, result.body.refresh_token);
  log('Token refreshed', { twitch_login: session.twitch_login });

  res.status(200).json({ access_token: result.body.access_token });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`Stream Server running on port ${PORT}`);
  log(`Environment: ${IS_PRODUCTION ? 'production' : 'development'}`);
});
