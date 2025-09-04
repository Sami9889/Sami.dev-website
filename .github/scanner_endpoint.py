# scanner_endpoint.py
from flask import Flask, request, jsonify
import subprocess
import logging
from threading import Thread

# ================= CONFIG =================
APP_HOST = "db.fr-pari1.bengt.wasmernet.com"  # listen on all interfaces
APP_PORT = 10272       # endpoint port
SECRET_KEY = "068b8f3a-88d2-7881-8000-58d3b0601a74"  # strong key to prevent unauthorized triggers
SCANNER_SCRIPT = "security_scan.py"  # path to your scanner script

# ================= LOGGING =================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# ================= FLASK APP =================
app = Flask(__name__)

def run_scanner_in_background():
    """
    Run the security scanner script in a separate thread
    so Flask doesn't block requests.
    """
    try:
        subprocess.Popen(["python3", SCANNER_SCRIPT])
        logging.info("Security scanner triggered successfully.")
    except Exception as e:
        logging.error(f"Failed to trigger scanner: {e}")

@app.route("/trigger-scan", methods=["POST"])
def trigger_scan():
    key = request.form.get("key")
    if key != SECRET_KEY:
        logging.warning(f"Unauthorized scan trigger attempt from {request.remote_addr}")
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    # Trigger the scanner in background
    Thread(target=run_scanner_in_background).start()
    return jsonify({"status": "success", "message": "Security scan started"}), 200

@app.route("/")
def index():
    return "Scanner endpoint is running."

# ================= MAIN =================
if __name__ == "__main__":
    logging.info(f"Starting scanner endpoint on {APP_HOST}:{APP_PORT}")
    app.run(host=APP_HOST, port=APP_PORT)
