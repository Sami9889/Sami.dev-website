const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Products endpoint — local-only implementation (no external Printify calls). Reads `assets/products.json`.
const fs = require('fs');
const ORDERS_DIR = path.join(__dirname, 'orders');
if(!fs.existsSync(ORDERS_DIR)) try{ fs.mkdirSync(ORDERS_DIR, { recursive: true }); }catch(e){ console.warn('Could not ensure orders dir', e); }

app.get('/api/products', async (req, res) => {
  try{
    const data = fs.readFileSync(path.join(__dirname, 'assets', 'products.json'), 'utf8');
    const json = JSON.parse(data);
    return res.json(json);
  }catch(err){
    console.error('Failed to read local products.json', err);
    res.status(500).json({ message: 'Failed to load products' });
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
// Printify test endpoint is disabled in local-only mode to preserve privacy and avoid external calls
app.get('/api/printify/test', async (req, res) => {
  res.status(400).json({ message: 'External Printify API disabled in local-only mode' });
});

// Product details endpoint — in local-only mode this reads from local products file and returns product + no shipping info
app.get('/api/printify/products/:productId', async (req, res) => {
  const id = req.params.productId;
  try{
    const data = fs.readFileSync(path.join(__dirname, 'assets', 'products.json'), 'utf8');
    const json = JSON.parse(data);
    // allow lookup by id or product_id
    const found = (json || []).find(p => String(p.id) === String(id) || String(p.product_id) === String(id));
    if(!found) return res.status(404).json({ message: 'Product not found' });
    return res.json({ product: found, shipping: null });
  }catch(err){
    console.error('Product details (local) error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Checkout — places an order via Printify if PRINTIFY_TOKEN & SHOP_ID are set.
// If credentials are missing, simulate an order so developers can test checkout & shipping locally.
app.post('/api/checkout', async (req, res)=>{
  // Local-only checkout: write an order file to `orders/` and optionally send confirmation email (if SENDGRID configured and client requested it)
  const payload = req.body || {};
  // Minimal validation
  if(!payload.address_to || !payload.line_items || !Array.isArray(payload.line_items) || payload.line_items.length===0) return res.status(400).json({ message: 'Invalid payload' });

  try{
    const subtotal = Number(payload.order_subtotal_cents || 0);
    const shipping = Number(payload.shipping_cost_usd_cents || 0);
    const total = subtotal + shipping;
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const safeOrder = {
      id,
      created_at: new Date().toISOString(),
      status: 'placed',
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
      line_items: payload.line_items || [],
      // store address but avoid logging PII to console
      address_to: payload.address_to || {},
      metadata: payload.metadata || {}
    };

    const filePath = path.join(ORDERS_DIR, `${id}.json`);
    // write with restricted permissions where possible
    fs.writeFileSync(filePath, JSON.stringify(safeOrder, null, 2), { mode: 0o600 });

    // optionally send confirmation email when requested and when configured
    const sgKey = process.env.SENDGRID_API_KEY;
    const from = process.env.EMAIL_FROM;
    if(payload.send_confirmation_email && sgKey && from && payload.address_to && payload.address_to.email){
      try{
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sgKey);
        const msg = {
          to: payload.address_to.email,
          from: from,
          subject: `Order confirmation — ${id}`,
          text: `Thanks for your order. Your order id: ${id}. Total: ${(total/100).toFixed(2)} ${payload.display_currency || 'USD'}`
        };
        await sgMail.send(msg);
      }catch(e){
        console.error('Email send failed (will not block order):', e && e.message ? e.message : e);
      }
    }

    // Return non-sensitive confirmation to client
    res.json({ id, status: 'placed', message: 'Order recorded locally' });
  }catch(err){
    console.error('Checkout (local) error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin endpoints to view orders — protected by ADMIN_TOKEN (set in env)
app.get('/admin/orders', (req, res)=>{
  const token = process.env.ADMIN_TOKEN || '';
  const auth = (req.headers.authorization || '').replace(/^Bearer\s*/, '');
  if(!token || !auth || auth !== token) return res.status(401).json({ message: 'Unauthorized' });
  try{
    const files = fs.readdirSync(ORDERS_DIR).filter(f => f.endsWith('.json'));
    const orders = files.map(f => JSON.parse(fs.readFileSync(path.join(ORDERS_DIR, f), 'utf8'))).map(o => ({ id: o.id, created_at: o.created_at, total_cents: o.total_cents, status: o.status }));
    return res.json({ orders });
  }catch(e){ console.error('Admin read orders error', e); return res.status(500).json({ message: 'Could not read orders' }); }
});

app.get('/admin/orders/:id', (req,res)=>{
  const token = process.env.ADMIN_TOKEN || '';
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
