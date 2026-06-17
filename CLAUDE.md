# PropertyScout AI Agent Platform — Pipeline Instructions

## ภาพรวม (Overview)

ระบบนี้คือ AI Virtual Office สำหรับตรวจสอบและปรับปรุง listing อสังหาริมทรัพย์บน PropertyScout.co.th
- เว็บไซต์มี 2 ภาษา: ไทย (TH) และ อังกฤษ (EN) — output ทุกชิ้นต้องมีทั้งสองภาษา
- เป้าหมาย: เพิ่ม SEO ranking + เพิ่มอัตราที่ AI แชท (ChatGPT, Perplexity, Gemini) ดึงข้อมูลไปแสดง (AEO)
- Pipeline: 11 agents ทำงานต่อเนื่อง ตั้งแต่ intake ไปถึง publish

## วิธีรัน Pipeline

เมื่อผู้ใช้บอกให้ "วิเคราะห์ประกาศ" หรือ "process listings" หรืออัพโหลด CSV ใหม่:

```
1. อ่านไฟล์ CSV (URL column)
2. สำหรับแต่ละ URL: ใช้ WebFetch ดึงข้อมูลหน้า listing
3. ผ่าน agent pipeline ทั้ง 11 ขั้นตอน (ดูด้านล่าง)
4. Output: data/agent_results.json + ps_summary.csv + ps_details.csv
5. ทุก output ต้องมีทั้ง TH และ EN
```

## Agent Pipeline (11 Agents)

### AGENT 1 — KANYA (INTAKE / ตัวรับข้อมูล)
**หน้าที่:** Fetch URL + extract structured data
**ตรวจ:**
- ชื่อ listing, ประเภท, ราคา, พื้นที่ (ตร.ม.), ชั้น, ห้องนอน, ห้องน้ำ
- รายการที่ขาด: นักพัฒนา, ปีสร้าง, ประเภทกรรมสิทธิ์, ค่า CAM, ค่าไฟ, ค่าน้ำ
- จำนวนรูปภาพ (<5 = flag), วิดีโอ (มี/ไม่มี)
- ตรวจซ้ำ: ราคา+ขนาด+ชั้น เหมือนกัน = POSSIBLE DUPLICATE

### AGENT 2 — PANSA (ENRICH / เติมข้อมูล)
**หน้าที่:** ค้นหาข้อมูลที่ขาดจากแหล่งภายนอก
**ตรวจ:**
- Developer: ค้นหาจากชื่อโครงการ (เช่น "Noble" = Noble Development PCL)
- ปีสร้าง + จำนวน floor + จำนวน unit (จาก project name ในชื่อ URL)
- ข้อมูล transit: ระยะทางถึง BTS/MRT ที่ใกล้ที่สุด
- Landmark ใกล้เคียง: ห้างสรรพสินค้า, โรงพยาบาล, โรงเรียน, มหาวิทยาลัย
- สิ่งอำนวยความสะดวกโครงการ: สระ, ฟิตเนส, co-working, สวน, ลาน BBQ

### AGENT 3 — SUWAN (AUDIT / ตรวจสอบคุณภาพ)
**หน้าที่:** ประเมินความสมบูรณ์ของข้อมูล
**สูตรคะแนน:** completeness×0.4 + accuracy×0.3 + appeal×0.3
- **PASS** ≥ 75 | **BORDERLINE** 70–74 | **FAIL** < 70
- ตรวจ missing_fields_count (บ่งชี้ completeness)
- Flag listing ที่มีรูป < 5 รูป, ไม่มีค่า CAM, ไม่มีชื่อนักพัฒนา

### AGENT 4 — PRIYA (RESEARCH / นักวิจัย)
**หน้าที่:** ค้นหาข้อมูลตลาดและบริบท
**ตรวจ:**
- ราคาต่อ ตร.ม. เทียบกับพื้นที่ (เช่น ราคา Sukhumvit ที่ต่ำเกินไป = flag)
- คู่แข่งในย่านเดียวกัน (listing คล้ายกัน ราคาต่างกัน)
- ค่า CAM ปกติสำหรับโครงการประเภทนี้

### AGENT 5 — NIRAN (FACTCHECK / ตรวจสอบข้อเท็จจริง)
**หน้าที่:** Verify ข้อมูลที่ระบุในหน้า listing
**ตรวจ:**
- ระยะทาง BTS/MRT (สมเหตุสมผลไหม)
- ชื่อสถานี (ถูกต้องไหม — เช่น BTS Sukhumvit vs BTS Asok ต่างกัน)
- ปีสร้างและ floor count (สมเหตุสมผลไหม)
- Price-per-sqm: ผิดปกติมากเกินไป = flag accuracy

### AGENT 6 — TAWAN (SEO / นักปรับ SEO)
**หน้าที่:** ปรับ title + keyword ให้ติด Google
**ตรวจ (EN):**
- Primary keyword: "condo for rent near [BTS/MRT] [area]" หรือ "[bedroom]-bed condo [area]"
- Title ≤ 60 ตัวอักษร ควรมี: ขนาด, สถานีรถไฟฟ้า, พื้นที่
- URL slug ควรตรงกับ keyword
**ตรวจ (TH):**
- คีย์เวิร์ดหลัก: "คอนโดให้เช่าใกล้ [BTS/MRT] [พื้นที่]"
- ชื่อไทยควรตรงกับสิ่งที่คนไทยค้นหา
- ค้นหาคีย์เวิร์ดที่ใช้ใน Google.co.th

### AGENT 7 — WICHAI (COPYWRITER / นักเขียน)
**หน้าที่:** สร้าง copy ใหม่ทั้ง TH และ EN
**Output ต้องมี:**
```
EN:
- headline: สั้น ≤ 100 ตัวอักษร ดึงดูด USP หลัก
- description: 2-3 ประโยค เน้น lifestyle + USP + location
- meta_description: ≤ 160 ตัวอักษร สำหรับ Google snippet

TH:
- ชื่อ: สั้น ≤ 100 ตัวอักษร ดึงดูดด้วยจุดขาย
- คำอธิบาย: 2-3 ประโยค เน้น lifestyle + จุดเด่น + ที่ตั้ง
- meta_description_th: ≤ 160 ตัวอักษร
```
**กฎการเขียน:**
- ห้ามใช้ "luxury", "spacious", "stunning" โดยไม่มี proof
- ต้องอิงข้อเท็จจริง: "120m from BTS" ดีกว่า "great location"
- USP ที่ดี: ระยะ BTS, ขนาดผิดปกติ, วิวพิเศษ, สัตว์เลี้ยงได้, Co-working, สระส่วนตัว

### AGENT 8 — DAOW (AEO / Answer Engine Optimization)
**หน้าที่:** ทำให้ AI แชทดึงข้อมูลไปแสดงได้ง่าย
**Output:**
```json
{
  "schema_markup": {
    "type": "Apartment/House",
    "name": "...",
    "address": {...},
    "numberOfRooms": ...,
    "price": {...}
  },
  "faq_schema": [
    {"question_en": "...", "answer_en": "...", "question_th": "...", "answer_th": "..."},
    ...
  ]
}
```
**FAQ ที่ดีสำหรับ AEO (ทั้ง TH + EN):**
- "Are pets allowed?" / "อนุญาตให้เลี้ยงสัตว์ได้ไหม?"
- "How far is [BTS/MRT]?" / "ห่างจาก BTS/MRT เท่าไหร่?"
- "Is this freehold or leasehold?" / "เป็น freehold หรือ leasehold?"
- "What are the monthly fees?" / "ค่าใช้จ่ายต่อเดือนมีอะไรบ้าง?"

### AGENT 9 — PLOYCHIT (OPTIMISE / นักปรับปรุง)
**หน้าที่:** รวม output จาก agents 6,7,8 และปรับให้สอดคล้อง
- ตรวจให้ title TH + EN ใช้ keyword เดียวกัน
- ตรวจ FAQ ครบทั้ง TH + EN
- เรียงลำดับ: issue สำคัญที่สุดก่อน

### AGENT 10 — PHITCHAYA (SCORE / ผู้ตัดสิน)
**หน้าที่:** คำนวณคะแนนสุดท้าย
```
completeness_score (0-100):
  - มีรูป ≥ 10 = +20
  - มีชื่อนักพัฒนา = +15
  - มีข้อมูล transit = +15
  - มีค่า CAM = +15
  - มีปีสร้าง = +10
  - มีประเภทกรรมสิทธิ์ = +10
  - มีรายละเอียดสิ่งอำนวยความสะดวก = +15

accuracy_score (0-100):
  - ระยะ BTS ตรวจสอบได้ = +30
  - ราคาต่อ ตร.ม. สมเหตุสมผล = +30
  - ชื่อสถานีถูก = +20
  - ไม่มีข้อมูลขัดแย้ง = +20

appeal_score (0-100):
  - มี USP ชัดเจน = +25
  - Headline ดึงดูด = +20
  - FAQ ครบ ≥ 3 ข้อ = +20
  - มีคำอธิบายอย่างน้อย 3 ประโยค = +20
  - Schema markup ครบ = +15

final = completeness×0.4 + accuracy×0.3 + appeal×0.3
grade: A (90+) | B+ (80-89) | C+ (70-79) | C (60-69) | D (<60)
result: PASS (≥75) | BORDERLINE (70-74) | FAIL (<70)
```

### AGENT 11 — FIAT (PUBLISH / ผู้เผยแพร่)
**หน้าที่:** ตรวจ PASS/BORDERLINE ก่อน approve
- PASS → output ทันที
- BORDERLINE → flag priority issues ที่ต้องแก้
- FAIL → ส่งกลับ INTAKE พร้อม checklist สิ่งที่ต้องเพิ่ม

## Output Format (JSON Schema)

ไฟล์ output: `data/agent_results.json`

```json
{
  "meta": {
    "processed_at": "ISO timestamp",
    "total_listings": 0,
    "pass": 0, "borderline": 0, "fail": 0,
    "systemic_issues": []
  },
  "listings": [
    {
      "listing_id": "743934",
      "url": "https://propertyscout.co.th/en/...",
      "type": "Condo",
      "bedrooms": 1,
      "price_thb_month": 55000,
      "area_sqm": 61,
      "floor": 17,
      "district": "Lumphini",
      "developer": "Noble Development PCL",
      "transit_station": "BTS Phloen Chit",
      "transit_distance_m": 120,

      "bilingual": {
        "en": {
          "title_suggested": "1-Bed 61sqm on Floor 17 at Noble Ploenchit — 120m from BTS Phloen Chit",
          "headline": "Wake up 120m from BTS Phloen Chit — Noble Ploenchit 17F with city views, pool & gym",
          "description": "Rarely available 61sqm 1-bedroom on the 17th floor at Noble Ploenchit. Walk 2 minutes to BTS Phloen Chit, with direct access to EmQuartier and Lumphini Park. Fully furnished with floor-to-ceiling windows, resort-style pool and a coworking space.",
          "meta_description": "1-bed condo for rent near BTS Phloen Chit. Noble Ploenchit 61sqm floor 17, furnished, pool, gym. ฿55,000/month.",
          "seo_primary_keyword": "condo for rent near BTS Phloen Chit",
          "seo_secondary_keywords": ["Noble Ploenchit rent", "Lumphini condo for rent", "Ploenchit apartment furnished"],
          "faqs": [
            {"question": "Are pets allowed at Noble Ploenchit?", "answer": "No, this building does not allow pets."},
            {"question": "How far is BTS Phloen Chit?", "answer": "Noble Ploenchit is 120m — about a 2-minute walk — from BTS Phloen Chit."},
            {"question": "What are the monthly fees?", "answer": "The rental price is ฿55,000/month. CAM fee information is not listed — please contact the agent."}
          ]
        },
        "th": {
          "title_suggested": "คอนโด 1 นอน 61 ตร.ม. ชั้น 17 โนเบิล เพลินจิต — เดิน 2 นาที BTS เพลินจิต",
          "headline": "โนเบิล เพลินจิต ชั้น 17 · BTS เพลินจิต 120 ม. · วิวเมือง สระ ฟิตเนส co-working",
          "description": "ห้อง 1 นอน 61 ตร.ม. ชั้น 17 โนเบิล เพลินจิต เฟอร์นิเจอร์ครบ เดินถึง BTS เพลินจิต 2 นาที ใกล้เอ็มควอเทียร์และสวนลุมพินี สระว่ายน้ำริมสระสไตล์รีสอร์ต ฟิตเนส และพื้นที่ co-working",
          "meta_description": "คอนโดให้เช่าใกล้ BTS เพลินจิต โนเบิล เพลินจิต 61 ตร.ม. ชั้น 17 เฟอร์นิเจอร์ครบ 55,000 บาท/เดือน",
          "seo_primary_keyword": "คอนโดให้เช่าใกล้ BTS เพลินจิต",
          "seo_secondary_keywords": ["โนเบิล เพลินจิต ให้เช่า", "คอนโดลุมพินี ให้เช่า", "คอนโดเพลินจิต เฟอร์นิเจอร์ครบ"],
          "faqs": [
            {"question": "โนเบิล เพลินจิต อนุญาตให้เลี้ยงสัตว์ไหม?", "answer": "ไม่อนุญาตให้เลี้ยงสัตว์ในโครงการนี้"},
            {"question": "BTS เพลินจิตอยู่ห่างแค่ไหน?", "answer": "โนเบิล เพลินจิต อยู่ห่างจาก BTS เพลินจิต 120 เมตร หรือเดินประมาณ 2 นาที"},
            {"question": "ค่าใช้จ่ายต่อเดือนมีอะไรบ้าง?", "answer": "ค่าเช่า 55,000 บาท/เดือน ค่าส่วนกลาง (CAM) กรุณาสอบถามเพิ่มเติมจากตัวแทน"}
          ]
        }
      },

      "missing_fields": ["cam_fee", "electricity_price", "water_price"],
      "issues": {
        "en": ["CAM fee not listed", "Utility prices missing"],
        "th": ["ไม่มีค่าส่วนกลาง (CAM)", "ไม่มีข้อมูลค่าไฟและค่าน้ำ"]
      },
      "priority_actions": {
        "en": ["Add CAM fee to listing", "Add utility pricing"],
        "th": ["เพิ่มค่าส่วนกลาง (CAM) ในประกาศ", "เพิ่มข้อมูลค่าไฟและค่าน้ำ"]
      },

      "scores": {
        "completeness": 80,
        "accuracy": 90,
        "appeal": 85,
        "total": 85,
        "grade": "B+",
        "result": "PASS"
      },

      "schema_markup": {
        "@type": "Apartment",
        "name": "Noble Ploenchit",
        "address": {"streetAddress": "Phloen Chit Road", "addressLocality": "Bangkok"},
        "numberOfRooms": 1,
        "floorSize": {"value": 61, "unitCode": "MTK"},
        "offers": {"price": 55000, "priceCurrency": "THB", "priceSpecification": "per month"}
      }
    }
  ]
}
```

## CSV Output Format

**ps_summary.csv** — สรุปสำหรับ management (1 แถว = 1 listing)
```
listing_id, title_en, title_th_suggested, type, bedrooms, price, area, district,
transit, developer, score_total, grade, result,
top_issue_en, top_issue_th, seo_keyword_en, seo_keyword_th
```

**ps_details.csv** — รายละเอียดสำหรับ content team (1 แถว = 1 listing)
```
listing_id, headline_en, headline_th, description_en, description_th,
meta_en, meta_th, seo_keyword_en, seo_keyword_th,
faq1_q_en, faq1_a_en, faq1_q_th, faq1_a_th,
faq2_q_en, faq2_a_en, faq2_q_th, faq2_a_th,
faq3_q_en, faq3_a_en, faq3_q_th, faq3_a_th,
missing_fields, priority_action_en, priority_action_th
```

## กฎการเขียน Copy (Bilingual)

### ภาษาอังกฤษ (EN)
- เปิดด้วย USP ที่แข็งแกร่งที่สุด (ระยะ BTS, ขนาด, วิว)
- ใช้ตัวเลขจริง: "120m from BTS" ไม่ใช่ "convenient location"
- ลูกค้า EN มักเป็น expat หรือนักลงทุนต่างชาติ — เน้น lifestyle และ connectivity

### ภาษาไทย (TH)
- เปิดด้วยจุดเด่นที่คนไทยให้ความสำคัญ (ราคา, ใกล้รถไฟฟ้า, เฟอร์นิเจอร์ครบ)
- ใช้คีย์เวิร์ดที่คนไทยค้นหาจริง: "คอนโดให้เช่าใกล้ BTS" ไม่ใช่ "condominium rental"
- ลูกค้า TH มักให้ความสำคัญ: ราคา, ค่าส่วนกลาง, สัตว์เลี้ยง, ใกล้โรงเรียน

### FAQ Best Practices
- FAQ ที่ดีต้องตอบ "intent" ของผู้ค้นหา AI (ChatGPT, Perplexity ฯลฯ)
- คำถามต้องเป็นภาษาที่คนถามจริงๆ ไม่ใช่ภาษาทางการ
- คำตอบสั้น ตรงประเด็น ไม่เกิน 2 ประโยค
- ตัวอย่างคำถามที่ดี: "สัตว์เลี้ยงได้ไหม" "ห่าง BTS เท่าไหร่" "มีสระว่ายน้ำไหม"

## Systemic Issues ที่พบบ่อย

จากการวิเคราะห์ 20 listings แรก:
1. **20/20** ไม่มีค่า CAM, ค่าไฟ, ค่าน้ำ → ต้องเพิ่มทุก listing
2. **13/20** ไม่มีชื่อนักพัฒนา → ลด trust signal อย่างมาก
3. **15/20** title ยังไม่ใช้ keyword ที่ถูกต้อง
4. **8/20** ระยะ BTS ผิด หรือ ใช้ชื่อสถานีที่ไม่ใช่ primary keyword
5. **2 listings** (ID 2328349, 1569716) น่าจะ duplicate — ต้องตรวจ
6. **0/20** มี FAQ schema — โอกาสใหญ่สำหรับ AEO

## การรันครั้งต่อไป

เมื่อผู้ใช้ให้ CSV ใหม่:
1. วิเคราะห์ทุก URL ตาม pipeline ด้านบน
2. Output ลง `data/agent_results.json`
3. Output CSVs ตาม format ด้านบน
4. Virtual Office UI จะอ่านจาก `data/agent_results.json` อัตโนมัติ
5. ทีม content เปิด `reports/team_report.html` เพื่อดูผลและ copy paste
