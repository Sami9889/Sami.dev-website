# Cloudflare Setup for Security Headers

Since GitHub Pages doesn't support custom HTTP headers, we need to use Cloudflare Workers to add them.

## Option 1: Cloudflare Workers (Recommended - Free Tier Available)

### Step 1: Create a Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: **sami-s.dev**
3. Navigate to **Workers & Pages** → **Create Application** → **Create Worker**
4. Name it: `security-headers`
5. Click **Deploy**
6. Click **Edit Code**
7. Replace the default code with the contents of `cloudflare-worker.js` from this repo
8. Click **Save and Deploy**

### Step 2: Add Worker Route

1. Go back to **Workers & Pages** → **security-headers** worker
2. Click **Triggers** tab
3. Click **Add Route**
4. Enter route: `sami-s.dev/*` (or `*sami-s.dev/*` to include all subdomains)
5. Select zone: **sami-s.dev**
6. Click **Save**

### Step 3: Verify

1. Wait 1-2 minutes for propagation
2. Visit https://securityheaders.com/?q=https://sami-s.dev
3. You should now see all security headers with an A+ rating

---

## Option 2: Cloudflare Transform Rules (Easier - Also Free)

### Step 1: Add HTTP Response Header Modifications

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: **sami-s.dev**
3. Navigate to **Rules** → **Transform Rules** → **Modify Response Header**
4. Click **Create Rule**
5. Name: `Security Headers`
6. When incoming requests match: **All incoming requests**
7. Then modify response headers - Add each header:

   - **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`
   - **Content-Security-Policy**: `default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.github.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.github.com https://ghchart.rshah.org https://formsubmit.co; frame-ancestors 'none'; upgrade-insecure-requests; require-trusted-types-for 'script'; trusted-types default`
   - **X-Frame-Options**: `SAMEORIGIN`
   - **X-Content-Type-Options**: `nosniff`
   - **Referrer-Policy**: `strict-origin-when-cross-origin`
   - **Permissions-Policy**: `geolocation=(), microphone=(), camera=()`
   - **Cross-Origin-Opener-Policy**: `same-origin`
   - **Cross-Origin-Embedder-Policy**: `credentialless`

8. Click **Deploy**

### Step 2: Verify

1. Wait 1-2 minutes for propagation
2. Visit https://securityheaders.com/?q=https://sami-s.dev
3. You should now see all security headers with an A+ rating

---

## Why This is Necessary

GitHub Pages does not support:
- Custom `_headers` files (Netlify feature)
- Complete security header control via `<meta>` tags (limited browser support)
- `.htaccess` files (Apache feature)
- Server-side configuration

The **only** way to add proper HTTP security headers to a GitHub Pages site with a custom domain is through Cloudflare (or another CDN/proxy that allows header modification).

---

## Already Using Cloudflare

Your site is already behind Cloudflare (based on the security scan showing Cloudflare IPs), so you just need to configure the headers in your Cloudflare dashboard!
