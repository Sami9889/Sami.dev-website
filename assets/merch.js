(function(){
  // --- Sentry initialization (metrics) ---
  // Sentry DSN should not be hardcoded in source. If present, it should be injected via server-side config
  // (e.g., window.SENTRY_DSN or CONFIG.sentryDsn). We avoid initializing Sentry from this module.
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
  function readCart(){
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch(e) {
      console.warn('Cart data corrupted or invalid JSON, resetting cart', e);
      localStorage.removeItem(CART_KEY);
      return [];
    }
  }
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
  // cache products to avoid refetching on every user action
  let cachedProducts = null;

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
    // Ensure products are cached and apply UI filter
    if(!cachedProducts) cachedProducts = await fetchProducts();
    let products = (cachedProducts || []).slice();
    const filterEl = document.getElementById('productFilter');
    const filterVal = filterEl ? filterEl.value : 'all';
    if(filterVal === 'shirt') products = products.filter(p => /shirt|tee/i.test(p.title || ''));

    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div'); card.className='card';
      // image
      const img = document.createElement('img'); img.src = p.image || ''; img.alt = p.title || 'product image';
      // title
      const h3 = document.createElement('h3'); h3.textContent = p.title || '';
      // price
      const priceDiv = document.createElement('div'); priceDiv.className = 'muted'; priceDiv.textContent = formatPrice(p.price);
      // buttons
      const btnWrap = document.createElement('div'); btnWrap.style.marginTop = '.5rem';
      const addBtn = document.createElement('button'); addBtn.className = 'btn add'; addBtn.dataset.id = p.id; addBtn.dataset.pid = p.product_id; addBtn.textContent = 'Add to cart';
      const viewBtn = document.createElement('button'); viewBtn.className = 'btn view'; viewBtn.dataset.pid = p.product_id; viewBtn.textContent = 'View';
      btnWrap.appendChild(addBtn); btnWrap.appendChild(viewBtn);

      card.appendChild(img); card.appendChild(h3); card.appendChild(priceDiv); card.appendChild(btnWrap);
      grid.appendChild(card);

      // image fallback: try alternate URLs from product.images then local copies
      try{
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

    // Add to cart handlers (disable briefly to avoid accidental double-adds)
    grid.querySelectorAll('button.add').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        const button = e.currentTarget;
        if(button.disabled) return;
        button.disabled = true; const orig = button.textContent; button.textContent = 'Added ✓';
        setTimeout(()=>{ button.disabled = false; button.textContent = orig; }, 700);

        sendMetric('count', 'button_click', 1);
        sendMetric('count', 'add_to_cart', 1);
        const id = e.currentTarget.dataset.id;
        const product = (cachedProducts || []).find(x=>x.id===id);
        if(!product){ alert('Product not found'); button.disabled = false; button.textContent = orig; return; }
        const cart = readCart();
        const found = cart.find(i=>i.id===product.id);
        if(found) found.quantity += 1; else cart.push({ id: product.id, title: product.title, price: product.price, product_id: product.product_id, variant_id: product.variant_id, quantity: 1 });
        writeCart(cart);
        updateCartBadge();
        showToast('Added to cart');
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

  // Toasts for small transient notifications
  function showToast(message, timeout=2500){
    try{
      const cont = document.getElementById('toastContainer'); if(!cont) return;
      const t = document.createElement('div'); t.className = 'toast'; t.textContent = message;
      cont.appendChild(t);
      setTimeout(()=>{ t.style.opacity = '0'; setTimeout(()=> t.remove(), 200); }, timeout);
    }catch(e){ console.warn('Toast failed', e); }
  }

  // Cart modal
  const cartModal = document.getElementById('cartModal');
  document.getElementById('viewCart').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('checkoutBtn').addEventListener('click', ()=>{ document.getElementById('checkoutForm').style.display = 'block'; window.scrollTo(0, document.body.scrollHeight); });

  function openCart(){
    renderCart();
    cartModal.classList.add('open');
  }
  function closeCart(){ cartModal.classList.remove('open'); document.getElementById('checkoutForm').style.display = 'none'; }

  function renderCart(){
    const list = document.getElementById('cartList'); list.innerHTML = '';
    const cart = readCart();
    if(cart.length===0){
      const empty = document.createElement('div'); empty.textContent = 'Your cart is empty'; list.appendChild(empty);
      document.getElementById('cartTotal').textContent = formatPrice(0); updateShippingDisplay(); return; }
    cart.forEach(item => {
      const row = document.createElement('div'); row.className='row';
      row.style.justifyContent = 'space-between';
      const left = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = item.title || '';
      const muted = document.createElement('div'); muted.className = 'muted'; muted.textContent = formatPrice(item.price);
      left.appendChild(strong); left.appendChild(muted);

      const right = document.createElement('div');
      const dec = document.createElement('button'); dec.className = 'btn dec'; dec.dataset.id = item.id; dec.textContent = '-';
      const qty = document.createElement('span'); qty.textContent = item.quantity;
      const inc = document.createElement('button'); inc.className = 'btn inc'; inc.dataset.id = item.id; inc.textContent = '+';
      const rm = document.createElement('button'); rm.className = 'btn rm'; rm.dataset.id = item.id; rm.textContent = 'Remove';

      right.appendChild(dec); right.appendChild(qty); right.appendChild(inc); right.appendChild(rm);
      row.appendChild(left); row.appendChild(right);
      list.appendChild(row);

      dec.addEventListener('click', ()=>{ const id = dec.dataset.id; const cart = readCart(); const it = cart.find(i=>i.id===id); if(!it) return; if(it.quantity>1){ it.quantity--; showToast('Quantity decreased'); } else { const idx = cart.findIndex(i=>i.id===id); cart.splice(idx,1); showToast('Item removed'); } writeCart(cart); renderCart(); updateCartBadge(); });
      inc.addEventListener('click', ()=>{ const id = inc.dataset.id; const cart = readCart(); const it = cart.find(i=>i.id===id); if(!it) return; it.quantity++; writeCart(cart); renderCart(); updateCartBadge(); showToast('Quantity increased'); });
      rm.addEventListener('click', ()=>{ const id = rm.dataset.id; const cart = readCart(); const idx = cart.findIndex(i=>i.id===id); if(idx>-1) cart.splice(idx,1); writeCart(cart); renderCart(); updateCartBadge(); showToast('Item removed'); });
    });

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
    modal.classList.add('open');

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

      // Use textContent to avoid rendering untrusted HTML in product descriptions
      descEl.textContent = product.description || product.body_html || product.meta_description || product.title || 'No description available.';

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
      const local = (cachedProducts || (await fetchProducts())).find(p=>p.product_id===productId || p.id===productId);
      if(local){
        titleEl.textContent = local.title;
        if(local.images && local.images.length) { imgEl.src = local.images[0]; imgEl.style.display = 'block'; }
        descEl.textContent = local.description || '';
        shipEl.textContent = 'Local product — shipping/price may vary.';
        sendMetric('count', 'product_view_local', 1);
      }
    }
  }

  document.getElementById('closeProduct').addEventListener('click', ()=>{ document.getElementById('productModal').classList.remove('open'); });

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
        if(CONFIG.printifyConfigured){
          // build content with safe DOM APIs rather than innerHTML
          statusEl.textContent = 'Printify: ';
          const strong = document.createElement('strong'); strong.textContent = 'configured'; statusEl.appendChild(strong);
          statusEl.appendChild(document.createTextNode(' — '));
          const btn = document.createElement('button'); btn.id = 'testCreds'; btn.className = 'btn'; btn.textContent = 'Test credentials';
          statusEl.appendChild(btn);
          // attach handler immediately
          btn.addEventListener('click', async ()=>{
            btn.textContent = 'Testing…';
            try{
              const r = await fetch('/api/printify/test');
              const j = await r.json();
              if(r.ok) btn.textContent = 'Success ✓'; else btn.textContent = 'Failed ✕';
              setTimeout(()=> btn.textContent = 'Test credentials', 2500);
              console.log('printify test', j);
            }catch(e){ btn.textContent = 'Failed ✕'; setTimeout(()=> btn.textContent = 'Test credentials', 2500); console.error(e); }
          });
        } else {
          statusEl.textContent = 'Printify: not configured (set PRINTIFY_TOKEN & SHOP_ID to enable live products and real checkout)';
        }
      }

      // Initialize currency selector UI
      try{
        setCurrency(CURRENT_CURRENCY);
        const sel = document.getElementById('currencySelector');
        if(sel){ sel.value = CURRENT_CURRENCY; sel.addEventListener('change', (e)=>{ setCurrency(e.target.value); render(); renderCart(); updateCartBadge(); }); }
      }catch(e){/* ignore if UI not present */}
    }catch(e){ console.warn('Could not load config', e); }
  }
  loadConfig();

  // UI initialization (one-time)
  let uiInitialized = false;
  function initUI(){
    if(uiInitialized) return; uiInitialized = true;
    const filter = document.getElementById('productFilter'); if(filter) filter.addEventListener('change', ()=>{ render(); });
    const clearBtn = document.getElementById('clearCartBtn'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('Clear cart?')){ localStorage.removeItem(CART_KEY); updateCartBadge(); renderCart(); showToast('Cart cleared'); } });

    // overlay click to close modals
    if(cartModal) cartModal.addEventListener('click', (e)=>{ if(e.target === cartModal) closeCart(); });
    const pModal = document.getElementById('productModal'); if(pModal) pModal.addEventListener('click', (e)=>{ if(e.target === pModal) pModal.classList.remove('open'); });

    // ESC to close
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeCart(); const pm = document.getElementById('productModal'); if(pm) pm.classList.remove('open'); } });

    // ensure cart badge correct
    updateCartBadge();
  }
  initUI();

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
      address_to: { first_name: data.first_name, last_name: data.last_name, email: data.email, address1: data.address1 || data.address, city: data.city, zip: data.zip, country: (data.country || CONFIG.defaultCountry || '') },
      line_items: cart.map(i=>({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      order_subtotal_cents: subtotal,
      shipping_cost_usd_cents: shippingUsdCents,
      shipping_method: getSelectedShippingMethod(),
      send_shipping_notification: false,
      display_currency: CURRENT_CURRENCY,
      confirm_real: (CONFIG.printifyConfigured && !CONFIG.safeMode) ? true : false,
      send_confirmation_email: data.send_confirmation_email === 'on' || data.send_confirmation_email === 'true' || data.send_confirmation_email === '1'
    };

    const resEl = document.getElementById('orderResult'); resEl.textContent = 'Placing order…';
    try{
      sendMetric('count', 'checkout_started', 1);
    const rxStart = Date.now();
    const res = await fetch('/api/checkout', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    const rxDur = Date.now() - rxStart; sendMetric('distribution', 'response_time', rxDur);
    const json = await res.json();
    if(!res.ok){ sendMetric('count', 'checkout_failed', 1); throw json; }
    resEl.style.color = 'green'; resEl.textContent = `Order placed — id: ${json.id || json.external_id || json.order_id || json}`;
    sendMetric('count', 'order_placed', 1);
    // send order total as gauge in USD cents and in display currency cents if available
    try{
      const cart = readCart(); const amount = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
      const totalUsd = amount + (payload.shipping_cost_usd_cents || 0);
      sendMetric('gauge', 'order_total_cents', totalUsd);
      const converted = convertCentsToCurrency(totalUsd, CURRENT_CURRENCY);
      sendMetric('gauge', `order_total_${CURRENT_CURRENCY}_cents`, converted);
    }catch(e){}
    localStorage.removeItem(CART_KEY); updateCartBadge(); renderCart(); showToast('Order placed — id: ' + (json.id || json.external_id || json.order_id || json));
    }catch(err){ sendMetric('count', 'checkout_failed', 1);
      console.error(err);
      resEl.style.color = 'red'; resEl.textContent = `Failed: ${err.message || JSON.stringify(err)}`;
      showToast('Order failed');
    }
  });

  // Init
  render();

  // Page-level metrics
  try{
    sendMetric('count', 'page_view', 1);
    let loadTime = Math.round(performance.now());
    const navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation') && performance.getEntriesByType('navigation')[0]) || null;
    if(navEntry && navEntry.loadEventEnd > 0){ loadTime = Math.round(navEntry.loadEventEnd); }
    sendMetric('gauge', 'page_load_time', loadTime);
  }catch(e){/* ignore */}
})();
