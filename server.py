"""
server.py — PropertyScout AI Agent Platform
Replaces `python -m http.server 8080` with a proper backend that can:
  - Serve static files
  - Accept CSV upload
  - Run the agent pipeline in background
  - Stream progress back to the UI
"""

import os, sys, json, threading, subprocess, time
from pathlib import Path

BASE = Path(__file__).parent

try:
    from flask import Flask, request, jsonify, send_from_directory, Response
except ImportError:
    print("Installing Flask...")
    subprocess.run([sys.executable, "-m", "pip", "install", "flask"], check=True)
    from flask import Flask, request, jsonify, send_from_directory, Response

app = Flask(__name__, static_folder=str(BASE))

# ── Pipeline state ─────────────────────────────────────────────────────────
_state = {
    "running": False,
    "done": False,
    "error": None,
    "log": [],          # list of progress lines
    "total": 0,
    "current": 0,
    "csv_name": "",
}
_lock = threading.Lock()

def reset_state(csv_name=""):
    with _lock:
        _state.update(running=False, done=False, error=None,
                      log=[], total=0, current=0, csv_name=csv_name)

def append_log(line):
    with _lock:
        _state["log"].append(line)


# ── Static file serving (no-cache for dev files) ───────────────────────────
NO_CACHE_EXTS = {".html", ".jsx", ".js", ".css"}

def _no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/")
def root():
    return _no_cache(send_from_directory(BASE, "AI Agent Platform.html"))

@app.route("/<path:path>")
def static_files(path):
    resp = send_from_directory(BASE, path)
    if Path(path).suffix in NO_CACHE_EXTS:
        _no_cache(resp)
    return resp


# ── Upload CSV or Excel ────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file field"}), 400
    f = request.files["file"]
    fname = f.filename.lower()
    if not (fname.endswith(".csv") or fname.endswith(".xlsx") or fname.endswith(".xls")):
        return jsonify({"error": "Please upload a .csv or .xlsx file"}), 400

    save_path = BASE / "data" / "uploaded_listings.csv"
    save_path.parent.mkdir(exist_ok=True)

    if fname.endswith(".csv"):
        f.save(str(save_path))
    else:
        # Excel → extract URLs from the correct column
        import openpyxl, io
        wb = openpyxl.load_workbook(io.BytesIO(f.read()), read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        wb.close()

        urls = []
        if rows:
            # Find column whose header suggests it contains URLs
            # Accepts: url, link, href, http (covers "w-full href", "URL", "link" etc.)
            URL_KEYWORDS = ["url", "link", "href", "http"]
            header = [str(c).strip() if c else "" for c in rows[0]]
            url_col = 0
            for i, h in enumerate(header):
                if any(k in h.lower() for k in URL_KEYWORDS):
                    url_col = i
                    break

            # Skip header row if the first cell in url_col isn't an http URL
            first_val = str(rows[0][url_col]).strip() if rows[0] and url_col < len(rows[0]) and rows[0][url_col] else ""
            data_rows = rows[1:] if not first_val.startswith("http") else rows

            for row in data_rows:
                if row and url_col < len(row) and row[url_col]:
                    val = str(row[url_col]).strip()
                    if val.startswith("http"):
                        urls.append(val)

        # Write as CSV
        with open(str(save_path), "w", encoding="utf-8", newline="") as out:
            out.write("url\n")
            for u in urls:
                out.write(u + "\n")

    # Count URLs
    lines = [l for l in save_path.read_text(encoding="utf-8-sig").splitlines() if l.strip()]
    url_count = max(0, len(lines) - 1)
    return jsonify({"ok": True, "filename": f.filename, "url_count": url_count})


# ── Run pipeline ───────────────────────────────────────────────────────────
@app.route("/api/run", methods=["POST"])
def run():
    with _lock:
        if _state["running"]:
            return jsonify({"error": "Pipeline already running"}), 409

    csv_path = BASE / "data" / "uploaded_listings.csv"
    if not csv_path.exists():
        return jsonify({"error": "No CSV uploaded yet"}), 400

    body = request.get_json(silent=True) or {}
    limit = int(body.get("limit", 0))   # 0 = all

    reset_state(csv_name="uploaded_listings.csv")
    with _lock:
        _state["running"] = True
        _state["limit"] = limit

    def worker():
        script = str(BASE / "runner" / "run_agents.py")
        cmd = [sys.executable, script, str(csv_path)]
        if limit > 0:
            cmd += ["--limit", str(limit)]
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(BASE),
        )
        for line in proc.stdout:
            line = line.rstrip()
            if not line:
                continue
            append_log(line)
            # parse progress hints from run_agents.py output
            with _lock:
                if "Found" in line and "URLs" in line:
                    try:
                        _state["total"] = int(line.split("Found")[1].split("URL")[0].strip())
                    except Exception:
                        pass
                if "Listing" in line and "/" in line:
                    try:
                        part = line.split("Listing")[1].strip()
                        cur = int(part.split("/")[0].strip())
                        _state["current"] = cur
                    except Exception:
                        pass

        proc.wait()
        with _lock:
            if proc.returncode == 0:
                _state["running"] = False
                _state["done"] = True
            else:
                _state["running"] = False
                _state["done"] = True
                _state["error"] = f"Pipeline exited with code {proc.returncode}"

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return jsonify({"ok": True})


# ── Status ─────────────────────────────────────────────────────────────────
@app.route("/api/status")
def status():
    with _lock:
        return jsonify({
            "running": _state["running"],
            "done":    _state["done"],
            "error":   _state["error"],
            "total":   _state["total"],
            "current": _state["current"],
            "log":     _state["log"][-40:],   # last 40 lines
            "csv_name":_state["csv_name"],
        })


# ── Results JSON ────────────────────────────────────────────────────────────
@app.route("/api/results")
def results():
    p = BASE / "data" / "agent_results.json"
    if not p.exists():
        return jsonify({"error": "No results yet"}), 404
    return Response(p.read_text(encoding="utf-8"),
                    mimetype="application/json")


# ── Export standalone ───────────────────────────────────────────────────────
@app.route("/api/export", methods=["POST"])
def export():
    script = str(BASE / "runner" / "export_standalone.py")
    result = subprocess.run([sys.executable, script], capture_output=True, text=True, cwd=str(BASE))
    if result.returncode == 0:
        return jsonify({"ok": True, "file": "reports/team_report_standalone.html"})
    return jsonify({"error": result.stderr}), 500


# ── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  PropertyScout AI Agent Platform")
    print("  http://localhost:8080")
    print("=" * 55)
    app.run(host="0.0.0.0", port=8080, debug=False, threaded=True)
