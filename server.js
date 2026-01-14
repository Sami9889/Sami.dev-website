const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Products endpoint — will fetch from Printify if credentials are set, otherwise returns static sample products.
app.get('/api/products', async (req, res) => {
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.SHOP_ID;

  // If no Printify credentials, return static fallback
  if(!token || !shopId){
    return res.json([
      { id: 'p1', title: 'T-Shirt — Minimal', price: 1999, product_id: '5bfd0b66a342bcc9b5563216', variant_id: 17887, image: 'https://via.placeholder.com/600x600?text=T-Shirt', description: 'Fallback sample item' },
      { id: 'p2', title: 'Sticker Pack', price: 499, product_id: '5bfd0b66a342bcc9b5563217', variant_id: 17888, image: 'https://via.placeholder.com/600x600?text=Sticker', description: 'Fallback sample item' }
    ]);
  }

  try{
    // Attempt to fetch products from Printify for the shop
    const endpoint = `https://api.printify.com/v1/shops/${shopId}/products.json?limit=50`;
    const response = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
    const json = await response.json();
    if(!response.ok) return res.status(response.status).json(json);

    // Map Printify products to a simplified product model for the frontend
    const mapped = (json.data || json).map(p => {
      // choose first reasonable variant
      const variants = p.variants || [];
      let chosen = variants.find(v => v.is_available || v.is_enabled) || variants[0] || {};
      // price is expected in cents
      const price = chosen.price || chosen.cost || 0;
      // image: use product.images first, or views, or empty
      let image = '';
      if(p.images && p.images.length) image = p.images[0].src;
      else if(p.views && p.views.length && p.views[0].files && p.views[0].files.length) image = p.views[0].files[0].src;

      return {
        id: String(p.id),
        title: p.title || p.name || 'Product',
        description: p.description || '',
        price: Number(price) || 0,
        product_id: String(p.id),
        variant_id: Number(chosen.id) || null,
        image
      };
    });

    res.json(mapped);
  }catch(err){
    console.error('Products fetch error', err);
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

// Config endpoint — returns optional background image and server flags
app.get('/api/config', (req, res) => {
  res.json({
    backgroundImage: process.env.BACKGROUND_IMAGE || null,
    safeMode: process.env.SAFE_MODE === '1',
    printifyConfigured: !!(process.env.PRINTIFY_TOKEN && process.env.SHOP_ID)
  });
});

// Printify product details endpoint. Returns product info and shipping profiles when possible.
// Test endpoint — checks Printify token + shop id by fetching a single product (safe read-only call)
app.get('/api/printify/test', async (req, res) => {
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.SHOP_ID;
  if(!token || !shopId) return res.status(400).json({ message: 'PRINTIFY_TOKEN or SHOP_ID not set' });
  try{
    const resp = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await resp.json();
    if(!resp.ok) return res.status(resp.status).json(json);
    return res.json({ ok: true, sample: json });
  }catch(err){
    console.error('Printify test error', err);
    res.status(500).json({ message: 'Printify test failed', error: err.message });
  }
});

app.get('/api/printify/products/:productId', async (req, res) => {
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.SHOP_ID;
  const id = req.params.productId;

  // If we don't have credentials, fail with helpful message
  if(!token || !shopId) {
    // fallback: return a helpful message for the frontend to display
    return res.json({
      product: { id, title: 'Sample product', description: 'No Printify credentials set on server. Set PRINTIFY_TOKEN and SHOP_ID to fetch real product data.' },
      shipping: null
    });
  }

  try{
    // Fetch product from Printify shop
    const prodResp = await fetch(`https://api.printify.com/v1/shops/${shopId}/products/${id}.json`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const productJson = await prodResp.json();
    if(!prodResp.ok) return res.status(prodResp.status).json(productJson);

    const blueprintId = productJson.blueprint_id;
    const providerId = productJson.print_provider_id;
    let shippingJson = null;

    if(blueprintId && providerId){
      const shipResp = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      shippingJson = await shipResp.json();
      // do not fail entire request if shipping call fails: just keep shipping as null
      if(!shipResp.ok) shippingJson = { error: shippingJson };
    }

    res.json({ product: productJson, shipping: shippingJson });
  }catch(err){
    console.error('Product details error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Checkout — places an order via Printify if PRINTIFY_TOKEN & SHOP_ID are set.
// If credentials are missing, simulate an order so developers can test checkout & shipping locally.
app.post('/api/checkout', async (req, res)=>{
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.SHOP_ID;
  const safeMode = process.env.SAFE_MODE === '1';

  const payload = req.body || {};
  // Minimal validation
  if(!payload.address_to || !payload.line_items || !Array.isArray(payload.line_items) || payload.line_items.length===0) return res.status(400).json({ message: 'Invalid payload' });

  // If Printify credentials are missing: simulate order (for local/dev).
  if(!token || !shopId){
    const subtotal = Number(payload.order_subtotal_cents || 0);
    const shipping = Number(payload.shipping_cost_usd_cents || 0);
    const total = subtotal + shipping;
    const simulatedOrder = {
      id: `sim-${Date.now()}`,
      status: 'simulated',
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
      message: 'This is a simulated order because PRINTIFY_TOKEN or SHOP_ID is not set on the server.'
    };
    return res.json(simulatedOrder);
  }

  // If not in safe mode, require confirmation flag from client to avoid accidental charges
  if(!safeMode && !payload.confirm_real){
    return res.status(400).json({ message: 'Real order confirmation missing. Set confirm_real=true in the request body to place real orders.' });
  }

  const endpoint = `https://api.printify.com/v1/shops/${shopId}/orders.json`;
  try{
    // Attach shipping information as metadata to help trace costs (Printify accepts arbitrary fields as part of order payload in most cases)
    const toSend = Object.assign({}, payload, {
      metadata: Object.assign({}, payload.metadata || {}, {
        client_display_currency: payload.display_currency || 'USD',
        client_order_subtotal_cents: payload.order_subtotal_cents || 0,
        client_shipping_cost_usd_cents: payload.shipping_cost_usd_cents || 0,
      })
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    });
    const json = await response.json();
    if(!response.ok) return res.status(response.status).json(json);
    // Echo the Printify response back to client (do not store tokens)
    res.json(json);
  }catch(err){
    console.error('Checkout error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(PORT, ()=> console.log(`Server started on http://localhost:${PORT}`));
