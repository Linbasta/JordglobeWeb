const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || 'uazkf6crnp6yyje6uo8ke7akya993a';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

export async function exchangeCode(code, redirectUri) {
  if (!TWITCH_CLIENT_SECRET) {
    return { status: 500, body: { error: 'TWITCH_CLIENT_SECRET not configured' } };
  }

  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    return { status: 400, body: { error: 'Token exchange failed', detail: err } };
  }

  const tokens = await tokenRes.json();

  const userRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Client-Id': TWITCH_CLIENT_ID,
    },
  });

  if (!userRes.ok) {
    return { status: 400, body: { error: 'Failed to fetch user info' } };
  }

  const userData = await userRes.json();
  const user = userData.data[0];

  return {
    status: 200,
    body: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      twitch_id: user.id,
      twitch_login: user.login,
      display_name: user.display_name,
    },
  };
}

export async function refreshAccessToken(refreshToken) {
  if (!TWITCH_CLIENT_SECRET) {
    return { status: 500, body: { error: 'TWITCH_CLIENT_SECRET not configured' } };
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { status: 400, body: { error: 'Token refresh failed', detail: err } };
  }

  const tokens = await res.json();
  return {
    status: 200,
    body: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    },
  };
}
