// Cloudflare Worker to add security headers for sami-s.dev
// Deploy this at: https://dash.cloudflare.com -> Workers & Pages -> Create Worker

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  const securityHeaders = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.github.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.github.com https://ghchart.rshah.org https://formsubmit.co; frame-ancestors 'none'; upgrade-insecure-requests; require-trusted-types-for 'script'; trusted-types default",
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless'
  }

  function applyHeaders(response) {
    const headers = new Headers(response.headers)
    Object.entries(securityHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }

  if (pathname.match(/\.(md|markdown)$/i)) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'X-Robots-Tag': 'noindex, nofollow',
        ...securityHeaders
      }
    })
  }

  const response = await fetch(request)

  if (response.status === 404 && request.method === 'GET' && !pathname.match(/\.[a-z0-9]+$/i)) {
    const indexResponse = await fetch(new URL('/index.html', request.url))
    return applyHeaders(indexResponse)
  }

  return applyHeaders(response)
}
