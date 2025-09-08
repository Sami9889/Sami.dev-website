// ======= CONFIG =======
const maintenance = {
  active: true,            // true = maintenance on, false = off
  durationHours: 5,        // how long maintenance lasts
  page: "/Sami.dev-website/maintenance.html", // maintenance page
  mainSite: "/Sami.dev-website/index.html"    // site to return to
};
// ======================

// Calculate maintenance end time dynamically
const now = new Date();
const endTime = new Date(now.getTime() + maintenance.durationHours * 60 * 60 * 1000);

// Redirect to maintenance page if active
(function() {
  const currentPath = window.location.pathname;
  if (maintenance.active && now < endTime && currentPath !== maintenance.page) {
    window.location.href = maintenance.page;
  }
})();

// Automatically create countdown on maintenance page
(function() {
  const currentPath = window.location.pathname;
  if (!maintenance.active || currentPath !== maintenance.page) return;

  // Create countdown container if it doesn't exist
  let countdownEl = document.getElementById("maintenance-countdown");
  if (!countdownEl) {
    countdownEl = document.createElement("div");
    countdownEl.id = "maintenance-countdown";
    countdownEl.style.fontSize = "2rem";
    countdownEl.style.textAlign = "center";
    countdownEl.style.marginTop = "20px";
    document.body.appendChild(countdownEl);
  }

  function updateCountdown() {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      window.location.href = maintenance.mainSite;
      return;
    }

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.textContent = `Maintenance ends in: ${hours}h ${minutes}m ${seconds}s`;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();
})();
