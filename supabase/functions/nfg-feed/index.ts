// nfg-feed — read-only Supabase REST proxy for the deployed NFG dashboard.
//
// WHY THIS EXISTS
//   In dev, the Vite server proxy (vite.config.js → /nfg) rewrites requests to
//   Supabase and injects the service key server-side. That proxy does NOT exist
//   in a production build (Amplify serves static files only), so the dashboard's
//   relative /nfg/rest/v1/* calls 404. This edge function is the production
//   stand-in: it holds the service key as a secret and forwards read requests to
//   PostgREST, so the key never reaches the browser.
//
// CONTRACT
//   GET  <fn>/<table>?<postgrest-query>   →  <TARGET>/rest/v1/<table>?<query>
//   Only GET is allowed (read, never own). Range / Range-Unit / Prefer headers
//   are forwarded (needed for paging + exact counts); content-range is exposed
//   back to the browser.
//
// DEPLOY (recommended: to the Braind engine project, so the client DB is never
// touched — the function just reads the client REST API over the network):
//   supabase functions deploy nfg-feed --no-verify-jwt --project-ref <REF>
//   supabase secrets set \
//     NFG_SUPABASE_URL=https://siabytqhreilqhngptyz.supabase.co \
//     NFG_SERVICE_KEY=<service_role key> \
//     --project-ref <REF>
//
//   --no-verify-jwt makes it callable from the browser without shipping any key.
//   The dashboard is already a public page, so a public read-only endpoint is the
//   same risk profile; set NFG_ALLOW_ORIGIN to your Amplify URL to scope CORS.

const TARGET = Deno.env.get('NFG_SUPABASE_URL')   // e.g. https://siabytqhreilqhngptyz.supabase.co
const KEY = Deno.env.get('NFG_SERVICE_KEY')       // service_role key — server-side only
const ALLOW_ORIGIN = Deno.env.get('NFG_ALLOW_ORIGIN') || '*'

const cors = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, range, range-unit, prefer, accept, x-client-info',
  'Access-Control-Expose-Headers': 'content-range, content-location, content-type',
  'Vary': 'Origin',
}

// Everything after the function-name segment is the PostgREST path + query.
function restPath(reqUrl: string): string {
  const u = new URL(reqUrl)
  const segs = u.pathname.split('/').filter(Boolean) // e.g. ["functions","v1","nfg-feed","inbox_messages"]
  const idx = segs.indexOf('nfg-feed')
  const rest = idx >= 0 ? segs.slice(idx + 1) : segs
  return rest.join('/') + u.search
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed (read-only proxy)' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  if (!TARGET || !KEY) {
    return new Response(JSON.stringify({ message: 'Proxy not configured: set NFG_SUPABASE_URL and NFG_SERVICE_KEY' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const target = `${TARGET}/rest/v1/${restPath(req.url)}`
  const headers = new Headers({
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    Accept: req.headers.get('accept') || 'application/json',
  })
  for (const h of ['range', 'range-unit', 'prefer']) {
    const v = req.headers.get(h)
    if (v) headers.set(h, v)
  }

  let upstream: Response
  try {
    upstream = await fetch(target, { method: 'GET', headers })
  } catch (_e) {
    return new Response(JSON.stringify({ message: 'Upstream Supabase unreachable' }), {
      status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const out = new Headers(cors)
  for (const h of ['content-type', 'content-range', 'content-location']) {
    const v = upstream.headers.get(h)
    if (v) out.set(h, v)
  }
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: out })
})
