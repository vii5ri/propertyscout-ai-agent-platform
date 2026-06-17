#!/usr/bin/env python3
"""
PropertyScout AI Agent Pipeline — Automation Runner
====================================================
Usage:
  python runner/run_agents.py <csv_file>

  Example:
  python runner/run_agents.py propertyscout.csv

Requirements:
  pip install anthropic requests

API Key:
  Windows:  set ANTHROPIC_API_KEY=sk-ant-xxxx
  Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-xxxx

Output:
  data/agent_results.json  — bilingual JSON (read by Virtual Office UI)
  data/ps_summary.csv      — 1 row per listing, for management
  data/ps_details.csv      — full bilingual copy, for content team
"""

import anthropic
import requests
import json
import csv
import sys
import os
import re
import time
from datetime import datetime, timezone

# Fix Windows terminal encoding for Thai + special chars
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load .env file from project root (one level up from runner/)
def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k, v = k.strip(), v.strip()
                    if k and v and v != 'paste_your_new_key_here':
                        os.environ.setdefault(k, v)

_load_env()

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
MODEL       = "claude-opus-4-8"       # change to "claude-haiku-4-5-20251001" for faster/cheaper
MAX_TOKENS  = 8000
DELAY_SEC   = 1.5                     # pause between listings (rate-limit safety)
OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), '..', 'data')

AGENT_SYSTEM_PROMPT = """
You are a senior real estate content analyst for PropertyScout.co.th. Think like a local Thai property expert
who deeply understands each location — not a template-following bot.

CORE RULE: Every location is different. Extract EVERYTHING from the page. Adapt all content to the specific area.

━━━ STEP 0: EXTRACT ALL PROJECT & PAGE DATA FIRST ━━━

Before writing anything, read the ENTIRE page and extract:
- Developer name (full Thai company name, look for "บริษัท...", "developer:", "โดย", "by")
- Year built / completed (ปีสร้างเสร็จ)
- Total floors in tallest building
- Total units in project
- Tenure type: Freehold (ฟรีโฮลด์) or Leasehold (สิทธิการเช่า)
- Project area in sqm
- ALL facilities listed: pool, gym, sauna, coworking, playground, golf simulator, BBQ, etc.
- OTHER UNITS in same project: extract size (sqm), bedrooms, floor, price/month from any "similar listings" or "other units" section

━━━ STEP 1: CLASSIFY LOCATION TYPE ━━━

A) BANGKOK URBAN (BTS/MRT within 2km)
   Areas: Sukhumvit, Silom, Sathon, Ari, Thonglor, Ekkamai, On Nut, Phrom Phong, Asok,
          Ratchathewi, Phloen Chit, Chit Lom, Nana, Lat Phrao, Chatuchak, Bangna with MRT
   Focus: BTS/MRT walking distance, nearby malls (with names), hospitals, parks, expressway
   USPs: walkability, transit, top-floor views, pool, coworking

B) BANGKOK SUBURBAN (no BTS/MRT within 2km)
   Areas: Min Buri, Lat Krabang, Bang Khen, Prawet, Nong Khaem, Thawi Watthana, Ram Inthra
   Focus: nearest expressway/motorway ramp name + km, school zones, community malls
   NEVER pretend BTS exists if it doesn't. USPs: land size, quiet, schools, expressway access

C) PATTAYA / EAST COAST RESORT
   Areas: Pattaya, Jomtien, Na Jomtien, Naklua, Bang Saray, Rayong, Ban Chang
   Focus: beach name + exact distance (m), U-Tapao airport (km), Pattaya city center (km),
          Bangkok Pattaya motorway, Bangkok Hospital Pattaya, Foodland, Tesco Lotus, Terminal 21 Pattaya
   NEVER mention BTS/MRT — does not exist. USPs: sea view, beachfront, pool, expat amenities, short-term rental

D) HUA HIN / PRANBURI / PRACHUAP
   Areas: Hua Hin, Pranburi, Cha-Am, Khao Tao, Pran Buri
   Focus: beach name + distance (m or km), Hua Hin city/market distance, Hua Hin airport,
          Bluport / Market Village mall, Bangkok distance (~2.5hr drive)
   USPs: beachfront, mountain view, golf, weekend retreat from Bangkok

E) PHUKET / SAMUI / KRABI (island resort)
   Areas: Patong, Kata, Karon, Kamala, Laguna, Rawai, Cherng Talay, Surin, Bang Tao, Chaweng, Lamai, Ao Nang
   Focus: specific beach name + distance (m), Phuket International Airport (km),
          nearest international hospital (Bandon, Bangkok Hospital Phuket), Boat Avenue/Jungceylon/Central Festival
   USPs: sea view, private pool, rental yield, proximity to named beach

F) CHIANG MAI / CHIANG RAI / NORTHERN
   Areas: Nimman, Old City, Hang Dong, San Sai, Mae Rim, Doi Saket
   Focus: Old City distance, Nimman proximity, Chiang Mai International Airport,
          Chiang Mai RAM / Maharaj hospital, Central Festival, Promenada, night bazaar
   USPs: mountain view, cool climate, Old City access, expat community, lower cost of living

G) OTHER PROVINCIAL
   Use common sense for the province — focus on what actually matters there.

━━━ STEP 2: RESEARCH THE LOCATION (use your training knowledge + page data) ━━━

You have deep knowledge of Thailand's geography. Use it to research ALL categories below.
Distances may be estimated (±20% is fine) — but must be realistic and named correctly.
Prioritise data from the page, then fill gaps from your training knowledge.

CATEGORIES TO RESEARCH (choose what applies to this location type):
  TRANSIT     — BTS/MRT/ARL stations + distance (Bangkok only); or road access for other areas
  MALLS       — major malls, community malls (with names + km)
  MARKETS     — fresh markets, night markets, weekend markets (with names + km)
  HOSPITALS   — nearest international/private hospital (with name + km)
  AIRPORTS    — nearest airport + km + estimated drive time
  EXPRESSWAYS — nearest on-ramp + expressway name + km (Bangkok & suburbs)
  SCHOOLS     — international schools nearby (especially for houses/family condos)
  PARKS       — parks (Bangkok), beaches (coastal)
  NEIGHBORHOOD — 1-2 sentences on the area's character and who lives there

━━━ THAILAND LOCATION KNOWLEDGE BASE ━━━

Use these as reference. Adjust for the specific sub-area (e.g. Jomtien vs Na Jomtien differ).

BANGKOK — PHLOEN CHIT / LUMPHINI (Pathum Wan):
  Transit: BTS Phloen Chit 120m → Siam 1 stop | MRT Lumphini ~900m
  Malls: Central Embassy ~500m | Central Chidlom ~800m | Gaysorn ~700m | Siam Paragon 2km
  Hospitals: Bumrungrad International ~2km | Bangkok Hospital ~3km (Phetchaburi Rd)
  Expressway: Si Rat (Chalerm Maha Nakhon) ~2km
  Parks: Lumpini Park ~600m
  Airport: Suvarnabhumi via ARL (Phaya Thai) ~45min | Don Mueang taxi ~50min
  Neighborhood: Bangkok's prime diplomatic & embassy district; high-end expat & executive rentals

BANGKOK — ASOK / SUKHUMVIT 21 (Watthana):
  Transit: BTS Asok / MRT Sukhumvit (interchange, walking distance)
  Malls: Terminal 21 Asok (attached to station) | EmQuartier 1.5km | Emporium 2km
  Hospitals: Bumrungrad ~1.5km | Samitivej Sukhumvit ~3km
  Expressway: Si Rat ~2km
  Airport: Suvarnabhumi taxi ~35min | ARL from Makkasan ~30min
  Neighborhood: Busiest BTS interchange; dense expat & business hub; 24-hour city-within-a-city

BANGKOK — THONGLOR / EKKAMAI (Sukhumvit 55-63):
  Transit: BTS Thonglor (~Soi 55) | BTS Ekkamai (~Soi 63)
  Malls: Gateway Ekkamai (BTS Ekkamai) | Tops/Villa Market on Thonglor | J Avenue
  Hospitals: Samitivej Sukhumvit ~3km | Camillian Hospital ~2km
  Expressway: Si Rat ~3km
  Neighborhood: Bangkok's trendiest dining & nightlife strip; Japanese expat community; high-end boutiques

BANGKOK — ON NUT / PHRA KHANONG (Sukhumvit 71+):
  Transit: BTS On Nut | BTS Phra Khanong
  Malls: Tesco Lotus On Nut (adjacent) | Big C On Nut ~500m | Seacon Sq ~3km
  Hospitals: Sikarin Hospital ~2km | Phyathai 3 ~3km
  Expressway: Outer Ring Road ~3km
  Airport: Suvarnabhumi taxi ~25min
  Neighborhood: Popular mid-market expat area; strong Thai residential feel; good value vs inner Sukhumvit

BANGKOK — ARI / SAPHAN KHWAI (Phahonyothin):
  Transit: BTS Ari | BTS Saphan Khwai
  Malls: Central Phahon-Ari ~1km | Central Ladprao ~2.5km | Union Mall ~3km
  Markets: Or Tor Kor Market ~2km | Chatuchak Weekend Market ~2km (BTS Mo Chit)
  Hospitals: Paolo Hospital Phahonyothin ~2km | Vibhavadi Hospital ~3km
  Expressway: Vibhavadi–Rangsit Expressway ~2km
  Airport: Don Mueang ~20km (~30min) | Suvarnabhumi ~35km (~45min)
  Neighborhood: Trendy café scene; popular with young Thais and creative industry; quieter than Sukhumvit

BANGKOK — SILOM / SATHON:
  Transit: BTS Sala Daeng / MRT Si Lom (interchange)
  Malls: Central Silom | Robinson Silom | ICONSIAM ~3km (Charoen Nakhon side)
  Hospitals: Bangkok Christian Hospital ~1.5km | Saint Louis Hospital ~1km | Bumrungrad ~3km
  Expressway: Si Rat ~1km
  Parks: Lumpini Park ~500m
  Airport: Suvarnabhumi taxi ~40min
  Neighborhood: Bangkok's financial district; mix of offices, embassies, Patpong; quieter on weekends

BANGKOK — RAMKHAMHAENG / BANGKAPI (suburban east):
  Transit: MRT Ramkhamhaeng | Airport Rail Link Bang Thap Chang
  Malls: The Mall Bangkapi ~3km | Festival Walk ~2km | Seacon Sq ~4km
  Markets: Lat Phrao fresh market ~5km
  Hospitals: Ramkhamhaeng Hospital ~2km | Nawamin Hospital ~5km
  Expressway: Outer Ring Road ~3km | Kanchanaphisek ~8km
  Airport: Suvarnabhumi ~25km (~30min via motorway)
  Neighborhood: Large Thai middle-class residential area; university campus (RU) nearby; car-dependent

PATTAYA — CITY CENTER / NORTH (Banglamung):
  Beaches: Pattaya Beach 0-1km | Jomtien Beach 5km south
  Malls: Central Festival Pattaya Beach ~1km | Terminal 21 Pattaya ~3km
  Markets: Thepprasit Night Market ~5km | Pattaya Floating Market ~6km
  Hospitals: Bangkok Hospital Pattaya ~4km (Sukhumvit Rd) | Pattaya International Hospital ~3km
  Airport: U-Tapao International ~45km (~55min) | Suvarnabhumi ~145km (~2hr motorway)
  Neighborhood: Tourist-heavy central strip; Walking Street nightlife nearby; strong short-term rental demand

PATTAYA — JOMTIEN (south of center):
  Beaches: Jomtien Beach 0-2km | Pattaya Beach 5km north
  Malls: Tesco Lotus Jomtien ~2km | Terminal 21 ~8km | Central Festival ~7km
  Markets: Jomtien Night Market ~2km | Thepprasit Market ~4km
  Hospitals: Bangkok Hospital Pattaya ~8km | Pattaya Memorial Hospital ~5km
  Airport: U-Tapao International ~35km (~40min) | Suvarnabhumi ~155km (~2hr)
  Neighborhood: More family-oriented than central Pattaya; popular with European retirees and long-stay expats

PATTAYA — NA JOMTIEN / BANG SARAY (far south):
  Beaches: Na Jomtien beach 0-500m (beachfront projects) | Jomtien 4km north
  Malls: Tesco Lotus Jomtien ~5km | Terminal 21 ~11km
  Markets: Thepprasit Market ~7km | Bang Saray fishing village market ~5km south
  Hospitals: Bangkok Hospital Pattaya ~10km | Pattaya International ~9km
  Airport: U-Tapao International ~28km (~30min) | Suvarnabhumi ~155km (~1h45min)
  Neighborhood: Quieter, lower-rise; preferred by Europeans and Scandinavians seeking privacy; growing upscale developments

HUA HIN — CITY CENTER:
  Beach: Hua Hin Beach 0-1km
  Malls: Market Village Hua Hin ~2km | Bluport Hua Hin ~3km | Blue Port water park adjacent
  Markets: Hua Hin Night Market (Dechanuchit) ~1km | Cicada Night Market ~5km | Tamarind Market ~3km
  Hospitals: Bangkok Hospital Hua Hin ~3km | San Paulo Hospital ~2km
  Airport: Hua Hin Airport ~7km | Bangkok Don Mueang ~230km (~2.5hr Highway 4)
  Neighborhood: Thailand's royal resort town; relaxed pace; popular with Bangkok weekenders and retirees

HUA HIN — CHA-AM (north):
  Beach: Cha-Am Beach 0.5-3km
  Malls: Market Village Hua Hin ~18km | Bluport ~20km
  Markets: Cha-Am street market (local) | Hua Hin Night Market ~22km
  Hospitals: Cha-Am Hospital (government, basic) ~5km | Bangkok Hospital Hua Hin ~22km
  Airport: Hua Hin Airport ~25km | Don Mueang ~206km (~2.5hr)
  Neighborhood: Budget-friendly beach town; popular with Thai families and Bangkok day-trippers; less expat than Hua Hin

PHUKET — CHERNG TALAY / BANG TAO / LAGUNA:
  Beaches: Bang Tao Beach ~1.5km | Surin Beach ~3km | Layan Beach ~2km
  Malls: Boat Avenue ~1km | Porto de Phuket ~4km | Jungceylon (Patong) ~18km
  Hospitals: Bandon International Hospital ~10km | Bangkok Hospital Phuket ~25km
  Airport: Phuket International ~14km (~20min)
  Neighborhood: Phuket's fastest-growing luxury zone; Laguna resort complex; strong rental yield; international school nearby (HeadStart)

PHUKET — PATONG:
  Beach: Patong Beach 0-800m
  Malls: Jungceylon ~500m | Junceylon directly walkable
  Hospitals: Patong Hospital (government) ~1km | Bandon International ~18km
  Airport: Phuket International ~35km (~45min)
  Neighborhood: Phuket's busiest tourist strip; nightlife-heavy; highest short-term rental yield but noisiest

PHUKET — RAWAI / NAIA (south):
  Beaches: Rawai Beach 0-1km | Nai Harn Beach 3km | Kata Beach 6km
  Malls: Lotus's (Big C) Rawai ~3km | Central Festival ~20km
  Hospitals: Mission Hospital ~12km | Bangkok Hospital ~18km
  Airport: Phuket International ~45km (~55min)
  Neighborhood: Popular with long-term expats and retirees; Rawai seafood market; quieter than north Phuket

CHIANG MAI — NIMMAN / OLD CITY:
  Transit: No rail; Grab/taxi culture; airport shuttle
  Malls: Maya Mall (Nimman) ~500m (if Nimman) | Central Festival ~4km | Promenada ~8km
  Markets: Night Bazaar ~4km | Sunday Walking Street ~3km | Warorot Market ~4km
  Hospitals: Chiang Mai RAM Hospital ~3km | McCormick Hospital ~4km | Maharaj Hospital ~3km
  Airport: Chiang Mai International ~5km (~15min)
  Neighborhood: Trendy café-and-coworking scene; digital nomad hub; cool season Oct-Feb; popular with younger expats

━━━ STEP 2.5: WRITE THE LOCATION NARRATIVE ━━━

Using your research above, write location_narrative: 3-4 sentences, each covering a different category:
Sentence 1: Transit / road access (most important for that location type)
Sentence 2: Malls / markets / daily needs
Sentence 3: Healthcare + airport access
Sentence 4: Neighborhood character (who lives here, what's the vibe)

BAD: "Great location near city center" — no real names, no real distances.

━━━ STEP 3: MARKET COMPARISON — SIZE-MATCHED UNITS ━━━

PRIORITY ORDER:
1. Find units in the SAME PROJECT with the CLOSEST SIZE (±20sqm of this unit)
2. Only if no same-project size match → compare with NEARBY PROJECTS with similar unit size

RULE: Always match on SIZE first, then location. A 61sqm unit should compare to 55-70sqm units,
NOT to all 1BR units regardless of size. Size drives price/sqm; floor and view adjust it.

A) SAME PROJECT, SIMILAR SIZE (primary comparison):
- From page data: identify which other units are closest in sqm to THIS unit
- Calculate price/sqm for each; flag if this unit is value (<-10% vs similar-size), fair (±10%), or premium (>+10%)
- If a unit on a higher floor is listed at lower price/sqm → flag as pricing anomaly
- If any sale prices appear: gross yield = (annual rent ÷ sale price × 100)%

B) NEARBY PROJECTS WITH SIMILAR SIZE (secondary — only if same-project data is thin):
- Use your knowledge to find 2-3 competing projects within ~1-2km with similar sqm range
- Compare rent/sqm and position this listing vs the market

KNOWLEDGE BASE — COMPETING PROJECTS BY AREA (use as reference, adjust for current market):

Bangkok Phloen Chit / Lumphini competitors (1BR ~60sqm):
  - Park Origin Phromphong: 1BR 30-35sqm ฿22-28k/mo
  - The ESSE Sukhumvit 36: 1BR 35-45sqm ฿28-38k/mo
  - Noble Reflex Ari: different area
  - Magnolias Ratchadamri: 1BR 50-70sqm ฿50-80k/mo (more premium)
  - 185 Rajadamri: studio-1BR ฿45-70k/mo
  → Noble Ploenchit at ฿902/sqm is mid-market for this prime CBD strip

Bangkok Asok / Sukhumvit 21 competitors (1-2BR):
  - Villa Asoke: 1BR 30-35sqm ฿18-25k/mo
  - The Master Centrium Asoke: 2BR 55sqm ฿28-35k/mo
  - Celes Asoke: 1BR 32sqm ฿25-32k/mo
  - Rhythm Sukhumvit 42: 1BR 30sqm ฿22-28k/mo

Bangkok Thonglor / Ekkamai:
  - Rhythm Ekkamai: 1BR 30-35sqm ฿20-28k/mo
  - Taka Haus: 2BR 60sqm ฿45-60k/mo
  - Park Origin Thonglor: 1BR 30sqm ฿22-30k/mo
  - FYNN Asoke: 1BR 28sqm ฿20-25k/mo

Bangkok Silom / Sathon:
  - The Royal Saladaeng: 2-3BR older stock ฿30-50k/mo
  - Canapaya Residences Rama 3: 3BR 120sqm ฿55-75k/mo
  - Amanta Lumpini: 2BR 80sqm ฿35-50k/mo

Pattaya / Jomtien (1BR beach condos):
  - Grand Florida Beachfront: 1BR 36sqm ฿17-20k/mo (beachfront)
  - The Riviera Jomtien: 1BR 32-35sqm ฿15-20k/mo
  - Northshore Pattaya: 1BR 35sqm ฿14-18k/mo (Pattaya north)
  - Park Lane Jomtien: 1BR 38sqm ฿15-20k/mo

Hua Hin / Cha-Am (condos + houses):
  - Dusit Condominium: 4BR 317sqm ฿170k/mo (premium large unit)
  - Baan San Sabai: studio ฿8-12k/mo (basic)
  - Palm Hills: 3-4BR house ฿40-80k/mo

For units not in this list, use your broader knowledge of the area and make reasonable estimates.
Always state when data is estimated vs extracted from the page.

━━━ STEP 4: INVESTMENT & EXPAT CONTENT ━━━

For Bangkok CBD, Pattaya, Phuket, Hua Hin — add investor/expat angle:
- Freehold project = foreign quota units eligible (mention this explicitly)
- Developer publicly listed on SET = stronger trust signal
- Comparable rent range within the same building (from page data)
- Suitability for short-term rental / Airbnb
- Include ≥1 FAQ about foreign ownership or investment potential

━━━ STEP 5: SMART FAQs (3-4 per language) ━━━

Choose ONLY questions a real buyer would ask for THIS specific property and location:
- Bangkok urban: "How far is [nearest BTS/MRT station] from the building?"
- Beach areas: "How far is [named beach] from the property?"
- All areas: "What are the monthly charges (CAM fee, utilities)?"
- Resort / investment: "Is this property suitable for short-term rental / Airbnb?"
- Foreign buyers: "Can foreigners rent or buy here?" / "Is there foreign quota?"
- Condos: "Is this building pet-friendly?" (only if not already clear)
- High floors: "What are the views from this unit?"
- Resort: "How far is the nearest international hospital?"
- Suburban: "Which expressway is closest and how far?"
- Families: "Are there good international schools nearby?"

NEVER when irrelevant:
- NEVER "How far is BTS?" for Pattaya, Hua Hin, Phuket, Samui
- NEVER "How far is the beach?" for Bangkok condos
- NEVER repeat what's obvious from the listing title

━━━ STEP 6: SCORING ━━━

completeness×0.4 + accuracy×0.3 + appeal×0.3 | PASS≥75 | BORDERLINE 70-74 | FAIL<70

COMPLETENESS (0-100):
  images ≥10: +20 | developer listed: +15 | relevant location info (transit/beach/airport): +15
  CAM/monthly fees: +15 | year built: +10 | ownership type: +10 | amenities: +15

ACCURACY (0-100):
  location claims verifiable: +30 | price/sqm reasonable for area: +30
  place names correct: +20 | no contradictions: +20

APPEAL (0-100):
  clear area-specific USP: +25 | compelling headline: +20 | smart relevant FAQs ≥3: +20
  description ≥4 sentences with location narrative: +20 | schema markup: +15

━━━ COPY RULES ━━━
- Description: 4-5 sentences — (1) USP hook, (2) location narrative, (3) building/project quality, (4) facilities, (5) lifestyle/who-it-suits
- Lead with the SINGLE STRONGEST USP for this property in this specific location
- Use real numbers: "120m from BTS" not "convenient", "35km to U-Tapao" not "near airport"
- EN copy: expat / international buyer perspective, lifestyle-focused
- TH copy: keywords Thai people actually search; price-first approach
- Never use "luxury", "spacious", "stunning" without specific proof

Return ONLY valid JSON — no markdown, no explanation.
""".strip()

AGENT_USER_TEMPLATE = """
Analyze this PropertyScout listing page and return a JSON object matching the schema below.
Extract ALL available data — project details, comparable units, location, facilities.

URL: {url}

PAGE CONTENT:
{page_content}

Return JSON with this exact schema:
{{
  "listing_id": "string",
  "url": "string",
  "type": "Condo|House|Villa|Land",
  "bedrooms": number,
  "price_thb_month": number,
  "area_sqm": number,
  "floor": number or null,
  "district": "string",
  "developer": "string or null",
  "transit_station": "nearest BTS/MRT/ARL station name or null (null for Pattaya/Hua Hin/Phuket)",
  "transit_distance_m": number or null,
  "duplicate_flag": "describe if suspected duplicate, else null",

  "project": {{
    "name": "project name",
    "developer": "developer company full name or null",
    "year_built": number or null,
    "total_floors": number or null,
    "total_units": number or null,
    "tenure": "Freehold|Leasehold|null",
    "project_area_sqm": number or null,
    "facilities": ["pool", "gym", "sauna", "...all from page"]
  }},

  "comparable_units": [
    {{"size_sqm": number, "bedrooms": number, "floor": number_or_null, "price_thb_month": number, "price_per_sqm": number}}
  ],

  "market_comparison": {{
    "this_unit_price_per_sqm": number,
    "project_avg_price_per_sqm": number_or_null,
    "value_assessment": "value|fair|premium — compared to other units in same project",
    "nearby_projects": [
      {{
        "project_name": "string",
        "distance_km": number,
        "unit_type": "1BR 35sqm etc.",
        "rent_range_thb": "฿XX,000–XX,000/mo",
        "price_per_sqm_range": "฿XXX–XXX",
        "vs_this_listing": "cheaper|similar|pricier"
      }}
    ],
    "market_position_en": "1-2 sentences: how this unit is positioned vs the market",
    "market_position_th": "1-2 ประโยค: ตำแหน่งราคาเทียบตลาด",
    "gross_yield_estimate": "X.X% — if sale price data is available, else null"
  }},

  "location_research": {{
    "transit": [
      {{"name": "station or route name", "distance_m": number, "type": "BTS|MRT|ARL|boat|bus"}}
    ],
    "malls": [
      {{"name": "mall name", "distance_km": number}}
    ],
    "markets": [
      {{"name": "market name", "distance_km": number, "type": "fresh|night|weekend|floating"}}
    ],
    "hospitals": [
      {{"name": "hospital name", "distance_km": number, "type": "international|private|government"}}
    ],
    "airports": [
      {{"name": "airport name", "distance_km": number, "travel_time_min": number, "note": "via ARL / motorway / etc."}}
    ],
    "expressways": [
      {{"name": "expressway name", "distance_km": number}}
    ],
    "schools": [
      {{"name": "school name", "distance_km": number, "type": "international|bilingual|government"}}
    ],
    "parks_beaches": [
      {{"name": "park or beach name", "distance_m": number}}
    ],
    "neighborhood_character": "1-2 sentences describing the area vibe, who lives here, and what makes this location distinctive"
  }},

  "bilingual": {{
    "en": {{
      "title_suggested": "≤60 chars — sqm + strongest USP + location (BTS station for Bangkok, beach for Pattaya/Hua Hin/Phuket)",
      "headline": "≤100 chars — lead with single strongest USP for this specific location",
      "description": "4-5 sentences: (1) USP hook, (2) location narrative with real named places and distances, (3) building/project quality, (4) key facilities, (5) lifestyle/who-it-suits",
      "location_narrative": "2-3 sentences describing the neighborhood — real named places with real distances appropriate to location type (Bangkok: BTS/malls/hospitals/parks; Pattaya: beach/airport/city center/hospitals; Hua Hin: beach/Bangkok distance/malls; Phuket: beach/airport/hospital)",
      "investment_notes": "1-2 sentences for investors/expats: freehold status + foreign quota, developer reputation, comparable rent range in project, short-term rental potential — null if not applicable",
      "meta_description": "≤160 chars for Google snippet",
      "seo_primary_keyword": "keyword real buyers search for THIS location type",
      "seo_secondary_keywords": ["keyword1", "keyword2", "keyword3"],
      "faqs": [
        {{"question": "question a real buyer asks for THIS property and location", "answer": "concise factual answer ≤2 sentences"}},
        {{"question": "second relevant question — different topic", "answer": "..."}},
        {{"question": "third relevant question", "answer": "..."}},
        {{"question": "fourth question — investor or expat angle if applicable", "answer": "..."}}
      ]
    }},
    "th": {{
      "title_suggested": "≤60 ตัวอักษร — เน้นข้อมูลสำคัญสำหรับพื้นที่นี้",
      "headline": "≤100 ตัวอักษร — เปิดด้วย USP ที่แข็งแกร่งที่สุดสำหรับพื้นที่นี้",
      "description": "4-5 ประโยค: USP หลัก + ทำเลพร้อมสถานที่จริงและระยะทาง + คุณภาพโครงการ + สิ่งอำนวยความสะดวก + ไลฟ์สไตล์",
      "location_narrative": "2-3 ประโยค อธิบายทำเลพร้อมสถานที่ชื่อจริงและระยะทางจริง ตามประเภทพื้นที่",
      "investment_notes": "1-2 ประโยค สำหรับนักลงทุน/ชาวต่างชาติ หรือ null ถ้าไม่เกี่ยวข้อง",
      "meta_description": "≤160 ตัวอักษร สำหรับ Google",
      "seo_primary_keyword": "คีย์เวิร์ดที่คนไทยค้นหาจริงสำหรับพื้นที่นี้",
      "seo_secondary_keywords": ["คีย์เวิร์ด1", "คีย์เวิร์ด2", "คีย์เวิร์ด3"],
      "faqs": [
        {{"question": "คำถามที่คนไทยจะถามจริงๆ สำหรับ property และพื้นที่นี้", "answer": "คำตอบสั้น ≤2 ประโยค"}},
        {{"question": "คำถามที่สอง — หัวข้อต่างจากข้อแรก", "answer": "..."}},
        {{"question": "คำถามที่สาม", "answer": "..."}},
        {{"question": "คำถามที่สี่ — นักลงทุน/ชาวต่างชาติถ้าเกี่ยวข้อง", "answer": "..."}}
      ]
    }}
  }},

  "missing_fields": ["cam_fee", "electricity_price", "water_price", ...],
  "issues": {{
    "en": ["Issue 1", "Issue 2"],
    "th": ["ปัญหา 1", "ปัญหา 2"]
  }},
  "priority_actions": {{
    "en": ["Action 1", "Action 2"],
    "th": ["การดำเนินการ 1", "การดำเนินการ 2"]
  }},
  "scores": {{
    "completeness": 0-100,
    "accuracy": 0-100,
    "appeal": 0-100,
    "total": 0-100,
    "grade": "A|B+|C+|C|D",
    "result": "PASS|BORDERLINE|FAIL"
  }},
  "schema_markup": {{
    "@context": "https://schema.org",
    "@type": "Apartment or SingleFamilyResidence",
    "name": "project name",
    "address": {{"streetAddress": "...", "addressLocality": "city", "addressCountry": "TH"}},
    "numberOfRooms": number,
    "floorSize": {{"value": number, "unitCode": "MTK"}},
    "offers": {{"@type": "Offer", "price": number, "priceCurrency": "THB"}}
  }}
}}
"""


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def read_urls_from_csv(path):
    """Extract URLs from the first column of a CSV."""
    urls = []
    with open(path, newline='', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            url = row[0].strip().strip('"')
            if url.startswith('http'):
                urls.append(url)
    return urls


def fetch_page(url):
    """Fetch page HTML, return truncated text content."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        html = response.text
        # Strip scripts/styles, keep meaningful text
        html = re.sub(r'<script[^>]*>.*?</script>', ' ', html, flags=re.DOTALL)
        html = re.sub(r'<style[^>]*>.*?</style>', ' ', html, flags=re.DOTALL)
        html = re.sub(r'<[^>]+>', ' ', html)
        html = re.sub(r'\s+', ' ', html).strip()
        # Truncate to 12000 chars to stay within token limits
        return html[:12000]
    except Exception as e:
        return f"ERROR fetching page: {e}"


def analyze_listing(client, url, page_content, index, total):
    """Call Claude API to analyze one listing. Returns dict."""
    print(f"  [{index}/{total}] Analyzing {url[:60]}...")

    prompt = AGENT_USER_TEMPLATE.format(url=url, page_content=page_content)

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=AGENT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()

        # Sometimes Claude wraps in ```json ... ```, strip it
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'```\s*$', '', raw)

        # Fix trailing commas before } or ]
        raw = re.sub(r',\s*([}\]])', r'\1', raw)

        # Fix literal control characters inside JSON strings (newline, tab, CR)
        # Walk char-by-char: escape \n \r \t only when inside a string value
        fixed = []
        in_str = False
        esc = False
        for ch in raw:
            if esc:
                fixed.append(ch); esc = False
            elif ch == '\\' and in_str:
                fixed.append(ch); esc = True
            elif ch == '"':
                in_str = not in_str; fixed.append(ch)
            elif in_str and ch == '\n':
                fixed.append('\\n')
            elif in_str and ch == '\r':
                fixed.append('\\r')
            elif in_str and ch == '\t':
                fixed.append('\\t')
            else:
                fixed.append(ch)
        raw = ''.join(fixed)

        result = json.loads(raw)
        result['url'] = url  # ensure URL is set
        print(f"  ✅ Score: {result.get('scores', {}).get('total', '?')} — {result.get('scores', {}).get('result', '?')}")
        return result

    except json.JSONDecodeError as e:
        print(f"  ⚠️  JSON parse error: {e}")
        return {"url": url, "error": str(e), "scores": {"total": 0, "grade": "D", "result": "FAIL"}}
    except anthropic.APIError as e:
        print(f"  ❌ API error: {e}")
        return {"url": url, "error": str(e), "scores": {"total": 0, "grade": "D", "result": "FAIL"}}


def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  💾 Saved: {path}")


def save_summary_csv(listings, path):
    fieldnames = [
        'listing_id', 'title_en', 'title_th', 'type', 'bedrooms',
        'price_thb_month', 'area_sqm', 'district', 'transit_station',
        'transit_distance_m', 'developer', 'score_completeness',
        'score_accuracy', 'score_appeal', 'score_total', 'grade', 'result',
        'top_issue_en', 'top_issue_th', 'seo_keyword_en', 'seo_keyword_th',
        'duplicate_flag'
    ]
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for l in listings:
            en = (l.get('bilingual') or {}).get('en') or {}
            th = (l.get('bilingual') or {}).get('th') or {}
            iss = l.get('issues') or {}
            sc  = l.get('scores') or {}
            writer.writerow({
                'listing_id':        l.get('listing_id', ''),
                'title_en':          en.get('title_suggested', ''),
                'title_th':          th.get('title_suggested', ''),
                'type':              l.get('type', ''),
                'bedrooms':          l.get('bedrooms', ''),
                'price_thb_month':   l.get('price_thb_month', ''),
                'area_sqm':          l.get('area_sqm', ''),
                'district':          l.get('district', ''),
                'transit_station':   l.get('transit_station', ''),
                'transit_distance_m': l.get('transit_distance_m', ''),
                'developer':         l.get('developer', ''),
                'score_completeness': sc.get('completeness', ''),
                'score_accuracy':    sc.get('accuracy', ''),
                'score_appeal':      sc.get('appeal', ''),
                'score_total':       sc.get('total', ''),
                'grade':             sc.get('grade', ''),
                'result':            sc.get('result', ''),
                'top_issue_en':      (iss.get('en') or [''])[0],
                'top_issue_th':      (iss.get('th') or [''])[0],
                'seo_keyword_en':    en.get('seo_primary_keyword', ''),
                'seo_keyword_th':    th.get('seo_primary_keyword', ''),
                'duplicate_flag':    l.get('duplicate_flag', ''),
            })
    print(f"  💾 Saved: {path}")


def save_details_csv(listings, path):
    fieldnames = [
        'listing_id',
        'headline_en', 'headline_th',
        'description_en', 'description_th',
        'meta_en', 'meta_th',
        'seo_keyword_en', 'seo_keyword_th',
        'faq1_q_en', 'faq1_a_en', 'faq1_q_th', 'faq1_a_th',
        'faq2_q_en', 'faq2_a_en', 'faq2_q_th', 'faq2_a_th',
        'faq3_q_en', 'faq3_a_en', 'faq3_q_th', 'faq3_a_th',
        'missing_fields', 'priority_action_en', 'priority_action_th',
    ]
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for l in listings:
            en = (l.get('bilingual') or {}).get('en') or {}
            th = (l.get('bilingual') or {}).get('th') or {}
            ef = en.get('faqs') or []
            tf = th.get('faqs') or []
            pa = l.get('priority_actions') or {}
            writer.writerow({
                'listing_id':      l.get('listing_id', ''),
                'headline_en':     en.get('headline', ''),
                'headline_th':     th.get('headline', ''),
                'description_en':  en.get('description', ''),
                'description_th':  th.get('description', ''),
                'meta_en':         en.get('meta_description', ''),
                'meta_th':         th.get('meta_description', ''),
                'seo_keyword_en':  en.get('seo_primary_keyword', ''),
                'seo_keyword_th':  th.get('seo_primary_keyword', ''),
                'faq1_q_en':       ef[0]['question'] if len(ef) > 0 else '',
                'faq1_a_en':       ef[0]['answer']   if len(ef) > 0 else '',
                'faq1_q_th':       tf[0]['question'] if len(tf) > 0 else '',
                'faq1_a_th':       tf[0]['answer']   if len(tf) > 0 else '',
                'faq2_q_en':       ef[1]['question'] if len(ef) > 1 else '',
                'faq2_a_en':       ef[1]['answer']   if len(ef) > 1 else '',
                'faq2_q_th':       tf[1]['question'] if len(tf) > 1 else '',
                'faq2_a_th':       tf[1]['answer']   if len(tf) > 1 else '',
                'faq3_q_en':       ef[2]['question'] if len(ef) > 2 else '',
                'faq3_a_en':       ef[2]['answer']   if len(ef) > 2 else '',
                'faq3_q_th':       tf[2]['question'] if len(tf) > 2 else '',
                'faq3_a_th':       tf[2]['answer']   if len(tf) > 2 else '',
                'missing_fields':  '; '.join(l.get('missing_fields') or []),
                'priority_action_en': (pa.get('en') or [''])[0],
                'priority_action_th': (pa.get('th') or [''])[0],
            })
    print(f"  💾 Saved: {path}")


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    # ── 1. Check arguments
    if len(sys.argv) < 2:
        print("Usage: python runner/run_agents.py <path_to_csv>")
        print("Example: python runner/run_agents.py propertyscout.csv")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"Error: file not found: {csv_path}")
        sys.exit(1)

    # ── 2. Check API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("\n❌ ANTHROPIC_API_KEY not set.")
        print("\nHow to get your API key:")
        print("  1. Go to https://console.anthropic.com")
        print("  2. Sign up / log in")
        print("  3. Click 'API Keys' → 'Create Key'")
        print("  4. Run: set ANTHROPIC_API_KEY=sk-ant-xxxx  (Windows)")
        print("     Or: export ANTHROPIC_API_KEY=sk-ant-xxxx  (Mac/Linux)")
        print("  5. Run this script again\n")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # ── 3. Read URLs
    print(f"\n📂 Reading CSV: {csv_path}")
    urls = read_urls_from_csv(csv_path)
    if not urls:
        print("Error: no URLs found in CSV. Ensure URLs are in the first column.")
        sys.exit(1)
    print(f"   Found {len(urls)} URLs\n")

    # ── 4. Process each listing
    listings = []
    start_time = time.time()

    for i, url in enumerate(urls, 1):
        print(f"\n─── Listing {i}/{len(urls)} ───")
        print(f"  URL: {url[:70]}")

        # Fetch page
        print("  📡 Fetching page...")
        page_content = fetch_page(url)

        # Analyze with Claude
        result = analyze_listing(client, url, page_content, i, len(urls))
        listings.append(result)

        # Rate-limit pause
        if i < len(urls):
            time.sleep(DELAY_SEC)

    elapsed = time.time() - start_time
    print(f"\n✅ Processed {len(listings)} listings in {elapsed:.1f}s")

    # ── 5. Calculate summary stats
    pass_count       = sum(1 for l in listings if l.get('scores', {}).get('result') == 'PASS')
    borderline_count = sum(1 for l in listings if l.get('scores', {}).get('result') == 'BORDERLINE')
    fail_count       = sum(1 for l in listings if l.get('scores', {}).get('result') == 'FAIL')

    # Detect systemic issues
    systemic = []
    no_cam = sum(1 for l in listings if 'cam_fee' in (l.get('missing_fields') or []))
    no_dev = sum(1 for l in listings if not l.get('developer'))
    dups   = sum(1 for l in listings if l.get('duplicate_flag') and 'DUPLICATE' in str(l.get('duplicate_flag')))
    if no_cam > len(listings) // 2:
        systemic.append(f"{no_cam}/{len(listings)} listings missing CAM fee — add to all listings")
    if no_dev > len(listings) // 3:
        systemic.append(f"{no_dev}/{len(listings)} listings missing developer name — reduces trust and AEO")
    if dups > 0:
        systemic.append(f"{dups} suspected duplicate listings — investigate and merge/remove")

    # ── 6. Build output JSON
    output = {
        "meta": {
            "processed_at":   datetime.now(timezone.utc).isoformat(),
            "source_csv":     os.path.basename(csv_path),
            "total_listings": len(listings),
            "pass":           pass_count,
            "borderline":     borderline_count,
            "fail":           fail_count,
            "systemic_issues": systemic,
        },
        "listings": listings,
    }

    # ── 7. Save outputs
    print("\n💾 Saving outputs...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    json_path    = os.path.join(OUTPUT_DIR, 'agent_results.json')
    summary_path = os.path.join(OUTPUT_DIR, 'ps_summary.csv')
    details_path = os.path.join(OUTPUT_DIR, 'ps_details.csv')

    save_json(output, json_path)
    save_summary_csv(listings, summary_path)
    save_details_csv(listings, details_path)

    # ── 8. Final summary
    print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PropertyScout Analysis Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total:       {len(listings)} listings
  Pass:        {pass_count}  ✅
  Borderline:  {borderline_count}  ⚠️
  Fail:        {fail_count}  ❌

  Output files:
  • {json_path}
  • {summary_path}
  • {details_path}

  Open the Virtual Office to view results:
  http://localhost:8080/AI%20Agent%20Platform.html
  → Click "ผล Listing" in the sidebar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")


if __name__ == '__main__':
    main()
