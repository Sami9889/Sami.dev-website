
class Firewall {
    constructor() {
        this.isCompromised = false;
        this.log = [];
        this.originalFunctions = {};
        this.memoryThreshold = 100 * 1024 * 1024; // 100MB JS heap
        this.errorCodes = ['404', '403', '4049'];
        this.domSnapshot = this.takeDOMSnapshot();
        this.rateLimitMap = new Map();
        this.selfInflateInterval = null;
        this.init();
    }

    init() {
        this.protectFunctions();
        this.monitorDOM();
        this.monitorDevTools();
        this.monitorMemory();
        this.monitorPerformance();
        this.monitorGlobals();
        this.monitorContentChanges();
        this.monitorNetwork();
        this.performInitialScan();
        this.startSelfInflate();
        console.log('Firewall Active - Everything + Network + Self-Inflate');
    }

    // ---------- CORE  ----------

    generateBreachCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    protectFunctions() {
        const funcs = ['eval', 'Function', 'setTimeout', 'setInterval', 'innerHTML', 'outerHTML', 'insertAdjacentHTML'];
        funcs.forEach(fn => {
            if (window[fn]) {
                this.originalFunctions[fn] = window[fn];
                const self = this;
                window[fn] = function(...args) {
                    if (!self.isCompromised && self.containsSuspiciousContent(args.join(' '))) {
                        self.terminate('Suspicious function call: ' + fn, '4049');
                        return;
                    }
                    return self.originalFunctions[fn].apply(this, args);
                };
            }
        });

        setInterval(() => {
            if (this.isCompromised) return;
            funcs.forEach(fn => {
                if (window[fn] && window[fn].toString() !== this.originalFunctions[fn].toString()) {
                    this.terminate('Function tampering detected: ' + fn, '4049');
                }
            });
        }, 2000);
    }

    monitorDOM() {
        const observer = new MutationObserver(mutations => {
            if (this.isCompromised) return;
            let suspiciousChanges = 0;
            mutations.forEach(m => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
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
                    if (attr.startsWith('on') || (val && val.includes('javascript:'))) {
                        this.terminate('Malicious attribute modification: ' + attr, '4049');
                    }
                }
            });
            if (suspiciousChanges > 5) {
                this.terminate('Excessive DOM modifications detected', '4049');
            }
        });
        observer.observe(document, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
    }

    monitorDevTools() {
        const threshold = 160;
        setInterval(() => {
            if (this.isCompromised) return;
            if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
                this.terminate('Developer tools detected', '4049');
            }
        }, 1000);
    }

    monitorMemory() {
        setInterval(() => {
            if (this.isCompromised) return;
            try {
                if (performance.memory && performance.memory.usedJSHeapSize > this.memoryThreshold) {
                    this.terminate('High memory usage detected', '4049');
                }
            } catch (e) {
                this.logEvent('Memory API unavailable: ' + e.message);
            }
        }, 3000);
    }

    monitorPerformance() {
        setInterval(() => {
            if (this.isCompromised) return;
            const start = performance.now();
            let x = 0; for (let i = 0; i < 10000; i++) x += i;
            const end = performance.now();
            if (end - start > 50) {
                this.terminate('Performance anomaly detected: ' + (end - start).toFixed(2) + 'ms', '4049');
            }
        }, 2000);
    }

    monitorGlobals() {
        const suspiciousGlobals = ['beEF', 'Metasploit', 'sqlmap', 'Burp', 'Empire'];
        setInterval(() => {
            if (this.isCompromised) return;
            suspiciousGlobals.forEach(g => {
                if (window[g]) {
                    this.terminate('Suspicious global variable detected: ' + g, '4049');
                }
            });
        }, 2000);
    }

    performInitialScan() {
        const suspicious = ['beEF', 'Metasploit', 'sqlmap', 'Burp'];
        const content = document.documentElement.outerHTML.toLowerCase();
        suspicious.forEach(s => {
            if (content.includes(s.toLowerCase())) {
                this.logEvent('Suspicious content detected: ' + s);
            }
        });
    }

    monitorContentChanges() {
        setInterval(() => {
            if (this.isCompromised) return;
            const newSnapshot = this.takeDOMSnapshot();
            if (newSnapshot !== this.domSnapshot) {
                this.terminate('Page content changed unexpectedly', '4049');
            }
        }, 5000);
    }

    monitorNetwork() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.checkRateLimit(args[0]);
            return originalFetch(...args);
        };

        const originalXHR = XMLHttpRequest.prototype.open;
        const self = this;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            self.checkRateLimit(url);
            return originalXHR.call(this, method, url, ...rest);
        };
    }

    checkRateLimit(url) {
        const now = Date.now();
        if (!this.rateLimitMap.has(url)) this.rateLimitMap.set(url, []);
        const timestamps = this.rateLimitMap.get(url).filter(t => now - t < 5000);
        timestamps.push(now);
        this.rateLimitMap.set(url, timestamps);
        if (timestamps.length > 5) {
            this.terminate(`Rate limit exceeded for ${url}`, '4049');
        }
    }

    takeDOMSnapshot() {
        return document.body ? document.body.innerHTML : '';
    }

    containsSuspiciousContent(str) {
        return ['<script', 'javascript:'].some(p => str.toLowerCase().includes(p));
    }

    getPageDetails() {
        const title = document.title || 'N/A';
        const description = document.querySelector('meta[name="description"]')?.content || 'N/A';
        const url = window.location.href;
        const h1s = Array.from(document.querySelectorAll('h1')).map(e => e.innerText).join('; ') || 'N/A';
        const paragraphs = Array.from(document.querySelectorAll('p')).slice(0,5).map(e => e.innerText).join('\n') || 'N/A';
        return { title, description, url, h1s, paragraphs };
    }

    terminate(reason, code = '404') {
        if (this.isCompromised) return;
        this.isCompromised = true;
        if (!this.errorCodes.includes(code)) code = '404';
        const breachCode = this.generateBreachCode();
        this.logEvent(`TERMINATED: ${reason} | BREACH CODE: ${breachCode} | ERROR CODE: ${code}`);
        console.warn('SECURITY BREACH:', reason, '| BREACH CODE:', breachCode, '| ERROR CODE:', code);

        document.body.innerHTML = '';
        window.stop();

        const details = this.getPageDetails();
        document.body.style.background = '#f4f4f4';
        document.body.style.color = '#333';
        document.body.style.fontFamily = 'Arial, sans-serif';
        document.body.style.textAlign = 'center';
        document.body.style.padding = '50px';
        document.body.innerHTML = `
            <h1>Error ${code}</h1>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Breach Code:</strong> ${breachCode}</p>
            <hr style="width:50%;border:1px solid #333;">
            <h2>Page Details</h2>
            <p><strong>Title:</strong> ${details.title}</p>
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>URL:</strong> ${details.url}</p>
            <p><strong>H1 Elements:</strong> ${details.h1s}</p>
            <h3>First Paragraphs</h3>
            <pre style="text-align:left;margin:0 auto;display:inline-block;padding:10px;border:1px solid #ccc;background:#fff;">${details.paragraphs}</pre>
            <hr style="width:50%;border:1px solid #333;">
            <h2>Security Log</h2>
            <pre style="text-align:left;margin:0 auto;display:inline-block;padding:10px;border:1px solid #ccc;background:#fff;">${this.log.join('\n')}</pre>
            <p>The page has been terminated to maintain security.</p>
        `;
    }

    logEvent(msg) {
        const timestamp = new Date().toISOString();
        this.log.push(`[${timestamp}] ${msg}`);
        console.log('SECURITY LOG:', msg);
    }

    // ---------- SELF-INFLATE ----------
    startSelfInflate() {
        this.selfInflateInterval = setInterval(() => {
            if (!window.firewall || window.firewall.isCompromised) {
                console.warn('Firewall self-inflating...');
                window.firewall = new Firewall();
            }
        }, 5000);
    }
}

// Auto-initialize
window.firewall = new Firewall();
