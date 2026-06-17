# PropertyScout AI Agent Platform

> **ระบบ AI วิเคราะห์และปรับปรุงประกาศอสังหาริมทรัพย์สำหรับ [PropertyScout.co.th](https://propertyscout.co.th)**
>
> AI-powered listing quality pipeline for PropertyScout.co.th — analyzes property listings and generates bilingual (TH/EN) SEO copy, FAQ schema, market comparison, and location intelligence.

---

## ระบบนี้ทำอะไร / What This Does

ทีม AI **11 agents** ทำงานต่อเนื่องกัน รับ URL ประกาศอสังหาฯ แล้วผลิต content พร้อมลง — ทั้ง title, description, FAQ schema, เปรียบเทียบราคาตลาด และข้อมูลทำเล — ครบทั้งภาษาไทยและอังกฤษ

A virtual office of **11 named AI agents** that work in sequence — transforming raw listing URLs into fully optimized, publication-ready bilingual content with SEO keywords, AEO FAQ schema, market analysis, and location intelligence.

**Input:** ไฟล์ CSV ที่มี URL ประกาศ / A CSV of listing URLs
**Output:** Copy ภาษาไทย + อังกฤษ, คะแนน, FAQ Schema, รายงาน HTML / Bilingual copy, scores, FAQ schema, HTML report

---

## ทีม AI Agents / Agent Pipeline

| # | Agent | หน้าที่ (TH) | Role (EN) |
|---|-------|-------------|-----------|
| 1 | **KANYA** | รับข้อมูล — ดึงข้อมูลจากหน้า listing | Intake — fetch & extract structured listing data |
| 2 | **PANSA** | เติมข้อมูลที่ขาด | Enrich — fill missing fields from external sources |
| 3 | **SUWAN** | ตรวจสอบคุณภาพ | Audit — score completeness, accuracy, appeal |
| 4 | **PRIYA** | วิจัยตลาดและบริบท | Research — market context & comparable pricing |
| 5 | **NIRAN** | ตรวจสอบข้อเท็จจริง | Factcheck — verify BTS distances, station names, prices |
| 6 | **TAWAN** | ปรับ SEO title และ keyword | SEO — optimise title & keywords (TH + EN) |
| 7 | **WICHAI** | เขียน copy ทั้งไทยและอังกฤษ | Copywriter — write bilingual headlines, descriptions, meta |
| 8 | **DAOW** | สร้าง FAQ Schema สำหรับ AI Chat | AEO — generate FAQ schema for ChatGPT / Perplexity / Gemini |
| 9 | **PLOYCHIT** | รวมและปรับ output ให้สอดคล้อง | Optimise — merge & align all bilingual output |
| 10 | **PHITCHAYA** | คำนวณคะแนนสุดท้าย | Score — calculate final grade (A / B+ / C+ / C / D) |
| 11 | **FIAT** | อนุมัติหรือส่งกลับแก้ไข | Publish — approve PASS, flag BORDERLINE, return FAIL |

---

## ฟีเจอร์หลัก / Features

- **Bilingual ทุกช่อง** — title, description, FAQ, meta ทั้งไทยและอังกฤษ / Every field in Thai + English
- **ข้อมูลทำเล** — BTS/MRT/ARL, ห้างสรรพสินค้า, โรงพยาบาล, สนามบิน, ทางด่วน, โรงเรียน, สวน / Transit, malls, hospitals, airports, expressways, schools, parks
- **เปรียบเทียบตลาด** — ราคา/ตร.ม. เทียบกับ unit ในโครงการเดียวกันและโครงการใกล้เคียง / Price/sqm vs same-project & nearby competing projects
- **Investment Notes** — ข้อมูล Freehold/Leasehold, นักพัฒนาในตลาดหลักทรัพย์, ประมาณการ yield / Freehold status, SET-listed developer, yield estimates
- **AEO-ready FAQ Schema** — Q&A ที่ AI chatbot ดึงไปแสดงได้ (ChatGPT, Perplexity, Gemini) / Structured Q&A for AI chatbot citation
- **ระบบคะแนน** — Completeness × 0.4 + Accuracy × 0.3 + Appeal × 0.3 → เกรด A–D / Scoring system → letter grade
- **Standalone HTML Report** — ส่งออกเป็นไฟล์เดียว ส่งต่อได้ทันทีไม่ต้องมี server / Single-file export, shareable with no server required
- **Virtual Office Dashboard** — หน้า dashboard แบบ React / React 18 virtual office UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Claude API (Anthropic) — claude-opus-4-8 |
| Pipeline | Python 3 |
| Frontend | React 18 (CDN) + Babel Standalone JSX |
| Report | Vanilla HTML/CSS/JS — ไม่มี dependencies |
| Data | JSON + CSV |

---

## โครงสร้างโปรเจกต์ / Project Structure

```
PropertyScout/
├── AI Agent Platform.html     # แดชบอร์ด Virtual Office (React)
├── agent-cards.jsx            # UI components
├── runner/
│   ├── run_agents.py          # Pipeline หลัก — อ่าน CSV, เรียก Claude API
│   └── export_standalone.py  # ส่งออก HTML report แบบ standalone
├── app/                       # React JSX views
│   ├── results.jsx            # หน้าแสดงผล listing
│   └── ...
├── reports/
│   └── team_report.html       # รายงาน bilingual สำหรับทีม
├── data/
│   ├── agent_results.json     # ผลลัพธ์ pipeline (มี sample ให้ดู)
│   ├── ps_summary.csv         # ตารางสรุปสำหรับผู้บริหาร
│   └── ps_details.csv         # รายละเอียดสำหรับทีม content
├── .env.example               # template สำหรับใส่ API key
└── เปิดโปรแกรม.bat            # เปิดโปรแกรมด้วยดับเบิลคลิก (Windows)
```

---

## วิธีติดตั้งและใช้งาน / Quick Start

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

`.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **ห้าม commit ไฟล์ .env** — ไฟล์นี้ถูก gitignore ไว้แล้ว / Never commit `.env` — it is already gitignored.

### 3. ติดตั้ง dependencies

```bash
pip install anthropic python-dotenv requests
```

### 4. สร้าง CSV ที่มี URL ประกาศ

```csv
url
https://propertyscout.co.th/en/1-br-condo-noble-ploenchit-near-bts-phloen-chit-743934/
https://propertyscout.co.th/en/...
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

**Mac/Linux:**
```bash
python -m http.server 8080
# เปิด http://localhost:8080/AI Agent Platform.html
```

---

## ไฟล์ Output / Output Files

| ไฟล์ | ใช้สำหรับ |
|------|---------|
| `data/agent_results.json` | ข้อมูล JSON ครบทุก field ทุก agent |
| `data/ps_summary.csv` | ตารางสรุปสำหรับผู้บริหาร |
| `data/ps_details.csv` | รายละเอียด copy สำหรับทีม content |
| `reports/team_report.html` | รายงาน HTML สวยงาม (ต้องรัน server) |
| `reports/team_report_standalone.html` | รายงานเดียวกัน — ไฟล์เดียว ส่งต่อได้เลย |

---

## สูตรคะแนน / Scoring Formula

```
คะแนนรวม = ความสมบูรณ์ × 0.4 + ความแม่นยำ × 0.3 + ความน่าสนใจ × 0.3
Final score = Completeness × 0.4 + Accuracy × 0.3 + Appeal × 0.3

เกรด / Grade:  A (90+) | B+ (80–89) | C+ (70–79) | C (60–69) | D (<60)
ผล / Result:   PASS (≥75) | BORDERLINE (70–74) | FAIL (<70)
```

---

## ตัวอย่าง Output / Sample Output

โฟลเดอร์ `data/` มีตัวอย่างจาก 3 listings จริง:
- Noble Ploenchit (กรุงเทพ CBD) — Score 84, Grade B+
- Grand Florida Beachfront (พัทยา) — Score 83, Grade B+
- Dusit Condominium (หัวหิน) — Score 78, Grade C+

The `data/` folder contains sample output from 3 real listings for demonstration.

---

## License

MIT — ใช้งาน แก้ไข และแจกจ่ายได้อย่างอิสระ / Free to use, modify, and distribute.

---

*Built for [PropertyScout.co.th](https://propertyscout.co.th) · Powered by Claude AI*
