// fireall.js - CSP-safe full version with live status
class FireallClass {
    constructor() {
        this.isMonitoring = false;
        this.isCompromised = false;
        this.log = [];
        this.consoleReady = false;
        this.memoryThreshold = 100 * 1024 * 1024;
        this.errorCodes = ['404', '403', '4049'];
        this.rateLimitMap = new Map();
        this.domSnapshot = document.body ? document.body.innerHTML : '';
        this.monitorIntervals = [];
        this.statusBanner = null;
    }

    init() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        this.createStatusBanner();
        this.monitorDOM();
        this.monitorDevTools();
        this.monitorMemory();
        this.monitorPerformance();
        this.monitorGlobals();
        this.monitorContentChanges();
        this.monitorNetwork();
        this.monitorIntervalAntiTamper();
        this.startSelfInflate();
        this.startConsoleMonitor();

        this.updateStatus('Fireall running');
        console.log('%cFireall initialized safely!', 'color:#00ff00;font-weight:bold;');
    }

    generateBreachCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    createStatusBanner() {
        this.statusBanner = document.createElement('div');
        this.statusBanner.id = 'fireall-status';
        this.statusBanner.style.position = 'fixed';
        this.statusBanner.style.bottom = '10px';
        this.statusBanner.style.right = '10px';
        this.statusBanner.style.background = '#00cc00';
        this.statusBanner.style.color = '#fff';
        this.statusBanner.style.fontFamily = 'Arial, sans-serif';
        this.statusBanner.style.padding = '5px 10px';
        this.statusBanner.style.fontSize = '12px';
        this.statusBanner.style.zIndex = '99999';
        this.statusBanner.style.borderRadius = '4px';
        this.statusBanner.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        this.statusBanner.textContent = 'Fireall initializing...';
        document.body.appendChild(this.statusBanner);
    }

    updateStatus(text) {
        if (this.statusBanner) this.statusBanner.textContent = text;
    }

    // --- Monitoring functions ---
    monitorDOM() {
        const observer = new MutationObserver(mutations => {
            if (this.isCompromised) return;
            let suspiciousChanges = 0;
            mutations.forEach(m => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const tag = node.tagName.toLowerCase();
                            if (['script', 'iframe', 'object', 'embed', 'link'].includes(tag)) {
                                this.terminate('Unexpected element added: ' + tag, '4049');
                            }
                            suspiciousChanges++;
                        }
                    });
                }
                if (m.type === 'attributes') {
                    const attr = m.attributeName;
                    const val = m.target.getAttribute(attr);
                    if (attr && (attr.startsWith('on') || (val && val.includes('javascript:')))) {
                        this.terminate('Malicious attribute modification: ' + attr, '4049');
                    }
                }
            });
            if (suspiciousChanges > 5) this.terminate('Excessive DOM modifications detected', '4049');
        });
        observer.observe(document, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
    }

    monitorDevTools() {
        const threshold = 160;
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
                this.terminate('Developer tools detected', '4049');
            }
        }, 1000));
    }

    monitorMemory() {
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            try {
                if (performance.memory && performance.memory.usedJSHeapSize > this.memoryThreshold) {
                    this.terminate('High memory usage detected', '4049');
                }
            } catch (e) {
                this.logEvent('Memory API unavailable: ' + e.message);
            }
        }, 3000));
    }

    monitorPerformance() {
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            const start = performance.now();
            let x = 0; for (let i = 0; i < 10000; i++) x += i;
            const end = performance.now();
            if (end - start > 50) this.terminate('Performance anomaly detected: ' + (end - start).toFixed(2) + 'ms', '4049');
        }, 2000));
    }

    monitorGlobals() {
        const suspicious = ['beEF', 'Metasploit', 'sqlmap', 'Burp', 'Eruda'];
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            suspicious.forEach(g => {
                if (window[g]) this.terminate('Suspicious global variable detected: ' + g, '4049');
            });
        }, 2000));
    }

    monitorContentChanges() {
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            const newSnapshot = document.body ? document.body.innerHTML : '';
            if (newSnapshot !== this.domSnapshot) this.terminate('Page content changed unexpectedly', '4049');
        }, 5000));
    }

    monitorNetwork() {
        const self = this;
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            self.checkRateLimit(args[0]);
            return originalFetch.apply(this, args);
        };
        const originalXHR = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            self.checkRateLimit(url);
            return originalXHR.call(this, method, url, ...rest);
        };
    }

    monitorIntervalAntiTamper() {
        this.monitorIntervals.push(setInterval(() => {
            if (this.isCompromised) return;
            ['setTimeout', 'setInterval'].forEach(fn => {
                if (typeof window[fn] !== 'function') {
                    this.terminate('Critical function tampering detected: ' + fn, '4049');
                }
            });
        }, 1000));
    }

    checkRateLimit(url) {
        const now = Date.now();
        if (!this.rateLimitMap.has(url)) this.rateLimitMap.set(url, []);
        const timestamps = this.rateLimitMap.get(url).filter(t => now - t < 5000);
        timestamps.push(now);
        this.rateLimitMap.set(url, timestamps);
        if (timestamps.length > 5) this.terminate(`Rate limit exceeded for ${url}`, '4049');
    }

    containsSuspiciousContent(str) {
        return ['<script', 'javascript:', 'onerror', 'onload'].some(p => str.toLowerCase().includes(p));
    }

    terminate(reason, code = '404') {
        if (this.isCompromised) return;
        this.isCompromised = true;
        if (!this.errorCodes.includes(code)) code = '404';
        const breachCode = this.generateBreachCode();
        this.logEvent(`TERMINATED: ${reason} | BREACH CODE: ${breachCode} | ERROR CODE: ${code}`);
        if (this.statusBanner) this.statusBanner.style.background = '#cc0000';
        if (this.statusBanner) this.statusBanner.textContent = 'Fireall TERMINATED';
        document.body.innerHTML = `
            <h1>Error ${code}</h1>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Breach Code:</strong> ${breachCode}</p>
            <hr style="width:50%;border:1px solid #333;">
            <h2>Security Log</h2>
            <pre style="text-align:left;margin:0 auto;display:inline-block;padding:10px;border:1px solid #ccc;background:#fff;">${this.log.join('\n')}</pre>
            <p>The page has been terminated to maintain security.</p>
        `;
        window.stop();
        console.error('Fireall triggered:', reason);
    }

    logEvent(msg) {
        const timestamp = new Date().toISOString();
        const formatted = `[Fireall][${timestamp}] ${msg}`;
        if (this.consoleReady) console.log(`%c${formatted}`, 'color:#ff0000;font-weight:bold;background:#f0f0f0;padding:2px;');
        this.log.push(formatted);
        this.updateStatus('Fireall running');
    }

    startSelfInflate() {
        setInterval(() => {
            if (!window.fireallInstance || window.fireallInstance.isCompromised) {
                console.warn('%cFireall self-inflating...', 'color:#ff0000;font-weight:bold;');
                window.fireallInstance = new FireallClass();
                window.fireallInstance.init();
            }
        }, 5000);
    }

    startConsoleMonitor() {
        this.consoleReady = true;
    }
}

// Auto-boot Fireall safely
document.addEventListener('DOMContentLoaded', () => {
    if (!window.fireallInstance) {
        window.fireallInstance = new FireallClass();
        window.fireallInstance.init();
    }
});
