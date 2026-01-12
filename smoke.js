const fetch = require('node-fetch');
const PORT = process.env.PORT || 3000;
(async ()=>{
  try{
    console.log('Checking /api/config');
    const cfg = await (await fetch(`http://localhost:${PORT}/api/config`)).json();
    console.log('config:', cfg);

    if(cfg.printifyConfigured){
      console.log('Printify configured — running test endpoint');
      const t = await fetch(`http://localhost:${PORT}/api/printify/test`);
      const tj = await t.json();
      console.log('printify/test status:', t.status);
      console.log('printify/test body:', tj);
    } else {
      console.log('Printify not configured — no printify test run');
    }
  }catch(err){
    console.error('Smoke test failed:', err.message);
    process.exit(2);
  }
})();