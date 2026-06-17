# คู่มือ Skills ทั้ง 4 ตัวของโปรเจกต์ PropertyScout

เอกสารนี้อธิบายว่าแต่ละ Skill ทำอะไร ควรใช้ตอนไหน และต้องพิมพ์/ขอแบบไหนเพื่อให้ Claude เรียกใช้งานมันโดยอัตโนมัติ (Skill จะ trigger เองจากคำพูดของคุณ ไม่ต้องพิมพ์ชื่อ skill ตรงๆ)

---

## 1. propertyscout-analyzer — ตัวประมวลผล pipeline เต็มรูปแบบ

**ทำอะไร:**
รัน pipeline 11 agents ทั้งหมดของโปรเจกต์ (Kanya → Pansa → Suwan → Priya → Niran → Tawan → Wichai → Daow → Ploychit → Phitchaya → Fiat) กับ listing 1 รายการหรือทั้ง CSV เป็น batch ครบทุกขั้นตอนตั้งแต่ดึงข้อมูล, เติมข้อมูลที่ขาด, ตรวจสอบคุณภาพ, วิจัยตลาด, fact-check, ทำ SEO/AEO, เขียน copy ใหม่ทั้ง TH/EN, จนถึงให้คะแนนและตัดสิน PASS/BORDERLINE/FAIL

**Output ที่ได้:**
- `data/agent_results.json` (schema เต็มตามที่กำหนดไว้ใน CLAUDE.md)
- `ps_summary.csv` (สรุปสำหรับผู้บริหาร)
- `ps_details.csv` (รายละเอียดสำหรับทีม content)
- ทุกอย่างมีทั้งภาษาไทยและอังกฤษ

**ใช้ตอนไหน / พิมพ์อะไร:**
- "วิเคราะห์ประกาศนี้ [ลิงก์]"
- "process listings จาก CSV นี้"
- อัปโหลดไฟล์ CSV ที่มีคอลัมน์ URL แล้วบอกว่า "วิเคราะห์ทุกตัวในไฟล์นี้"
- "รัน pipeline กับ listing ID 743934"

เหมาะกับงาน **batch ใหญ่** หรือเมื่อต้องการผลลัพธ์ครบวงจรแบบเดียวกับที่ทีมใช้ดู `team_report.html`

---

## 2. listing-copywriter-th-en — นักเขียน copy คู่ภาษา (เร็ว, โฟกัสเดียว)

**ทำอะไร:**
รับข้อมูล listing (ที่มีอยู่แล้ว ไม่ต้องดึงใหม่) แล้วเขียน copy การตลาดใหม่ทั้ง TH และ EN: title, headline, description, meta description, primary/secondary keywords, FAQ 3-5 ข้อ (สำหรับ AEO), และ schema markup — ตาม "กฎการเขียน Copy" ของ CLAUDE.md (ห้ามใช้คำลอยๆ อย่าง "luxury/spacious" โดยไม่มีข้อเท็จจริงรองรับ, ต้องเปิดด้วย USP ที่แข็งแกร่งที่สุด)

**ต่างจาก propertyscout-analyzer ตรงไหน:**
ตัวนี้ **ไม่รัน pipeline ทั้ง 11 ขั้นตอน** — ใช้เมื่อมีข้อมูล listing อยู่แล้ว (เช่น คุณบอกราคา ขนาด ชั้น ระยะ BTS มาให้) และต้องการแค่ "เขียน copy ใหม่" เร็วๆ สำหรับ listing เดียว ไม่ต้องรอ research/fact-check ทั้งระบบ

**ใช้ตอนไหน / พิมพ์อะไร:**
- "ช่วยเขียน headline + description ภาษาไทยและอังกฤษให้ listing นี้ [ข้อมูล]"
- "เขียน FAQ สำหรับ AEO ให้คอนโดนี้ ทั้งสองภาษา"
- "ปรับ copy ของประกาศนี้ใหม่ให้ดึงดูดขึ้น"
- "ทำ schema markup ให้ listing นี้"

---

## 3. listing-quality-scorer — ผู้ตรวจให้คะแนน (เหมือน Agent 3+10 รวมกัน)

**ทำอะไร:**
ตรวจสอบ listing 1 รายการ (หรือหลายรายการ) แล้วให้คะแนน 3 ด้าน — completeness, accuracy, appeal — ตามสูตรใน CLAUDE.md (`total = completeness×0.4 + accuracy×0.3 + appeal×0.3`) ออกมาเป็นเกรด A/B+/C+/C/D และผล PASS/BORDERLINE/FAIL พร้อม **รายการสิ่งที่ต้องแก้เรียงตามความสำคัญ** เพื่อให้ผ่าน 75 คะแนน

มีการปรับสูตรให้ยุติธรรมกับ listing นอกกรุงเทพฯ ที่ไม่มี BTS/MRT (เช่น หัวหิน, ชะอำ, พัทยา, ภูเก็ต) โดยใช้ระยะทางถึง landmark สำคัญ (ชายหาด, สนามบิน) แทนระยะ BTS/MRT

**ใช้ตอนไหน / พิมพ์อะไร:**
- "ให้คะแนน listing นี้หน่อย"
- "listing นี้พร้อม publish หรือยัง"
- "ตรวจสอบคุณภาพประกาศนี้ ขาดอะไรบ้าง"
- "ทำไม listing นี้ได้ FAIL บอกหน่อยว่าต้องแก้อะไรก่อน"
- ใช้กับหลาย listing พร้อมกันเพื่อหา **pattern ที่พบบ่อย** (เช่น "12/15 ไม่มีค่า CAM")

**เหมาะกับ:** การตรวจสอบแบบ "second opinion" ก่อน publish หรือ audit เร็วๆ โดยไม่ต้องรัน pipeline เต็ม

---

## 4. propertyscout-report — ตัวสร้างหน้ารายงาน HTML สไตล์ Virtual Office

**ทำอะไร:**
สร้างหน้ารายงานแบบ scrollable one-page HTML ที่ใช้ดีไซน์เดียวกับ `report_th.html` / `report_en.html` / `team_report.html` — พื้นหลังครีม, ส่วนหัว/ท้ายสีเข้ม, สีเขียวเน้น, ฟอนต์ IBM Plex Sans Thai + IBM Plex Mono, การ์ด KPI, badge แบบ pill, กล่อง before/after, timeline ของ pipeline ฯลฯ

มีไฟล์ `references/design-tokens.md` เก็บ CSS เดิมทั้งหมดไว้ เพื่อให้รายงานใหม่หน้าตาเหมือนเดิมทุกครั้ง

**ใช้ตอนไหน / พิมพ์อะไร:**
- "สรุปผลการรันรอบนี้เป็นหน้ารายงานแบบเดิม"
- "ทำหน้า presentation สรุปผลให้ทีม ทั้งไทยและอังกฤษ"
- "ทำ status report เหมือน team_report.html แต่ข้อมูลใหม่"
- "อัปเดต report_th.html / report_en.html ด้วยผลล่าสุด"

ถ้าขอทั้งสองภาษา จะสร้างเป็น **2 ไฟล์แยกกัน** (`report_th.html`, `report_en.html`) พร้อมลิงก์สลับภาษาที่หัวเพจ — ไม่ใช่ปุ่ม toggle ด้วย JS

---

## สรุปเร็วๆ — เลือกใช้ตัวไหนดี

| สถานการณ์ | Skill ที่จะ trigger |
|---|---|
| มี CSV ใหม่ ต้องวิเคราะห์ครบทุกขั้นตอน | propertyscout-analyzer |
| มีข้อมูล listing แล้ว อยากได้แค่ copy/FAQ ใหม่ | listing-copywriter-th-en |
| อยากรู้ว่า listing พร้อม publish หรือยัง/ขาดอะไร | listing-quality-scorer |
| อยากได้หน้ารายงานสรุปผลแบบสวยๆ ไทย+อังกฤษ | propertyscout-report |

ทุก Skill ถูกเขียนให้ trigger อัตโนมัติจากคำพูดธรรมชาติ — ไม่ต้องพิมพ์ชื่อ skill ตรงๆ เพียงแค่บอกสิ่งที่ต้องการ Claude จะเลือก skill ที่เหมาะสมเอง (และสามารถใช้หลายตัวต่อกันได้ เช่น วิเคราะห์ → ให้คะแนน → ทำรายงาน)
