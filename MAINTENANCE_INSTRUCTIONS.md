# Maintenance Page Configuration Guide

## Quick Start

The maintenance page (`maintenance.html`) has an easy-to-use configuration system at the top of the script section.

## How to Enable/Disable Maintenance

Open `maintenance.html` and find the `MAINTENANCE_SETTINGS` object at the bottom of the file.

### Settings Explained:

```javascript
const MAINTENANCE_SETTINGS = {
  // Enable/disable maintenance mode
  enabled: true,  // Set to false to disable maintenance and auto-redirect
  
  // Set end time (null = no auto-redirect, or use ISO date string)
  endTime: null,  // Example: '2024-12-31T23:59:59Z'
  
  // Estimated duration in hours (for display only)
  estimatedDuration: 2,  // Shows "Expected to complete in approximately 2 hours"
  
  // Auto-redirect URL when maintenance ends
  redirectUrl: '/',  // Where to redirect users after maintenance
  
  // Check interval in seconds (how often to check if maintenance is over)
  checkInterval: 30,  // Check every 30 seconds
  
  // Display settings
  display: {
    title: "We'll Be Right Back",  // Page title
    message: "We're currently performing scheduled maintenance...",  // Main message
    statusText: "🔄 Maintenance in Progress",  // Status badge text
    showEstimate: true  // Show estimated duration box
  }
};
```

## Common Scenarios:

### 1. Enable Maintenance with No Set End Time
```javascript
enabled: true,
endTime: null,
estimatedDuration: 2,
```

### 2. Enable Maintenance with Auto-Redirect at Specific Time
```javascript
enabled: true,
endTime: '2024-12-25T15:30:00Z',  // Will redirect at this time
estimatedDuration: 3,
```

### 3. Disable Maintenance (Auto-redirect to main site)
```javascript
enabled: false,
```

### 4. Custom Messages
```javascript
display: {
  title: "Upgrading Our Systems",
  message: "We're adding exciting new features!",
  statusText: "⚡ Upgrade in Progress",
  showEstimate: true
}
```

## Time Format

Use ISO 8601 format for `endTime`:
- Format: `'YYYY-MM-DDTHH:MM:SSZ'`
- Example: `'2024-12-31T23:59:59Z'` (midnight UTC on Dec 31, 2024)
- Tool: https://www.timestamp-converter.com/

## Tips:

1. **Quick disable**: Set `enabled: false`
2. **Manual end**: Set `endTime: null` (manual redirect only)
3. **Auto end**: Set `endTime: '2024-12-31T23:59:59Z'` (auto-redirect at time)
4. **Update duration**: Change `estimatedDuration: 2` to show users how long

## No External Dependencies!

This maintenance page has:
- ✅ No external CSS files
- ✅ No external JavaScript files
- ✅ No third-party scripts (StatusPage, etc.)
- ✅ Everything is self-contained
- ✅ Works offline and in all browsers including Safari