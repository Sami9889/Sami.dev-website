# Cloudflare Security Headers Configuration
**Date:** 2026-06-06
**Purpose:** Fix security header warnings from PageSpeed Insights and browser console

## Problem

The security audit shows these issues that **cannot** be fixed with HTML meta tags:
- ❌ No HSTS header found (High severity)
- ❌ No COOP header found (High severity)
- ❌ No frame control policy found (High severity)
- ❌ CSP with 'unsafe-inline' (High severity)
- ❌ Cloudflare Insights script blocked by CSP
- ❌ GitHub frames blocked by CSP

**Why meta tags don't work:**
- `X-Frame-Options` - Browsers ignore meta tag version
- `Strict-Transport-Security` - Only works as HTTP header
- `Cross-Origin-Opener-Policy` - Only works as HTTP header
- `Cross-Origin-Embedder-Policy` - Only works as HTTP header
- `frame-ancestors` directive - Only works in HTTP CSP header

## Solution: Cloudflare Transform Rules

### Step 1: Update CSP to Allow Cloudflare & GitHub

Go to Cloudflare Dashboard → sami-s.dev → Rules → Transform Rules → Modify Response Header

**Rule Name:** `Security Headers - CSP and HSTS`

**When:**
- All incoming requests

**Then - Add/Modify Headers:**

1. **Content-Security-Policy**
   ```
   default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.github.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.github.com https://ghchart.rshah.org https://formsubmit.co https://fonts.googleapis.com https://fonts.gstatic.com https://cloudflareinsights.com; frame-src https://github.com; base-uri 'self'; form-action 'self' https://formsubmit.co; upgrade-insecure-requests
   ```

2. **Strict-Transport-Security** (HSTS)
   ```
   max-age=31536000; includeSubDomains; preload
   ```

3. **X-Frame-Options**
   ```
   SAMEORIGIN
   ```

4. **X-Content-Type-Options**
   ```
   nosniff
   ```

5. **Referrer-Policy**
   ```
   strict-origin-when-cross-origin
   ```

6. **Permissions-Policy**
   ```
   geolocation=(), microphone=(), camera=()
   ```

7. **Cross-Origin-Opener-Policy**
   ```
   same-origin
   ```

8. **Cross-Origin-Embedder-Policy**
   ```
   credentialless
   ```

### Step 2: Deploy

Click **Deploy** and wait 2-3 minutes for headers to propagate.

### Step 3: Verify

Run these commands to check headers:

```bash
# Check all security headers
curl -I https://sami-s.dev | grep -i "content-security\|strict-transport\|x-frame\|cross-origin"

# Check CSP specifically
curl -I https://sami-s.dev | grep "content-security-policy"

# Check HSTS
curl -I https://sami-s.dev | grep "strict-transport-security"

# Check COOP
curl -I https://sami-s.dev | grep "cross-origin-opener-policy"
```

Expected output:
```
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.github.com https://static.cloudflareinsights.com; ...
x-frame-options: SAMEORIGIN
cross-origin-opener-policy: same-origin
cross-origin-embedder-policy: credentialless
```

### Step 4: Re-run Security Audit

After deploying:
1. Wait 5 minutes for Cloudflare cache to clear
2. Run PageSpeed Insights: https://pagespeed.web.dev/analysis?url=https://sami-s.dev
3. Check browser console for CSP errors (should be gone)

## What This Fixes

### Before (Current State):
- ❌ No HSTS header (High severity)
- ❌ No COOP header (High severity)
- ❌ No frame control policy (High severity)
- ❌ CSP blocks Cloudflare Insights
- ❌ CSP blocks GitHub frames
- ❌ X-Frame-Options ignored (meta tag)

### After (With Cloudflare Transform Rules):
- ✅ HSTS with 1-year max-age + preload
- ✅ COOP for origin isolation
- ✅ X-Frame-Options for clickjacking protection
- ✅ CSP allows Cloudflare Insights
- ✅ CSP allows GitHub frames
- ✅ All headers work as HTTP headers (not meta tags)

## CSP Changes Explained

| Change | Reason |
|--------|--------|
| Added `https://static.cloudflareinsights.com` to script-src | Allows Cloudflare analytics without console errors |
| Added `https://cloudflareinsights.com` to connect-src | Allows analytics beacons |
| Added `frame-src https://github.com` | Allows embedding GitHub content (if needed) |
| Removed `frame-ancestors 'none'` | This directive doesn't work in meta tags anyway |

## Important Notes

1. **Remove meta tag CSP after deploying:** Once Cloudflare headers are active, you can remove the CSP meta tag from index.html to avoid conflicts.

2. **HSTS Preload:** The `preload` directive means your site can be added to browser HSTS preload lists. Only enable if you're committed to HTTPS forever.

3. **'unsafe-inline' Security:** The CSP still contains `'unsafe-inline'` which is not ideal. To remove it, you'd need to:
   - Extract all inline scripts to external files
   - Use CSP nonces or hashes
   - Refactor onclick handlers to addEventListener

   This is a larger refactoring task beyond current scope.

4. **Cloudflare Insights:** If you don't want Cloudflare analytics, you can disable it in: Cloudflare Dashboard → Speed → Optimization → Web Analytics → Turn off.

## Alternative: Disable Cloudflare Insights

If you prefer to block Cloudflare Insights instead of allowing it in CSP:

1. Go to: Cloudflare Dashboard → sami-s.dev
2. Navigate to: **Speed** → **Optimization**
3. Find: **Web Analytics**
4. Toggle: **Off**

Then the CSP errors will disappear without needing to allow `static.cloudflareinsights.com`.

## Security Score Impact

**Current Security Issues:**
- High severity: No HSTS (100% sites should have this)
- High severity: No COOP (recommended for all sites)
- High severity: CSP with 'unsafe-inline' (can't fix without major refactoring)
- Medium severity: CSP in meta tag (we're moving to HTTP header)

**After This Fix:**
- ✅ HSTS enabled (High → Fixed)
- ✅ COOP enabled (High → Fixed)
- ✅ X-Frame-Options enabled (High → Fixed)
- ⚠️ CSP still has 'unsafe-inline' (would need code refactoring)
- ✅ CSP moved to HTTP header (Medium → Fixed)

**Expected Result:**
- 3 out of 4 high-severity issues fixed
- All headers now working as HTTP headers
- No more console errors for Cloudflare/GitHub
- Security audit score significantly improved

---

**Questions?** Check the browser console after deploying to verify no CSP errors remain.
