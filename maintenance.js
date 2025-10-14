<script>
document.addEventListener('DOMContentLoaded', function() {
  (function() {
    const maintenanceDurationHours = 5; // duration of maintenance
    const mainPageURL = 'index.html';   // page to redirect after maintenance

    const STORAGE_KEY = 'maintEndTime';

    let endTime = Number(sessionStorage.getItem(STORAGE_KEY));
    if (!endTime || isNaN(endTime) || endTime <= Date.now()) {
      endTime = Date.now() + maintenanceDurationHours * 60 * 60 * 1000;
      sessionStorage.setItem(STORAGE_KEY, endTime);
    }

    let countdownEl = document.getElementById('maintenance-countdown');
    if (!countdownEl) {
      countdownEl = document.createElement('div');
      countdownEl.id = 'maintenance-countdown';
      countdownEl.style.fontSize = '1.6rem';
      countdownEl.style.marginTop = '1rem';
      document.body.appendChild(countdownEl);
    }

    function updateCountdown() {
      const now = Date.now();
      const remainingMs = endTime - now;

      if (remainingMs <= 0) {
        sessionStorage.removeItem(STORAGE_KEY);
        window.location.assign(mainPageURL);
        return;
      }

      const totalSeconds = Math.ceil(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      countdownEl.textContent = `Maintenance ends in: ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    window.addEventListener('beforeunload', () => clearInterval(intervalId));
  })();
});
</script>
