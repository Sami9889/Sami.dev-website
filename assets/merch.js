(function(){
  // Simple static product list (can be replaced by /api/products)
  async function fetchProducts(){
    try{
      const res = await fetch('/api/products');
      if(!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }catch(e){
      console.warn('Falling back to local products', e);
      return [
        { id: 'p1', title: 'T-Shirt — Minimal', price: 1999, product_id: '5bfd0b66a342bcc9b5563216', variant_id: 17887, image: 'https://via.placeholder.com/600x600?text=T-Shirt' },
        { id: 'p2', title: 'Sticker Pack', price: 499, product_id: '5bfd0b66a342bcc9b5563217', variant_id: 17888, image: 'https://via.placeholder.com/600x600?text=Sticker' }
      ];
    }
  }

  // Cart helpers
  const CART_KEY = 'site_cart_v1';
  function readCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  function formatMoney(cents){ return (cents/100).toFixed(2); }

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
        <div class="muted">$${formatMoney(p.price)}</div>
        <div style="margin-top:.5rem">
          <button class="btn add" data-id="${p.id}" data-pid="${p.product_id}">Add to cart</button>
          <button class="btn view" data-pid="${p.product_id}">View</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Add to cart handlers
    grid.querySelectorAll('button.add').forEach(btn => {
      btn.addEventListener('click', async (e)=>{
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
    if(cart.length===0){ list.innerHTML = '<div>Your cart is empty</div>'; document.getElementById('cartTotal').textContent = '0.00'; return; }
    cart.forEach(item => {
      const row = document.createElement('div'); row.className='row';
      row.style.justifyContent = 'space-between';
      row.innerHTML = `<div><strong>${item.title}</strong><div class="muted">$${formatMoney(item.price)}</div></div><div><button data-id="${item.id}" class="btn dec">-</button> <span>${item.quantity}</span> <button data-id="${item.id}" class="btn inc">+</button> <button data-id="${item.id}" class="btn rm">Remove</button></div>`;
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

    const total = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
    document.getElementById('cartTotal').textContent = formatMoney(total);
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
      const res = await fetch(`/api/printify/products/${productId}`);
      const json = await res.json();
      if(!res.ok) throw json;
      const product = json.product || {};
      titleEl.textContent = product.title || product.name || product.id || 'Product';

      // image heuristics
      let imgSrc = '';
      if(product.images && product.images.length) imgSrc = product.images[0].src;
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
    }catch(err){
      titleEl.textContent = 'Error loading product';
      descEl.textContent = err.message || JSON.stringify(err);
      shipEl.textContent = '';
      console.error(err);
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

    const payload = {
      address_to: { first_name: data.first_name, email: data.email, address1: data.address1 || data.address, city: data.city, zip: data.zip, country: 'US' },
      line_items: cart.map(i=>({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      shipping_method: 1,
      send_shipping_notification: false,
      confirm_real: (CONFIG.printifyConfigured && !CONFIG.safeMode) ? true : false
    };

    const resEl = document.getElementById('orderResult'); resEl.textContent = 'Placing order…';
    try{
      const res = await fetch('/api/checkout', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const json = await res.json();
      if(!res.ok) throw json;
      resEl.innerHTML = `<div style="color:green">Order placed — id: ${json.id || json.external_id || json.order_id}</div>`;
      localStorage.removeItem(CART_KEY); updateCartBadge(); renderCart();
    }catch(err){
      console.error(err);
      resEl.innerHTML = `<div style="color:red">Failed: ${err.message || JSON.stringify(err)}</div>`;
    }
  });

  // Init
  render();
})();
