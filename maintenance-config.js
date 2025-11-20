snippet
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
