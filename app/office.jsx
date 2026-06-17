// app/office.jsx — Virtual Office spatial monitor (dark canvas).

const OFFICE_T = {
  title: { en: "Virtual Office", th: "ออฟฟิศเสมือน" },
  sub:   { en: "Your team's floor — who's at their desk and who's talking to whom, live.", th: "ผังออฟฟิศของทีม — ใครอยู่โต๊ะ ใครคุยกับใคร แบบเรียลไทม์" },
  beams: { en: "live conversations", th: "การคุยงานสด" },
  atDesk:{ en: "at desk", th: "อยู่โต๊ะ" },
};

const OW = 1100, OH = 680;

function OfficeDesk({ agent, p, live, lang, onClick }) {
  const s = STATUS[live.status];
  const leftPct = (p.x / OW) * 100, topPct = (p.y / OH) * 100;
  const now = live.status === "idle" ? (lang === "th" ? "ว่าง" : "Idle") : L(live.task, lang);
  return (
    <button onClick={onClick} className="agp-desk" style={{ left: leftPct + "%", top: topPct + "%" }} title={`${L(agent.name, lang)} · ${now}`}>
      <span className="agp-desk-av" style={{ borderColor: agent.lead ? "#A98BDD" : s.color, boxShadow: live.status === "active" ? `0 0 0 4px ${s.color}22, 0 0 18px -2px ${s.color}66` : "none" }}>
        {agentInitials(agent)}
        <span className="agp-desk-dot" style={{ background: s.color }}></span>
      </span>
      <span className="agp-desk-name">{agentShort(agent, lang)}</span>
    </button>
  );
}

function VirtualOffice({ sim, lang, onAgent }) {
  return (
    <div>
      <PageHead title={L(OFFICE_T.title, lang)} sub={L(OFFICE_T.sub, lang)}
        right={<LiveBadge lang={lang} paused={sim.paused} onToggle={() => sim.setPaused(!sim.paused)} />} />
      <OfficeFloor sim={sim} lang={lang} onAgent={onAgent} />
    </div>
  );
}

function OfficeFloor({ sim, lang, onAgent }) {
  const { pos, rooms } = officeLayout();
  const links = computeLinks(sim.agents);
  const beams = links.handoffs.filter(h => h.active);
  const atDesk = TEAM.filter(a => sim.agents[a.id].status !== "idle").length;

  return (
    <React.Fragment>
      <div className="agp-canvas-dark agp-office-canvas">
        <div className="agp-office-floor">
          {/* rooms */}
          {rooms.map(r => {
            const d = DEPTS[r.dept];
            return (
              <div key={r.dept} className="agp-room" style={{
                left: (r.x / OW) * 100 + "%", top: (r.y / OH) * 100 + "%",
                width: (r.w / OW) * 100 + "%", height: (r.h / OH) * 100 + "%",
                borderColor: d.color + "55",
              }}>
                <span className="agp-room-label" style={{ color: d.color }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: d.color, display: "inline-block" }}></span>
                  {L(d, lang)}
                </span>
              </div>
            );
          })}

          {/* beams overlay */}
          <svg className="agp-beam-layer" viewBox={`0 0 ${OW} ${OH}`} preserveAspectRatio="none">
            {beams.map((h, i) => {
              const p1 = pos[h.from], p2 = pos[h.to];
              if (!p1 || !p2) return null;
              return (
                <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="#2FC397" strokeWidth="2" strokeLinecap="round"
                  className={h.flowing ? "agp-edge-flow" : ""} opacity={h.flowing ? 0.9 : 0.4}
                  vectorEffect="non-scaling-stroke" />
              );
            })}
          </svg>

          {/* desks */}
          {TEAM.map(a => (
            <OfficeDesk key={a.id} agent={a} p={pos[a.id]} live={sim.agents[a.id]} lang={lang} onClick={() => onAgent(a.id)} />
          ))}
        </div>

        <div className="agp-canvas-foot">
          <span className="agp-legend-item"><span className="agp-legend-line"></span>{beams.length} {L(OFFICE_T.beams, lang)}</span>
          <span style={{ color: "#9FE9CF", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>{atDesk}/{TEAM.length} {L(OFFICE_T.atDesk, lang)}</span>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { VirtualOffice, OfficeFloor });
