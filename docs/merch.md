# Merch store

This site includes a simple Merch page available at `/merch.html`.

Features:
- Product grid (static by default, served from `/api/products`)
- Client-side cart with localStorage persistence
- Checkout that calls `/api/checkout` on the server
- Server integrates with Printify and uses environment variables:
  - `PRINTIFY_TOKEN` — your Printify personal access token or OAuth token
  - `SHOP_ID` — the numeric ID of your Printify shop

Security
- Do NOT commit `PRINTIFY_TOKEN` to git. Use environment variables or secrets.
- If you accidentally share a token, rotate/regenerate it immediately.

Local run
1. Install: `npm install`
2. Set env vars: `export PRINTIFY_TOKEN=YOUR_PERSONAL_ACCESS_TOKEN` and `export SHOP_ID=12345`
   - Optional: `export BACKGROUND_IMAGE=https://example.com/your-background.jpg` (or leave unset to use the default gradient)
   - Optional: set `SAFE_MODE=1` to bypass the real-order confirmation (useful for automated tests). By default SAFE_MODE is off and the app requires confirmation before placing real orders.
3. Start: `npm start`
4. Open: `http://localhost:3000/merch.html`

Testing your Printify credentials
- To confirm your token & shop id are valid (read-only check):
  curl -H "Authorization: Bearer $PRINTIFY_TOKEN" http://localhost:3000/api/printify/test
  The endpoint will attempt to fetch a single product from your shop; if successful, you'll see a `ok: true` JSON response.

Notes
- The products list is served locally from `assets/products.json`; this site runs in "local-only" mode and does not call external Printify APIs by default (improves privacy and makes the store self-contained).
- For safety/privacy, orders are stored locally in the `orders/` directory and are only viewable via the admin endpoints (protected by `ADMIN_TOKEN`).
- For optional email confirmations: when `SENDGRID_API_KEY` and `EMAIL_FROM` are configured and the buyer checks the "Send confirmation email" box, a confirmation will be sent to the buyer. Email sending is opt-in and does not change how orders are stored locally.
- If you prefer a production Printify integration later, we can switch `/api/products` and `/api/checkout` back to using Printify (but that will involve storing and using tokens on the server and may expose more risk).
- The current flow assumes existing Printify products (product_id + variant_id). If you'd like on-the-fly product creation via order, tell me and I will add support for sending `print_areas` and blueprints.
- Do NOT commit your `PRINTIFY_TOKEN` to the repository. After testing, consider rotating the token for security.

## Notes added by automation
- Sentry metrics are enabled on the client-side for the merch page (counts and distributions for actions like `add_to_cart`, `view_product`, `checkout_started`, `order_placed`, and `response_time`). The DSN should be provided via server-side config (e.g., `window.SENTRY_DSN` or `window.CONFIG.sentryDsn`) rather than hardcoded in source. If you prefer to use a different DSN or disable metrics, update the site config accordingly.
- Upload your product images to `assets/images/` if you prefer local storage. The merch page currently uses remote image URLs for the Sami tee (<https://sami.is-a.dev/IMG_2231.jpeg>, <https://sami.is-a.dev/IMG_2230.jpeg>, <https://sami.is-a.dev/IMG_2229.jpeg>) and will fall back to local files if those hosts are unavailable.

### Currency & navigation
- The merch page now includes a currency selector (USD, AUD, JPY, EUR, GBP). Prices are converted client-side using simple static rates and displayed with a currency symbol. The base product prices remain in USD cents (for consistency with the server), but the UI shows converted values. If you want live FX rates, I can wire an external API.
- To get to the merch page: use the "Shop" link in the navigation bar on the site or open `/merch.html` directly.