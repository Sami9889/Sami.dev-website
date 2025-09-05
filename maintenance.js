// ======= CONFIG =======
const maintenance = {
  active: false,             // true = maintenance on, false = off
  endTime: "2025-09-06T12:00:00", // maintenance end time
  page: "maintenance.html"  // page to show
};
// ======================

(function() {
  const now = new Date();
  const end = new Date(maintenance.endTime);

  if (maintenance.active && now < end) {
    // redirect to maintenance page
    window.location.href = maintenance.page;
  }
})();
