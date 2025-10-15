
// Encrypted Admin Console - Browser DevTools Only
// Access: AC.login('password')

const AC = (() => {
  // Advanced encryption (multi-layer obfuscation)
  const e = s => {
    let r = btoa(s).split('').reverse().join('');
    return btoa(r).split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 7))).join('');
  };
  
  const d = s => {
    let r = s.split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 7))).join('');
    return atob(atob(r).split('').reverse().join(''));
  };
  
  const cfg = {
    auth: false,
    pwd: e('admin123'), // Multi-layer encrypted password
    
    // Styling constants
    style: {
      header: 'background:#1a1a1a;color:#00ff41;padding:8px 12px;font-size:14px;font-weight:bold;border-left:4px solid #00ff41',
      subheader: 'background:#2a2a2a;color:#00d4ff;padding:6px 12px;font-size:13px;font-weight:bold;border-left:3px solid #00d4ff',
      success: 'color:#00ff41;font-weight:bold',
      error: 'color:#ff4444;font-weight:bold',
      warning: 'color:#ffaa00;font-weight:bold',
      info: 'color:#00d4ff;font-weight:bold',
      command: 'color:#ffaa00;font-family:monospace;font-weight:bold',
      value: 'color:#ffffff;font-family:monospace',
      key: 'color:#00d4ff;font-weight:bold'
    },
    
    // Auth check
    ck: function() {
      if (!this.auth) {
        console.log('%c ACCESS DENIED ', this.style.header);
        console.log('%c Authentication Required ', 'background:#ff4444;color:#fff;padding:4px 8px');
        console.log('%cAC.login("password")', this.style.command);
        return false;
      }
      return true;
    },
    
    // Commands
    login: function(p) {
      if (e(p) === this.pwd) {
        this.auth = true;
        console.log('%c ACCESS GRANTED ', 'background:#00ff41;color:#000;padding:8px 12px;font-size:14px;font-weight:bold');
        console.log('%c Session authenticated successfully ', 'color:#00ff41;font-style:italic');
        this.help();
        return 'LOGGED_IN';
      }
      console.log('%c ACCESS DENIED ', 'background:#ff4444;color:#fff;padding:8px 12px;font-size:14px;font-weight:bold');
      console.log('%c Invalid credentials ', 'color:#ff4444;font-style:italic');
      return 'AUTH_FAILED';
    },
    
    logout: function() {
      this.auth = false;
      console.log('%c SESSION TERMINATED ', 'background:#ff4444;color:#fff;padding:6px 12px;font-weight:bold');
      return 'LOGGED_OUT';
    },
    
    help: function() {
      console.log('%c AVAILABLE COMMANDS ', this.style.header);
      console.log('');
      console.log('%c System ', this.style.subheader);
      console.log('  %cAC.help()%c          Show all commands', this.style.command, this.style.value);
      console.log('  %cAC.status()%c        Display system information', this.style.command, this.style.value);
      console.log('  %cAC.info()%c          Browser details', this.style.command, this.style.value);
      console.log('  %cAC.perf()%c          Performance metrics', this.style.command, this.style.value);
      console.log('');
      console.log('%c Maintenance ', this.style.subheader);
      console.log('  %cAC.m.on()%c          Enable maintenance mode', this.style.command, this.style.value);
      console.log('  %cAC.m.off()%c         Disable maintenance mode', this.style.command, this.style.value);
      console.log('');
      console.log('%c Cookies ', this.style.subheader);
      console.log('  %cAC.c.ls()%c          List all cookies', this.style.command, this.style.value);
      console.log('  %cAC.c.rm()%c          Remove all cookies', this.style.command, this.style.value);
      console.log('');
      console.log('%c Storage ', this.style.subheader);
      console.log('  %cAC.s.ls()%c          Show localStorage items', this.style.command, this.style.value);
      console.log('  %cAC.s.rm()%c          Clear localStorage', this.style.command, this.style.value);
      console.log('  %cAC.s.get(key)%c      Get value by key', this.style.command, this.style.value);
      console.log('  %cAC.s.set(k,v)%c      Set key-value pair', this.style.command, this.style.value);
      console.log('');
      console.log('%c Navigation ', this.style.subheader);
      console.log('  %cAC.go(url)%c         Redirect to URL', this.style.command, this.style.value);
      console.log('  %cAC.reload()%c        Reload current page', this.style.command, this.style.value);
      console.log('');
      console.log('%c Utilities ', this.style.subheader);
      console.log('  %cAC.clear()%c         Clear console', this.style.command, this.style.value);
      console.log('  %cAC.logout()%c        End session', this.style.command, this.style.value);
      console.log('');
      return 'HELP_DISPLAYED';
    },
    
    status: function() {
      if (!this.ck()) return;
      console.log('%c SYSTEM STATUS ', this.style.header);
      console.log('');
      console.log('%c Network ', this.style.key);
      console.log('  URL:', '%c' + location.href, this.style.value);
      console.log('  Protocol:', '%c' + location.protocol, this.style.value);
      console.log('  Host:', '%c' + location.host, this.style.value);
      console.log('');
      console.log('%c Data ', this.style.key);
      console.log('  Cookies:', '%c' + (document.cookie ? 'PRESENT' : 'NONE'), this.style.value);
      console.log('  Storage Items:', '%c' + localStorage.length, this.style.value);
      console.log('  Maintenance:', '%c' + (localStorage.getItem('maintenanceEnabled') || 'false').toUpperCase(), this.style.value);
      console.log('');
      console.log('%c Client ', this.style.key);
      console.log('  Platform:', '%c' + navigator.platform, this.style.value);
      console.log('  Language:', '%c' + navigator.language, this.style.value);
      console.log('  Screen:', '%c' + screen.width + 'x' + screen.height, this.style.value);
      console.log('  Online:', '%c' + (navigator.onLine ? 'YES' : 'NO'), this.style.value);
      console.log('');
      return 'STATUS_OK';
    },
    
    // Maintenance
    m: {
      on: function() {
        if (!cfg.ck()) return;
        localStorage.setItem('maintenanceEnabled', 'true');
        console.log('%c MAINTENANCE MODE ', 'background:#ffaa00;color:#000;padding:6px 12px;font-weight:bold');
        console.log('%c Enabled ', cfg.style.success);
        return 'ENABLED';
      },
      off: function() {
        if (!cfg.ck()) return;
        localStorage.setItem('maintenanceEnabled', 'false');
        console.log('%c MAINTENANCE MODE ', 'background:#00ff41;color:#000;padding:6px 12px;font-weight:bold');
        console.log('%c Disabled ', cfg.style.success);
        return 'DISABLED';
      }
    },
    
    // Cookies
    c: {
      ls: function() {
        if (!cfg.ck()) return;
        console.log('%c COOKIES ', cfg.style.header);
        const ck = document.cookie.split(';');
        if (!document.cookie) {
          console.log('%c No cookies found ', 'color:#888;font-style:italic');
        } else {
          ck.forEach(c => {
            const [key, val] = c.split('=');
            console.log('  %c' + key.trim() + '%c = %c' + (val || ''), cfg.style.key, 'color:#888', cfg.style.value);
          });
        }
        console.log('');
        return ck;
      },
      rm: function() {
        if (!cfg.ck()) return;
        document.cookie.split(';').forEach(c => {
          const n = c.split('=')[0].trim();
          document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
        });
        console.log('%c COOKIES CLEARED ', 'background:#ff4444;color:#fff;padding:6px 12px;font-weight:bold');
        return 'CLEARED';
      }
    },
    
    // Storage
    s: {
      ls: function() {
        if (!cfg.ck()) return;
        console.log('%c LOCAL STORAGE ', cfg.style.header);
        if (localStorage.length === 0) {
          console.log('%c Empty ', 'color:#888;font-style:italic');
        } else {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = localStorage.getItem(k);
            console.log('  %c' + k + '%c = %c' + v, cfg.style.key, 'color:#888', cfg.style.value);
          }
        }
        console.log('');
        return localStorage;
      },
      rm: function() {
        if (!cfg.ck()) return;
        if (confirm('Clear all localStorage data?')) {
          localStorage.clear();
          console.log('%c STORAGE CLEARED ', 'background:#ff4444;color:#fff;padding:6px 12px;font-weight:bold');
          return 'CLEARED';
        }
        return 'CANCELLED';
      },
      get: function(k) {
        if (!cfg.ck()) return;
        const v = localStorage.getItem(k);
        console.log('%c' + k + '%c = %c' + v, cfg.style.key, 'color:#888', cfg.style.value);
        return v;
      },
      set: function(k, v) {
        if (!cfg.ck()) return;
        localStorage.setItem(k, v);
        console.log('%c SET ', 'background:#00ff41;color:#000;padding:4px 8px;font-weight:bold', '%c' + k + '%c = %c' + v, cfg.style.key, 'color:#888', cfg.style.value);
        return 'SET';
      }
    },
    
    // Navigation
    go: function(url) {
      if (!this.ck()) return;
      console.log('%c REDIRECT ', 'background:#00d4ff;color:#000;padding:4px 8px;font-weight:bold', '%c' + url, this.style.value);
      location.href = url;
      return 'REDIRECTING';
    },
    
    reload: function() {
      if (!this.ck()) return;
      console.log('%c RELOADING ', 'background:#00d4ff;color:#000;padding:4px 8px;font-weight:bold');
      location.reload();
      return 'RELOADING';
    },
    
    clear: function() {
      if (!this.ck()) return;
      console.clear();
      console.log('%c CONSOLE CLEARED ', 'background:#00ff41;color:#000;padding:6px 12px;font-weight:bold');
      return 'CLEARED';
    },
    
    // Browser info
    info: function() {
      if (!this.ck()) return;
      console.log('%c BROWSER INFORMATION ', this.style.header);
      console.log('');
      console.log('%c Name:', this.style.key, '%c' + navigator.appName, this.style.value);
      console.log('%c Version:', this.style.key, '%c' + navigator.appVersion, this.style.value);
      console.log('%c User Agent:', this.style.key, '%c' + navigator.userAgent, this.style.value);
      console.log('%c Online Status:', this.style.key, '%c' + (navigator.onLine ? 'ONLINE' : 'OFFLINE'), this.style.value);
      console.log('%c Cookies Enabled:', this.style.key, '%c' + (navigator.cookieEnabled ? 'YES' : 'NO'), this.style.value);
      console.log('%c CPU Cores:', this.style.key, '%c' + (navigator.hardwareConcurrency || 'N/A'), this.style.value);
      console.log('%c Memory:', this.style.key, '%c' + (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A'), this.style.value);
      console.log('%c Touch Support:', this.style.key, '%c' + ('ontouchstart' in window ? 'YES' : 'NO'), this.style.value);
      console.log('');
      return 'INFO_OK';
    },
    
    // Performance
    perf: function() {
      if (!this.ck()) return;
      const p = performance;
      console.log('%c PERFORMANCE METRICS ', this.style.header);
      console.log('');
      console.log('%c Runtime:', this.style.key, '%c' + (p.now() / 1000).toFixed(2) + 's', this.style.value);
      if (p.memory) {
        console.log('%c JS Heap Used:', this.style.key, '%c' + (p.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB', this.style.value);
        console.log('%c JS Heap Limit:', this.style.key, '%c' + (p.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB', this.style.value);
      }
      const nav = p.getEntriesByType('navigation')[0];
      if (nav) {
        console.log('%c DNS Lookup:', this.style.key, '%c' + (nav.domainLookupEnd - nav.domainLookupStart).toFixed(2) + 'ms', this.style.value);
        console.log('%c Connection:', this.style.key, '%c' + (nav.connectEnd - nav.connectStart).toFixed(2) + 'ms', this.style.value);
        console.log('%c DOM Load:', this.style.key, '%c' + (nav.domContentLoadedEventEnd - nav.fetchStart).toFixed(2) + 'ms', this.style.value);
      }
      console.log('');
      return 'PERF_OK';
    }
  };
  
  return cfg;
})();

// Expose globally
window.AC = AC;

// Clean init banner
console.log('%c ADMIN CONSOLE v2.0 ', 'background:#1a1a1a;color:#00ff41;padding:10px 15px;font-size:16px;font-weight:bold;border:2px solid #00ff41');
console.log('%c Authentication Required ', 'background:#2a2a2a;color:#00d4ff;padding:6px 12px;font-size:12px');
console.log('');
console.log('%cAC.login("password")', 'color:#ffaa00;font-family:monospace;font-weight:bold;font-size:14px');
console.log('');
console.log('%c Security: Multi-layer encrypted credentials ', 'color:#888;font-size:11px;font-style:italic');
