const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_DIR = path.join(__dirname, 'orders');

// Ensure orders directory exists
// The fs.mkdirSync with recursive:true handles the case where the directory
// already exists, so the fs.existsSync check is not needed.
try {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not ensure orders dir', e);
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Setup email transporter for order confirmations
let emailTransporter = null;
if(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD){
  emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Function to send order confirmation email
async function sendOrderConfirmationEmail(orderData){
  if(!emailTransporter) return; // Skip if email not configured
  
  try{
    const to = orderData.address_to?.email || orderData.email;
    if(!to) return;
    
    const customerName = orderData.address_to?.first_name || orderData.first_name || 'Customer';
    const itemsList = (orderData.line_items || [])
      .map(item => `  • ${item.quantity}x ${item.title || 'Product'} - ${orderData.display_currency || 'USD'} ${(item.price/100).toFixed(2)}`)
      .join('\n');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #007bff 0%, #0051cc 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .order-section { margin: 15px 0; }
          .order-section h3 { color: #007bff; margin: 10px 0; }
          .items-list { background: #f9f9f9; padding: 10px; border-radius: 4px; }
          .total { font-weight: bold; font-size: 1.2em; color: #28a745; margin-top: 10px; }
          .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! Your order has been received and is being processed.</p>
            
            <div class="order-section">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${orderData.id}</p>
              <p><strong>Order Date:</strong> ${new Date(orderData.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
            
            <div class="order-section">
              <h3>Items Ordered</h3>
              <div class="items-list">
${itemsList}
              </div>
            </div>
            
            <div class="order-section">
              <h3>Shipping Address</h3>
              <p>
                ${orderData.address_to?.first_name || ''} ${orderData.address_to?.last_name || ''}<br>
                ${orderData.address_to?.address1 || ''}<br>
                ${orderData.address_to?.city || ''}, ${orderData.address_to?.state || ''} ${orderData.address_to?.zip || ''}<br>
                ${orderData.address_to?.country || ''}
              </p>
            </div>
            
            <div class="order-section total">
              Total: ${orderData.display_currency || 'USD'} ${(orderData.total_cents/100).toFixed(2)}
            </div>
            
            <div class="footer">
              <p>You'll receive a tracking number via email once your order ships.</p>
              <p>If you have any questions, please contact us.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: `Order Confirmation - ${orderData.id}`,
      html: htmlContent
    });
    
    console.log(`Order confirmation email sent to ${to}`);
  }catch(err){
    console.error('Failed to send email:', err);
  }
}

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
    printifyConfigured: !!(process.env.PRINTIFY_TOKEN && process.env.SHOP_ID),
    stripeConfigured: !!process.env.STRIPE_PUBLISHABLE_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
});

// Stripe Payment Intent endpoint — creates a payment intent for Stripe payment processing
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  if(!process.env.STRIPE_SECRET_KEY){
    return res.status(400).json({ message: 'Stripe not configured on server' });
  }
  
  try{
    const { amount_cents, description, email } = req.body;
    
    if(!amount_cents || amount_cents < 50){
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_cents),
      currency: 'usd',
      description: description || 'Merch Store Order',
      receipt_email: email
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  }catch(err){
    console.error('Payment intent error:', err);
    res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
});

// Stripe Webhook endpoint — listens for payment success events
app.post('/api/stripe/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  if(!process.env.STRIPE_WEBHOOK_SECRET){
    return res.status(400).json({ message: 'Webhook not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try{
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }catch(err){
    console.error('Webhook sig error:', err);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }
  
  if(event.type === 'payment_intent.succeeded'){
    const paymentIntent = event.data.object;
    console.log('Payment succeeded:', paymentIntent.id);
    // Update order status or trigger fulfillment here
  }
  
  res.json({received: true});
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
      created_at: new Date().toISOString(),
      address_to: payload.address_to,
      line_items: payload.line_items,
      display_currency: payload.display_currency || 'USD',
      message: 'This is a simulated order because PRINTIFY_TOKEN or SHOP_ID is not set on the server.'
    };
    // Send confirmation email even for simulated orders
    await sendOrderConfirmationEmail(simulatedOrder);
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
        payment_method: payload.payment_method || 'stripe'
      })
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    });
    const json = await response.json();
    if(!response.ok) return res.status(response.status).json(json);
    
    // Enrich response with order data for email
    const orderResponse = Object.assign({}, json, {
      display_currency: payload.display_currency || 'USD',
      line_items: payload.line_items,
      address_to: payload.address_to
    });
    
    // Send confirmation email after successful order
    await sendOrderConfirmationEmail(orderResponse);
    
    // Echo the Printify response back to client (do not store tokens)
    res.json(json);
  }catch(err){
    console.error('Checkout error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ADMIN_TOKEN handling — for local dev we provide a non-production default for convenience, but never use this in production.
const DEFAULT_ADMIN_TOKEN = 'Procoder@988';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || (process.env.NODE_ENV !== 'production' ? DEFAULT_ADMIN_TOKEN : '');
if(!process.env.ADMIN_TOKEN && ADMIN_TOKEN){
  console.warn('WARNING: Using default ADMIN_TOKEN for local/dev. Do NOT use this in production. Set ADMIN_TOKEN in the environment to a secret value.');
}

// Admin endpoints to view orders — protected by ADMIN_TOKEN (set in env)
app.get('/admin/orders', (req, res)=>{
  const token = ADMIN_TOKEN;
  const auth = (req.headers.authorization || '').replace(/^Bearer\s*/, '');
  if(!token || !auth || auth !== token) return res.status(401).json({ message: 'Unauthorized' });
  try{
    const files = fs.readdirSync(ORDERS_DIR).filter(f => f.endsWith('.json'));
    const orders = files.map(f => JSON.parse(fs.readFileSync(path.join(ORDERS_DIR, f), 'utf8'))).map(o => ({ id: o.id, created_at: o.created_at, total_cents: o.total_cents, status: o.status }));
    return res.json({ orders });
  }catch(e){ console.error('Admin read orders error', e); return res.status(500).json({ message: 'Could not read orders' }); }
});

app.get('/admin/orders/:id', (req,res)=>{
  const token = ADMIN_TOKEN;
  const auth = (req.headers.authorization || '').replace(/^Bearer\s*/, '');
  if(!token || !auth || auth !== token) return res.status(401).json({ message: 'Unauthorized' });
  try{
    const id = req.params.id; const file = path.join(ORDERS_DIR, `${id}.json`);
    if(!fs.existsSync(file)) return res.status(404).json({ message: 'Not found' });
    const order = JSON.parse(fs.readFileSync(file, 'utf8'));
    return res.json({ order });
  }catch(e){ console.error('Admin read order error', e); return res.status(500).json({ message: 'Could not read order' }); }
});

app.listen(PORT, ()=> console.log(`Server started on http://localhost:${PORT}`));
