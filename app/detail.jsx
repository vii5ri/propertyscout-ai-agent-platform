// app/detail.jsx — single agent profile with tabs.

const _LISTINGS = ["Noble Ploenchit", "Rhythm 36", "Ideo Q Chula-Samyan", "Life Asoke",
  "Ashton Chula-Silom", "Belle Grand Rama 9", "Ideo O2", "Park Origin Thonglor",
  "Noble Recole", "Chapter One Midtown"];

function MemoryCard({ mem, lang }) {
  const t = MEMTYPE[mem.type];
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 12, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ alignSelf: "flex-start", background: t.soft, color: t.color, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, letterSpacing: ".03em", fontFamily: "'IBM Plex Mono',monospace" }}>
        {L(t.label, lang).toUpperCase()}
      </span>
      <p style={{ margin: 0, fontSize: 13, color: "#3A352E", lineHeight: 1.5 }}>{L(mem.text, lang)}</p>
    </div>
  );
}

function DetailTabs({ tab, setTab, lang }) {
  const tabs = [
    ["overview", T.t_overview], ["skills", T.t_skills], ["memory", T.t_memory],
    ["process", T.t_process], ["history", T.t_history], ["tools", T.t_tools],
  ];
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E7E1D8", marginBottom: 22, overflowX: "auto" }}>
      {tabs.map(([id, label]) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            border: "none", background: "none", cursor: "pointer", padding: "11px 14px",
            fontSize: 13, fontWeight: on ? 700 : 500, color: on ? "#0A6B52" : "#8B8475",
            borderBottom: `2px solid ${on ? "#0E9E78" : "transparent"}`, marginBottom: -1,
            fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif", whiteSpace: "nowrap",
          }}>{L(label, lang)}</button>
        );
      })}
    </div>
  );
}

function HistoryRow({ verb, obj, ageMs, lang }) {
  const tone = verb.tone;
  const dot = tone === "good" ? "#0E9E78" : tone === "warn" ? "#D45B3C" : "#8B8475";
  return (
    <div style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid #F0EAE0", alignItems: "flex-start" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, marginTop: 6, flex: "0 0 auto" }} />
      <div style={{ flex: 1, fontSize: 13, color: "#3A352E", lineHeight: 1.45 }}>
        <span style={{ color: "#6B655C" }}>{L(verb, lang)} </span>
        <span style={{ color: "#0A6B52", fontWeight: 600 }}>{L(obj, lang)}</span>
      </div>
      <span style={{ fontSize: 11, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace", flex: "0 0 auto", marginTop: 1 }}>{relTime(ageMs, lang)}</span>
    </div>
  );
}

function AgentDetail({ agent, live, sim, lang, onBack, onAgent }) {
  const [tab, setTab] = React.useState("overview");
  React.useEffect(() => { setTab("overview"); }, [agent.id]);
  const st = live.status;
  const s = STATUS[st];
  const curStep = st === "active" ? Math.min(agent.process.length - 1, Math.floor(live.progress / 100 * agent.process.length)) : (st === "idle" ? -1 : 0);

  // build history: this agent's live feed + seeded past
  const liveHist = sim.feed.filter(f => f.agentId === agent.id).map(f => ({ verb: f.verb, obj: f.obj, ageMs: f.ageMs }));
  const seeded = [];
  let base = Math.max(120000, (liveHist.length ? liveHist[liveHist.length - 1].ageMs : 60000) + 90000);
  for (let i = 0; i < 6; i++) {
    seeded.push({ verb: VERB.complete, obj: { en: _LISTINGS[(i * 3) % _LISTINGS.length], th: _LISTINGS[(i * 3) % _LISTINGS.length] }, ageMs: base });
    base += 70000 + i * 40000;
  }
  const history = [...liveHist, ...seeded];

  const lead = agent.reportsTo ? TEAM_BY_ID[agent.reportsTo] : null;

  return (
    <div>
      <button onClick={onBack} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, color: "#6B655C", fontSize: 13, fontWeight: 600, marginBottom: 18, fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif" }}>
        <span style={{ fontSize: 15 }}>←</span> {L(T.back, lang)}
      </button>

      {/* header */}
      <div style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ height: 6, background: s.color }} />
        <div style={{ padding: 22, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <AgentAvatar size={84} status={st} lang={lang} round={20} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#211E1A", lineHeight: 1.2, whiteSpace: "nowrap" }}>{L(agent.name, lang)}</h1>
              {agent.lead && <span style={{ fontSize: 10, fontWeight: 700, color: "#9A6CD0", background: "#F1E9FA", borderRadius: 6, padding: "3px 8px" }}>LEAD</span>}
              <StatusPill status={st} lang={lang} />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 15, color: "#0A6B52", fontWeight: 600 }}>{L(agent.role, lang)}</p>
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#A89E8C" }}>{agent.code}</span>
              <DeptTag dept={agent.dept} lang={lang} />
              {lead && (
                <span style={{ fontSize: 12, color: "#6B655C" }}>{L(T.reportsTo, lang)}:{" "}
                  <button onClick={() => onAgent(lead.id)} style={{ all: "unset", cursor: "pointer", color: "#0A6B52", fontWeight: 600 }}>{L(lead.name, lang)}</button>
                </span>
              )}
              {agent.manages && <span style={{ fontSize: 12, color: "#6B655C" }}>{L(T.manages, lang)}: {agent.manages}</span>}
            </div>
          </div>
        </div>
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid #F0EAE0" }}>
          {[[T.tasksDone, agent.stats.done], [T.accuracy, agent.stats.acc], [T.avgTime, agent.stats.avg], [T.uptime, agent.stats.uptime]].map(([lab, val], i) => (
            <div key={i} style={{ padding: "14px 18px", borderLeft: i ? "1px solid #F0EAE0" : "none" }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: "#211E1A" }}>{val}</div>
              <div style={{ fontSize: 10.5, color: "#8B8475", textTransform: "uppercase", letterSpacing: ".04em", marginTop: 2 }}>{L(lab, lang)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* live now */}
      <div style={{ background: "#211E1A", borderRadius: 14, padding: "15px 18px", color: "#EFE9DF", fontFamily: "'IBM Plex Mono',monospace", marginBottom: 18 }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#8B8475", marginBottom: 6 }}>{(st === "error" ? (lang === "th" ? "ต้องการความช่วยเหลือ" : "NEEDS ATTENTION") : L(T.now, lang)).toUpperCase()}</div>
        <div style={{ fontSize: 14, display: "flex", gap: 9, alignItems: "center", color: st === "error" ? "#F0A48E" : "#EFE9DF" }}>
          <span style={{ color: s.color }}>{st === "active" ? "▸" : st === "error" ? "✕" : "■"}</span>
          {st === "idle" ? (lang === "th" ? "ว่าง · รองานถัดไป" : "Idle · awaiting next job") : L(live.task, lang)}
        </div>
        {st === "active" && (
          <div style={{ marginTop: 11, height: 5, borderRadius: 3, background: "#3A352E", overflow: "hidden" }}>
            <div style={{ width: `${live.progress}%`, height: "100%", background: s.color, transition: "width .9s linear" }} />
          </div>
        )}
      </div>

      <DetailTabs tab={tab} setTab={setTab} lang={lang} />

      {tab === "overview" && (
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 15, color: "#3A352E", lineHeight: 1.6, maxWidth: 640 }}>{L(agent.blurb, lang)}</p>
          <div>
            <SubLabel>{L(T.persona, lang)}</SubLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{agent.traits.map((t, i) => <Chip key={i} tone="brand">{L(t, lang)}</Chip>)}</div>
          </div>
          <div className="agp-two">
            <div>
              <SubLabel>{L(T.t_skills, lang)}</SubLabel>
              <div style={{ display: "grid", gap: 11 }}>{agent.skills.slice(0, 3).map((sk, i) => <SkillBar key={i} {...sk} lang={lang} />)}</div>
            </div>
            <div>
              <SubLabel>{L(T.recent, lang)}</SubLabel>
              <div>{history.slice(0, 4).map((h, i) => <HistoryRow key={i} {...h} lang={lang} />)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "skills" && (
        <div style={{ maxWidth: 560, display: "grid", gap: 16 }}>
          {agent.skills.map((sk, i) => <SkillBar key={i} {...sk} lang={lang} />)}
        </div>
      )}

      {tab === "memory" && (
        <div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8B8475" }}>{L(T.memHint, lang)}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {agent.memory.map((m, i) => <MemoryCard key={i} mem={m} lang={lang} />)}
          </div>
        </div>
      )}

      {tab === "process" && (
        <div style={{ maxWidth: 520 }}>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#8B8475" }}>{L(T.procHint, lang)}</p>
          <Pipeline steps={agent.process} lang={lang} active={curStep} />
        </div>
      )}

      {tab === "history" && (
        <div style={{ maxWidth: 620 }}>
          {history.map((h, i) => <HistoryRow key={i} {...h} lang={lang} />)}
        </div>
      )}

      {tab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {agent.tools.map((tool, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #E7E1D8", borderRadius: 12, padding: "13px 15px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: "#F1ECE3", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, border: "2px solid #0E9E78" }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#211E1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool}</div>
                <div style={{ fontSize: 10.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace" }}>{L(T.lastUsed, lang)} {(i * 7 + 3)}m</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubLabel({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".09em", color: "#A89E8C", textTransform: "uppercase", fontFamily: "'IBM Plex Mono',monospace", marginBottom: 11 }}>{children}</div>;
}

Object.assign(window, { MemoryCard, DetailTabs, HistoryRow, AgentDetail, SubLabel });
