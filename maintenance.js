document.addEventListener("DOMContentLoaded", () => {

    // CONFIGURATION
    const MAINTENANCE_MODE = true;         // true = maintenance ON, false = OFF
    const MAINTENANCE_DURATION_HOURS = 2;  // hours maintenance should last
    const MAIN_PAGE_URL = "index.html";    // page to redirect after maintenance

    if (!MAINTENANCE_MODE) {
        window.location.href = MAIN_PAGE_URL;
        return;
    }

    let endTime = Number(localStorage.getItem("maintEndTime"));

    // Initialize endTime if not set or expired
    if (!endTime || isNaN(endTime) || endTime <= Date.now()) {
        endTime = Date.now() + MAINTENANCE_DURATION_HOURS * 60 * 60 * 1000;
        localStorage.setItem("maintEndTime", endTime);
    }

    // Force user to stay on maintenance page
    if (!window.location.href.includes("maintenance.html")) {
        window.location.href = "maintenance.html";
        return;
    }

    const countdownEl = document.getElementById("maintenance-countdown");

    function updateCountdown() {
        const remaining = endTime - Date.now();

        if (remaining <= 0) {
            localStorage.removeItem("maintEndTime");
            window.location.href = MAIN_PAGE_URL;
            return;
        }

        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        countdownEl.textContent = `Maintenance ends in: ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

});
