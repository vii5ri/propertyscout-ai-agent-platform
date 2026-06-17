# PropertyScout AI Agent Platform

> **ระบบ AI วิเคราะห์และปรับปรุงประกาศอสังหาริมทรัพย์บน PropertyScout.co.th**
> AI-powered listing quality pipeline for [PropertyScout.co.th](https://propertyscout.co.th) — generates bilingual TH/EN SEO copy, FAQ schema, market comparison & location intelligence.

---

## ระบบนี้ทำอะไร / What This Does

ทีม AI **11 agents** ทำงานต่อเนื่องกัน รับ URL ประกาศอสังหาฯ แล้วผลิต content พร้อมลง ครบทั้งภาษาไทยและอังกฤษ

A virtual office of **11 named AI agents** that transform raw listing URLs into fully optimized, publication-ready bilingual content — titles, descriptions, FAQ schema, market analysis, and location intelligence.

| | ภาษาไทย | English |
|--|---------|---------|
| **Input** | ไฟล์ CSV ที่มี URL ประกาศ | A CSV of listing URLs |
| **Output** | Copy ไทย+อังกฤษ, คะแนน, FAQ, รายงาน HTML | Bilingual copy, scores, FAQ schema, HTML report |

---

## ทีม AI Agents / Agent Pipeline

| # | Agent | หน้าที่ภาษาไทย | English Role |
|---|-------|----------------|-------------|
| 1 | **KANYA** | รับข้อมูล — ดึงข้อมูลจากหน้า listing | Intake — fetch & extract structured listing data |
| 2 | **PANSA** | เติมข้อมูลที่ขาดจากแหล่งภายนอก | Enrich — fill missing fields from external sources |
| 3 | **SUWAN** | ตรวจสอบคุณภาพและความสมบูรณ์ | Audit — score completeness, accuracy, appeal |
| 4 | **PRIYA** | วิจัยตลาดและบริบทราคา | Research — market context & comparable pricing |
| 5 | **NIRAN** | ตรวจสอบข้อเท็จจริง เช่น ระยะ BTS | Factcheck — verify BTS distances, station names, prices |
| 6 | **TAWAN** | ปรับ SEO title และ keyword ทั้งสองภาษา | SEO — optimise title & keywords (TH + EN) |
| 7 | **WICHAI** | เขียน copy ทั้งไทยและอังกฤษ | Copywriter — write bilingual headlines, descriptions, meta |
| 8 | **DAOW** | สร้าง FAQ Schema สำหรับ AI Chat | AEO — FAQ schema for ChatGPT / Perplexity / Gemini |
| 9 | **PLOYCHIT** | รวมและปรับ output ทุกภาษาให้สอดคล้อง | Optimise — merge & align all bilingual output |
| 10 | **PHITCHAYA** | คำนวณคะแนนสุดท้ายและเกรด | Score — calculate final grade (A / B+ / C+ / C / D) |
| 11 | **FIAT** | อนุมัติ PASS หรือส่งกลับแก้ไข | Publish — approve PASS, flag BORDERLINE, return FAIL |

---

## ฟีเจอร์หลัก / Features

| ฟีเจอร์ | รายละเอียด (TH) | Detail (EN) |
|---------|----------------|------------|
| **Bilingual Output** | ทุกช่อง — title, headline, FAQ, meta ครบทั้งไทยและอังกฤษ | Every field in Thai + English |
| **ข้อมูลทำเล / Location** | BTS/MRT/ARL, ห้าง, โรงพยาบาล, สนามบิน, ทางด่วน, โรงเรียน | Transit, malls, hospitals, airports, expressways, schools |
| **เปรียบเทียบตลาด / Market** | ราคา/ตร.ม. vs unit ในโครงการเดียวกันและโครงการใกล้เคียง | Price/sqm vs same-project & nearby competing projects |
| **Investment Notes** | Freehold/Leasehold, นักพัฒนาในตลาดหลักทรัพย์, ประมาณการ yield | Freehold status, SET-listed developer, yield estimates |
| **AEO FAQ Schema** | Q&A ที่ AI chatbot ดึงไปแสดงได้ (ChatGPT, Perplexity, Gemini) | Structured Q&A for AI chatbot citation |
| **ระบบคะแนน / Scoring** | ความสมบูรณ์ × 0.4 + ความแม่นยำ × 0.3 + ความน่าสนใจ × 0.3 | Completeness × 0.4 + Accuracy × 0.3 + Appeal × 0.3 |
| **Standalone Report** | ส่งออกเป็นไฟล์ HTML เดียว ส่งต่อได้ไม่ต้องมี server | Single-file HTML export, shareable with no server |
| **Virtual Office UI** | แดชบอร์ด React สำหรับดูผลและ monitor agents | React 18 dashboard for results & agent monitoring |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Claude API (Anthropic) — claude-opus-4-8 |
| Pipeline | Python 3 |
| Frontend | React 18 (CDN) + Babel Standalone — ไม่ต้องมี build step / no build step |
| Report | Vanilla HTML/CSS/JS — ไม่มี dependencies / zero dependencies |
| Output | JSON + CSV |

---

## โครงสร้างโปรเจกต์ / Project Structure

```
PropertyScout/
├── AI Agent Platform.html     # แดชบอร์ด Virtual Office (React) / Virtual Office dashboard
├── agent-cards.jsx            # Shared UI components
├── runner/
│   ├── run_agents.py          # Pipeline หลัก — อ่าน CSV, เรียก Claude API / Main pipeline
│   └── export_standalone.py  # ส่งออก HTML report แบบ standalone / Standalone HTML exporter
├── app/                       # React JSX views
│   ├── results.jsx            # หน้าแสดงผล listing / Listing result cards
│   └── ...
├── reports/
│   └── team_report.html       # รายงาน bilingual สำหรับทีม / Bilingual team report
├── data/
│   ├── agent_results.json     # ผลลัพธ์ pipeline + ตัวอย่าง / Pipeline output (sample included)
│   ├── ps_summary.csv         # ตารางสรุปสำหรับผู้บริหาร / Management summary table
│   └── ps_details.csv         # รายละเอียดสำหรับทีม content / Content team detail CSV
├── .env.example               # Template API key — copy ไปเป็น .env / Copy to .env
└── เปิดโปรแกรม.bat            # เปิดโปรแกรมด้วยดับเบิลคลิก (Windows) / One-click launcher
```

---

## วิธีติดตั้งและใช้งาน / Quick Start

### 1. Clone โปรเจกต์ / Clone the repo

```bash
git clone https://github.com/vii5ri/propertyscout-ai-agent-platform.git
cd propertyscout-ai-agent-platform
```

### 2. ใส่ API Key / Add your API key

```bash
cp .env.example .env
# เปิดไฟล์ .env แล้วใส่ Anthropic API key / Edit .env and add your key
```

```
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **ห้าม commit ไฟล์ .env** — ไฟล์นี้ถูก gitignore ไว้แล้ว
> **Never commit `.env`** — it is already in `.gitignore`

### 3. ติดตั้ง dependencies / Install dependencies

```bash
pip install anthropic python-dotenv requests
```

### 4. สร้างไฟล์ CSV / Create a CSV with listing URLs

```csv
url
https://propertyscout.co.th/en/1-br-condo-noble-ploenchit-near-bts-phloen-chit-743934/
https://propertyscout.co.th/en/...
```

### 5. รัน Pipeline / Run the pipeline

```bash
python runner/run_agents.py your_listings.csv
```

### 6. ส่งออกรายงาน / Export standalone report

```bash
python runner/export_standalone.py
# ได้ไฟล์ → reports/team_report_standalone.html
# Output  → single shareable HTML file, no server needed
```

### 7. เปิด Dashboard / Open Dashboard

**Windows:** ดับเบิลคลิก `เปิดโปรแกรม.bat` / Double-click `เปิดโปรแกรม.bat`

**Mac / Linux:**
```bash
python -m http.server 8080
# เปิด / Open: http://localhost:8080/AI Agent Platform.html
```

---

## ไฟล์ Output / Output Files

| ไฟล์ / File | ใช้สำหรับ (TH) | Purpose (EN) |
|------------|---------------|-------------|
| `data/agent_results.json` | ข้อมูล JSON ครบทุก field ทุก agent | Full JSON — all agent outputs, bilingual copy, scores |
| `data/ps_summary.csv` | ตารางสรุปสำหรับผู้บริหาร | Management summary table |
| `data/ps_details.csv` | รายละเอียด copy สำหรับทีม content | Full content detail for copy-paste by content team |
| `reports/team_report.html` | รายงาน HTML สวยงาม (ต้องรัน server) | Beautiful bilingual report (requires local server) |
| `reports/team_report_standalone.html` | รายงานเดียวกัน — ไฟล์เดียว ส่งต่อได้เลย | Same report — self-contained, shareable single file |

---

## สูตรคะแนน / Scoring Formula

```
คะแนนรวม  = ความสมบูรณ์ × 0.4  +  ความแม่นยำ × 0.3  +  ความน่าสนใจ × 0.3
Final score = Completeness × 0.4  +  Accuracy × 0.3    +  Appeal × 0.3

เกรด / Grade:   A (90+)  |  B+ (80–89)  |  C+ (70–79)  |  C (60–69)  |  D (<60)
ผล / Result:    PASS (≥75)  |  BORDERLINE (70–74)  |  FAIL (<70)
```

---

## ตัวอย่างผลลัพธ์ / Sample Output

โฟลเดอร์ `data/` มีตัวอย่างจาก 3 listings จริง / The `data/` folder includes sample output from 3 real listings:

| โครงการ / Project | ที่ตั้ง / Location | คะแนน / Score | เกรด / Grade |
|------------------|--------------------|--------------|-------------|
| Noble Ploenchit | กรุงเทพ CBD / Bangkok CBD | 84 | B+ |
| Grand Florida Beachfront | พัทยา / Pattaya | 83 | B+ |
| Dusit Condominium | หัวหิน / Hua Hin | 78 | C+ |

---

## License

MIT — ใช้งาน แก้ไข และแจกจ่ายได้อย่างอิสระ / Free to use, modify, and distribute.

---

*Built for [PropertyScout.co.th](https://propertyscout.co.th) · Powered by Claude AI*
