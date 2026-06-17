"""
export_standalone.py
--------------------
Reads data/agent_results.json + reports/team_report.html
and produces a single self-contained HTML file with the data
embedded inline — no server, no extra files needed.

Usage:
    python runner/export_standalone.py
    python runner/export_standalone.py --out reports/my_report.html
"""

import json
import os
import sys
import re
import argparse
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH     = os.path.join(BASE, "data", "agent_results.json")
TEMPLATE_PATH = os.path.join(BASE, "reports", "team_report.html")
DEFAULT_OUT   = os.path.join(BASE, "reports", "team_report_standalone.html")


def build_standalone(json_path: str, template_path: str, out_path: str):
    # Load data
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Load HTML template
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Serialize JSON (compact, safe for embedding)
    json_str = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

    # Inject data script immediately after <body> tag
    inject = f'<script>window.__REPORT_DATA__ = {json_str};</script>\n'
    if "<body>" in html:
        html = html.replace("<body>", "<body>\n" + inject, 1)
    else:
        # fallback: inject before first <div
        html = html.replace("<div", inject + "<div", 1)

    # Update <html lang> to include both languages note
    html = html.replace('<html lang="th">', '<html lang="th">', 1)

    # Stamp the file with export timestamp in a comment
    stamp = f"<!-- Standalone export: {datetime.now().strftime('%Y-%m-%d %H:%M')} -->\n"
    html = stamp + html

    # Write output
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(out_path) / 1024
    listing_count = len(data.get("listings", []))
    print(f"OK  Standalone HTML exported")
    print(f"    File : {out_path}")
    print(f"    Size : {size_kb:.1f} KB")
    print(f"    Data : {listing_count} listing(s) embedded")
    print()
    print("Share this single file — no other files needed.")
    print("Recipient just double-clicks to open in any browser.")


def main():
    parser = argparse.ArgumentParser(description="Export standalone PropertyScout report")
    parser.add_argument("--json",  default=JSON_PATH,     help="Path to agent_results.json")
    parser.add_argument("--tmpl",  default=TEMPLATE_PATH, help="Path to team_report.html template")
    parser.add_argument("--out",   default=DEFAULT_OUT,   help="Output file path")
    args = parser.parse_args()

    if not os.path.exists(args.json):
        print(f"ERROR: JSON not found: {args.json}")
        print("       Run the pipeline first: python runner/run_agents.py <csv>")
        sys.exit(1)
    if not os.path.exists(args.tmpl):
        print(f"ERROR: Template not found: {args.tmpl}")
        sys.exit(1)

    build_standalone(args.json, args.tmpl, args.out)


if __name__ == "__main__":
    main()
