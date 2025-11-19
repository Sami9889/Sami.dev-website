document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // CONFIGURATION
    // ==========================
    const MAINTENANCE_MODE = true;        // true = ON, false = OFF
    const MAINTENANCE_DURATION_HOURS = 2; // hours
    const MAIN_PAGE_URL = "index.html";   // page to go after maintenance

    if (!MAINTENANCE_MODE) {
        window.location.href = MAIN_PAGE_URL;
        return;
    }

    // Initialize endTime in localStorage
    let endTime = Number(localStorage.getItem("maintEndTime"));
    if (!endTime || isNaN(endTime) || endTime <= Date.now()) {
        endTime = Date.now() + MAINTENANCE_DURATION_HOURS * 60 * 60 * 1000;
        localStorage.setItem("maintEndTime", endTime);
    }

    // Ensure user stays on maintenance page
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

        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);

        countdownEl.textContent = `Maintenance ends in: ${h}h ${m}m ${s}s`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

});
