// app/pixel.jsx — "Pixel Agents: Virtual Office" — a live pixel-art office.
// Characters walk, sit at desks, and carry handoffs between each other,
// all driven by the shared simulation. Warm wood floor, room walls, props.

const PIXEL_T = {
  title: { en: "Virtual Office", th: "ออฟฟิศเสมือน" },
  sub:   { en: "A living pixel office — watch the team work, wander, and hand off jobs.", th: "ออฟฟิศพิกเซลที่มีชีวิต — ดูทีมทำงาน เดินไปมา และส่งต่องานกัน" },
  hint:  { en: "Click a character to open their profile.", th: "คลิกตัวละครเพื่อเปิดโปรไฟล์" },
  delivering: { en: "delivering", th: "กำลังส่งงาน" },
};

const BASE_W = 1120, BASE_H = 700, WALL = 16;

// ---------- palettes ----------
const PX = {
  bg: "#15120D",
  floorA: "#E3C99A", floorB: "#DBBF8B", plankLine: "#C2A571",
  wall: "#CDBBA0", wallTop: "#E4D7C0", wallSide: "#9E876A", wallLine: "#7C6A50",
  deskTop: "#B5824E", deskEdge: "#8A5E36", deskLeg: "#6E4A2C",
  mon: "#2A2722", key: "#D9C6A0",
  shelf: "#9A6B3F", books: ["#C7503F", "#3F7BC7", "#D8A53C", "#4E9E63", "#9A5BB0"],
  pot: "#B5663B", leaf: "#5DA05A", leaf2: "#4A8048",
  sofa: "#B0695A", sofaDark: "#955446", cushion: "#C98A6E",
  rug: "#CBA98A",
};
const SKIN = ["#F1C49A", "#E6AE80", "#CC9264", "#A56C42"];
const HAIR = ["#2A2018", "#5A3920", "#7A5A2E", "#33263A", "#141414", "#8A6A3A", "#B0743A"];
const PANTS = ["#3A3A44", "#46414B", "#5A4A3A", "#34506A", "#4A3A4A"];

function paletteFor(agent, i) {
  return {
    skin: SKIN[i % SKIN.length],
    hair: HAIR[(i * 3 + 1) % HAIR.length],
    shirt: DEPTS[agent.dept].color,
    pants: PANTS[i % PANTS.length],
  };
}

// ---------- layout ----------
function buildLayout() {
  // interior floor rects for 6 rooms around a cross corridor
  const rooms = {
    r2: { dept: "wing-left",  x: WALL, y: WALL, w: 356, h: 314, door: { x: 392, y: 200 }, hall: { x: 392, y: 350 }, agents: ["enrich", "project", "location"] },
    r1: { dept: "leadership", x: 412, y: WALL, w: 296, h: 314, door: { x: 540, y: 344 }, hall: { x: 540, y: 350 }, agents: ["cco"] },
    r3: { dept: "wing-right", x: 748, y: WALL, w: 356, h: 314, door: { x: 728, y: 200 }, hall: { x: 728, y: 350 }, agents: ["seo", "aeo", "entity"] },
    r4: { dept: "quality",    x: WALL, y: 370, w: 356, h: 314, door: { x: 392, y: 500 }, hall: { x: 392, y: 350 }, agents: ["auditor", "factcheck", "score"] },
    r5: { dept: "content",    x: 412, y: 370, w: 296, h: 314, door: { x: 540, y: 356 }, hall: { x: 540, y: 350 }, agents: ["faq", "copywriter"] },
    r6: { dept: "lounge",     x: 748, y: 370, w: 356, h: 314, door: { x: 728, y: 500 }, hall: { x: 728, y: 350 }, agents: [] },
  };
  // doorway side for wall drawing
  rooms.r2.doorSide = "right"; rooms.r2.doorAt = 200;
  rooms.r1.doorSide = "bottom"; rooms.r1.doorAt = 540;
  rooms.r3.doorSide = "left";  rooms.r3.doorAt = 200;
  rooms.r4.doorSide = "right"; rooms.r4.doorAt = 500;
  rooms.r5.doorSide = "top";   rooms.r5.doorAt = 540;
  rooms.r6.doorSide = "left";  rooms.r6.doorAt = 500;

  const seats = {}; // agentId -> {x,y, deskX,deskY, room}
  const desks = [];
  Object.values(rooms).forEach(r => {
    const ids = r.agents;
    const n = ids.length;
    if (n === 0) return;
    const usableW = r.w - 60;
    const slot = usableW / n;
    ids.forEach((id, i) => {
      const dx = Math.round(r.x + 30 + slot * i + slot / 2 - 32);
      const dy = r.y + 34;
      const seat = { x: dx + 32, y: dy + 64, deskX: dx, deskY: dy, room: r };
      seats[id] = seat;
      desks.push({ x: dx, y: dy, agentId: id });
    });
  });

  // props per room (type,x,y)
  const props = [
    // r2
    { t: "plant", x: 30, y: 290 }, { t: "shelf", x: 300, y: 150 }, { t: "cabinet", x: 40, y: 150 },
    // r1 leadership — sofa + plant
    { t: "sofa", x: 440, y: 250 }, { t: "plant", x: 660, y: 40 }, { t: "rug", x: 470, y: 170, w: 180, h: 120 },
    // r3
    { t: "plant", x: 1070, y: 40 }, { t: "shelf", x: 760, y: 150 }, { t: "cabinet", x: 1060, y: 290 },
    // r4
    { t: "cabinet", x: 320, y: 470 }, { t: "plant", x: 30, y: 650 },
    // r5
    { t: "plant", x: 430, y: 650 }, { t: "shelf", x: 640, y: 500 },
    // r6 lounge
    { t: "rug", x: 800, y: 470, w: 250, h: 150 }, { t: "sofa", x: 800, y: 430 }, { t: "sofa", x: 800, y: 560 },
    { t: "coffee", x: 920, y: 500 }, { t: "plant", x: 1070, y: 400 }, { t: "plant", x: 1070, y: 650 },
  ];

  const lounge = { x: 900, y: 520 };
  return { rooms, seats, desks, props, lounge };
}

// ---------- static draw helpers (offscreen) ----------
function rrect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

function drawFloor(g) {
  rrect(g, 0, 0, BASE_W, BASE_H, PX.bg);
  // wood floor inside outer walls
  const fx = WALL - 6, fy = WALL - 6, fw = BASE_W - 2 * (WALL - 6), fh = BASE_H - 2 * (WALL - 6);
  for (let y = fy; y < fy + fh; y += 14) {
    rrect(g, fx, y, fw, 14, (Math.floor(y / 14) % 2) ? PX.floorB : PX.floorA);
    g.fillStyle = PX.plankLine; g.fillRect(fx, y, fw, 1);
    // plank seams
    for (let x = fx + ((Math.floor(y / 14) % 2) ? 60 : 0); x < fx + fw; x += 120) {
      g.fillRect(x, y, 1, 14);
    }
  }
}

function drawWallEdge(g, x, y, w, h) {
  rrect(g, x, y, w, h, PX.wall);
  if (h > w) { // vertical wall
    rrect(g, x, y, 3, h, PX.wallSide);
    rrect(g, x + w - 2, y, 2, h, PX.wallLine);
  } else { // horizontal wall
    rrect(g, x, y, w, 4, PX.wallTop);
    rrect(g, x, y + h - 3, w, 3, PX.wallLine);
  }
}

function drawRoomWalls(g, r) {
  const t = 10, gap = 56;
  const x = r.x, y = r.y, w = r.w, h = r.h;
  const ox = x - t, oy = y - t, ow = w + 2 * t, oh = h + 2 * t;
  const seg = (side) => {
    if (side === "top") {
      if (r.doorSide === "top") { const dc = r.doorAt; drawWallEdge(g, ox, oy, dc - gap / 2 - ox, t); drawWallEdge(g, dc + gap / 2, oy, ox + ow - (dc + gap / 2), t); }
      else drawWallEdge(g, ox, oy, ow, t);
    } else if (side === "bottom") {
      if (r.doorSide === "bottom") { const dc = r.doorAt; drawWallEdge(g, ox, y + h, dc - gap / 2 - ox, t); drawWallEdge(g, dc + gap / 2, y + h, ox + ow - (dc + gap / 2), t); }
      else drawWallEdge(g, ox, y + h, ow, t);
    } else if (side === "left") {
      if (r.doorSide === "left") { const dc = r.doorAt; drawWallEdge(g, ox, oy, t, dc - gap / 2 - oy); drawWallEdge(g, ox, dc + gap / 2, t, oy + oh - (dc + gap / 2)); }
      else drawWallEdge(g, ox, oy, t, oh);
    } else if (side === "right") {
      if (r.doorSide === "right") { const dc = r.doorAt; drawWallEdge(g, x + w, oy, t, dc - gap / 2 - oy); drawWallEdge(g, x + w, dc + gap / 2, t, oy + oh - (dc + gap / 2)); }
      else drawWallEdge(g, x + w, oy, t, oh);
    }
  };
  seg("top"); seg("bottom"); seg("left"); seg("right");
}

function drawProp(g, p) {
  if (p.t === "rug") { g.globalAlpha = 0.5; rrect(g, p.x, p.y, p.w, p.h, PX.rug); g.globalAlpha = 1; rrect(g, p.x, p.y, p.w, 2, "#B9966F"); }
  else if (p.t === "plant") {
    rrect(g, p.x + 2, p.y + 14, 12, 8, PX.pot); rrect(g, p.x + 2, p.y + 14, 12, 2, "#C97B4A");
    rrect(g, p.x, p.y, 16, 16, PX.leaf); rrect(g, p.x + 4, p.y - 4, 8, 8, PX.leaf2); rrect(g, p.x + 6, p.y + 4, 4, 10, PX.leaf2);
  } else if (p.t === "shelf") {
    rrect(g, p.x, p.y, 56, 30, PX.shelf); rrect(g, p.x, p.y, 56, 3, "#B0824E");
    for (let i = 0; i < 7; i++) rrect(g, p.x + 4 + i * 7, p.y + 5, 5, 10, PX.books[i % PX.books.length]);
    rrect(g, p.x, p.y + 17, 56, 2, "#7A5430");
    for (let i = 0; i < 6; i++) rrect(g, p.x + 5 + i * 8, p.y + 20, 6, 8, PX.books[(i + 2) % PX.books.length]);
  } else if (p.t === "cabinet") {
    rrect(g, p.x, p.y, 30, 40, "#A9B0B5"); rrect(g, p.x, p.y, 30, 3, "#C4CACE");
    rrect(g, p.x + 4, p.y + 8, 22, 10, "#8B9298"); rrect(g, p.x + 4, p.y + 22, 22, 10, "#8B9298");
    rrect(g, p.x + 12, p.y + 12, 6, 2, "#5E646A"); rrect(g, p.x + 12, p.y + 26, 6, 2, "#5E646A");
  } else if (p.t === "sofa") {
    rrect(g, p.x, p.y, 70, 34, PX.sofaDark); rrect(g, p.x, p.y, 70, 14, PX.sofa);
    rrect(g, p.x + 4, p.y + 12, 30, 18, PX.cushion); rrect(g, p.x + 36, p.y + 12, 30, 18, PX.cushion);
  } else if (p.t === "coffee") {
    rrect(g, p.x, p.y, 40, 24, "#8A5E36"); rrect(g, p.x, p.y, 40, 4, "#B5824E");
    rrect(g, p.x + 8, p.y - 6, 8, 8, "#EDE3CF"); rrect(g, p.x + 22, p.y - 5, 6, 6, "#EDE3CF");
  }
}

function drawDesk(g, d, screenOn) {
  rrect(g, d.x, d.y, 64, 30, PX.deskTop);
  rrect(g, d.x, d.y, 64, 4, "#C79A63");
  rrect(g, d.x, d.y + 26, 64, 4, PX.deskEdge);
  rrect(g, d.x + 3, d.y + 30, 5, 8, PX.deskLeg); rrect(g, d.x + 56, d.y + 30, 5, 8, PX.deskLeg);
  // monitor
  const mx = d.x + 32;
  rrect(g, mx - 11, d.y - 16, 22, 15, PX.mon);
  rrect(g, mx - 9, d.y - 14, 18, 11, screenOn ? "#43D6A6" : "#7FB3D0");
  rrect(g, mx - 2, d.y - 1, 4, 3, PX.mon);
  // keyboard
  rrect(g, mx - 9, d.y + 6, 18, 5, PX.key);
}

// ---------- character ----------
function drawChar(ctx, cx, cy, dir, frame, walking, sitting, p, bubble) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  // shadow
  ctx.fillStyle = "rgba(20,14,6,.16)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 2, 10, 3.4, 0, 0, Math.PI * 2); ctx.fill();

  const bodyTop = sitting ? cy - 17 : cy - 20;
  // legs (hidden when sitting)
  if (!sitting) {
    const sw = walking ? (frame ? 2 : -2) : 0;
    R(cx - 5 + sw, cy - 8, 4, 8, p.pants);
    R(cx + 1 - sw, cy - 8, 4, 8, p.pants);
    R(cx - 5 + sw, cy - 1, 4, 2, "#2A2722");
    R(cx + 1 - sw, cy - 1, 4, 2, "#2A2722");
  }
  // torso
  R(cx - 6, bodyTop, 12, sitting ? 11 : 13, p.shirt);
  R(cx - 6, bodyTop, 12, 2, "rgba(255,255,255,.12)");
  // arms
  const armBob = walking && frame ? 1 : 0;
  R(cx - 8, bodyTop + 1 + armBob, 3, 9, p.shirt); R(cx + 5, bodyTop + 1 - armBob, 3, 9, p.shirt);
  R(cx - 8, bodyTop + 9 + armBob, 3, 2, p.skin); R(cx + 5, bodyTop + 9 - armBob, 3, 2, p.skin);
  // head
  const hy = bodyTop - 11;
  R(cx - 5, hy, 10, 11, p.skin);
  // hair + face by direction
  R(cx - 5, hy, 10, 4, p.hair);
  if (dir === "up") {
    R(cx - 5, hy, 10, 8, p.hair);
  } else if (dir === "left" || dir === "right") {
    R(cx - 5, hy, 10, 5, p.hair);
    const ex = dir === "left" ? cx - 3 : cx + 1;
    R(ex, hy + 6, 2, 2, "#2A2722");
    if (dir === "left") R(cx + 3, hy, 2, 7, p.hair); else R(cx - 5, hy, 2, 7, p.hair);
  } else { // down
    R(cx - 5, hy, 2, 7, p.hair); R(cx + 3, hy, 2, 7, p.hair);
    R(cx - 3, hy + 6, 2, 2, "#2A2722"); R(cx + 1, hy + 6, 2, 2, "#2A2722");
  }
  // bubble
  if (bubble) {
    const bx = cx + 8, by = hy - 16;
    R(bx - 2, by, 22, 16, "#FFFFFF");
    R(bx - 2, by + 16, 6, 4, "#FFFFFF");
    if (bubble === "doc") {
      R(bx + 4, by + 3, 12, 10, "#EDE7D8");
      R(bx + 6, by + 5, 8, 1, "#9A8C72"); R(bx + 6, by + 7, 8, 1, "#9A8C72"); R(bx + 6, by + 9, 6, 1, "#9A8C72");
    } else if (bubble === "think") {
      R(bx + 3, by + 7, 2, 2, "#8B8475"); R(bx + 8, by + 7, 2, 2, "#8B8475"); R(bx + 13, by + 7, 2, 2, "#8B8475");
    } else if (bubble === "alert") {
      R(bx + 8, by + 3, 2, 7, "#D45B3C"); R(bx + 8, by + 11, 2, 2, "#D45B3C");
    }
  }
}

Object.assign(window, { PIXEL_T, BASE_W, BASE_H, WALL, PX, paletteFor, buildLayout, drawFloor, drawRoomWalls, drawProp, drawDesk, drawChar, rrect });
