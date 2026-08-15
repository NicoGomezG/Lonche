export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INSTAGRAM_ACCESS_TOKEN: string; // token semilla, solo se usa si instagram_token está vacía
  SYNC_KEY: string; // protege el endpoint manual /sync
}

interface TokenRow {
  id: number;
  access_token: string;
  expires_at: string;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function supabaseHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function getStoredToken(env: Env): Promise<TokenRow> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/instagram_token?select=id,access_token,expires_at&order=id.desc&limit=1`,
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) {
    throw new Error(`No se pudo leer instagram_token: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as TokenRow[];
  if (rows.length > 0) return rows[0];

  // Primera vez: no hay fila todavía, la sembramos con el token inicial del secret.
  const seeded: TokenRow = {
    id: 0,
    access_token: env.INSTAGRAM_ACCESS_TOKEN,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/instagram_token`, {
    method: 'POST',
    headers: { ...supabaseHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify({ access_token: seeded.access_token, expires_at: seeded.expires_at }),
  });
  if (!insertRes.ok) {
    throw new Error(`No se pudo sembrar instagram_token: ${insertRes.status} ${await insertRes.text()}`);
  }
  const inserted = (await insertRes.json()) as TokenRow[];
  return inserted[0];
}

async function refreshTokenIfNeeded(env: Env, token: TokenRow): Promise<string> {
  const expiresAt = new Date(token.expires_at).getTime();
  if (expiresAt - Date.now() > FIVE_DAYS_MS) {
    return token.access_token; // todavía vigente por más de 5 días
  }

  const refreshRes = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
      token.access_token
    )}`
  );
  if (!refreshRes.ok) {
    // Si falla la renovación, seguimos usando el token actual (puede que aún funcione).
    console.error('Fallo al renovar token IG:', refreshRes.status, await refreshRes.text());
    return token.access_token;
  }
  const refreshed = (await refreshRes.json()) as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const updateRes = await fetch(`${env.SUPABASE_URL}/rest/v1/instagram_token?id=eq.${token.id}`, {
    method: 'PATCH',
    headers: supabaseHeaders(env),
    body: JSON.stringify({ access_token: refreshed.access_token, expires_at: newExpiresAt, updated_at: new Date().toISOString() }),
  });
  if (!updateRes.ok) {
    console.error('Fallo al guardar token renovado:', updateRes.status, await updateRes.text());
  }
  return refreshed.access_token;
}

async function fetchInstagramMedia(accessToken: string): Promise<InstagramMedia[]> {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const res = await fetch(
    `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) {
    throw new Error(`Instagram Graph API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { data: InstagramMedia[] };
  return data.data ?? [];
}

async function upsertPosts(env: Env, posts: InstagramMedia[]): Promise<void> {
  if (posts.length === 0) return;

  const rows = posts.map((p) => ({
    media_id: p.id,
    caption: p.caption ?? null,
    media_type: p.media_type,
    media_url: p.media_url ?? null,
    thumbnail_url: p.thumbnail_url ?? null,
    permalink: p.permalink ?? null,
    timestamp: p.timestamp ?? null,
    synced_at: new Date().toISOString(),
  }));

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/instagram_posts?on_conflict=media_id`, {
    method: 'POST',
    headers: { ...supabaseHeaders(env), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`No se pudo hacer upsert de instagram_posts: ${res.status} ${await res.text()}`);
  }
}

async function runSync(env: Env): Promise<{ synced: number }> {
  const token = await getStoredToken(env);
  const accessToken = await refreshTokenIfNeeded(env, token);
  const posts = await fetchInstagramMedia(accessToken);
  await upsertPosts(env, posts);
  return { synced: posts.length };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runSync(env).catch((err) => console.error('instagram-sync scheduled failed:', err))
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/sync' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }
    if (request.headers.get('x-sync-key') !== env.SYNC_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }
    try {
      const result = await runSync(env);
      return Response.json(result);
    } catch (err) {
      console.error('instagram-sync manual failed:', err);
      return Response.json({ error: 'sync failed' }, { status: 500 });
    }
  },
};
