# วิธีตั้งค่า Automation Runner

## ขั้นตอนที่ 1 — ติดตั้ง Python packages

เปิด Command Prompt แล้วรัน:
```
pip install anthropic requests
```

## ขั้นตอนที่ 2 — รับ Claude API Key

1. ไปที่ https://console.anthropic.com
2. Sign up หรือ Log in
3. คลิก "API Keys" → "Create Key"
4. Copy key ที่ได้ (ขึ้นต้นด้วย `sk-ant-...`)

## ขั้นตอนที่ 3 — ตั้งค่า API Key

เปิด Command Prompt แล้วรัน:
```
set ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```
(เปลี่ยน `sk-ant-xxx...` เป็น key จริง)

## ขั้นตอนที่ 4 — รัน Pipeline

วาง CSV file ที่ root ของโปรเจกต์ แล้วรัน:
```
cd "c:\Users\vii5r\Downloads\Claude Cowork\Virtual Office Pixel Agents PropertyScout"
python runner/run_agents.py propertyscout.csv
```

## ผลลัพธ์

หลังรันเสร็จ จะได้ไฟล์:
- `data/agent_results.json` — ข้อมูล bilingual ทั้งหมด
- `data/ps_summary.csv` — สรุปสำหรับผู้บริหาร
- `data/ps_details.csv` — รายละเอียดสำหรับ content team

เปิด Virtual Office ดูผล:
http://localhost:8080/AI%20Agent%20Platform.html
→ คลิก "ผล Listing" ในเมนูซ้าย

## ตัวเลือก Model

เปิดไฟล์ `runner/run_agents.py` แล้วเปลี่ยน `MODEL`:
- `claude-opus-4-8` — คุณภาพสูงสุด (แนะนำ)
- `claude-haiku-4-5-20251001` — เร็วกว่า ถูกกว่า

## ค่าใช้จ่ายโดยประมาณ

- Haiku: ~$0.01–$0.02 ต่อ listing
- Opus:  ~$0.10–$0.20 ต่อ listing

20 listings ≈ $0.20–$4.00 ขึ้นอยู่กับ model ที่เลือก
