(function() {
  const maintenanceDurationHours = 5; // change duration here
  const mainPageURL = 'index.html';    // page to redirect after maintenance

  const STORAGE_KEY = 'maintEndTime';

  // Create a basic maintenance page layout if not present
  if (!document.getElementById('maintenance-container')) {
    const container = document.createElement('div');
    container.id = 'maintenance-container';
    container.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial";
    container.style.textAlign = 'center';
    container.style.marginTop = '3rem';
    container.innerHTML = `
      <h1>Site is under maintenance</h1>
      <div id="maintenance-countdown" style="font-size:1.6rem; margin-top:1rem;"></div>
    `;
    document.body.innerHTML = ''; // clear existing content
    document.body.appendChild(container);
  }

  const countdownEl = document.getElementById('maintenance-countdown');

  // Get stored end time, or set it if not present
  let endTime = Number(sessionStorage.getItem(STORAGE_KEY));
  if (!endTime || isNaN(endTime) || endTime <= Date.now()) {
    endTime = Date.now() + maintenanceDurationHours * 60 * 60 * 1000;
    sessionStorage.setItem(STORAGE_KEY, endTime);
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
