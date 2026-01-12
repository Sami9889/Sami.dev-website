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
- The products list will be fetched live from Printify when credentials are set; otherwise fallback sample items are used.
- For safety, the checkout will require checking the confirmation box before placing a real order unless `SAFE_MODE=1` is set.
- The current flow assumes existing Printify products (product_id + variant_id). If you'd like on-the-fly product creation via order, tell me and I will add support for sending `print_areas` and blueprints.
- Do NOT commit your `PRINTIFY_TOKEN` to the repository. After testing, consider rotating the token for security.
