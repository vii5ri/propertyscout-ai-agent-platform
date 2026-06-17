// app/sim.jsx — realtime simulation engine.
// Drives per-agent live status/progress, an activity feed, a task queue,
// pipeline counts and KPIs. Returns a snapshot + controls.

const VERB = {
  start:    { en: "started", th: "เริ่ม", tone: "neutral" },
  complete: { en: "finished", th: "ทำเสร็จ", tone: "good" },
  delegate: { en: "assigned a job", th: "มอบหมายงาน", tone: "neutral" },
  flag:     { en: "flagged an issue on", th: "ติดธงปัญหาที่", tone: "warn" },
  recover:  { en: "recovered and resumed", th: "กลับมาทำงานต่อ", tone: "neutral" },
  publish:  { en: "published", th: "เผยแพร่แล้ว", tone: "good" },
};

const LISTING_NAMES = [
  "Noble Ploenchit", "Rhythm 36", "Ideo Q Chula-Samyan", "Life Asoke",
  "Ashton Chula-Silom", "Belle Grand Rama 9", "Ideo O2", "Noble Recole",
  "The Line Sukhumvit 71", "Park Origin Thonglor", "Phuket Pool Villa",
  "Noble Around Ari", "Ideo Mobi Sukhumvit", "Chapter One Midtown",
];

let _uid = 1;
const uid = () => _uid++;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

function useSimulation() {
  const [tick, setTick] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const stateRef = React.useRef(null);

  // initialise once
  if (!stateRef.current) {
    const agents = {};
    TEAM.forEach(a => {
      const active = a.status === "active";
      agents[a.id] = {
        status: a.status,
        progress: active ? 20 + Math.floor(Math.random() * 50) : 0,
        taskIdx: 0,
        task: a.tasks[0],
        done: 0,            // jobs completed this session
        cooldown: 0,
      };
    });
    const feed = [];
    // seed a few feed items
    const seedAgents = ["copywriter", "auditor", "factcheck", "enrich", "score", "seo"];
    seedAgents.forEach((id, i) => {
      const a = TEAM_BY_ID[id];
      feed.push({
        id: uid(), agentId: id, verb: VERB.complete,
        obj: { en: pick(LISTING_NAMES), th: pick(LISTING_NAMES) },
        ageMs: (i + 1) * 14000 + Math.random() * 8000,
      });
    });
    const queue = [];
    for (let i = 0; i < 7; i++) queue.push(makeQueueItem());
    const pipe = {};
    PIPELINE.forEach(s => { pipe[s.id] = 1 + Math.floor(Math.random() * 6); });
    stateRef.current = { agents, feed, queue, pipe, published: 18, tickCount: 0 };
  }

  function makeQueueItem() {
    const stage = pick(PIPELINE.filter(s => s.id !== "publish"));
    return {
      id: uid(),
      name: pick(LISTING_NAMES),
      stageId: stage.id,
      agentId: pick(stage.agents),
      eta: 1 + Math.floor(Math.random() * 5),
    };
  }

  React.useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      s.tickCount++;
      // age the feed
      s.feed.forEach(f => { f.ageMs += 2000; });

      const pushFeed = (agentId, verb, objStr) => {
        s.feed.unshift({ id: uid(), agentId, verb, obj: objStr, ageMs: 0 });
        if (s.feed.length > 36) s.feed.pop();
      };

      TEAM.forEach(a => {
        const st = s.agents[a.id];
        if (st.cooldown > 0) { st.cooldown--; if (st.cooldown === 0 && st.status !== "active") { /* stay */ } }

        if (st.status === "active") {
          st.progress += 6 + Math.floor(Math.random() * 18);
          if (st.progress >= 100) {
            st.progress = 100;
            st.done++;
            const obj = { en: pick(LISTING_NAMES), th: pick(LISTING_NAMES) };
            pushFeed(a.id, a.id === "cco" ? VERB.publish : VERB.complete, obj);
            if (a.id === "cco") s.published++;
            // next task or rest
            if (chance(0.55)) {
              st.taskIdx = (st.taskIdx + 1) % a.tasks.length;
              st.task = a.tasks[st.taskIdx];
              st.progress = 0;
            } else {
              st.status = a.id === "cco" ? "thinking" : "idle";
              st.progress = 0;
              st.cooldown = 1 + Math.floor(Math.random() * 2);
            }
          }
        } else if (st.status === "thinking") {
          if (chance(0.45)) {
            st.status = "active";
            st.task = a.tasks[st.taskIdx];
            st.progress = 5;
            pushFeed(a.id, VERB.start, st.task);
          }
        } else if (st.status === "idle") {
          if (st.cooldown === 0 && chance(0.3)) {
            st.status = "active";
            st.taskIdx = (st.taskIdx + 1) % a.tasks.length;
            st.task = a.tasks[st.taskIdx];
            st.progress = 5;
            pushFeed(a.id, VERB.start, st.task);
          }
        } else if (st.status === "error") {
          if (chance(0.5)) {
            st.status = "active";
            st.progress = Math.max(st.progress, 10);
            pushFeed(a.id, VERB.recover, st.task);
          }
        }

        // rare error injection (not for CCO)
        if (a.id !== "cco" && st.status === "active" && chance(0.015)) {
          st.status = "error";
          pushFeed(a.id, VERB.flag, st.task);
        }
      });

      // queue churn
      if (chance(0.5) && s.queue.length > 0) s.queue.shift();
      while (s.queue.length < 6) s.queue.push(makeQueueItem());
      s.queue.forEach(q => { if (chance(0.3) && q.eta > 1) q.eta--; });

      // pipeline drift
      PIPELINE.forEach(p => {
        let v = s.pipe[p.id] + (chance(0.5) ? 1 : -1);
        s.pipe[p.id] = Math.max(0, Math.min(9, v));
      });

      setTick(t => t + 1);
    }, Math.round(2000 / speed));
    return () => clearInterval(iv);
  }, [paused, speed]);

  const s = stateRef.current;
  // derive KPIs
  const counts = { active: 0, thinking: 0, idle: 0, error: 0 };
  TEAM.forEach(a => { counts[s.agents[a.id].status]++; });
  const sessionDone = TEAM.reduce((n, a) => n + s.agents[a.id].done, 0);
  const throughput = 60 + counts.active * 9 + Math.round(sessionDone * 1.5);

  return {
    tick, paused, setPaused, speed, setSpeed,
    agents: s.agents,
    feed: s.feed,
    queue: s.queue,
    pipe: s.pipe,
    counts,
    published: s.published,
    throughput,
    queueLen: s.queue.length,
  };
}

function relTime(ageMs, lang) {
  const sec = Math.floor(ageMs / 1000);
  if (sec < 5) return lang === "th" ? "เมื่อกี้" : "just now";
  if (sec < 60) return lang === "th" ? `${sec} วิ` : `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return lang === "th" ? `${min} นาที` : `${min}m`;
  const hr = Math.floor(min / 60);
  return lang === "th" ? `${hr} ชม.` : `${hr}h`;
}

Object.assign(window, { useSimulation, relTime, VERB });
