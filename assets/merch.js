(function(){
  // --- Sentry initialization (metrics) ---
  const _SENTRY_DSN = "https://19f914da843ff91848281a5e4be175e8@o4510440292220928.ingest.de.sentry.io/4510440295563344";
  // Do not initialize Sentry from this page. If Sentry is present (initialized elsewhere), mark it available so metrics will use it.
  function initSentry(){
    try{
      if(window.Sentry && !window.__sentry_inited){
        // assume site-level Sentry was initialized elsewhere (e.g., index.html)
        window.__sentry_inited = true;
      }
    }catch(e){}
  }
  // mark if Sentry already present
  if(window.Sentry) initSentry();

  function sendMetric(type, name, value){
    try{
      if(window.Sentry && Sentry.metrics && typeof Sentry.metrics[type] === 'function'){
        Sentry.metrics[type](name, value);
      } else {
        // best-effort: attach as breadcrumb so it's visible in Sentry events
        if(window.Sentry && Sentry.addBreadcrumb) Sentry.addBreadcrumb({ category: 'metrics', message: `${type}:${name}=${value}` });
      }
    }catch(e){ console.warn('Metric send failed', e); }
  }

  // Simple static product list (can be replaced by /api/products)
  async function fetchProducts(){
    const start = Date.now();
    try{
      const res = await fetch('/api/products');
      const dur = Date.now() - start; sendMetric('distribution', 'response_time', dur);
      if(!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }catch(e){
      const dur = Date.now() - start; sendMetric('distribution', 'response_time', dur);
      console.warn('Falling back to local products', e);
      return [
        { id: 'p1', title: 'T-Shirt — Minimal', price: 1999, product_id: '5bfd0b66a342bcc9b5563216', variant_id: 17887, image: 'https://via.placeholder.com/600x600?text=T-Shirt' },
        { id: 'p2', title: 'Sticker Pack', price: 499, product_id: '5bfd0b66a342bcc9b5563217', variant_id: 17888, image: 'https://via.placeholder.com/600x600?text=Sticker' },
        { id: 'sami-tee', title: 'Sami.dev tee — Unisex', price: 4999, product_id: 'sami-tee-prod', variant_id: 1001, image: 'https://imagesami.is-a.dev/sIMG_2231.jpeg', images: ['https://imagesami.is-a.dev/sIMG_2231.jpeg','https://sami.is-a.dev/IMG_2230.jpeg','https://sami.is-a.dev/IMG_2229.jpeg'], description: `This long sleeve tee feels like a worn-in favorite from the moment you put it on. Environmentally-friendly heavier cotton with vintage feel. Production cost (AUD): 50.30, Shipping (AUD): 9.85, Taxes (AUD): 6.01 — Total (AUD): 66.16. Contact to add to store or change price.`, remoteImages: true }
      ];
    }
  }

  // Cart helpers
  const CART_KEY = 'site_cart_v1';
  function readCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  // Currency support
  const DEFAULT_CURRENCY = localStorage.getItem('site_currency') || 'USD';
  const SUPPORTED_RATES = {
    // base currency USD
    USD: 1.0,
    AUD: 1.50,
    JPY: 140.0,
    EUR: 0.92,
    GBP: 0.80
  };
  const CURRENCY_SYMBOL = { USD: '$', AUD: 'A$', JPY: '¥', EUR: '€', GBP: '£' };
  let CURRENT_CURRENCY = DEFAULT_CURRENCY;

  function setCurrency(code){
    if(!SUPPORTED_RATES[code]) code = 'USD';
    CURRENT_CURRENCY = code;
    localStorage.setItem('site_currency', code);
    const sel = document.getElementById('currencySelector'); if(sel) sel.value = code;
    // Update shipping display when currency changes
    try{ updateShippingDisplay(); }catch(e){}
  }

  function convertCentsToCurrency(cents, currency){
    const usd = cents / 100; // original assumed USD
    const rate = SUPPORTED_RATES[currency] || 1;
    const converted = usd * rate; // in display currency units
    return Math.round(converted * 100); // cents in display currency
  }

  function formatPrice(cents, currency){
    currency = currency || CURRENT_CURRENCY;
    const convertedCents = convertCentsToCurrency(cents, currency);
    const symbol = CURRENCY_SYMBOL[currency] || '';
    return `${symbol}${(convertedCents/100).toFixed(2)} ${currency}`;
  }

  // Shipping methods (amounts stored as USD cents baseline)
  const SHIPPING_METHODS = {
    standard: { name: 'Standard', usdCents: 985 }, // $9.85
    express: { name: 'Express', usdCents: 1985 }  // $19.85
  };

  function getSelectedShippingMethod(){
    const sel = document.getElementById('shippingSelector');
    return sel ? (sel.value || 'standard') : 'standard';
  }

  function getShippingUsdCents(){
    const m = getSelectedShippingMethod();
    return (SHIPPING_METHODS[m] && SHIPPING_METHODS[m].usdCents) || SHIPPING_METHODS.standard.usdCents;
  }

  function updateShippingDisplay(){
    const shipCostEl = document.getElementById('shippingCost');
    if(!shipCostEl) return;
    const usdCents = getShippingUsdCents();
    shipCostEl.textContent = formatPrice(usdCents);
  }

  // UI
  async function render(){
    const products = await fetchProducts();
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <div class="muted">${formatPrice(p.price)}</div>
        <div style="margin-top:.5rem">
          <button class="btn add" data-id="${p.id}" data-pid="${p.product_id}">Add to cart</button>
          <button class="btn view" data-pid="${p.product_id}">View</button>
        </div>
      `;
      grid.appendChild(card);
      // image fallback: try alternate URLs from product.images then local copies
      try{
        const img = card.querySelector('img');
        if(img){
          const altSrcs = (p.images && p.images.slice()) || [];
          let idx = 0;
          img.onerror = function(){
            idx++;
            if(altSrcs[idx]) img.src = altSrcs[idx];
            else img.src = '/assets/images/IMG_2231.jpeg'; // final fallback
          };
        }
      }catch(e){/* ignore */}
    });

    // Add to cart handlers
    grid.querySelectorAll('button.add').forEach(btn => {
      btn.addEventListener('click', async (e)=>{
        sendMetric('count', 'button_click', 1);
        sendMetric('count', 'add_to_cart', 1);
        const id = e.currentTarget.dataset.id;
        const product = (await fetchProducts()).find(x=>x.id===id);
        if(!product) return alert('Product not found');
        const cart = readCart();
        const found = cart.find(i=>i.id===product.id);
        if(found) found.quantity += 1; else cart.push({ id: product.id, title: product.title, price: product.price, product_id: product.product_id, variant_id: product.variant_id, quantity: 1 });
        writeCart(cart);
        updateCartBadge();
      });
    });

    // View (product details) handlers
    grid.querySelectorAll('button.view').forEach(btn => {
      btn.addEventListener('click', async (e)=>{
        sendMetric('count', 'button_click', 1);
        sendMetric('count', 'view_product', 1);
        const pid = e.currentTarget.dataset.pid;
        showProductDetails(pid);
      });
    });

    updateCartBadge();
  }

  function updateCartBadge(){
    const cart = readCart();
    const count = cart.reduce((s,i)=>s+i.quantity,0);
    document.getElementById('cartCount').textContent = count;
  }

  // Cart modal
  const cartModal = document.getElementById('cartModal');
  document.getElementById('viewCart').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('checkoutBtn').addEventListener('click', ()=>{ document.getElementById('checkoutForm').style.display = 'block'; window.scrollTo(0, document.body.scrollHeight); });

  function openCart(){
    renderCart();
    cartModal.style.display = 'flex';
  }
  function closeCart(){ cartModal.style.display = 'none'; document.getElementById('checkoutForm').style.display = 'none'; }

  function renderCart(){
    const list = document.getElementById('cartList'); list.innerHTML = '';
    const cart = readCart();
    if(cart.length===0){ list.innerHTML = '<div>Your cart is empty</div>'; document.getElementById('cartTotal').textContent = formatPrice(0); updateShippingDisplay(); return; }
    cart.forEach(item => {
      const row = document.createElement('div'); row.className='row';
      row.style.justifyContent = 'space-between';
      row.innerHTML = `<div><strong>${item.title}</strong><div class="muted">${formatPrice(item.price)}</div></div><div><button data-id="${item.id}" class="btn dec">-</button> <span>${item.quantity}</span> <button data-id="${item.id}" class="btn inc">+</button> <button data-id="${item.id}" class="btn rm">Remove</button></div>`;
      list.appendChild(row);
    });

    list.querySelectorAll('.inc').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const cart = readCart(); const it = cart.find(i=>i.id===id); it.quantity++; writeCart(cart); renderCart(); updateCartBadge();
    }));
    list.querySelectorAll('.dec').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const cart = readCart(); const it = cart.find(i=>i.id===id); if(it.quantity>1) it.quantity--; else { const idx = cart.findIndex(i=>i.id===id); cart.splice(idx,1); } writeCart(cart); renderCart(); updateCartBadge();
    }));
    list.querySelectorAll('.rm').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const cart = readCart(); const idx = cart.findIndex(i=>i.id===id); cart.splice(idx,1); writeCart(cart); renderCart(); updateCartBadge();
    }));

    const subtotal = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
    const shippingUsdCents = getShippingUsdCents();
    const total = subtotal + shippingUsdCents;
    updateShippingDisplay();
    document.getElementById('cartTotal').textContent = formatPrice(total);
  }

  // Product details
  async function showProductDetails(productId){
    const modal = document.getElementById('productModal');
    const titleEl = document.getElementById('productTitle');
    const imgEl = document.getElementById('productImage');
    const descEl = document.getElementById('productDescription');
    const shipEl = document.getElementById('productShipping');
    titleEl.textContent = 'Loading…';
    descEl.textContent = '';
    shipEl.textContent = '';
    modal.style.display = 'flex';

    try{
      const start = Date.now();
      const res = await fetch(`/api/printify/products/${productId}`);
      const dur = Date.now() - start; sendMetric('distribution', 'response_time', dur);
      const json = await res.json();
      if(!res.ok) throw json;
      const product = json.product || {};
      titleEl.textContent = product.title || product.name || product.id || 'Product';

      // image heuristics (handle Printify shapes or simple string arrays)
      let imgSrc = '';
      if(product.images && product.images.length){
        if(typeof product.images[0] === 'string') imgSrc = product.images[0];
        else if(product.images[0] && product.images[0].src) imgSrc = product.images[0].src;
      }
      else if(product.views && product.views.length && product.views[0].files && product.views[0].files.length) imgSrc = product.views[0].files[0].src;
      else imgSrc = product.image || product.preview_url || '';
      if(imgSrc){ imgEl.src = imgSrc; imgEl.style.display = 'block'; } else { imgEl.style.display = 'none'; }

      descEl.innerHTML = product.description || product.body_html || product.meta_description || product.title || 'No description available.';

      const shipping = json.shipping;
      if(!shipping) shipEl.textContent = 'Shipping info not available or credentials are missing on server.';
      else if(shipping.profiles && Array.isArray(shipping.profiles)){
        shipEl.textContent = shipping.profiles.map(p=>`Countries: ${p.countries ? p.countries.join(', ') : 'N/A'} — First: ${p.first_item && p.first_item.currency ? p.first_item.currency + ' ' + (p.first_item.cost/100) : JSON.stringify(p.first_item)}`).join('\n');
      } else {
        shipEl.textContent = JSON.stringify(shipping, null, 2);
      }
      sendMetric('count', 'product_fetch_success', 1);
    }catch(err){
      titleEl.textContent = 'Error loading product';
      descEl.textContent = err.message || JSON.stringify(err);
      shipEl.textContent = '';
      console.error(err);
      // Attempt to show local product fallbacks (e.g., sami-tee)
      const local = (await fetchProducts()).find(p=>p.product_id===productId || p.id===productId);
      if(local){
        titleEl.textContent = local.title;
        if(local.images && local.images.length) { imgEl.src = local.images[0]; imgEl.style.display = 'block'; }
        descEl.innerHTML = local.description || '';
        shipEl.textContent = 'Local product — shipping/price may vary.';
        sendMetric('count', 'product_view_local', 1);
      }
    }
  }

  document.getElementById('closeProduct').addEventListener('click', ()=>{ document.getElementById('productModal').style.display = 'none'; });

  // Load config (background, safeMode, printifyConfigured)
  let CONFIG = {};
  async function loadConfig(){
    try{
      const res = await fetch('/api/config');
      CONFIG = await res.json();
      const statusEl = document.getElementById('shopStatus');
      if(CONFIG.backgroundImage){ document.body.style.backgroundImage = `url(${CONFIG.backgroundImage})`; document.body.style.backgroundSize = 'cover'; document.body.style.backgroundAttachment = 'fixed'; }
      // show confirmation checkbox if printify configured and not safeMode
      if(CONFIG.printifyConfigured && !CONFIG.safeMode){ document.getElementById('confirmLabel').style.display = 'block'; }
      if(statusEl){
        if(CONFIG.printifyConfigured) statusEl.innerHTML = 'Printify: <strong>configured</strong> — <button id="testCreds" class="btn">Test credentials</button>';
        else statusEl.textContent = 'Printify: not configured (set PRINTIFY_TOKEN & SHOP_ID to enable live products and real checkout)';
      }
      // test credentials button
      setTimeout(()=>{
        const btn = document.getElementById('testCreds'); if(btn) btn.addEventListener('click', async ()=>{
          btn.textContent = 'Testing…';
          const r = await fetch('/api/printify/test');
          const j = await r.json();
          if(r.ok) btn.textContent = 'Success ✓'; else btn.textContent = 'Failed ✕';
          setTimeout(()=> btn.textContent = 'Test credentials', 2500);
          console.log('printify test', j);
        });
      }, 100);

      // Initialize currency selector UI
      try{
        setCurrency(CURRENT_CURRENCY);
        const sel = document.getElementById('currencySelector');
        if(sel){ sel.value = CURRENT_CURRENCY; sel.addEventListener('change', (e)=>{ setCurrency(e.target.value); render(); renderCart(); updateCartBadge(); }); }
      }catch(e){/* ignore if UI not present */}
    }catch(e){ console.warn('Could not load config', e); }
  }
  loadConfig();

  // Checkout submission
  document.getElementById('form').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const cart = readCart();
    if(cart.length===0) return alert('Cart is empty');

    // If Printify is configured and not in safe mode, require confirmation checkbox
    if(CONFIG.printifyConfigured && !CONFIG.safeMode){
      const conf = document.getElementById('confirmOrder');
      if(!conf || !conf.checked) return alert('Please confirm you want to place a real order by checking the confirmation checkbox.');
    }

    const subtotal = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
    const shippingUsdCents = getShippingUsdCents();

    const payload = {
      address_to: { first_name: data.first_name, email: data.email, address1: data.address1 || data.address, city: data.city, zip: data.zip, country: 'US' },
      line_items: cart.map(i=>({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      order_subtotal_cents: subtotal,
      shipping_cost_usd_cents: shippingUsdCents,
      shipping_method: getSelectedShippingMethod(),
      send_shipping_notification: false,
      display_currency: CURRENT_CURRENCY,
      confirm_real: (CONFIG.printifyConfigured && !CONFIG.safeMode) ? true : false
    };

    const resEl = document.getElementById('orderResult'); resEl.textContent = 'Placing order…';
    try{
      sendMetric('count', 'checkout_started', 1);
    const rxStart = Date.now();
    const res = await fetch('/api/checkout', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    const rxDur = Date.now() - rxStart; sendMetric('distribution', 'response_time', rxDur);
    const json = await res.json();
    if(!res.ok){ sendMetric('count', 'checkout_failed', 1); throw json; }
    resEl.innerHTML = `<div style="color:green">Order placed — id: ${json.id || json.external_id || json.order_id}</div>`;
    sendMetric('count', 'order_placed', 1);
    // send order total as gauge in USD cents and in display currency cents if available
    try{
      const cart = readCart(); const amount = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
      const totalUsd = amount + (payload.shipping_cost_usd_cents || 0);
      sendMetric('gauge', 'order_total_cents', totalUsd);
      const converted = convertCentsToCurrency(totalUsd, CURRENT_CURRENCY);
      sendMetric('gauge', `order_total_${CURRENT_CURRENCY}_cents`, converted);
    }catch(e){}
    localStorage.removeItem(CART_KEY); updateCartBadge(); renderCart();
    }catch(err){ sendMetric('count', 'checkout_failed', 1);
      console.error(err);
      resEl.innerHTML = `<div style="color:red">Failed: ${err.message || JSON.stringify(err)}</div>`;
    }
  });

  // Init
  render();

  // Page-level metrics
  try{
    sendMetric('count', 'page_view', 1);
    let loadTime = Math.round(performance.now());
    if(performance.timing && performance.timing.loadEventEnd && performance.timing.navigationStart){
      const t = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if(t > 0) loadTime = t;
    }
    sendMetric('gauge', 'page_load_time', loadTime);
  }catch(e){/* ignore */}
})();
