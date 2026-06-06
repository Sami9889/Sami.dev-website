// Cloudflare Worker to add security headers for sami-s.dev
// Deploy this at: https://dash.cloudflare.com -> Workers & Pages -> Create Worker

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Fetch the original response from GitHub Pages
  const response = await fetch(request)

  // Create a new response with the same content but modified headers
  const newResponse = new Response(response.body, response)

  // Add security headers
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

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value)
  })

  return newResponse
}
