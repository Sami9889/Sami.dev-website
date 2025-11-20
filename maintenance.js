document.addEventListener('DOMContentLoaded', async function() {
  const config = MAINTENANCE_CONFIG;
  const BYPASS_KEY = config.storageKeys.bypass;

  // Check if maintenance has been bypassed
  const bypassFlag = localStorage.getItem(BYPASS_KEY);
  if (bypassFlag === 'true') {
    window.location.replace(config.mainPageURL);
    return;
  }

  const elements = {
    title: document.getElementById('maintenance-title'),
    description: document.getElementById('maintenance-description'),
    countdown: document.getElementById('maintenance-countdown'),
    components: document.getElementById('affected-components')
  };

  let activeMaintenance = null;
  let countdownInterval = null;

  // Initialize StatusPage widget
  const sp = new StatusPage.page({ page: config.statusPageId });

  // Fetch active maintenance using widget
  function fetchActiveMaintenance() {
    return new Promise((resolve) => {
      sp.scheduledMaintenances({
        filter: 'active',
        success: function(data) {
          if (data.scheduled_maintenances && data.scheduled_maintenances.length > 0) {
            resolve(data.scheduled_maintenances[0]);
          } else {
            // Check upcoming if no active
            sp.scheduledMaintenances({
              filter: 'upcoming',
              success: function(upcomingData) {
                if (upcomingData.scheduled_maintenances && upcomingData.scheduled_maintenances.length > 0) {
                  resolve(upcomingData.scheduled_maintenances[0]);
                } else {
                  resolve(null);
                }
              },
              error: function() {
                resolve(null);
              }
            });
          }
        },
        error: function() {
          resolve(null);
        }
      });
    });
  }

  // Fetch component statuses
  function fetchComponents() {
    return new Promise((resolve) => {
      sp.components({
        success: function(data) {
          resolve(data.components || []);
        },
        error: function() {
          resolve([]);
        }
      });
    });
  }

  // Display maintenance info
  async function displayMaintenance(maintenance) {
    if (!maintenance) {
      elements.title.textContent = 'No Active Maintenance';
      elements.description.textContent = 'Checking for scheduled maintenance...';
      elements.countdown.textContent = 'Redirecting to main site...';
      
      setTimeout(() => {
        localStorage.setItem(BYPASS_KEY, 'true');
        window.location.replace(config.mainPageURL);
      }, 2000);
      return;
    }

    // Set title and description
    elements.title.textContent = maintenance.name;
    
    const latestUpdate = maintenance.incident_updates[0];
    if (latestUpdate) {
      elements.description.innerHTML = `
        <span class="impact-badge impact-${maintenance.impact}">${maintenance.impact.toUpperCase()}</span>
        <br>${latestUpdate.body}
      `;
    }

    // Display affected components
    const components = await fetchComponents();
    const affectedComponents = components.filter(c => 
      c.status !== 'operational'
    );

    if (affectedComponents.length > 0) {
      let componentsHTML = '<h3>Affected Services:</h3>';
      affectedComponents.forEach(comp => {
        const statusClass = comp.status.replace(/_/g, '-');
        componentsHTML += `
          <div class="component-item">
            <span class="component-status status-${statusClass}"></span>
            <span>${comp.name}: ${comp.status.replace(/_/g, ' ')}</span>
          </div>
        `;
      });
      elements.components.innerHTML = componentsHTML;
    }

    // Start countdown
    const scheduledUntil = new Date(maintenance.scheduled_until);
    startCountdown(scheduledUntil);
  }

  // Countdown timer
  function startCountdown(endTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
      const remaining = endTime - Date.now();
      
      if (remaining <= 0) {
        elements.countdown.textContent = 'Maintenance complete! Redirecting...';
        localStorage.setItem(BYPASS_KEY, 'true');
        setTimeout(() => {
          window.location.replace(config.mainPageURL);
        }, 2000);
        clearInterval(countdownInterval);
        return;
      }

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      elements.countdown.textContent = `Estimated completion: ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  // Check if maintenance is still active periodically
  async function checkMaintenanceStatus() {
    const newMaintenance = await fetchActiveMaintenance();
    
    if (!newMaintenance) {
      // No active maintenance, redirect
      localStorage.setItem(BYPASS_KEY, 'true');
      window.location.replace(config.mainPageURL);
    } else if (!activeMaintenance || newMaintenance.id !== activeMaintenance.id) {
      // New maintenance detected
      activeMaintenance = newMaintenance;
      await displayMaintenance(activeMaintenance);
    }
  }

  // Initial load
  activeMaintenance = await fetchActiveMaintenance();
  await displayMaintenance(activeMaintenance);

  // Periodic check
  setInterval(checkMaintenanceStatus, config.checkInterval * 1000);
});
