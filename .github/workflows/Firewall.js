// fireall.js - Normal Fireall with custom error screens
(function() {
    class FireallClass {
        constructor() {
            this.isMonitoring = false;
            this.isCompromised = false;
            this.statusBanner = null;
            this.memoryThreshold = 100 * 1024 * 1024; // 100MB
            this.errorCodes = ['403', '404', '4049'];
            this.domSnapshot = document.body ? document.body.innerHTML : '';
            this.rateLimitMap = new Map();
            this.monitorIntervals = [];
        }

        init() {
            if (this.isMonitoring) return;
            this.isMonitoring = true;

            this.ensureBody(() => {
                this.createStatusBanner();
                this.updateStatus('Fireall running');

                this.monitorDOM();
                this.monitorDevTools();
                this.monitorMemory();
                this.monitorPerformance();
                this.monitorGlobals();
                this.monitorContentChanges();
                this.monitorNetwork();
                this.monitorIntervalAntiTamper();
                this.startSelfInflate();
            });
        }

        ensureBody(callback) {
            if (document.body) return callback();
            const interval = setInterval(() => {
                if (document.body) {
                    clearInterval(interval);
                    callback();
                }
            }, 50);
        }

        createStatusBanner() {
            this.statusBanner = document.createElement('div');
            Object.assign(this.statusBanner.style, {
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                background: '#00cc00',
                color: '#fff',
                padding: '5px 10px',
                fontSize: '12px',
                zIndex: '99999',
                borderRadius: '4px',
                fontFamily: 'Arial, sans-serif',
            });
            this.statusBanner.textContent = 'Fireall initializing...';
            document.body.appendChild(this.statusBanner);
        }

        updateStatus(text) {
            if (this.statusBanner) this.statusBanner.textContent = text;
        }

        generateBreachCode() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        }

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
                } catch (e) {}
            }, 3000));
        }

        monitorPerformance() {
            this.monitorIntervals.push(setInterval(() => {
                if (this.isCompromised) return;
                const start = performance.now();
                let x = 0; for (let i = 0; i < 10000; i++) x += i;
                const end = performance.now();
                if (end - start > 50) this.terminate('Performance anomaly detected', '4049');
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
            if (originalFetch) {
                window.fetch = function (...args) {
                    self.checkRateLimit(args[0]);
                    return originalFetch.apply(this, args);
                };
            }
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

        terminate(reason, code = '404') {
            if (this.isCompromised) return;
            this.isCompromised = true;
            if (!this.errorCodes.includes(code)) code = '404';
            const breachCode = Math.random().toString(36).substr(2, 12).toUpperCase();
            if (this.statusBanner) {
                this.statusBanner.style.background = '#cc0000';
                this.statusBanner.textContent = 'Fireall TERMINATED';
            }
            document.body.innerHTML = this.generateErrorScreen(reason, code, breachCode);
            window.stop();
        }

        generateErrorScreen(reason, code, breachCode) {
            const errorTitle = code === '403' ? 'Forbidden Access' :
                               code === '404' ? 'Page Not Found' :
                               code === '4049' ? 'Security Violation' : 'Error';
            const color = code === '4049' ? '#cc0000' : '#ff9900';
            return `
                <div style="text-align:center;margin-top:50px;font-family:Arial,sans-serif;">
                    <h1 style="color:${color}">Error ${code}</h1>
                    <h2>${errorTitle}</h2>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Breach Code:</strong> ${breachCode}</p>
                    <hr style="width:50%;border:1px solid #333;">
                    <p>The page has been terminated to maintain security.</p>
                </div>
            `;
        }

        startSelfInflate() {
            setInterval(() => {
                if (!window.fireallInstance || window.fireallInstance.isCompromised) {
                    window.fireallInstance = new FireallClass();
                    window.fireallInstance.init();
                }
            }, 5000);
        }
    }

    if (!window.fireallInstance) {
        window.fireallInstance = new FireallClass();
        window.fireallInstance.init();
    }
})();
