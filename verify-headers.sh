#!/bin/bash
# Verify Cloudflare security headers are deployed

echo "=== Checking Security Headers for sami-s.dev ==="
echo ""

echo "1. Content-Security-Policy:"
curl -sI https://sami-s.dev | grep -i "content-security-policy:" || echo "   ❌ Not found"
echo ""

echo "2. Strict-Transport-Security (HSTS):"
curl -sI https://sami-s.dev | grep -i "strict-transport-security:" || echo "   ❌ Not found"
echo ""

echo "3. X-Frame-Options:"
curl -sI https://sami-s.dev | grep -i "x-frame-options:" || echo "   ❌ Not found"
echo ""

echo "4. X-Content-Type-Options:"
curl -sI https://sami-s.dev | grep -i "x-content-type-options:" || echo "   ❌ Not found"
echo ""

echo "5. Referrer-Policy:"
curl -sI https://sami-s.dev | grep -i "referrer-policy:" || echo "   ❌ Not found"
echo ""

echo "6. Permissions-Policy:"
curl -sI https://sami-s.dev | grep -i "permissions-policy:" || echo "   ❌ Not found"
echo ""

echo "7. Cross-Origin-Opener-Policy (COOP):"
curl -sI https://sami-s.dev | grep -i "cross-origin-opener-policy:" || echo "   ❌ Not found"
echo ""

echo "8. Cross-Origin-Embedder-Policy (COEP):"
curl -sI https://sami-s.dev | grep -i "cross-origin-embedder-policy:" || echo "   ❌ Not found"
echo ""

echo "=== Summary ==="
echo "If all headers show ✅, the Transform Rules are working!"
echo "If any show ❌, wait a few more minutes for Cloudflare to propagate."
