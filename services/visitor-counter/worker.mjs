const uuid = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;

export function dateKeys(now = new Date()) {
  const localDay = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    today: localDay.toISOString().slice(0, 10),
    yesterday: new Date(localDay.getTime() - 86400000).toISOString().slice(0, 10),
  };
}

export async function getStats(db, visitorId = null, now = new Date()) {
  const { today, yesterday } = dateKeys(now);
  const queries = [];
  if (visitorId) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${today}:${visitorId}`));
    const hash = [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
    queries.push(db.prepare('INSERT OR IGNORE INTO visits (day, visitor_hash) VALUES (?, ?)').bind(today, hash));
  }
  queries.push(db.prepare(`SELECT
    COALESCE((SELECT value FROM counts WHERE bucket = ?), 0) AS today,
    COALESCE((SELECT value FROM counts WHERE bucket = ?), 0) AS yesterday,
    COALESCE((SELECT value FROM counts WHERE bucket = 'total'), 0) AS total`).bind(today, yesterday));
  const results = await db.batch(queries);
  return results.at(-1).results[0];
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const preview = !!env.PREVIEW_ORIGIN && origin === env.PREVIEW_ORIGIN;
    if (origin !== env.ALLOWED_ORIGIN && !preview) return new Response('Forbidden', { status: 403 });
    if (preview && !['GET', 'OPTIONS'].includes(request.method)) return new Response('Forbidden', { status: 403 });
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': preview ? 'GET, OPTIONS' : 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
    };
    const json = (body, status = 200) => Response.json(body, { status, headers });
    if (new URL(request.url).pathname !== '/') return json({ error: 'Not found' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    let visitorId = null;
    if (request.method === 'POST') {
      if (Number(request.headers.get('Content-Length')) > 256) return json({ error: 'Request too large' }, 413);
      try {
        const body = await request.text();
        if (body.length > 256) return json({ error: 'Request too large' }, 413);
        visitorId = JSON.parse(body).visitorId;
        if (typeof visitorId !== 'string' || !uuid.test(visitorId)) return json({ error: 'Invalid visitor' }, 400);
      } catch { return json({ error: 'Invalid request' }, 400); }
    }
    try { return json(await getStats(env.DB, visitorId)); }
    catch { return json({ error: 'Counter unavailable' }, 503); }
  },
};
