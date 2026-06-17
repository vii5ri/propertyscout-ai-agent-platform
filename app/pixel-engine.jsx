// app/pixel-engine.jsx — runtime: movement, behaviors, couriers, React wrapper.

const SPEED = 62;            // base px / sec
const FRAME_T = 0.16;        // walk frame swap
const COURIER_EVERY = 2.3;   // sec between courier attempts
const MAX_COURIERS = 2;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function createPixelEngine(canvas, overlay, wrap, simRef, langRef, onAgent) {
  const ctx = canvas.getContext("2d");
  const L0 = buildLayout();
  const { rooms, seats, desks, props, lounge } = L0;

  // static layer (floor, walls, props, desks drawn fresh for screen state but base is static)
  const off = document.createElement("canvas");
  off.width = BASE_W; off.height = BASE_H;
  const octx = off.getContext("2d");
  function paintStatic() {
    drawFloor(octx);
    Object.values(rooms).forEach(r => drawRoomWalls(octx, r));
    props.forEach(p => drawProp(octx, p));
  }
  paintStatic();

  // agents runtime
  const A = {};
  TEAM.forEach((a, i) => {
    const seat = seats[a.id];
    A[a.id] = {
      id: a.id, agent: a, pal: paletteFor(a, i), room: seat.room, seat,
      x: seat.x, y: seat.y, wps: [], mode: "desk", sitting: true, dir: "up",
      frame: 0, frameT: 0, idleT: 1 + Math.random() * 3, lastStatus: a.status,
      courier: null, bubble: null, bubbleT: 0, tag: null, lastNm: "", lastTip: "",
    };
  });

  // ---- DOM overlay tags ----
  TEAM.forEach(a => {
    const tag = document.createElement("button");
    tag.className = "agp-px-tag";
    tag.innerHTML = '<span class="dot"></span><span class="nm"></span><span class="tip"></span>';
    tag.addEventListener("click", () => onAgent(a.id));
    overlay.appendChild(tag);
    A[a.id].tag = tag;
    A[a.id].elDot = tag.querySelector(".dot");
    A[a.id].elNm = tag.querySelector(".nm");
    A[a.id].elTip = tag.querySelector(".tip");
  });
  // room labels
  const roomLabelEls = {};
  const ROOM_LABEL = {
    "wing-left": { en: "Data & Intelligence", th: "ข้อมูล & วิเคราะห์" },
    leadership: { en: "Leadership", th: "ผู้นำทีม" },
    "wing-right": { en: "Growth & Research", th: "การเติบโต & วิจัย" },
    quality: { en: "Quality", th: "คุณภาพ" },
    content: { en: "Content", th: "คอนเทนต์" },
    lounge: { en: "Lounge", th: "พักผ่อน" },
  };
  Object.entries(rooms).forEach(([key, r]) => {
    const el = document.createElement("div");
    el.className = "agp-px-zone";
    overlay.appendChild(el);
    roomLabelEls[key] = el;
  });

  // ---- geometry / routing ----
  function randInRoom(r) {
    return { x: r.x + 36 + Math.random() * (r.w - 72), y: r.y + 90 + Math.random() * (r.h - 130) };
  }
  function seatFrontOf(id) { const s = seats[id]; return { x: s.x, y: s.y + 16 }; }
  function routeBetween(fromRoom, toRoom, end) {
    if (fromRoom === toRoom) return [end];
    return [
      { x: fromRoom.door.x, y: fromRoom.door.y },
      { x: fromRoom.hall.x, y: fromRoom.hall.y },
      { x: toRoom.hall.x, y: toRoom.hall.y },
      { x: toRoom.door.x, y: toRoom.door.y },
      end,
    ];
  }

  // ---- behavior ----
  function setMode(o, mode) {
    if (o.mode === mode && o.wps.length) return;
    o.mode = mode;
    if (mode === "desk") o.wps = [{ x: o.seat.x, y: o.seat.y }];
    else if (mode === "wander") o.wps = [randInRoom(o.room)];
    else if (mode === "think") o.wps = [randInRoom(o.room)];
    else if (mode === "lounge") o.wps = routeBetween(o.room, rooms.r6, { x: lounge.x + (Math.random() * 40 - 20), y: lounge.y + (Math.random() * 30 - 15) });
  }

  let courierAcc = 0;
  function tryCourier() {
    const sim = simRef.current;
    const active = Object.values(A).filter(o => o.courier).length;
    if (active >= MAX_COURIERS) return;
    const flows = computeLinks(sim.agents).handoffs.filter(h => h.flowing);
    // shuffle
    for (let k = flows.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0;[flows[k], flows[j]] = [flows[j], flows[k]]; }
    for (const h of flows) {
      const o = A[h.from];
      if (!o || o.courier || o.mode !== "desk" || !o.sitting) continue;
      if (sim.agents[h.from].status !== "active") continue;
      // start courier
      o.courier = { to: h.to, phase: "go" };
      o.sitting = false;
      o.wps = routeBetween(o.room, A[h.to].room, seatFrontOf(h.to));
      return;
    }
  }

  function update(dt) {
    const sim = simRef.current;
    const paused = sim.paused;
    if (!paused) { courierAcc += dt; if (courierAcc >= COURIER_EVERY) { courierAcc = 0; tryCourier(); } }

    Object.values(A).forEach(o => {
      const st = sim.agents[o.id].status;

      // courier overrides
      if (o.courier) {
        moveAlong(o, dt);
        if (o.wps.length === 0) {
          if (o.courier.phase === "go") {
            o.courier.phase = "hand"; o.bubble = "doc"; o.bubbleT = 0.95; o.dir = "up";
            const tgt = A[o.courier.to]; if (tgt) { tgt.bubble = "doc"; tgt.bubbleT = 0.95; }
          } else if (o.courier.phase === "hand") {
            if (o.bubbleT <= 0) {
              o.courier.phase = "return";
              o.wps = routeBetween(A[o.courier.to].room, o.room, { x: o.seat.x, y: o.seat.y });
            }
          } else if (o.courier.phase === "return") {
            o.courier = null; o.sitting = true; o.dir = "up"; o.mode = "desk";
          }
        }
        tickBubble(o, dt);
        return;
      }

      // status -> desired mode
      if (st !== o.lastStatus) {
        o.lastStatus = st;
        if (st === "active" || st === "error") setMode(o, "desk");
        else if (st === "thinking") setMode(o, "think");
        else setMode(o, "wander");
      }

      if (paused) { tickBubble(o, dt); return; }

      if (o.wps.length > 0) {
        moveAlong(o, dt);
      } else {
        // arrived behaviors
        if (o.mode === "desk") { o.sitting = true; o.dir = "up"; }
        else {
          o.sitting = false;
          o.idleT -= dt;
          if (o.idleT <= 0) {
            o.idleT = 1.5 + Math.random() * 3.5;
            if (o.mode === "wander") { if (Math.random() < 0.25) setMode(o, "lounge"); else o.wps = [randInRoom(o.room)]; }
            else if (o.mode === "lounge") { if (Math.random() < 0.4) setMode(o, "wander"); else o.wps = [{ x: lounge.x + (Math.random() * 50 - 25), y: lounge.y + (Math.random() * 30 - 15) }]; }
            else if (o.mode === "think") o.wps = [randInRoom(o.room)];
          }
          o.dir = "down";
        }
      }

      // ambient bubbles
      if (o.bubbleT <= 0) {
        if (st === "error") { o.bubble = "alert"; o.bubbleT = 1.2; }
        else if (st === "thinking" && Math.random() < 0.02) { o.bubble = "think"; o.bubbleT = 1.4; }
      }
      tickBubble(o, dt);
    });
  }

  function tickBubble(o, dt) { if (o.bubbleT > 0) { o.bubbleT -= dt; if (o.bubbleT <= 0) o.bubble = null; } }

  function moveAlong(o, dt) {
    o.sitting = false;
    const tgt = o.wps[0];
    if (!tgt) return;
    const dx = tgt.x - o.x, dy = tgt.y - o.y;
    const d = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (d <= step) { o.x = tgt.x; o.y = tgt.y; o.wps.shift(); }
    else {
      o.x += (dx / d) * step; o.y += (dy / d) * step;
      o.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    }
    o.frameT += dt; if (o.frameT >= FRAME_T) { o.frameT = 0; o.frame = o.frame ? 0 : 1; }
  }

  // ---- render ----
  let s = 1, dpr = 1;
  function resize() {
    const cssW = wrap.clientWidth;
    const cssH = cssW * BASE_H / BASE_W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + "px";
    overlay.style.height = cssH + "px";
    s = cssW / BASE_W;
    // position room labels
    Object.entries(rooms).forEach(([key, r]) => {
      const el = roomLabelEls[key];
      el.style.left = (r.x + 12) * s + "px";
      el.style.top = (r.y + 8) * s + "px";
    });
    // repaint immediately (canvas.width reset clears the bitmap)
    draw(); updateOverlay();
  }
  const ro = new ResizeObserver(resize); ro.observe(wrap);
  resize();

  function draw() {
    const sim = simRef.current;
    ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, BASE_W, BASE_H);
    ctx.drawImage(off, 0, 0);
    // desks (with live screen state)
    desks.forEach(d => drawDesk(ctx, d, sim.agents[d.agentId].status === "active"));
    // characters sorted by y
    const list = Object.values(A).slice().sort((a, b) => a.y - b.y);
    list.forEach(o => drawChar(ctx, o.x, o.y, o.dir, o.frame, o.wps.length > 0 && !o.sitting, o.sitting, o.pal, o.bubble));
  }

  function updateOverlay() {
    const sim = simRef.current, lang = langRef.current;
    // room labels text
    Object.entries(rooms).forEach(([key, r]) => {
      const el = roomLabelEls[key];
      const txt = L(ROOM_LABEL[r.dept] || { en: r.dept, th: r.dept }, lang);
      if (el.textContent !== txt) el.textContent = txt;
    });
    Object.values(A).forEach(o => {
      const st = sim.agents[o.id].status;
      const px = o.x * s, py = (o.y - 44) * s;
      o.tag.style.transform = `translate(${px}px, ${py}px)`;
      o.elDot.style.background = STATUS[st].color;
      const nm = agentShort(o.agent, lang);
      if (o.lastNm !== nm) { o.elNm.textContent = nm; o.lastNm = nm; }
      const tip = o.courier
        ? `${L(o.agent.name, lang)} · ${L(PIXEL_T.delivering, lang)} → ${L(TEAM_BY_ID[o.courier.to].name, lang)}`
        : (st === "idle" ? `${L(o.agent.name, lang)} · ${lang === "th" ? "ว่าง" : "Idle"}` : `${L(o.agent.name, lang)} · ${L(sim.agents[o.id].task, lang)}`);
      if (o.lastTip !== tip) { o.elTip.textContent = tip; o.lastTip = tip; }
    });
  }

  let raf = null, last = 0, running = false;
  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    try { update(dt); draw(); updateOverlay(); }
    catch (e) { console.error("PIXEL loop error:", e && e.message, e && e.stack); running = false; return; }
    raf = requestAnimationFrame(loop);
  }

  return {
    start() { if (running) return; running = true; last = 0; draw(); updateOverlay(); raf = requestAnimationFrame(loop); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ro.disconnect(); overlay.innerHTML = ""; },
  };
}

function PixelOffice({ sim, lang, onAgent }) {
  const wrapRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const simRef = React.useRef(sim); simRef.current = sim;
  const langRef = React.useRef(lang); langRef.current = lang;
  const onAgentRef = React.useRef(onAgent); onAgentRef.current = onAgent;

  React.useEffect(() => {
    const engine = createPixelEngine(canvasRef.current, overlayRef.current, wrapRef.current, simRef, langRef, (id) => onAgentRef.current(id));
    engine.start();
    return () => engine.stop();
  }, []);

  return (
    <div>
      <PageHead title={L(PIXEL_T.title, lang)} sub={L(PIXEL_T.sub, lang)}
        right={<LiveBadge lang={lang} paused={sim.paused} onToggle={() => sim.setPaused(!sim.paused)} />} />
      <div className="agp-canvas-dark agp-px-shell">
        <div className="agp-px-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="agp-px-canvas"></canvas>
          <div className="agp-px-overlay" ref={overlayRef}></div>
        </div>
        <div className="agp-canvas-foot">
          <span className="agp-legend-item">{L(PIXEL_T.hint, lang)}</span>
          <span style={{ display: "inline-flex", gap: 12 }}>
            {["active", "idle", "error"].map(st => (
              <span key={st} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#B9B1A1" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS[st].color }} />{L(STATUS[st], lang)}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { createPixelEngine, PixelOffice });
