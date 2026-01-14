// ============================================================================
// NOTE: This file is NOT CURRENTLY IN USE
// ============================================================================
// This configuration file is for the advanced maintenance.js system which
// relies on the StatusPage.io widget library. The current maintenance.html
// uses a simpler, self-contained approach that doesn't need this config.
// This file is preserved for reference but is not loaded by any HTML page.
// ============================================================================

// MAINTENANCE CONFIGURATION
const MAINTENANCE_CONFIG = {
  // Your StatusPage.io page ID
  statusPageId: '8tq16kv1cnxh',
  
  // API endpoints
  apiBase: 'https://8tq16kv1cnxh.statuspage.io/api/v2',
  
  // URL to redirect to when maintenance ends
  mainPageURL: 'index.html',
  
  // Check for active maintenance every X seconds
  checkInterval: 60,
  
  // Storage keys
  storageKeys: {
    bypass: 'maintenanceBypass',
    lastCheck: 'maintenanceLastCheck'
  }
};
