// app/results.jsx — Upload CSV, view real results, download outputs

const GRADE_COLOR  = { "A":"#0E9E78","B+":"#0E9E78","C+":"#C99528","C":"#C99528","D":"#D45B3C" };
const RESULT_COLOR = { PASS:"#0E9E78", BORDERLINE:"#C99528", FAIL:"#D45B3C" };
const RESULT_BG    = { PASS:"#E4F4EE", BORDERLINE:"#FBF3DC", FAIL:"#FBE8E2" };
const RESULT_TH    = { PASS:"ผ่าน", BORDERLINE:"ขอบเขต", FAIL:"ไม่ผ่าน" };

/* ─── helpers ──────────────────────────────────────────────── */

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const urls = [];
  for (const line of lines) {
    const raw = line.split(',')[0].replace(/"/g, '').trim();
    if (raw.startsWith('http')) urls.push(raw);
  }
  return urls;
}

function generateSummaryCSV(listings) {
  const header = [
    'listing_id','title_en','title_th','type','bedrooms','price_thb_month',
    'area_sqm','district','transit_station','transit_distance_m','developer',
    'score_completeness','score_accuracy','score_appeal','score_total',
    'grade','result','top_issue_en','top_issue_th','seo_keyword_en','seo_keyword_th',
    'duplicate_flag'
  ].join(',');
  const rows = listings.map(l => {
    const en = l.bilingual?.en || {};
    const th = l.bilingual?.th || {};
    const iss = l.issues;
    const csv = (v) => `"${String(v||'').replace(/"/g,'""')}"`;
    return [
      l.listing_id,
      csv(en.title_suggested||''),
      csv(th.title_suggested||''),
      l.type||'',
      l.bedrooms||'',
      l.price_thb_month||'',
      l.area_sqm||'',
      csv(l.district||''),
      csv(l.transit_station||''),
      l.transit_distance_m||'',
      csv(l.developer||''),
      l.scores?.completeness||'',
      l.scores?.accuracy||'',
      l.scores?.appeal||'',
      l.scores?.total||'',
      l.scores?.grade||'',
      l.scores?.result||'',
      csv((iss?.en||[])[0]||''),
      csv((iss?.th||[])[0]||''),
      csv(en.seo_primary_keyword||''),
      csv(th.seo_primary_keyword||''),
      csv(l.duplicate_flag||'')
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function generateDetailsCSV(listings) {
  const header = [
    'listing_id',
    'headline_en','headline_th',
    'description_en','description_th',
    'meta_en','meta_th',
    'seo_keyword_en','seo_keyword_th',
    'faq1_q_en','faq1_a_en','faq1_q_th','faq1_a_th',
    'faq2_q_en','faq2_a_en','faq2_q_th','faq2_a_th',
    'faq3_q_en','faq3_a_en','faq3_q_th','faq3_a_th',
    'missing_fields',
    'priority_action_en','priority_action_th'
  ].join(',');
  const rows = listings.map(l => {
    const en = l.bilingual?.en || {};
    const th = l.bilingual?.th || {};
    const ef = en.faqs || [];
    const tf = th.faqs || [];
    const csv = (v) => `"${String(v||'').replace(/"/g,'""')}"`;
    return [
      l.listing_id,
      csv(en.headline||''), csv(th.headline||''),
      csv(en.description||''), csv(th.description||''),
      csv(en.meta_description||''), csv(th.meta_description||''),
      csv(en.seo_primary_keyword||''), csv(th.seo_primary_keyword||''),
      csv(ef[0]?.question||''), csv(ef[0]?.answer||''), csv(tf[0]?.question||''), csv(tf[0]?.answer||''),
      csv(ef[1]?.question||''), csv(ef[1]?.answer||''), csv(tf[1]?.question||''), csv(tf[1]?.answer||''),
      csv(ef[2]?.question||''), csv(ef[2]?.answer||''), csv(tf[2]?.question||''), csv(tf[2]?.answer||''),
      csv((l.missing_fields||[]).join('; ')),
      csv((l.priority_actions?.en||[])[0]||''),
      csv((l.priority_actions?.th||[])[0]||'')
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function downloadText(content, filename, mime) {
  const bom = mime.includes('csv') ? '﻿' : '';
  const blob = new Blob([bom + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── upload zone ──────────────────────────────────────────── */

function UploadZone({ lang, onUrls }) {
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const urls = parseCSV(e.target.result);
      onUrls(urls, file.name);
    };
    reader.readAsText(file, 'utf-8');
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onClick={() => fileRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? '#0E9E78' : '#D4C9B5'}`,
        borderRadius: 16, padding: '36px 24px', textAlign: 'center',
        background: dragging ? '#E4F4EE' : '#FAF7F2', cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <input
        ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#211E1A', marginBottom: 6 }}>
        {lang === 'th' ? 'วาง CSV หรือคลิกเพื่อเลือกไฟล์' : 'Drop CSV or click to choose file'}
      </div>
      <div style={{ fontSize: 13, color: '#8B8475' }}>
        {lang === 'th'
          ? 'รองรับ .csv / .xlsx — ต้องมีคอลัมน์ URL ในคอลัมน์แรก'
          : 'Accepts .csv / .xlsx — URL column must be first column'}
      </div>
    </div>
  );
}

/* ─── url preview + claude prompt ─────────────────────────── */

function URLPreview({ urls, filename, lang, onClear }) {
  const [copied, setCopied] = React.useState(false);
  const prompt = `วิเคราะห์ประกาศจากไฟล์ ${filename}\n\nURLs:\n${urls.join('\n')}\n\nกรุณา process ทุก URL ตาม 11-agent pipeline และ output ผลลัพธ์ bilingual (TH+EN) ลงใน data/agent_results.json`;

  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E3DACB', overflow: 'hidden' }}>
      {/* header */}
      <div style={{
        background: '#211E1A', color: '#EFE9DF', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {lang === 'th' ? `พบ ${urls.length} URL จาก "${filename}"` : `Found ${urls.length} URLs from "${filename}"`}
          </div>
          <div style={{ fontSize: 12, opacity: .65, marginTop: 2 }}>
            {lang === 'th' ? 'ขั้นตอนถัดไป: คัดลอก prompt แล้วส่งให้ Claude Code' : 'Next: copy the prompt below and send it to Claude Code'}
          </div>
        </div>
        <button onClick={onClear} style={{
          all: 'unset', cursor: 'pointer', padding: '6px 14px', borderRadius: 999,
          background: 'rgba(255,255,255,.12)', fontSize: 12.5, fontWeight: 600,
        }}>
          {lang === 'th' ? 'เริ่มใหม่' : 'Clear'}
        </button>
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', gap: 16 }}>
        {/* url list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8475', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>
            {lang === 'th' ? 'รายการ URL' : 'URL List'}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: '#F6F2EB', borderRadius: 10, padding: '10px 14px' }}>
            {urls.map((url, i) => (
              <div key={i} style={{ fontSize: 11.5, color: '#4F63D2', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace" }}>
                {i + 1}. {url}
              </div>
            ))}
          </div>
        </div>

        {/* step 2: prompt to copy */}
        <div style={{ flex: '0 0 320px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8475', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>
            {lang === 'th' ? 'ขั้นตอน: คัดลอก Prompt นี้ → ส่งให้ Claude Code' : 'Step: Copy this Prompt → Send to Claude Code'}
          </div>
          <div style={{
            background: '#F0F4FD', borderRadius: 10, padding: '12px 14px',
            fontSize: 11.5, color: '#211E1A', fontFamily: "'IBM Plex Mono',monospace",
            maxHeight: 160, overflowY: 'auto', lineHeight: 1.6, marginBottom: 10,
            whiteSpace: 'pre-wrap', border: '1px solid #D4DCFA',
          }}>
            {prompt}
          </div>
          <button onClick={copy} style={{
            all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
            textAlign: 'center', padding: '10px 0', borderRadius: 999,
            background: copied ? '#0E9E78' : '#4F63D2', color: '#fff',
            fontSize: 13.5, fontWeight: 700, transition: 'background .2s',
          }}>
            {copied ? (lang === 'th' ? '✅ คัดลอกแล้ว!' : '✅ Copied!') : (lang === 'th' ? '📋 คัดลอก Prompt' : '📋 Copy Prompt')}
          </button>
          <div style={{ fontSize: 11, color: '#8B8475', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            {lang === 'th'
              ? 'วาง prompt นี้ลงใน Claude Code chat\nระบบจะวิเคราะห์ทุก URL และบันทึกผล'
              : 'Paste this into your Claude Code chat.\nIt will analyze all URLs and save results here.'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── download section ─────────────────────────────────────── */

function DownloadSection({ data, lang }) {
  const download = (type) => {
    const { listings } = data;
    if (type === 'json') {
      downloadText(JSON.stringify(data, null, 2), 'agent_results.json', 'application/json');
    } else if (type === 'summary') {
      downloadText(generateSummaryCSV(listings), 'ps_summary.csv', 'text/csv;charset=utf-8');
    } else if (type === 'details') {
      downloadText(generateDetailsCSV(listings), 'ps_details.csv', 'text/csv;charset=utf-8');
    }
  };

  const btns = [
    { id: 'summary', icon: '📊', label: lang === 'th' ? 'สรุปสำหรับผู้บริหาร' : 'Summary CSV', sub: lang === 'th' ? 'ps_summary.csv — 1 แถว/listing' : 'ps_summary.csv — 1 row/listing', color: '#0E9E78' },
    { id: 'details', icon: '📝', label: lang === 'th' ? 'รายละเอียดสำหรับทีม' : 'Details CSV', sub: lang === 'th' ? 'ps_details.csv — Copy + FAQ ทั้งหมด' : 'ps_details.csv — All copy & FAQs', color: '#4F63D2' },
    { id: 'json',    icon: '📦', label: lang === 'th' ? 'ข้อมูลดิบ JSON' : 'Raw JSON', sub: lang === 'th' ? 'agent_results.json — ข้อมูลเต็ม' : 'agent_results.json — Full data', color: '#C99528' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8475', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'IBM Plex Mono',monospace" }}>
        {lang === 'th' ? 'ดาวน์โหลด Output' : 'Download Output'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {btns.map(b => (
          <button key={b.id} onClick={() => download(b.id)} style={{
            all: 'unset', cursor: 'pointer', boxSizing: 'border-box',
            background: '#fff', border: `1.5px solid ${b.color}30`,
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'box-shadow .15s, transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px -6px ${b.color}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: 22 }}>{b.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#211E1A' }}>{b.label}</div>
              <div style={{ fontSize: 11.5, color: '#8B8475', marginTop: 2 }}>{b.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <a href="reports/team_report.html" target="_blank" style={{
          all: 'unset', cursor: 'pointer', padding: '9px 18px', borderRadius: 999,
          background: '#211E1A', color: '#EFE9DF', fontSize: 13, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 7,
        }}>
          📄 {lang === 'th' ? 'เปิด Team Report (Print/PDF)' : 'Open Team Report (Print/PDF)'}
        </a>
        <button onClick={() => window.location.reload()} style={{
          all: 'unset', cursor: 'pointer', padding: '9px 18px', borderRadius: 999,
          background: '#ECE5D8', color: '#6B655C', fontSize: 13, fontWeight: 600,
        }}>
          🔄 {lang === 'th' ? 'โหลดผลใหม่' : 'Refresh Results'}
        </button>
      </div>
    </div>
  );
}

/* ─── grade badge ──────────────────────────────────────────── */

function GradeBadge({ grade, result, lang }) {
  const c = RESULT_COLOR[result] || '#8B8475';
  const bg = RESULT_BG[result] || '#ECE5D8';
  const label = lang === 'th' ? RESULT_TH[result] : result;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: bg, color: c, borderRadius: 999,
      padding: '3px 12px 3px 8px', fontSize: 12.5, fontWeight: 700,
      fontFamily: "'IBM Plex Mono',monospace",
    }}>
      <span style={{ background: c, color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11.5, fontWeight: 800 }}>{grade}</span>
      {label}
    </span>
  );
}

/* ─── score bar ────────────────────────────────────────────── */

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#8B8475', marginBottom: 3, fontFamily: "'IBM Plex Mono',monospace" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: '#211E1A' }}>{value}</span>
      </div>
      <div style={{ background: '#ECE5D8', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, background: color || '#0E9E78', height: '100%', borderRadius: 4, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

/* ─── listing card ─────────────────────────────────────────── */

function ListingCard({ listing, lang, expanded, onToggle }) {
  const bi = listing.bilingual;
  const lng = bi?.[lang] || bi?.en || {};
  const result = listing.scores?.result || 'FAIL';
  const grade = listing.scores?.grade || '?';
  const isDuplicate = listing.duplicate_flag && listing.duplicate_flag.includes('DUPLICATE');
  const proj = listing.project || {};

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #E3DACB',
      overflow: 'hidden', marginBottom: 14,
      boxShadow: expanded ? '0 8px 28px -16px rgba(40,30,15,.25)' : 'none',
      transition: 'box-shadow .2s',
    }}>
      <button onClick={onToggle} style={{
        all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'flex-start',
        gap: 14, padding: '16px 20px', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{
          flex: '0 0 48px', width: 48, height: 48, borderRadius: 11,
          background: RESULT_BG[result], display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${RESULT_COLOR[result]}22`,
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: RESULT_COLOR[result], fontFamily: "'IBM Plex Mono',monospace" }}>{grade}</span>
          <span style={{ fontSize: 8.5, color: '#8B8475', fontFamily: "'IBM Plex Mono',monospace", marginTop: 1 }}>
            {listing.type === 'House' ? 'HOUSE' : listing.type === 'Villa' ? 'VILLA' : 'CONDO'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#211E1A' }}>
              {lng.title_suggested || `Listing #${listing.listing_id}`}
            </span>
            {isDuplicate && <span style={{ background: '#FBE8E2', color: '#D45B3C', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>⚠ DUP</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8B8475' }}>#{listing.listing_id} · {listing.district}</span>
            {listing.transit_station && <span style={{ fontSize: 12, color: '#4F63D2', fontWeight: 600 }}>🚇 {listing.transit_station} {listing.transit_distance_m}m</span>}
            {proj.tenure && <span style={{ fontSize: 11, background: proj.tenure === 'Freehold' ? '#E4F4EE' : '#FBF3DC', color: proj.tenure === 'Freehold' ? '#0A6B52' : '#C99528', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>{proj.tenure}</span>}
            <span style={{ fontSize: 12.5, color: '#0E9E78', fontWeight: 700 }}>฿{listing.price_thb_month?.toLocaleString()}/mo</span>
            <GradeBadge grade={grade} result={result} lang={lang} />
          </div>
        </div>
        <div style={{
          flex: '0 0 26px', width: 26, height: 26, borderRadius: 7, background: '#F6F2EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8B8475', fontSize: 14, transition: 'transform .2s',
          transform: expanded ? 'rotate(180deg)' : 'none',
        }}>▾</div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #F0EAE0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* score bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
            <ScoreBar label={lang === 'th' ? 'ความสมบูรณ์' : 'Completeness'} value={listing.scores?.completeness} color="#0E9E78" />
            <ScoreBar label={lang === 'th' ? 'ความแม่นยำ' : 'Accuracy'} value={listing.scores?.accuracy} color="#4F63D2" />
            <ScoreBar label={lang === 'th' ? 'ความน่าสนใจ' : 'Appeal'} value={listing.scores?.appeal} color="#C99528" />
            <ScoreBar label={lang === 'th' ? 'รวม' : 'Total'} value={listing.scores?.total} color={RESULT_COLOR[result]} />
          </div>

          {/* project info */}
          {(proj.developer || proj.year_built || proj.total_floors || proj.total_units || (proj.facilities && proj.facilities.length > 0)) && (
            <div style={{ background: '#F0F4FD', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: '#4F63D2', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace" }}>
                🏢 {lang === 'th' ? 'ข้อมูลโครงการ' : 'Project Info'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: proj.facilities?.length ? 10 : 0 }}>
                {[
                  proj.developer      && { k: lang === 'th' ? 'นักพัฒนา' : 'Developer',   v: proj.developer },
                  proj.year_built     && { k: lang === 'th' ? 'ปีสร้างเสร็จ' : 'Built',   v: proj.year_built },
                  proj.total_floors   && { k: lang === 'th' ? 'จำนวนชั้น' : 'Floors',     v: proj.total_floors },
                  proj.total_units    && { k: lang === 'th' ? 'จำนวนยูนิต' : 'Units',     v: Number(proj.total_units).toLocaleString() },
                  proj.tenure         && { k: lang === 'th' ? 'กรรมสิทธิ์' : 'Tenure',    v: proj.tenure },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>
                    <span style={{ color: '#8B8475' }}>{item.k}: </span>
                    <span style={{ fontWeight: 700, color: '#211E1A' }}>{item.v}</span>
                  </div>
                ))}
              </div>
              {proj.facilities && proj.facilities.length > 0 && (
                <div style={{ fontSize: 11.5 }}>
                  <span style={{ color: '#8B8475' }}>{lang === 'th' ? 'สิ่งอำนวยความสะดวก: ' : 'Facilities: '}</span>
                  <span style={{ color: '#4F63D2', fontWeight: 600 }}>{proj.facilities.join(' · ')}</span>
                </div>
              )}
            </div>
          )}

          {/* bilingual copy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {['en','th'].map(l => {
              const b = listing.bilingual?.[l] || {};
              return (
                <div key={l} style={{ background: l === 'th' ? '#F6F2EB' : '#F0F4FD', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#8B8475', fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8, textTransform: 'uppercase' }}>
                    {l === 'en' ? '🇬🇧 English' : '🇹🇭 ภาษาไทย'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 2 }}>{l === 'th' ? 'ชื่อที่แนะนำ' : 'Suggested Title'}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#211E1A', lineHeight: 1.4, marginBottom: 8 }}>{b.title_suggested || '—'}</div>
                  <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 2 }}>{l === 'th' ? 'พาดหัว' : 'Headline'}</div>
                  <div style={{ fontSize: 12, color: '#211E1A', lineHeight: 1.5, marginBottom: 8 }}>{b.headline || '—'}</div>

                  {b.location_narrative && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 3 }}>{l === 'th' ? '📍 เล่าทำเล' : '📍 Location Story'}</div>
                      <div style={{ fontSize: 11.5, color: '#211E1A', lineHeight: 1.65, padding: '9px 11px', background: l === 'th' ? '#EBE5DA' : '#E8EDFD', borderRadius: 8, borderLeft: `3px solid ${l === 'th' ? '#C99528' : '#4F63D2'}` }}>
                        {b.location_narrative}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 4 }}>{l === 'th' ? 'คีย์เวิร์ด SEO' : 'SEO Keyword'}</div>
                  <div style={{
                    display: 'inline-block',
                    background: l === 'th' ? '#E4F4EE' : '#E8EDFD',
                    color: l === 'th' ? '#0A6B52' : '#2B3FA0',
                    borderRadius: 6, padding: '2px 8px', fontSize: 11.5, fontWeight: 600, marginBottom: 10,
                  }}>
                    {b.seo_primary_keyword || '—'}
                  </div>

                  {b.faqs && b.faqs.length > 0 && (
                    <>
                      <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 5 }}>FAQ (AEO)</div>
                      {b.faqs.map((faq, i) => (
                        <div key={i} style={{ marginBottom: 7, paddingLeft: 10, borderLeft: '2px solid #0E9E7840' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#211E1A', marginBottom: 2 }}>Q: {faq.question}</div>
                          <div style={{ fontSize: 10.5, color: '#6B655C' }}>A: {faq.answer}</div>
                        </div>
                      ))}
                    </>
                  )}

                  {b.investment_notes && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: '#FBF3DC', borderRadius: 8, borderLeft: '3px solid #C99528' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#C99528', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                        💰 {l === 'th' ? 'นักลงทุน / ชาวต่างชาติ' : 'Investor / Expat'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B655C', lineHeight: 1.55 }}>{b.investment_notes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* market comparison */}
          {listing.market_comparison && (
            <div style={{ background: '#FBF3DC', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C99528', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace" }}>
                📈 {lang === 'th' ? 'เปรียบเทียบตลาด' : 'Market Comparison'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                {[
                  { k: lang === 'th' ? 'ราคา/ตร.ม. ยูนิตนี้' : 'This unit ฿/sqm', v: `฿${listing.market_comparison.this_unit_price_per_sqm?.toLocaleString()}` },
                  listing.market_comparison.project_avg_price_per_sqm && { k: lang === 'th' ? 'ค่าเฉลี่ยโครงการ' : 'Project avg ฿/sqm', v: `฿${listing.market_comparison.project_avg_price_per_sqm?.toLocaleString()}` },
                  listing.market_comparison.value_assessment && { k: lang === 'th' ? 'ประเมินราคา' : 'Value assessment', v: listing.market_comparison.value_assessment, highlight: true },
                  listing.market_comparison.gross_yield_estimate && { k: lang === 'th' ? 'Gross Yield (ประมาณ)' : 'Est. Gross Yield', v: listing.market_comparison.gross_yield_estimate },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 12 }}>
                    <span style={{ color: '#8B8475' }}>{item.k}: </span>
                    <span style={{ fontWeight: 700, color: item.highlight ? '#C99528' : '#211E1A' }}>{item.v}</span>
                  </div>
                ))}
              </div>
              {listing.market_comparison.market_position_en && (
                <div style={{ fontSize: 12, color: '#6B655C', lineHeight: 1.55, marginBottom: 10, padding: '7px 10px', background: '#fff', borderRadius: 8 }}>
                  {lang === 'th' ? listing.market_comparison.market_position_th : listing.market_comparison.market_position_en}
                </div>
              )}
              {listing.market_comparison.nearby_projects && listing.market_comparison.nearby_projects.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, color: '#8B8475', marginBottom: 6, fontWeight: 600 }}>{lang === 'th' ? 'โครงการใกล้เคียง' : 'Nearby Competing Projects'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 7 }}>
                    {listing.market_comparison.nearby_projects.map((p, i) => {
                      const color = p.vs_this_listing === 'cheaper' ? '#D45B3C' : p.vs_this_listing === 'pricier' ? '#4F63D2' : '#0E9E78';
                      return (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 11px', borderLeft: `3px solid ${color}` }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#211E1A' }}>{p.project_name}</div>
                          <div style={{ fontSize: 11, color: '#8B8475' }}>{p.distance_km}km · {p.unit_type}</div>
                          <div style={{ fontSize: 11.5, color: '#211E1A', marginTop: 2 }}>{p.rent_range_thb}</div>
                          <div style={{ fontSize: 10.5, color, fontWeight: 700, marginTop: 2 }}>{p.vs_this_listing}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* location research */}
          {listing.location_research && (
            <div style={{ background: '#F0F4FD', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4F63D2', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'IBM Plex Mono',monospace" }}>
                🗺 {lang === 'th' ? 'วิจัยทำเลโดย AI' : 'AI Location Research'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {[
                  { key: 'transit',      icon: '🚇', label: lang === 'th' ? 'ขนส่งมวลชน' : 'Transit',     items: listing.location_research.transit,      fmt: i => `${i.name} — ${i.distance_m < 1000 ? i.distance_m + 'm' : (i.distance_m/1000).toFixed(1) + 'km'}` },
                  { key: 'malls',        icon: '🛍', label: lang === 'th' ? 'ห้างสรรพสินค้า' : 'Malls',   items: listing.location_research.malls,        fmt: i => `${i.name} — ${i.distance_km}km` },
                  { key: 'markets',      icon: '🏪', label: lang === 'th' ? 'ตลาด' : 'Markets',            items: listing.location_research.markets,      fmt: i => `${i.name} — ${i.distance_km}km` },
                  { key: 'hospitals',    icon: '🏥', label: lang === 'th' ? 'โรงพยาบาล' : 'Hospitals',    items: listing.location_research.hospitals,    fmt: i => `${i.name} — ${i.distance_km}km` },
                  { key: 'airports',     icon: '✈️', label: lang === 'th' ? 'สนามบิน' : 'Airports',       items: listing.location_research.airports,     fmt: i => `${i.name} — ${i.distance_km}km (~${i.travel_time_min}min)` },
                  { key: 'expressways',  icon: '🛣', label: lang === 'th' ? 'ทางด่วน' : 'Expressways',    items: listing.location_research.expressways,  fmt: i => `${i.name} — ${i.distance_km}km` },
                  { key: 'schools',      icon: '🏫', label: lang === 'th' ? 'โรงเรียน' : 'Schools',       items: listing.location_research.schools,      fmt: i => `${i.name} — ${i.distance_km}km` },
                  { key: 'parks_beaches',icon: '🌊', label: lang === 'th' ? 'สวน/ชายหาด' : 'Parks/Beach', items: listing.location_research.parks_beaches, fmt: i => `${i.name} — ${i.distance_m < 1000 ? i.distance_m + 'm' : (i.distance_m/1000).toFixed(1) + 'km'}` },
                ].filter(cat => cat.items && cat.items.length > 0).map(cat => (
                  <div key={cat.key} style={{ background: '#fff', borderRadius: 9, padding: '9px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4F63D2', marginBottom: 5 }}>{cat.icon} {cat.label}</div>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: '#211E1A', marginBottom: 3 }}>{cat.fmt(item)}</div>
                    ))}
                  </div>
                ))}
              </div>
              {listing.location_research.neighborhood_character && (
                <div style={{ marginTop: 10, padding: '9px 12px', background: '#E8EDFD', borderRadius: 9, fontSize: 12, color: '#211E1A', lineHeight: 1.6, borderLeft: '3px solid #4F63D2' }}>
                  <span style={{ fontWeight: 700, color: '#4F63D2' }}>{lang === 'th' ? 'บรรยากาศย่าน: ' : 'Neighborhood: '}</span>
                  {listing.location_research.neighborhood_character}
                </div>
              )}
            </div>
          )}

          {/* comparable units in project */}
          {listing.comparable_units && listing.comparable_units.length > 0 && (
            <div style={{ background: '#F6F2EB', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C99528', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                📊 {lang === 'th' ? 'ยูนิตอื่นในโครงการเดียวกัน' : 'Other Units in This Project'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {listing.comparable_units.map((u, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 9, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#211E1A' }}>{u.bedrooms}BR · {u.size_sqm}sqm</div>
                    {u.floor && <div style={{ fontSize: 11, color: '#8B8475' }}>{lang === 'th' ? 'ชั้น' : 'Floor'} {u.floor}</div>}
                    <div style={{ color: '#0E9E78', fontWeight: 700, marginTop: 3 }}>฿{u.price_thb_month?.toLocaleString()}/mo</div>
                    {u.price_per_sqm && <div style={{ fontSize: 10.5, color: '#8B8475' }}>฿{Number(u.price_per_sqm).toLocaleString()}/sqm</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* issues & actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#FBF0ED', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#D45B3C', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {lang === 'th' ? 'ปัญหาที่พบ' : 'Issues Found'}
              </div>
              {(listing.issues?.[lang] || listing.issues?.en || []).map((issue, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#6B655C', marginBottom: 5, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#D45B3C' }}>•</span>{issue}
                </div>
              ))}
            </div>
            <div style={{ background: '#E4F4EE', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0A6B52', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {lang === 'th' ? 'สิ่งที่ต้องดำเนินการ' : 'Priority Actions'}
              </div>
              {(listing.priority_actions?.[lang] || listing.priority_actions?.en || []).map((a, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#6B655C', marginBottom: 5, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#0E9E78' }}>→</span>{a}
                </div>
              ))}
            </div>
          </div>

          {listing.missing_fields && listing.missing_fields.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8475', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 7 }}>
                {lang === 'th' ? 'ข้อมูลที่ขาด' : 'Missing Fields'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {listing.missing_fields.map((f, i) => (
                  <span key={i} style={{ background: '#FBE8E2', color: '#D45B3C', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── main view ────────────────────────────────────────────── */

function ResultsView({ lang }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [uploadedUrls, setUploadedUrls] = React.useState(null);
  const [uploadedFilename, setUploadedFilename] = React.useState('');
  const [expanded, setExpanded] = React.useState({});
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    fetch('data/agent_results.json')
      .then(r => { if (!r.ok) throw new Error('no data'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleUrls = (urls, filename) => {
    setUploadedUrls(urls);
    setUploadedFilename(filename);
  };

  // ── No results yet ──────────────────────────────────────────
  if (!loading && !data) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#211E1A' }}>
            {lang === 'th' ? 'วิเคราะห์ Listing' : 'Analyse Listings'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#6B655C' }}>
            {lang === 'th'
              ? 'อัปโหลด CSV → คัดลอก prompt → ส่งให้ Claude Code → ดูผลที่นี่'
              : 'Upload CSV → copy prompt → send to Claude Code → results appear here'}
          </p>
        </div>

        {!uploadedUrls
          ? <UploadZone lang={lang} onUrls={handleUrls} />
          : <URLPreview urls={uploadedUrls} filename={uploadedFilename} lang={lang} onClear={() => setUploadedUrls(null)} />
        }

        <div style={{ marginTop: 28, background: '#F6F2EB', borderRadius: 14, padding: '18px 22px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#211E1A', marginBottom: 10 }}>
            {lang === 'th' ? 'วิธีการทำงาน' : 'How it works'}
          </div>
          {[
            { n: '1', t: lang === 'th' ? 'อัปโหลด CSV ที่มี URL PropertyScout' : 'Upload a CSV containing PropertyScout URLs', c: '#4F63D2' },
            { n: '2', t: lang === 'th' ? 'คัดลอก prompt ที่สร้างขึ้นอัตโนมัติ' : 'Copy the auto-generated prompt', c: '#C99528' },
            { n: '3', t: lang === 'th' ? 'วาง prompt ใน Claude Code chat — agents จะทำงานจริง' : 'Paste in Claude Code chat — agents run the real analysis', c: '#0E9E78' },
            { n: '4', t: lang === 'th' ? 'กลับมาหน้านี้ กด Refresh เพื่อดูผล + ดาวน์โหลด CSV/JSON' : 'Return here, hit Refresh to see results and download CSV/JSON', c: '#D45B3C' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: s.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flex: '0 0 auto' }}>{s.n}</div>
              <div style={{ fontSize: 13.5, color: '#211E1A', paddingTop: 4 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#8B8475', fontFamily: "'IBM Plex Mono',monospace" }}>
      {lang === 'th' ? 'กำลังโหลดผลการวิเคราะห์...' : 'Loading results…'}
    </div>
  );

  // ── Results available ───────────────────────────────────────
  const { meta, listings } = data;
  const filtered = filter === 'all' ? listings : listings.filter(l => l.scores?.result === filter.toUpperCase());

  const FILTERS = [
    { id: 'all', label: lang === 'th' ? 'ทั้งหมด' : 'All', count: listings.length },
    { id: 'pass', label: lang === 'th' ? 'ผ่าน' : 'Pass', count: meta.pass, color: '#0E9E78' },
    { id: 'borderline', label: lang === 'th' ? 'ขอบเขต' : 'Borderline', count: meta.borderline, color: '#C99528' },
    { id: 'fail', label: lang === 'th' ? 'ไม่ผ่าน' : 'Fail', count: meta.fail, color: '#D45B3C' },
  ];

  return (
    <div>
      {/* page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#211E1A' }}>
            {lang === 'th' ? 'ผลการวิเคราะห์ Listing' : 'Listing Analysis Results'}
          </h2>
          <span style={{ fontSize: 12, color: '#8B8475', fontFamily: "'IBM Plex Mono',monospace" }}>
            {new Date(meta.processed_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: '#6B655C' }}>
          {lang === 'th'
            ? 'คลิกแต่ละประกาศเพื่อดู copy ภาษาไทยและอังกฤษ, FAQ schema, และสิ่งที่ต้องแก้ไข'
            : 'Click any listing to see bilingual copy, FAQ schema, SEO keywords and action items'}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: lang === 'th' ? 'ทั้งหมด' : 'Total', value: meta.total_listings, color: '#211E1A' },
          { label: lang === 'th' ? 'ผ่าน' : 'Pass', value: meta.pass, color: '#0E9E78' },
          { label: lang === 'th' ? 'ขอบเขต' : 'Borderline', value: meta.borderline, color: '#C99528' },
          { label: lang === 'th' ? 'ไม่ผ่าน' : 'Fail', value: meta.fail, color: '#D45B3C' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #E3DACB' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, fontFamily: "'IBM Plex Mono',monospace" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#8B8475', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* download section */}
      <DownloadSection data={data} lang={lang} />

      {/* new upload zone */}
      <div style={{ marginBottom: 20 }}>
        {!uploadedUrls
          ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E3DACB', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 20 }}>📂</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#211E1A' }}>
                  {lang === 'th' ? 'วิเคราะห์ listing ชุดใหม่' : 'Analyse a new batch'}
                </div>
                <div style={{ fontSize: 12.5, color: '#8B8475' }}>
                  {lang === 'th' ? 'อัปโหลด CSV ใหม่เพื่อรันรอบถัดไป' : 'Upload a new CSV to start the next run'}
                </div>
              </div>
              <label style={{
                all: 'unset', cursor: 'pointer', padding: '8px 18px', borderRadius: 999,
                background: '#0E9E78', color: '#fff', fontSize: 13, fontWeight: 600,
              }}>
                {lang === 'th' ? '+ อัปโหลด CSV' : '+ Upload CSV'}
                <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                  onChange={e => handleUrls(parseCSV(Array.from(e.target.files).map(f => {
                    const r = new FileReader();
                    r.readAsText(f, 'utf-8');
                    return '';
                  }).join('')), e.target.files[0]?.name || '')}
                />
              </label>
            </div>
          ) : (
            <URLPreview urls={uploadedUrls} filename={uploadedFilename} lang={lang} onClear={() => setUploadedUrls(null)} />
          )
        }
      </div>

      {/* systemic issues */}
      {meta.systemic_issues && meta.systemic_issues.length > 0 && (
        <div style={{ background: '#FBF3DC', border: '1px solid #F0D97A', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C99528', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            {lang === 'th' ? 'ปัญหาระดับระบบ' : 'Systemic Issues'}
          </div>
          {meta.systemic_issues.map((issue, i) => (
            <div key={i} style={{ fontSize: 13, color: '#6B655C', marginBottom: 4, paddingLeft: 14, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#C99528' }}>!</span>{issue}
            </div>
          ))}
        </div>
      )}

      {/* filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            all: 'unset', cursor: 'pointer', padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: filter === f.id ? (f.color || '#211E1A') : '#ECE5D8',
            color: filter === f.id ? '#fff' : '#6B655C', transition: 'background .15s',
          }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* listing cards */}
      {filtered.map(listing => (
        <ListingCard
          key={listing.listing_id}
          listing={listing}
          lang={lang}
          expanded={!!expanded[listing.listing_id]}
          onToggle={() => toggle(listing.listing_id)}
        />
      ))}

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#8B8475' }}>
          {lang === 'th' ? 'ไม่มีประกาศในหมวดนี้' : 'No listings in this category'}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ResultsView });
