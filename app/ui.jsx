// app/ui.jsx — shared building blocks for the platform.
// Reuses PhotoSlot, StatusDot, StatusPill, SkillBar, Chip, L, STATUS (agent-cards.jsx)
// and T, MEMTYPE, DEPTS (app/data.jsx).

function AgentAvatar({ size = 56, status, lang, round = 16 }) {
  const c = STATUS[status].color;
  return (
    <div style={{ position: "relative", flex: "0 0 auto", width: size, height: size }}>
      <div style={{ position: "absolute", inset: -4, borderRadius: round + 4, border: `2px solid ${c}`, opacity: status === "active" ? .55 : .3 }} />
      <PhotoSlot w={size} h={size} round={round} lang={lang} caption={{ en: "PHOTO", th: "รูป" }} />
      <span style={{ position: "absolute", right: -2, bottom: -2, width: 14, height: 14, borderRadius: "50%", background: c, border: "2.5px solid #fff" }} />
    </div>
  );
}

function Barcode({ bars = 11, color = "#211E1A" }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} style={{ width: i % 3 === 0 ? 3 : 1.5, height: 16, background: i % 2 ? color : "#C9BFAD" }} />
      ))}
    </div>
  );
}

function DeptTag({ dept, lang }) {
  const d = DEPTS[dept];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B655C" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
      {L(d, lang)}
    </span>
  );
}

// E (Live Ops) primary + B (ID badge) accents
function AgentCard({ agent, live, lang, onClick }) {
  const st = live.status;
  const s = STATUS[st];
  const isActive = st === "active";
  const isError = st === "error";
  return (
    <button onClick={onClick} className="agp-card" style={{
      textAlign: "left", border: "1px solid #E7E1D8", background: "#fff", borderRadius: 18,
      padding: 0, cursor: "pointer", overflow: "hidden", fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
      boxShadow: "0 10px 26px -20px rgba(40,30,15,.5)", width: "100%",
    }}>
      {/* B: status colour bar */}
      <div style={{ height: 6, background: s.color }} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
          <AgentAvatar size={52} status={st} lang={lang} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "#211E1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{L(agent.name, lang)}</h3>
              {agent.lead && <span style={{ fontSize: 9, fontWeight: 700, color: "#9A6CD0", background: "#F1E9FA", borderRadius: 5, padding: "2px 6px", letterSpacing: ".04em" }}>LEAD</span>}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#0A6B52", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{L(agent.role, lang)}</p>
          </div>
          <StatusPill status={st} lang={lang} />
        </div>

        {/* E: live "now" panel */}
        <div style={{ background: "#211E1A", borderRadius: 12, padding: "11px 13px", color: "#EFE9DF", fontFamily: "'IBM Plex Mono',monospace" }}>
          <div style={{ fontSize: 9, letterSpacing: ".11em", color: "#8B8475", marginBottom: 5 }}>
            {(isError ? (lang === "th" ? "ต้องการความช่วยเหลือ" : "NEEDS ATTENTION") : L(T.now, lang)).toUpperCase()}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.4, display: "flex", gap: 7, alignItems: "flex-start", color: isError ? "#F0A48E" : "#EFE9DF" }}>
            <span style={{ color: s.color, flex: "0 0 auto" }}>{isActive ? "▸" : isError ? "✕" : "■"}</span>
            <span style={{ minWidth: 0 }}>{st === "idle" ? (lang === "th" ? "ว่าง · รองานถัดไป" : "Idle · awaiting next job") : L(live.task, lang)}</span>
          </div>
          {isActive && (
            <div style={{ marginTop: 9, height: 4, borderRadius: 2, background: "#3A352E", overflow: "hidden" }}>
              <div style={{ width: `${live.progress}%`, height: "100%", background: s.color, borderRadius: 2, transition: "width .9s linear" }} />
            </div>
          )}
        </div>

        {/* E: stats */}
        <div style={{ display: "flex", gap: 8 }}>
          <MiniStat label={L(T.tasksDone, lang)} value={agent.stats.done} />
          <MiniStat label={L(T.accuracy, lang)} value={agent.stats.acc} />
        </div>

        {/* B: footer — code + barcode */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #E2D9CB", paddingTop: 11 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 600, color: "#211E1A" }}>{agent.code}</span>
            <DeptTag dept={agent.dept} lang={lang} />
          </div>
          <Barcode />
        </div>
      </div>
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: "#F8F4ED", borderRadius: 10, padding: "8px 11px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#211E1A", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: "#8B8475", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function KpiTile({ label, value, status, accent }) {
  const color = status ? STATUS[status].color : (accent || "#211E1A");
  const soft = status ? STATUS[status].soft : "#F1ECE3";
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px ${soft}` }} />
        <span style={{ fontSize: 11.5, color: "#6B655C" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#211E1A", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FeedRow({ item, lang, onAgent }) {
  const a = TEAM_BY_ID[item.agentId];
  const tone = item.verb.tone;
  const dot = tone === "good" ? "#0E9E78" : tone === "warn" ? "#D45B3C" : "#8B8475";
  return (
    <div style={{ display: "flex", gap: 11, padding: "9px 2px", alignItems: "flex-start" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, marginTop: 6, flex: "0 0 auto" }} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#3A352E", lineHeight: 1.45 }}>
        <button onClick={() => onAgent && onAgent(item.agentId)} style={{ all: "unset", cursor: "pointer", fontWeight: 700, color: "#211E1A" }}>{L(a.name, lang)}</button>
        <span style={{ color: "#6B655C" }}> {L(item.verb, lang)} </span>
        <span style={{ color: "#0A6B52", fontWeight: 600 }}>{L(item.obj, lang)}</span>
      </div>
      <span style={{ fontSize: 10.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace", flex: "0 0 auto", marginTop: 2 }}>{relTime(item.ageMs, lang)}</span>
    </div>
  );
}

function QueueRow({ item, lang }) {
  const stage = PIPELINE.find(p => p.id === item.stageId);
  const a = TEAM_BY_ID[item.agentId];
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "center", padding: "9px 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#211E1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "#8B8475", display: "flex", gap: 6, alignItems: "center", marginTop: 1 }}>
          <span style={{ color: "#0A6B52" }}>{L(stage.label, lang)}</span>
          <span>·</span>
          <span>{L(a.name, lang)}</span>
        </div>
      </div>
      <span style={{ fontSize: 10.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace", flex: "0 0 auto" }}>~{item.eta}m</span>
    </div>
  );
}

function SectionCard({ title, action, children, pad = 18 }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `14px ${pad}px`, borderBottom: "1px solid #F0EAE0" }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#211E1A", letterSpacing: ".01em" }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}

Object.assign(window, { AgentAvatar, Barcode, DeptTag, AgentCard, MiniStat, KpiTile, FeedRow, QueueRow, SectionCard });
