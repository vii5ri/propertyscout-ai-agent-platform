// agent-cards.jsx — Agent "employee card" style explorations for PropertyScout
// AI Agent Orchestration Platform. Warm + human, bilingual TH/EN.
// Exports card variants + shared bits to window.

// ---------- Shared bilingual helpers ----------
const UI = {
  skills:   { en: "Skills",          th: "ทักษะ" },
  process:  { en: "Workflow",        th: "ขั้นตอนงาน" },
  tools:    { en: "Tools",           th: "เครื่องมือ" },
  now:      { en: "Working on",      th: "กำลังทำ" },
  status:   { en: "Status",          th: "สถานะ" },
  dept:     { en: "Team",            th: "ทีม" },
  traits:   { en: "Personality",     th: "บุคลิก" },
  level:    { en: "Lv", th: "เลเวล" },
  tasksDone:{ en: "tasks done",      th: "งานเสร็จ" },
  accuracy: { en: "accuracy",        th: "ความแม่นยำ" },
  viewProfile:{ en: "Open profile",  th: "ดูโปรไฟล์" },
};

const STATUS = {
  active:   { en: "Active",   th: "กำลังทำงาน", color: "#0E9E78", soft: "#E4F4EE" },
  thinking: { en: "Thinking", th: "กำลังคิด",   color: "#4F63D2", soft: "#E9ECFA" },
  idle:     { en: "Idle",     th: "ว่าง",       color: "#C99528", soft: "#FAF1DC" },
  error:    { en: "Error",    th: "ติดปัญหา",   color: "#D45B3C", soft: "#FBE8E2" },
};

function L(obj, lang) { return obj ? (obj[lang] ?? obj.en) : ""; }

// ---------- Photo placeholder ----------
function PhotoSlot({ w, h, round, lang, caption }) {
  const cap = caption || { en: "EMPLOYEE PHOTO", th: "รูปพนักงาน" };
  return (
    <div style={{
      width: w, height: h, borderRadius: round, flex: "0 0 auto",
      backgroundColor: "#EFE9DF",
      backgroundImage: "repeating-linear-gradient(135deg, #E7DFD1 0 7px, #EFE9DF 7px 14px)",
      border: "1px solid #E2D9CB",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: ".06em",
        color: "#A99E89", textAlign: "center", lineHeight: 1.4, padding: 4,
        background: "rgba(247,244,239,.78)", borderRadius: 4,
      }}>{L(cap, lang)}</span>
    </div>
  );
}

function StatusDot({ status, size = 8, pulse = true }) {
  const c = STATUS[status].color;
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: c,
        animation: pulse && status === "active" ? "agp-ping 1.8s cubic-bezier(0,0,.2,1) infinite" : "none",
        opacity: .55,
      }} />
      <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: c, boxShadow: `0 0 0 2px ${STATUS[status].soft}` }} />
    </span>
  );
}

function StatusPill({ status, lang }) {
  const s = STATUS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.soft, color: s.color, borderRadius: 999,
      padding: "3px 9px 3px 7px", fontSize: 11, fontWeight: 600,
      fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
    }}>
      <StatusDot status={status} size={7} />
      {L(s, lang)}
    </span>
  );
}

function SkillBar({ name, level, lang, color = "#0E9E78" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "baseline", gap: 8, fontSize: 11.5, color: "#4A453D" }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{L(name, lang)}</span>
        <span style={{ flex: "0 0 auto", fontFamily: "'IBM Plex Mono',monospace", color: "#A89E8C" }}>{level}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#EDE7DC", overflow: "hidden" }}>
        <div style={{ width: `${level}%`, height: "100%", borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

function Chip({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#F1ECE3", fg: "#5E584E" },
    brand:   { bg: "#E4F4EE", fg: "#0A6B52" },
    coral:   { bg: "#FBE8E2", fg: "#B14A2E" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      background: t.bg, color: t.fg, borderRadius: 6, padding: "4px 9px",
      fontSize: 11, fontWeight: 500, fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// process pipeline (small dots + labels)
function Pipeline({ steps, lang, active = -1, color = "#0E9E78" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
            <span style={{
              width: 14, height: 14, borderRadius: "50%", flex: "0 0 auto", marginTop: 1,
              background: i <= active ? color : "#fff",
              border: `2px solid ${i <= active ? color : "#D8CFBF"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i === active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
            </span>
            {i < steps.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 14, background: i < active ? color : "#E7DFD1" }} />}
          </div>
          <span style={{ fontSize: 11.5, color: i === active ? "#211E1A" : "#6B655C", fontWeight: i === active ? 600 : 400, paddingBottom: 12, lineHeight: 1.35 }}>
            {L(s, lang)}
          </span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { UI, STATUS, L, PhotoSlot, StatusDot, StatusPill, SkillBar, Chip, Pipeline });
