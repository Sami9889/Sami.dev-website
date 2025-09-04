#!/usr/bin/env python3
import requests, re, time, datetime, os, ssl, socket

# ================= CONFIG =================
URL = "https://sami.is-a.dev/"
TIMEOUT = 8
DELAY = 1  # seconds between requests
LOG_FILE = "security_scan.log"
HTML_REPORT = "security_scan_report.html"

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy"
]

MALWARE_PATTERNS = [
    "base64_decode", "eval(", "shell_exec", "system(", "passthru(", "exec(", "obfuscate"
]

SENSITIVE_PATHS = [
    "/admin", "/.env", "/phpmyadmin", "/config.php", "/backup.zip", "/wp-config.php", "/test.php"
]

PAYLOADS = [
    "' OR '1'='1", "<script>alert(1)</script>", "../../etc/passwd", "' OR 1=1 --", "'; DROP TABLE users; --"
]

# ================= LOGGING =================
def log(msg):
    print(msg)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.datetime.utcnow()} | {msg}\n")

def write_html_report(results):
    with open(HTML_REPORT, "w") as f:
        f.write("<html><head><title>Security Scan Report</title></head><body>")
        f.write("<h1>Security Scan Report</h1>")
        f.write(f"<p>Scanned: {datetime.datetime.utcnow()} UTC</p>")
        for section, content in results.items():
            color = "red" if "WARNING" in content or "Suspicious" in content else "black"
            f.write(f"<h2>{section}</h2><pre style='color:{color}'>{content}</pre>")
        f.write("</body></html>")

# ================= CHECK FUNCTIONS =================
def fetch(url):
    try:
        return requests.get(url, timeout=TIMEOUT, allow_redirects=True)
    except Exception as e:
        log(f"ERROR: {url} -> {e}")
        return None

def check_status():
    resp = fetch(URL)
    if not resp:
        return None, "ERROR: Website not reachable"
    return resp, f"Status code: {resp.status_code}"

def check_headers(resp):
    out = []
    for h in SECURITY_HEADERS:
        val = resp.headers.get(h)
        if val:
            out.append(f"{h}: {val}")
        else:
            out.append(f"{h}: MISSING")
    return "\n".join(out)

def check_malware(resp):
    found = [p for p in MALWARE_PATTERNS if re.search(p, resp.text, re.I)]
    return "Suspicious patterns detected: " + ", ".join(found) if found else "No suspicious patterns found"

def check_sensitive_paths():
    out = []
    for path in SENSITIVE_PATHS:
        url = URL.rstrip("/") + path
        resp = fetch(url)
        if resp:
            if resp.status_code == 200:
                out.append(f"WARNING: {url} is accessible (200) — BLOCKED RECOMMENDED")
            elif resp.status_code in [403, 401]:
                out.append(f"Protected: {url} ({resp.status_code})")
            elif resp.status_code == 404:
                out.append(f"Not found: {url}")
            else:
                out.append(f"{url} returned {resp.status_code}")
        else:
            out.append(f"Could not connect to {url}")
        time.sleep(DELAY)
    return "\n".join(out)

def check_injection():
    out = []
    for p in PAYLOADS:
        url = f"{URL}?q={p}"
        resp = fetch(url)
        if resp:
            if re.search(r"(sql|mysql|syntax error)", resp.text, re.I):
                out.append(f"SQLi suspicion with payload: {p} — BLOCK SI attempt")
            if p in resp.text:
                out.append(f"XSS/LFI reflection: {p} — BLOCK SI attempt")
        time.sleep(DELAY)
    return "\n".join(out) if out else "No injection issues detected"

def check_ssl_tls():
    out = []
    hostname = URL.replace("https://", "").split("/")[0]
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=TIMEOUT) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                out.append(f"SSL/TLS certificate: Subject={cert.get('subject')}, Validity={cert.get('notAfter')}")
    except Exception as e:
        out.append(f"SSL/TLS check failed: {e}")
    return "\n".join(out)

# ================= MAIN =================
def main():
    # Prevent random runs by requiring manual start
    input("Press Enter to start the security scan...")

    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)

    results = {}
    log("=== Security Scan Started ===")

    # Status
    resp, status = check_status()
    results["Status"] = status
    log(status)

    if resp:
        results["Headers"] = check_headers(resp)
        log(results["Headers"])

        results["Malware Scan"] = check_malware(resp)
        log(results["Malware Scan"])

        results["Sensitive Paths"] = check_sensitive_paths()
        log(results["Sensitive Paths"])

        results["Injection Tests"] = check_injection()
        log(results["Injection Tests"])

        results["SSL/TLS"] = check_ssl_tls()
        log(results["SSL/TLS"])

    log("=== Security Scan Complete ===")
    write_html_report(results)
    log(f"HTML report saved to {HTML_REPORT}")

if __name__ == "__main__":
    main()
