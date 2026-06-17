// app/links.jsx — collaboration links + layouts shared by Collaboration & Virtual Office.

// Who hands off to whom across the content pipeline (direction = from → to).
const HANDOFFS = [
  ["cco", "enrich"],
  ["enrich", "auditor"],
  ["auditor", "project"], ["auditor", "location"], ["auditor", "entity"],
  ["project", "copywriter"], ["location", "copywriter"], ["entity", "copywriter"],
  ["project", "faq"], ["location", "faq"], ["entity", "faq"],
  ["copywriter", "seo"], ["copywriter", "aeo"], ["faq", "seo"], ["faq", "aeo"],
  ["seo", "factcheck"], ["aeo", "factcheck"],
  ["factcheck", "score"],
  ["score", "cco"],
];

// orbit order (pipeline order) around the central CCO
const ORBIT = ["enrich", "auditor", "project", "location", "entity",
  "copywriter", "faq", "seo", "aeo", "factcheck", "score"];

function computeLinks(agents) {
  const isActive = (id) => agents[id] && agents[id].status === "active";
  const handoffs = HANDOFFS.map(([from, to]) => ({
    from, to,
    active: isActive(from) || isActive(to),
    flowing: isActive(from),
  }));
  const spokes = ORBIT.map(id => ({ id, active: isActive(id) }));
  return { handoffs, spokes };
}

function collaboratorsOf(id, agents) {
  const out = new Set();
  HANDOFFS.forEach(([from, to]) => {
    if (from === id && (agents[from].status === "active" || agents[to].status === "active")) out.add(to);
    if (to === id && (agents[from].status === "active" || agents[to].status === "active")) out.add(from);
  });
  return [...out];
}

function agentInitials(agent) {
  const parts = agent.name.en.split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}
function agentShort(agent, lang) {
  return (lang === "th" ? agent.name.th : agent.name.en).split(" ")[0];
}

// radial layout: CCO at centre, ORBIT on an ellipse
function radialLayout(W, H) {
  const cx = W * 0.5, cy = H * 0.52;
  const rx = W * 0.38, ry = H * 0.37;
  const pos = { cco: { x: cx, y: cy } };
  ORBIT.forEach((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / ORBIT.length;
    pos[id] = { x: cx + rx * Math.cos(ang), y: cy + ry * Math.sin(ang) };
  });
  return { pos, cx, cy };
}

function edgePath(p1, p2, cx, cy, bow = 46) {
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  let dx = mx - cx, dy = my - cy;
  const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${(mx + dx * bow).toFixed(1)},${(my + dy * bow).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
}

// office layout: rooms by department, agents seated as desks. Canvas 1100x680.
const OFFICE_ROOMS = [
  { dept: "leadership",   x: 380, y: 26,  w: 340, h: 116 },
  { dept: "data",         x: 36,  y: 178, w: 300, h: 150 },
  { dept: "intelligence", x: 372, y: 178, w: 356, h: 150 },
  { dept: "growth",       x: 764, y: 178, w: 300, h: 150 },
  { dept: "quality",      x: 36,  y: 364, w: 452, h: 178 },
  { dept: "content",      x: 524, y: 364, w: 300, h: 178 },
  { dept: "research",     x: 860, y: 364, w: 204, h: 178 },
];

function officeLayout() {
  const byDept = {};
  TEAM.forEach(a => { (byDept[a.dept] = byDept[a.dept] || []).push(a.id); });
  const pos = {};
  const rooms = OFFICE_ROOMS.map(r => {
    const ids = byDept[r.dept] || [];
    const labelH = 30, padX = 22;
    const availW = r.w - padX * 2;
    const slot = availW / Math.max(1, ids.length);
    const y = r.y + labelH + (r.h - labelH) / 2;
    ids.forEach((id, i) => { pos[id] = { x: r.x + padX + slot * (i + 0.5), y }; });
    return { ...r, agents: ids };
  });
  return { pos, rooms };
}

Object.assign(window, { HANDOFFS, ORBIT, computeLinks, collaboratorsOf, agentInitials, agentShort, radialLayout, edgePath, OFFICE_ROOMS, officeLayout });
