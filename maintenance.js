/* maintenance.js — drop-in, robust maintenance redirect + countdown
   Usage: edit only inside the CONFIG block below.
*/

(function () {
  // ======= CONFIG =======
  const maintenance = {
    active: false,              // true = maintenance ON, false = OFF
    // Either set durationHours OR endTimeISO (ISO string). If both set, endTimeISO wins.
    durationHours: 5,          // e.g. 5 (hours). Ignored if endTimeISO provided.
    endTimeISO: null,          // e.g. "2025-09-06T12:00:00" or null
    maintenanceFile: "maintenance.html", // filename (no leading slash)
    indexFile: "index.html"    // landing page to return to
  };
  // ========================

  // helpers
  function log(...s) { if (window.console) console.log("[maintenance]", ...s); }

  // Determine base path (directory) of current page, so relative file resolution works
  function getBasePath() {
    // If there's a <base href="..."> use that
    const baseEl = document.querySelector('base[href]');
    if (baseEl) {
      try {
        return new URL(baseEl.href).pathname;
      } catch (e) { /* ignore */ }
    }
    const p = location.pathname;
    // If path ends with '/', it's already a directory
    if (p.endsWith('/')) return p;
    // Otherwise strip filename to get directory
    return p.substring(0, p.lastIndexOf('/') + 1) || '/';
  }

  // Resolve a relative filename (e.g. "maintenance.html") to absolute URL for this site
  function resolveToAbsolute(filename) {
    // Use the base path directory as the parent for the filename
    const base = getBasePath();
    // Build origin + base and resolve with URL
    return new URL(filename, location.origin + base).href;
  }

  // Get or set persistent maintenance end time in sessionStorage to keep consistent across pages
  function getStoredEndTimeKey() {
    // Use absolute path to maintenance file as part of key to avoid collisions across sites
    return "maintenance_end_" + resolveToAbsolute(maintenance.maintenanceFile);
  }

  function computeEndTime() {
    // If user provided explicit ISO, use it (trust it)
    if (maintenance.endTimeISO) {
      try {
        return new Date(maintenance.endTimeISO);
      } catch (e) {
        log("Invalid endTimeISO:", maintenance.endTimeISO);
      }
    }

    // If there's a stored end time (and it's in the future) use it
    const key = getStoredEndTimeKey();
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d) && d.getTime() > Date.now()) return d;
    }

    // Otherwise compute from durationHours and store it
    const now = new Date();
    const hours = Number(maintenance.durationHours) || 0;
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    sessionStorage.setItem(key, end.toISOString());
    return end;
  }

  // main
  const maintenanceUrl = resolveToAbsolute(maintenance.maintenanceFile);
  const indexUrl = resolveToAbsolute(maintenance.indexFile);
  const currentHref = location.href.split('#')[0]; // ignore anchors
  const endTime = computeEndTime();
  log("maintenance.active =", maintenance.active, "| maintenanceUrl =", maintenanceUrl, "| endTime =", endTime.toISOString());

  // If maintenance is not active, and we're currently on the maintenance page, remove stored end time.
  if (!maintenance.active) {
    // If user toggled maintenance off, clear stored key so next maintenance starts fresh
    try { sessionStorage.removeItem(getStoredEndTimeKey()); } catch (e) {}
  }

  // Redirect logic (do not redirect if already on maintenance page)
  if (maintenance.active && Date.now() < endTime.getTime() && currentHref !== maintenanceUrl) {
    // Use replace to avoid adding redirect to history
    log("Redirecting to maintenance page:", maintenanceUrl);
    try { location.replace(maintenanceUrl); } catch (e) { location.href = maintenanceUrl; }
    return; // done — user will be taken to maintenance page
  }

  // If we're on the maintenance page, insert / update a countdown element automatically
  if (currentHref === maintenanceUrl) {
    // Create container if missing
    let container = document.getElementById("maintenance-countdown");
    if (!container) {
      container = document.createElement("div");
      container.id = "maintenance-countdown";
      // basic inline styling so it shows without editing HTML
      container.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
      container.style.fontSize = "1.6rem";
      container.style.textAlign = "center";
      container.style.marginTop = "1rem";
      container.style.padding = "0.5rem";
      // Insert near top of body (after existing first child) or append
      if (document.body.firstChild) document.body.insertBefore(container, document.body.firstChild.nextSibling);
      else document.body.appendChild(container);
    }

    function formatTime(ms) {
      if (ms <= 0) return "0h 0m 0s";
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    function tick() {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        // finished — clear storage and jump back to index
        try { sessionStorage.removeItem(getStoredEndTimeKey()); } catch (e) {}
        log("Maintenance complete — redirecting to:", indexUrl);
        try { location.replace(indexUrl); } catch (e) { location.href = indexUrl; }
        return;
      }
      container.textContent = "Maintenance ends in: " + formatTime(diff);
    }

    // run immediately and then every second
    tick();
    const timer = setInterval(tick, 1000);
    // clear interval when page unloads
    window.addEventListener('beforeunload', () => clearInterval(timer));
  }

  // If we're not on maintenance page and maintenance expired, allow normal browsing (no-op)
})();
