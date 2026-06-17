# PropertyScout AI Agent Platform

> **AI-powered listing quality pipeline for [PropertyScout.co.th](https://propertyscout.co.th)**
> — analyzes property listings, generates bilingual (TH/EN) SEO copy, and optimizes for AI answer engines (AEO).

---

## What This Does

A virtual office of **11 named AI agents** that work in sequence to transform raw property listing URLs into fully optimized, publication-ready content — with bilingual titles, descriptions, FAQ schemas, market comparisons, and location intelligence.

**Input:** A CSV of listing URLs
**Output:** Optimized copy in Thai + English, SEO keywords, FAQ schema, market analysis, location research — all in one bilingual HTML report

---

## Agent Pipeline

| # | Agent | Role |
|---|-------|------|
| 1 | **KANYA** | Intake — fetch & extract structured listing data |
| 2 | **PANSA** | Enrich — fill missing fields from external sources |
| 3 | **SUWAN** | Audit — score completeness, accuracy, appeal |
| 4 | **PRIYA** | Research — market context & comparable pricing |
| 5 | **NIRAN** | Factcheck — verify BTS distances, station names, prices |
| 6 | **TAWAN** | SEO — optimise title & keywords (TH + EN) |
| 7 | **WICHAI** | Copywriter — write bilingual headlines, descriptions, meta |
| 8 | **DAOW** | AEO — generate FAQ schema for ChatGPT / Perplexity / Gemini |
| 9 | **PLOYCHIT** | Optimise — merge & align all bilingual output |
| 10 | **PHITCHAYA** | Score — calculate final grade (A / B+ / C+ / C / D) |
| 11 | **FIAT** | Publish — approve PASS, flag BORDERLINE, return FAIL |

---

## Features

- **Bilingual output** — every field has a Thai and English version
- **Location intelligence** — transit (BTS/MRT/ARL), malls, hospitals, airports, expressways, schools, parks
- **Market comparison** — price/sqm vs same-project units & nearby competing projects
- **Investment notes** — freehold/leasehold status, SET-listed developer flags, yield estimates
- **AEO-ready FAQ schema** — structured Q&A for AI chatbot citation (ChatGPT, Perplexity, Gemini)
- **Scoring system** — Completeness × 0.4 + Accuracy × 0.3 + Appeal × 0.3 → letter grade
- **Standalone HTML report** — single-file export, shareable with no server required
- **Virtual Office UI** — React dashboard at `AI Agent Platform.html`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Claude API (Anthropic) — claude-opus-4-8 |
| Pipeline | Python 3 (`runner/run_agents.py`) |
| Frontend | React 18 (CDN) + Babel Standalone JSX |
| Report | Vanilla HTML/CSS/JS — zero dependencies |
| Data | JSON + CSV output |

---

## Project Structure

```
PropertyScout/
├── AI Agent Platform.html     # Virtual Office dashboard (React)
├── agent-cards.jsx            # Shared UI components
├── runner/
│   ├── run_agents.py          # Main pipeline — reads CSV, calls Claude API
│   └── export_standalone.py  # Export self-contained HTML report
├── app/                       # React JSX views
│   ├── results.jsx            # Listing result cards
│   ├── sim.jsx                # Simulation engine
│   └── ...
├── reports/
│   └── team_report.html       # Bilingual team report template
├── data/
│   ├── agent_results.json     # Pipeline output (sample included)
│   ├── ps_summary.csv         # Management summary
│   └── ps_details.csv         # Content team detail CSV
├── .env.example               # API key template (copy to .env)
└── เปิดโปรแกรม.bat            # One-click launcher (Windows)
```

---

## Quick Start

### 1. Clone & setup

```bash
git clone https://github.com/<your-username>/PropertyScout-AI.git
cd PropertyScout-AI
```

### 2. Add your API key

```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

`.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install dependencies

```bash
pip install anthropic python-dotenv requests
```

### 4. Create a CSV with listing URLs

```csv
url
https://propertyscout.co.th/en/1-br-condo-noble-ploenchit-near-bts-phloen-chit-743934/
https://propertyscout.co.th/en/...
```

### 5. Run the pipeline

```bash
python runner/run_agents.py your_listings.csv
```

### 6. Export standalone report

```bash
python runner/export_standalone.py
# → reports/team_report_standalone.html  (single file, shareable)
```

### 7. Open the dashboard

**Windows:** Double-click `เปิดโปรแกรม.bat`

**Mac/Linux:**
```bash
python -m http.server 8080
# Open http://localhost:8080/AI Agent Platform.html
```

---

## Output Files

| File | Purpose |
|------|---------|
| `data/agent_results.json` | Full JSON — all agent outputs, bilingual copy, scores |
| `data/ps_summary.csv` | Management summary table |
| `data/ps_details.csv` | Full content for copy-paste by content team |
| `reports/team_report.html` | Beautiful bilingual HTML report (requires local server) |
| `reports/team_report_standalone.html` | Same report — self-contained, shareable single file |

---

## Scoring Formula

```
final_score = completeness × 0.4 + accuracy × 0.3 + appeal × 0.3

Grade:  A (90+) | B+ (80–89) | C+ (70–79) | C (60–69) | D (<60)
Result: PASS (≥75) | BORDERLINE (70–74) | FAIL (<70)
```

---

## Sample Output

The `data/` folder contains sample output from 3 real listings:
- Noble Ploenchit (Bangkok CBD) — Score 84, Grade B+
- Grand Florida Beachfront (Pattaya) — Score 83, Grade B+
- Dusit Condominium (Hua Hin) — Score 78, Grade C+

---

## License

MIT — free to use, modify, and distribute.

---

*Built for [PropertyScout.co.th](https://propertyscout.co.th) · Powered by Claude AI*
