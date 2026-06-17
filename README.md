# PropertyScout AI Agent Platform

---

# 🇬🇧 ENGLISH

## What This Does

An AI virtual office of **11 named agents** that transforms raw property listing URLs into fully optimized, publication-ready bilingual content — titles, descriptions, FAQ schema, market analysis, and location intelligence.

- **Input:** A CSV file containing listing URLs from PropertyScout.co.th
- **Output:** Bilingual copy (TH + EN), quality scores, FAQ schema, standalone HTML report

## Agent Pipeline

| # | Agent | Role |
|---|-------|------|
| 1 | **KANYA** | Intake — fetch & extract structured data from listing page |
| 2 | **PANSA** | Enrich — fill missing fields from external sources |
| 3 | **SUWAN** | Audit — score completeness, accuracy, and appeal |
| 4 | **PRIYA** | Research — market context & comparable pricing |
| 5 | **NIRAN** | Factcheck — verify BTS distances, station names, price/sqm |
| 6 | **TAWAN** | SEO — optimise title & keywords for both TH and EN |
| 7 | **WICHAI** | Copywriter — write bilingual headlines, descriptions, meta |
| 8 | **DAOW** | AEO — generate FAQ schema for ChatGPT / Perplexity / Gemini |
| 9 | **PLOYCHIT** | Optimise — merge & align all bilingual output |
| 10 | **PHITCHAYA** | Score — calculate final grade (A / B+ / C+ / C / D) |
| 11 | **FIAT** | Publish — approve PASS, flag BORDERLINE, return FAIL for revision |

## Features

| Feature | Detail |
|---------|--------|
| **Bilingual Output** | Every field — title, headline, FAQ, meta — in Thai + English |
| **Location Intelligence** | Transit (BTS/MRT/ARL), malls, hospitals, airports, expressways, schools, parks |
| **Market Comparison** | Price/sqm vs same-project units & nearby competing projects |
| **Investment Notes** | Freehold/Leasehold status, SET-listed developer flag, yield estimates |
| **AEO FAQ Schema** | Structured Q&A optimised for ChatGPT, Perplexity, Gemini citation |
| **Scoring System** | Completeness × 0.4 + Accuracy × 0.3 + Appeal × 0.3 → letter grade |
| **Standalone Report** | Single-file HTML export — shareable with no server required |
| **Virtual Office UI** | React 18 dashboard for viewing results and monitoring agents |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Claude API (Anthropic) — claude-opus-4-8 |
| Pipeline | Python 3 |
| Frontend | React 18 (CDN) + Babel Standalone — no build step required |
| Report | Vanilla HTML / CSS / JS — zero dependencies |
| Output | JSON + CSV |

## Project Structure

```
PropertyScout/
├── AI Agent Platform.html     # Virtual Office dashboard (React)
├── agent-cards.jsx            # Shared UI components
├── runner/
│   ├── run_agents.py          # Main pipeline — reads CSV, calls Claude API
│   └── export_standalone.py  # Exports self-contained HTML report
├── app/                       # React JSX views
│   └── results.jsx            # Listing result cards
├── reports/
│   └── team_report.html       # Bilingual team report template
├── data/
│   ├── agent_results.json     # Pipeline output (sample data included)
│   ├── ps_summary.csv         # Management summary table
│   └── ps_details.csv         # Content team detail CSV
├── .env.example               # API key template — copy to .env
└── เปิดโปรแกรม.bat            # One-click launcher (Windows)
```

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/vii5ri/propertyscout-ai-agent-platform.git
cd propertyscout-ai-agent-platform
```

### 2. Add your API key
```bash
cp .env.example .env
# Edit .env and paste your Anthropic API key
```
```
ANTHROPIC_API_KEY=sk-ant-...
```
> ⚠️ **Never commit `.env`** — it is already in `.gitignore`

### 3. Install dependencies
```bash
pip install anthropic python-dotenv requests
```

### 4. Create a CSV with listing URLs
```csv
url
https://propertyscout.co.th/en/1-br-condo-noble-ploenchit-near-bts-phloen-chit-743934/
```

### 5. Run the pipeline
```bash
python runner/run_agents.py your_listings.csv
```

### 6. Export standalone HTML report
```bash
python runner/export_standalone.py
# Output → reports/team_report_standalone.html (single shareable file)
```

### 7. Open the dashboard

**Windows:** Double-click `เปิดโปรแกรม.bat`

**Mac / Linux:**
```bash
python -m http.server 8080
# Open: http://localhost:8080/AI Agent Platform.html
```

## Output Files

| File | Description |
|------|-------------|
| `data/agent_results.json` | Full JSON — all agent outputs, bilingual copy, scores |
| `data/ps_summary.csv` | Management summary table |
| `data/ps_details.csv` | Full content detail for copy-paste by content team |
| `reports/team_report.html` | Beautiful bilingual report (requires local server) |
| `reports/team_report_standalone.html` | Same report — self-contained, shareable single file |

## Scoring Formula

```
Final score = Completeness × 0.4  +  Accuracy × 0.3  +  Appeal × 0.3

Grade:   A (90+)  |  B+ (80–89)  |  C+ (70–79)  |  C (60–69)  |  D (<60)
Result:  PASS (≥75)  |  BORDERLINE (70–74)  |  FAIL (<70)
```

## Sample Output

The `data/` folder contains sample output from 3 real listings:

| Project | Location | Score | Grade |
|---------|----------|:-----:|:-----:|
| Noble Ploenchit | Bangkok CBD | 84 | B+ |
| Grand Florida Beachfront | Pattaya | 83 | B+ |
| Dusit Condominium | Hua Hin | 78 | C+ |

## License

MIT — Free to use, modify, and distribute.

---
---

# 🇹🇭 ภาษาไทย

## ระบบนี้ทำอะไร

ออฟฟิศเสมือนของ AI **11 agents** ที่แปลง URL ประกาศอสังหาริมทรัพย์ให้กลายเป็น content พร้อมใช้งาน — ทั้ง title, description, FAQ schema, การวิเคราะห์ตลาด และข้อมูลทำเล ครบทั้งภาษาไทยและอังกฤษ

- **Input:** ไฟล์ CSV ที่มี URL ประกาศจาก PropertyScout.co.th
- **Output:** Copy ไทย + อังกฤษ, คะแนนคุณภาพ, FAQ schema, รายงาน HTML แบบส่งต่อได้ทันที

## ทีม AI Agents

| # | Agent | หน้าที่ |
|---|-------|---------|
| 1 | **KANYA** | รับข้อมูล — ดึงและแยกข้อมูลจากหน้า listing |
| 2 | **PANSA** | เติมข้อมูลที่ขาดจากแหล่งภายนอก |
| 3 | **SUWAN** | ตรวจสอบคุณภาพ — ความสมบูรณ์, ความแม่นยำ, ความน่าสนใจ |
| 4 | **PRIYA** | วิจัยตลาดและบริบทราคา |
| 5 | **NIRAN** | ตรวจสอบข้อเท็จจริง — ระยะ BTS, ชื่อสถานี, ราคาต่อ ตร.ม. |
| 6 | **TAWAN** | ปรับ SEO title และ keyword ทั้งภาษาไทยและอังกฤษ |
| 7 | **WICHAI** | เขียน copy — headline, description, meta ทั้งสองภาษา |
| 8 | **DAOW** | สร้าง FAQ Schema สำหรับ ChatGPT, Perplexity, Gemini |
| 9 | **PLOYCHIT** | รวมและปรับ output ทุกภาษาให้สอดคล้องกัน |
| 10 | **PHITCHAYA** | คำนวณคะแนนสุดท้ายและเกรด A–D |
| 11 | **FIAT** | อนุมัติ PASS, ตั้งค่า BORDERLINE, ส่งกลับ FAIL เพื่อแก้ไข |

## ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| **Bilingual Output** | ทุกช่อง — title, headline, FAQ, meta ครบทั้งไทยและอังกฤษ |
| **ข้อมูลทำเล** | BTS/MRT/ARL, ห้างสรรพสินค้า, โรงพยาบาล, สนามบิน, ทางด่วน, โรงเรียน, สวน |
| **เปรียบเทียบตลาด** | ราคา/ตร.ม. เทียบกับ unit ในโครงการเดียวกันและโครงการใกล้เคียง |
| **Investment Notes** | ข้อมูล Freehold/Leasehold, นักพัฒนาในตลาดหลักทรัพย์, ประมาณการ yield |
| **AEO FAQ Schema** | Q&A ที่ AI chatbot ดึงไปแสดงได้ เช่น ChatGPT, Perplexity, Gemini |
| **ระบบคะแนน** | ความสมบูรณ์ × 0.4 + ความแม่นยำ × 0.3 + ความน่าสนใจ × 0.3 → เกรด |
| **Standalone Report** | ส่งออกเป็นไฟล์ HTML เดียว ส่งต่อได้ทันทีไม่ต้องมี server |
| **Virtual Office UI** | แดชบอร์ด React 18 สำหรับดูผลลัพธ์และ monitor agents |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Claude API (Anthropic) — claude-opus-4-8 |
| Pipeline | Python 3 |
| Frontend | React 18 (CDN) + Babel Standalone — ไม่ต้องมี build step |
| Report | Vanilla HTML / CSS / JS — ไม่มี dependencies |
| Output | JSON + CSV |

## โครงสร้างโปรเจกต์

```
PropertyScout/
├── AI Agent Platform.html     # แดชบอร์ด Virtual Office (React)
├── agent-cards.jsx            # Shared UI components
├── runner/
│   ├── run_agents.py          # Pipeline หลัก — อ่าน CSV, เรียก Claude API
│   └── export_standalone.py  # ส่งออก HTML report แบบ standalone
├── app/                       # React JSX views
│   └── results.jsx            # หน้าแสดงผล listing
├── reports/
│   └── team_report.html       # รายงาน bilingual สำหรับทีม
├── data/
│   ├── agent_results.json     # ผลลัพธ์ pipeline (มีตัวอย่างให้ดู)
│   ├── ps_summary.csv         # ตารางสรุปสำหรับผู้บริหาร
│   └── ps_details.csv         # รายละเอียดสำหรับทีม content
├── .env.example               # Template API key — copy ไปเป็น .env
└── เปิดโปรแกรม.bat            # เปิดโปรแกรมด้วยดับเบิลคลิก (Windows)
```

## วิธีติดตั้งและใช้งาน

### 1. Clone โปรเจกต์
```bash
git clone https://github.com/vii5ri/propertyscout-ai-agent-platform.git
cd propertyscout-ai-agent-platform
```

### 2. ใส่ API Key
```bash
cp .env.example .env
# เปิดไฟล์ .env แล้วใส่ Anthropic API key
```
```
ANTHROPIC_API_KEY=sk-ant-...
```
> ⚠️ **ห้าม commit ไฟล์ .env** — ไฟล์นี้ถูก gitignore ไว้แล้ว

### 3. ติดตั้ง dependencies
```bash
pip install anthropic python-dotenv requests
```

### 4. สร้างไฟล์ CSV ที่มี URL ประกาศ
```csv
url
https://propertyscout.co.th/en/1-br-condo-noble-ploenchit-near-bts-phloen-chit-743934/
```

### 5. รัน Pipeline
```bash
python runner/run_agents.py your_listings.csv
```

### 6. ส่งออกรายงาน HTML แบบ standalone
```bash
python runner/export_standalone.py
# ได้ไฟล์ → reports/team_report_standalone.html (ส่งต่อได้ทันที)
```

### 7. เปิด Dashboard

**Windows:** ดับเบิลคลิก `เปิดโปรแกรม.bat`

**Mac / Linux:**
```bash
python -m http.server 8080
# เปิด: http://localhost:8080/AI Agent Platform.html
```

## ไฟล์ Output

| ไฟล์ | คำอธิบาย |
|------|---------|
| `data/agent_results.json` | ข้อมูล JSON ครบทุก field ทุก agent |
| `data/ps_summary.csv` | ตารางสรุปสำหรับผู้บริหาร |
| `data/ps_details.csv` | รายละเอียด copy สำหรับทีม content |
| `reports/team_report.html` | รายงาน HTML สวยงาม (ต้องรัน server) |
| `reports/team_report_standalone.html` | รายงานเดียวกัน ไฟล์เดียว ส่งต่อได้เลย |

## สูตรคะแนน

```
คะแนนรวม = ความสมบูรณ์ × 0.4  +  ความแม่นยำ × 0.3  +  ความน่าสนใจ × 0.3

เกรด:   A (90+)  |  B+ (80–89)  |  C+ (70–79)  |  C (60–69)  |  D (<60)
ผล:     PASS (≥75)  |  BORDERLINE (70–74)  |  FAIL (<70)
```

## ตัวอย่างผลลัพธ์

โฟลเดอร์ `data/` มีตัวอย่างจาก 3 listings จริง:

| โครงการ | ที่ตั้ง | คะแนน | เกรด |
|---------|--------|:-----:|:----:|
| Noble Ploenchit | กรุงเทพ CBD | 84 | B+ |
| Grand Florida Beachfront | พัทยา | 83 | B+ |
| Dusit Condominium | หัวหิน | 78 | C+ |

## License

MIT — ใช้งาน แก้ไข และแจกจ่ายได้อย่างอิสระ
