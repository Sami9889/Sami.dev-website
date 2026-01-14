(function(){
  function el(id){return document.getElementById(id)}
  const authBtn = el('authBtn'); const tokenIn = el('adminToken'); const status = el('authStatus'); const ordersArea = el('ordersArea'); const tbody = document.querySelector('#ordersTable tbody'); const orderJson = el('orderJson'); const orderDetail = el('orderDetail'); const closeDetail = el('closeDetail');

  function setStatus(t, color){ status.textContent = t; status.style.color = color || '#666'; }

  async function fetchOrders(token){
    setStatus('Loading orders…');
    try{
      const res = await fetch('/admin/orders', { headers: { Authorization: 'Bearer ' + token } });
      if(!res.ok){ const j=await res.json(); throw new Error(j.message||res.statusText); }
      const j = await res.json(); return j.orders || [];
    }catch(e){ setStatus('Failed: ' + (e.message || e)); throw e; }
  }

  async function load(){
    const t = tokenIn.value.trim(); if(!t) return setStatus('Please enter token', 'red');
    sessionStorage.setItem('admin_token', t);
    try{
      const orders = await fetchOrders(t);
      setStatus('Loaded ' + orders.length + ' orders', 'green');
      ordersArea.style.display = '';
      tbody.innerHTML = '';
      orders.forEach(o => {
        const tr = document.createElement('tr');
        const idTd = document.createElement('td'); idTd.textContent = o.id;
        const when = document.createElement('td'); when.textContent = o.created_at || '';
        const tot = document.createElement('td'); tot.textContent = ((o.total_cents||0)/100).toFixed(2);
        const act = document.createElement('td');
        const btn = document.createElement('button'); btn.className='btn'; btn.textContent='View'; btn.addEventListener('click', ()=>viewOrder(o.id));
        act.appendChild(btn);
        tr.appendChild(idTd); tr.appendChild(when); tr.appendChild(tot); tr.appendChild(act);
        tbody.appendChild(tr);
      });
    }catch(e){}
  }

  async function viewOrder(id){
    const t = sessionStorage.getItem('admin_token'); if(!t) return setStatus('Not authenticated', 'red');
    setStatus('Loading order…');
    try{
      const res = await fetch('/admin/orders/' + encodeURIComponent(id), { headers: { Authorization: 'Bearer ' + t } });
      if(!res.ok){ const j=await res.json(); throw new Error(j.message||res.statusText); }
      const j = await res.json(); orderJson.textContent = JSON.stringify(j.order, null, 2); orderDetail.style.display = ''; setStatus('Loaded order', 'green');
    }catch(e){ setStatus('Failed to load order: ' + (e.message||e), 'red'); }
  }

  authBtn.addEventListener('click', load);
  closeDetail.addEventListener('click', ()=>{ orderDetail.style.display = 'none'; orderJson.textContent = ''; });

  // Search and refresh
  const search = el('orderSearch'); if(search) search.addEventListener('input', ()=>{
    const q = search.value.trim().toLowerCase();
    tbody.querySelectorAll('tr').forEach(tr => { const id = (tr.children[0] && tr.children[0].textContent || '').toLowerCase(); tr.style.display = id.includes(q) ? '' : 'none'; });
  });
  const refreshBtn = el('refreshOrders'); if(refreshBtn) refreshBtn.addEventListener('click', load);

  // auto-fill token if in session
  const saved = sessionStorage.getItem('admin_token'); if(saved){ tokenIn.value = saved; setTimeout(()=> load(), 200); }
})();