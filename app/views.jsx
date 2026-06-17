// app/views.jsx — Dashboard + Roster views.

function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#211E1A", letterSpacing: "-.01em", lineHeight: 1.25 }}>{title}</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#6B655C" }}>{sub}</p>
      </div>
      {right}
    </div>
  );
}

function LiveBadge({ lang, paused, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 8, background: paused ? "#F1ECE3" : "#E4F4EE",
      border: `1px solid ${paused ? "#E2D9CB" : "#BfE6D7"}`, borderRadius: 999, padding: "7px 14px",
      cursor: "pointer", fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
    }}>
      <span style={{ position: "relative", width: 8, height: 8 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: paused ? "#A89E8C" : "#0E9E78", animation: paused ? "none" : "agp-ping 1.8s infinite", opacity: .6 }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: paused ? "#A89E8C" : "#0E9E78" }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", color: paused ? "#6B655C" : "#0A6B52" }}>
        {paused ? (lang === "th" ? "หยุดชั่วคราว" : "Paused") : L(T.live, lang)}
      </span>
    </button>
  );
}

function TeamStatusRow({ agent, live, lang, onClick }) {
  const st = live.status;
  const s = STATUS[st];
  return (
    <button onClick={onClick} className="agp-row" style={{
      all: "unset", boxSizing: "border-box", cursor: "pointer", width: "100%",
      display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderRadius: 12,
    }}>
      <AgentAvatar size={38} status={st} lang={lang} round={11} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#211E1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{L(agent.name, lang)}</div>
        <div style={{ fontSize: 11, color: "#8B8475", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {st === "idle" ? (lang === "th" ? "ว่าง" : "Idle") : L(live.task, lang)}
        </div>
        {st === "active" && (
          <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: "#ECE6DB", overflow: "hidden" }}>
            <div style={{ width: `${live.progress}%`, height: "100%", background: s.color, borderRadius: 2, transition: "width .9s linear" }} />
          </div>
        )}
      </div>
      <StatusPill status={st} lang={lang} />
    </button>
  );
}

function PipelineStrip({ pipe, agents, lang }) {
  return (
    <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
      {PIPELINE.map((stage, i) => {
        const count = pipe[stage.id];
        const liveActive = stage.agents.some(id => agents[id] && agents[id].status === "active");
        return (
          <React.Fragment key={stage.id}>
            <div style={{ flex: "1 0 96px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 96 }}>
              <div style={{
                width: "100%", background: liveActive ? "#E4F4EE" : "#F8F4ED", border: `1px solid ${liveActive ? "#BfE6D7" : "#ECE6DB"}`,
                borderRadius: 12, padding: "10px 8px", textAlign: "center", transition: "background .4s",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3A352E" }}>{L(stage.label, lang)}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: liveActive ? "#0A6B52" : "#211E1A", lineHeight: 1.2 }}>{count}</div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {stage.agents.map(id => {
                  const stt = agents[id] ? agents[id].status : "idle";
                  return <span key={id} title={L(TEAM_BY_ID[id].name, lang)} style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS[stt].color }} />;
                })}
              </div>
            </div>
            {i < PIPELINE.length - 1 && (
              <div style={{ flex: "0 0 16px", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 26 }}>
                <span style={{ color: "#CBC1B0", fontSize: 14 }}>→</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Dashboard({ sim, lang, onAgent }) {
  return (
    <div>
      <PageHead title={L(T.d_title, lang)} sub={L(T.d_sub, lang)}
        right={<LiveBadge lang={lang} paused={sim.paused} onToggle={() => sim.setPaused(!sim.paused)} />} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        <KpiTile label={L(T.k_active, lang)} value={sim.counts.active} status="active" />
        <KpiTile label={L(T.k_thinking, lang)} value={sim.counts.thinking} status="thinking" />
        <KpiTile label={L(T.k_idle, lang)} value={sim.counts.idle} status="idle" />
        <KpiTile label={L(T.k_error, lang)} value={sim.counts.error} status="error" />
        <KpiTile label={L(T.k_throughput, lang)} value={sim.throughput} accent="#9A6CD0" />
        <KpiTile label={L(T.k_queue, lang)} value={sim.queueLen} accent="#2C8FB0" />
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 16 }}>
        <SectionCard title={L(T.sec_pipe, lang)} pad={18}
          action={<span style={{ fontSize: 11.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace" }}>{sim.published} {lang === "th" ? "เผยแพร่วันนี้" : "published today"}</span>}>
          <PipelineStrip pipe={sim.pipe} agents={sim.agents} lang={lang} />
        </SectionCard>
      </div>

      {/* Team status + feed/queue */}
      <div className="agp-dash-grid">
        <SectionCard title={L(T.sec_team, lang)} pad={10}
          action={<span style={{ fontSize: 11.5, color: "#A89E8C" }}>{TEAM.length} {lang === "th" ? "ตัว" : "agents"}</span>}>
          <div>
            {TEAM.map(a => (
              <TeamStatusRow key={a.id} agent={a} live={sim.agents[a.id]} lang={lang} onClick={() => onAgent(a.id)} />
            ))}
          </div>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <SectionCard title={L(T.sec_feed, lang)} pad={16}
            action={<LiveDot paused={sim.paused} />}>
            <div style={{ maxHeight: 320, overflowY: "auto", margin: "-4px 0" }}>
              {sim.feed.map(f => <FeedRow key={f.id} item={f} lang={lang} onAgent={onAgent} />)}
            </div>
          </SectionCard>

          <SectionCard title={L(T.sec_queue, lang)} pad={16}
            action={<span style={{ fontSize: 11.5, color: "#A89E8C", fontFamily: "'IBM Plex Mono',monospace" }}>{sim.queueLen} {L(T.waiting, lang)}</span>}>
            <div style={{ margin: "-4px 0" }}>
              {sim.queue.length === 0
                ? <p style={{ fontSize: 12.5, color: "#A89E8C", textAlign: "center", padding: "12px 0" }}>{L(T.empty, lang)}</p>
                : sim.queue.map(q => <QueueRow key={q.id} item={q} lang={lang} />)}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function LiveDot({ paused }) {
  return (
    <span style={{ position: "relative", width: 8, height: 8, display: "inline-block" }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#0E9E78", animation: paused ? "none" : "agp-ping 1.8s infinite", opacity: .6 }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: paused ? "#A89E8C" : "#0E9E78" }} />
    </span>
  );
}

function Roster({ sim, lang, onAgent }) {
  const [filter, setFilter] = React.useState("all");
  const depts = ["all", ...Object.keys(DEPTS)];
  const shown = filter === "all" ? TEAM : TEAM.filter(a => a.dept === filter);
  return (
    <div>
      <PageHead title={L(T.r_title, lang)} sub={L(T.r_sub, lang)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {depts.map(d => {
          const on = filter === d;
          const label = d === "all" ? L(T.filterAll, lang) : L(DEPTS[d], lang);
          return (
            <button key={d} onClick={() => setFilter(d)} style={{
              border: `1px solid ${on ? "#0E9E78" : "#E2D9CB"}`, background: on ? "#0E9E78" : "#fff",
              color: on ? "#fff" : "#6B655C", borderRadius: 999, padding: "7px 15px", cursor: "pointer",
              fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans Thai','Inter',sans-serif",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {d !== "all" && <span style={{ width: 8, height: 8, borderRadius: 2, background: on ? "#fff" : DEPTS[d].color }} />}
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {shown.map(a => (
          <AgentCard key={a.id} agent={a} live={sim.agents[a.id]} lang={lang} onClick={() => onAgent(a.id)} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PageHead, LiveBadge, TeamStatusRow, PipelineStrip, Dashboard, LiveDot, Roster });
