// app/collab.jsx — realtime Agent Collaboration graph (dark canvas).

const COLLAB_T = {
  title: { en: "Agent Collaboration", th: "การทำงานร่วมกัน" },
  sub:   { en: "Who hands off to whom across the content pipeline — live.", th: "ใครส่งงานต่อให้ใครในไปป์ไลน์คอนเทนต์ — แบบเรียลไทม์" },
  hub:        { en: "Orchestrator", th: "ผู้ควบคุมวง" },
  pickHint:   { en: "Hover or tap an agent to trace its live handoffs.", th: "ชี้หรือแตะที่เอเจนต์ เพื่อดูการส่งต่องานสด" },
  collabNow:  { en: "Collaborating now", th: "กำลังทำงานร่วมกับ" },
  noCollab:   { en: "No active handoffs right now", th: "ยังไม่มีการส่งต่องานตอนนี้" },
  flows:      { en: "active handoffs", th: "การส่งต่อกำลังทำงาน" },
  legend:     { en: "Flowing line = a live handoff", th: "เส้นไหล = การส่งต่องานสด" },
  open:       { en: "Open profile →", th: "ดูโปรไฟล์ →" },
  mNet:       { en: "Network", th: "เครือข่าย" },
  mFloor:     { en: "Floor plan", th: "ผังพื้น" },
};

const W_GRAPH = 1040, H_GRAPH = 680;

function CollabNode({ agent, p, live, lang, big, dim, highlight, onEnter, onLeave, onClick }) {
  const s = STATUS[live.status];
  const r = big ? 34 : 27;
  const ringColor = agent.lead ? "#A98BDD" : s.color;
  return (
    <g transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer", opacity: dim ? 0.32 : 1, transition: "opacity .25s" }}
       onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}>
      {live.status === "active" && <circle r={r + 7} fill="none" stroke={ringColor} strokeWidth="1.4" className="agp-glow" />}
      {highlight && <circle r={r + 11} fill="none" stroke={ringColor} strokeWidth="1.4" opacity="0.7" />}
      <circle r={r} fill="#2A2722" stroke={ringColor} strokeWidth={big ? 3.2 : 2.6} />
      <text textAnchor="middle" dy="0.34em" fontSize={big ? 16 : 13.5} fontWeight="700" fill="#F4EFE6"
            style={{ fontFamily: "'Inter',sans-serif", letterSpacing: ".02em" }}>{agentInitials(agent)}</text>
      <text textAnchor="middle" y={r + 17} fontSize="11" fill={highlight ? "#EFE9DF" : "#8E8675"}
            style={{ fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>
        {agentShort(agent, lang)}
      </text>
      {big && (
        <text textAnchor="middle" y={-r - 12} fontSize="9.5" fill="#A98BDD"
              style={{ fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".14em" }}>
          {L(COLLAB_T.hub, lang).toUpperCase()}
        </text>
      )}
    </g>
  );
}

function CollaborationView({ sim, lang, onAgent }) {
  const [hoverId, setHoverId] = React.useState(null);
  const [selId, setSelId] = React.useState(null);
  const [mode, setMode] = React.useState("network");
  const focus = hoverId || selId;
  const { pos, cx, cy } = radialLayout(W_GRAPH, H_GRAPH);
  const links = computeLinks(sim.agents);
  const activeCount = links.handoffs.filter(h => h.active).length;

  const connected = React.useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    HANDOFFS.forEach(([a, b]) => { if (a === focus) set.add(b); if (b === focus) set.add(a); });
    return set;
  }, [focus]);

  const focusAgent = focus ? TEAM_BY_ID[focus] : null;
  const collabIds = focus ? collaboratorsOf(focus, sim.agents) : [];

  const modeToggle = (
    <div className="agp-modeseg">
      <button className={mode === "network" ? "on" : ""} onClick={() => setMode("network")}>{L(COLLAB_T.mNet, lang)}</button>
      <button className={mode === "floor" ? "on" : ""} onClick={() => setMode("floor")}>{L(COLLAB_T.mFloor, lang)}</button>
    </div>
  );

  return (
    <div>
      <PageHead title={L(COLLAB_T.title, lang)} sub={L(COLLAB_T.sub, lang)}
        right={<div style={{ display: "flex", gap: 10, alignItems: "center" }}>{modeToggle}<LiveBadge lang={lang} paused={sim.paused} onToggle={() => sim.setPaused(!sim.paused)} /></div>} />

      {mode === "floor" ? (
        <OfficeFloor sim={sim} lang={lang} onAgent={onAgent} />
      ) : (
      <div className="agp-collab-wrap">
        <div className="agp-canvas-dark" style={{ flex: 1, minWidth: 0 }}>
          <svg viewBox={`0 0 ${W_GRAPH} ${H_GRAPH}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <radialGradient id="agp-cglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0E9E78" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#0E9E78" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={cx} cy={cy} rx={W_GRAPH * 0.34} ry={H_GRAPH * 0.34} fill="url(#agp-cglow)" />

            {/* orchestration spokes */}
            {links.spokes.map(sp => {
              const p = pos[sp.id];
              const lit = sp.active && (!focus || connected.has(sp.id));
              return <line key={"sp" + sp.id} x1={cx} y1={cy} x2={p.x} y2={p.y}
                stroke={lit ? "#7C6FB8" : "#3A352E"} strokeWidth={lit ? 1.3 : 1} strokeDasharray="2 6"
                opacity={focus && !connected.has(sp.id) ? 0.12 : (lit ? 0.5 : 0.22)} />;
            })}

            {/* handoff edges */}
            {links.handoffs.map((h, i) => {
              const p1 = pos[h.from], p2 = pos[h.to];
              const inFocus = !focus || (connected.has(h.from) && connected.has(h.to) && (h.from === focus || h.to === focus));
              const dimmed = focus && !inFocus;
              const d = edgePath(p1, p2, cx, cy);
              const base = (
                <path key={"b" + i} d={d} fill="none" stroke="#4A4438"
                  strokeWidth="1.4" opacity={dimmed ? 0.08 : 0.42} />
              );
              if (!h.active) return base;
              return (
                <React.Fragment key={"e" + i}>
                  {base}
                  <path d={d} fill="none" stroke="#2FC397" strokeWidth={h.flowing ? 2.4 : 1.8}
                    className={h.flowing ? "agp-edge-flow" : ""} strokeLinecap="round"
                    opacity={dimmed ? 0.14 : (h.flowing ? 0.95 : 0.55)} />
                </React.Fragment>
              );
            })}

            {/* nodes */}
            {[["cco", true], ...ORBIT.map(id => [id, false])].map(([id, big]) => (
              <CollabNode key={id} agent={TEAM_BY_ID[id]} p={pos[id]} live={sim.agents[id]} lang={lang} big={big}
                dim={focus && !connected.has(id)} highlight={focus === id}
                onEnter={() => setHoverId(id)} onLeave={() => setHoverId(null)}
                onClick={() => setSelId(selId === id ? null : id)} />
            ))}
          </svg>
          <div className="agp-canvas-foot">
            <span className="agp-legend-item"><span className="agp-legend-line"></span>{L(COLLAB_T.legend, lang)}</span>
            <span style={{ color: "#2FC397", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>{activeCount} {L(COLLAB_T.flows, lang)}</span>
          </div>
        </div>

        {/* side panel */}
        <aside className="agp-collab-side">
          {focusAgent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: "#2A2722", border: `2.5px solid ${focusAgent.lead ? "#A98BDD" : STATUS[sim.agents[focus].status].color}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#F4EFE6", fontWeight: 700, fontFamily: "'Inter',sans-serif", flex: "0 0 auto" }}>{agentInitials(focusAgent)}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F4EFE6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{L(focusAgent.name, lang)}</div>
                  <div style={{ fontSize: 12, color: "#9FE9CF", fontWeight: 600 }}>{L(focusAgent.role, lang)}</div>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,.25)", borderRadius: 11, padding: "11px 13px", fontFamily: "'IBM Plex Mono',monospace" }}>
                <div style={{ fontSize: 9, letterSpacing: ".1em", color: "#8E8675", marginBottom: 5 }}>{L(T.now, lang).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "#EFE9DF", lineHeight: 1.4 }}>
                  {sim.agents[focus].status === "idle" ? (lang === "th" ? "ว่าง" : "Idle") : L(sim.agents[focus].task, lang)}
                </div>
              </div>
              <div>
                <div className="agp-side-label">{L(COLLAB_T.collabNow, lang)}</div>
                {collabIds.length === 0
                  ? <p style={{ fontSize: 12, color: "#8E8675", margin: 0 }}>{L(COLLAB_T.noCollab, lang)}</p>
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {collabIds.map(id => {
                        const c = TEAM_BY_ID[id];
                        return (
                          <button key={id} onClick={() => { setSelId(id); }} className="agp-collab-chip">
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[sim.agents[id].status].color, flex: "0 0 auto" }} />
                            <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{L(c.name, lang)}</span>
                            <span style={{ fontSize: 10, color: "#8E8675", fontFamily: "'IBM Plex Mono',monospace" }}>{c.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
              <button onClick={() => onAgent(focus)} className="agp-side-open">{L(COLLAB_T.open, lang)}</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: "#B9B1A1", lineHeight: 1.55, margin: 0 }}>{L(COLLAB_T.pickHint, lang)}</p>
              <div className="agp-side-label">{L(T.sec_team, lang)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {["active", "thinking", "idle", "error"].map(st => (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#CFC7B7" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS[st].color, flex: "0 0 auto" }} />
                    <span style={{ flex: 1 }}>{L(STATUS[st], lang)}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#8E8675" }}>{sim.counts[st]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      )}
    </div>
  );
}

Object.assign(window, { CollaborationView });
