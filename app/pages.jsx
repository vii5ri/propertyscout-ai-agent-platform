// app/pages.jsx — Mission Log, Skills, Memory Graph, Settings.

// ============ small shared ============
function MiniAvatar({ agent, status, size = 30 }) {
  const c = STATUS[status].color;
  return (
    <span style={{ position: "relative", width: size, height: size, borderRadius: 9, background: "#F1ECE3", border: `2px solid ${c}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", fontSize: size * 0.36, fontWeight: 700, color: "#5E584E", fontFamily: "'Inter',sans-serif" }}>
      {agentInitials(agent)}
    </span>
  );
}

// ============ MISSION LOG ============
const LOG_T = {
  title: { en: "Mission Log", th: "บันทึกภารกิจ" },
  sub:   { en: "Every move the team makes, as it happens.", th: "ทุกความเคลื่อนไหวของทีม แบบเรียลไทม์" },
  liveMissions: { en: "Live missions", th: "ภารกิจที่กำลังทำ" },
  stream: { en: "Activity stream", th: "สตรีมกิจกรรม" },
  none: { en: "No missions running", th: "ไม่มีภารกิจที่กำลังทำ" },
};

function MissionLog({ sim, lang, onAgent }) {
  const liveAgents = TEAM.filter(a => sim.agents[a.id].status === "active");
  return (
    <div>
      <PageHead title={L(LOG_T.title, lang)} sub={L(LOG_T.sub, lang)}
        right={<LiveBadge lang={lang} paused={sim.paused} onToggle={() => sim.setPaused(!sim.paused)} />} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        <KpiTile label={L(T.k_active, lang)} value={sim.counts.active} status="active" />
        <KpiTile label={L(LOG_T.liveMissions, lang)} value={liveAgents.length} accent="#9A6CD0" />
        <KpiTile label={lang === "th" ? "เผยแพร่วันนี้" : "Published today"} value={sim.published} status="active" />
        <KpiTile label={L(T.k_queue, lang)} value={sim.queueLen} accent="#2C8FB0" />
      </div>

      <div className="agp-two" style={{ gridTemplateColumns: "0.9fr 1.1fr", alignItems: "start" }}>
        <SectionCard title={L(LOG_T.liveMissions, lang)} pad={14}
          action={<LiveDot paused={sim.paused} />}>
          {liveAgents.length === 0
            ? <p style={{ fontSize: 12.5, color: "#A89E8C", textAlign: "center", padding: "16px 0" }}>{L(LOG_T.none, lang)}</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {liveAgents.map(a => {
                  const live = sim.agents[a.id];
                  return (
                    <button key={a.id} onClick={() => onAgent(a.id)} style={{ all: "unset", cursor: "pointer", display: "flex", gap: 11, alignItems: "center" }}>
                      <MiniAvatar agent={a} status={live.status} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#211E1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{L(live.task, lang)}</div>
                        <div style={{ fontSize: 11, color: "#8B8475" }}>{L(a.name, lang)}</div>
                        <div style={{ marginTop: 5, height: 4, borderRadius: 2, background: "#ECE6DB", overflow: "hidden" }}>
                          <div style={{ width: live.progress + "%", height: "100%", background: STATUS.active.color, transition: "width .9s linear" }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#0A6B52", flex: "0 0 auto" }}>{live.progress}%</span>
                    </button>
                  );
                })}
              </div>
            )}
        </SectionCard>

        <SectionCard title={L(LOG_T.stream, lang)} pad={14}
          action={<span style={{ fontSize: 11.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace" }}>{sim.feed.length}</span>}>
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {sim.feed.map(f => {
              const a = TEAM_BY_ID[f.agentId];
              const dot = f.verb.tone === "good" ? "#0E9E78" : f.verb.tone === "warn" ? "#D45B3C" : "#8B8475";
              return (
                <div key={f.id} style={{ display: "flex", gap: 11, padding: "9px 0", borderBottom: "1px solid #F4EFE7", alignItems: "center" }}>
                  <MiniAvatar agent={a} status={sim.agents[f.agentId].status} size={30} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4 }}>
                    <button onClick={() => onAgent(f.agentId)} style={{ all: "unset", cursor: "pointer", fontWeight: 700, color: "#211E1A" }}>{L(a.name, lang)}</button>
                    <span style={{ color: "#6B655C" }}> {L(f.verb, lang)} </span>
                    <span style={{ color: "#0A6B52", fontWeight: 600 }}>{L(f.obj, lang)}</span>
                  </div>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flex: "0 0 auto" }} />
                  <span style={{ fontSize: 10.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace", flex: "0 0 auto", width: 42, textAlign: "right" }}>{relTime(f.ageMs, lang)}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ============ SKILLS ============
const SKILL_T = {
  title: { en: "Skills", th: "ทักษะรวม" },
  sub:   { en: "What each specialist is good at, and how good.", th: "แต่ละคนเก่งเรื่องอะไร และเก่งแค่ไหน" },
};

function SkillsView({ lang, onAgent }) {
  const byDept = {};
  TEAM.forEach(a => { (byDept[a.dept] = byDept[a.dept] || []).push(a); });
  return (
    <div>
      <PageHead title={L(SKILL_T.title, lang)} sub={L(SKILL_T.sub, lang)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {Object.keys(DEPTS).filter(d => byDept[d]).map(dept => (
          <div key={dept}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: DEPTS[dept].color }} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#211E1A", letterSpacing: ".02em" }}>{L(DEPTS[dept], lang)}</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
              {byDept[dept].map(a => (
                <button key={a.id} onClick={() => onAgent(a.id)} style={{ all: "unset", cursor: "pointer", background: "#fff", border: "1px solid #E7E1D8", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
                  <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                    <MiniAvatar agent={a} status="active" size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#211E1A" }}>{L(a.name, lang)}</div>
                      <div style={{ fontSize: 11.5, color: "#0A6B52", fontWeight: 600 }}>{L(a.role, lang)}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 9 }}>
                    {a.skills.map((sk, i) => <SkillBar key={i} {...sk} lang={lang} />)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MEMORY GRAPH ============
const MEM_T = {
  title: { en: "Memory Graph", th: "กราฟความจำ" },
  sub:   { en: "Everything the team remembers, sorted by how it's used.", th: "ทุกสิ่งที่ทีมจดจำ จัดตามวิธีนำไปใช้" },
};

function MemoryGraph({ lang, onAgent }) {
  const cols = ["fact", "pattern", "pref", "context"];
  const items = {};
  cols.forEach(c => { items[c] = []; });
  TEAM.forEach(a => a.memory.forEach(m => { items[m.type].push({ ...m, agent: a }); }));
  return (
    <div>
      <PageHead title={L(MEM_T.title, lang)} sub={L(MEM_T.sub, lang)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, alignItems: "start" }}>
        {cols.map(c => {
          const t = MEMTYPE[c];
          return (
            <div key={c} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
                <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#211E1A" }}>{L(t.label, lang)}</h3>
                <span style={{ fontSize: 11, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace" }}>{items[c].length}</span>
              </div>
              {items[c].map((m, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #E7E1D8", borderLeft: `3px solid ${t.color}`, borderRadius: 11, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 9 }}>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#3A352E", lineHeight: 1.5 }}>{L(m.text, lang)}</p>
                  <button onClick={() => onAgent(m.agent.id)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: DEPTS[m.agent.dept].color }} />
                    <span style={{ fontSize: 10.5, color: "#8B8475", fontWeight: 600 }}>{L(m.agent.name, lang)}</span>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ SETTINGS ============
const SET_T = {
  title: { en: "Settings", th: "ตั้งค่า" },
  sub:   { en: "Language and live simulation controls.", th: "ภาษาและการควบคุมการจำลองสด" },
  language: { en: "Language", th: "ภาษา" },
  langHint: { en: "Applies across the whole platform.", th: "มีผลทั้งระบบ" },
  playback: { en: "Live simulation", th: "การจำลองสด" },
  playHint: { en: "Pause the feed, or change how fast time moves.", th: "หยุดฟีด หรือปรับความเร็วของเวลา" },
  state:   { en: "State", th: "สถานะ" },
  speed:   { en: "Speed", th: "ความเร็ว" },
  pause:   { en: "Pause", th: "หยุด" },
  resume:  { en: "Resume", th: "เล่นต่อ" },
  slow:    { en: "Slow", th: "ช้า" },
  normal:  { en: "Normal", th: "ปกติ" },
  fast:    { en: "Fast", th: "เร็ว" },
  about:   { en: "About", th: "เกี่ยวกับ" },
  aboutTxt:{ en: "Mock environment with 12 simulated agents. Photos are placeholders — drop in real ones when ready.", th: "สภาพแวดล้อมจำลองพร้อมเอเจนต์ 12 ตัว · รูปเป็นช่องว่างไว้ก่อน ใส่รูปจริงได้เลยเมื่อพร้อม" },
};

function Seg({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "#ECE5D8", borderRadius: 999, padding: 3, gap: 2 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          border: 0, cursor: "pointer", padding: "8px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
          background: value === o.key ? "#fff" : "transparent", color: value === o.key ? "#211E1A" : "#8B8475",
          boxShadow: value === o.key ? "0 2px 6px -2px rgba(40,30,15,.25)" : "none",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function SettingsRow({ title, hint, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 14, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#211E1A" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#8B8475", marginTop: 3 }}>{hint}</div>
      </div>
      <div style={{ flex: "0 0 auto" }}>{children}</div>
    </div>
  );
}

function Settings({ sim, lang, setLang }) {
  return (
    <div>
      <PageHead title={L(SET_T.title, lang)} sub={L(SET_T.sub, lang)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
        <SettingsRow title={L(SET_T.language, lang)} hint={L(SET_T.langHint, lang)}>
          <Seg options={[{ key: "th", label: "ไทย" }, { key: "en", label: "EN" }]} value={lang} onChange={setLang} />
        </SettingsRow>
        <SettingsRow title={L(SET_T.playback, lang) + " · " + L(SET_T.state, lang)} hint={L(SET_T.playHint, lang)}>
          <button onClick={() => sim.setPaused(!sim.paused)} style={{
            border: `1px solid ${sim.paused ? "#0E9E78" : "#E2D9CB"}`, background: sim.paused ? "#0E9E78" : "#fff",
            color: sim.paused ? "#fff" : "#6B655C", borderRadius: 999, padding: "9px 18px", cursor: "pointer",
            fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif", minWidth: 92,
          }}>{sim.paused ? L(SET_T.resume, lang) : L(SET_T.pause, lang)}</button>
        </SettingsRow>
        <SettingsRow title={L(SET_T.playback, lang) + " · " + L(SET_T.speed, lang)} hint=" ">
          <Seg options={[{ key: 0.5, label: L(SET_T.slow, lang) }, { key: 1, label: L(SET_T.normal, lang) }, { key: 2, label: L(SET_T.fast, lang) }]} value={sim.speed} onChange={sim.setSpeed} />
        </SettingsRow>
        <div style={{ background: "#F8F4ED", border: "1px solid #ECE6DB", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#211E1A", marginBottom: 5 }}>{L(SET_T.about, lang)}</div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#6B655C", lineHeight: 1.55 }}>{L(SET_T.aboutTxt, lang)}</p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MissionLog, SkillsView, MemoryGraph, Settings });
