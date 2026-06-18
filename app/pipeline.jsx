/* app/pipeline.jsx — Upload CSV & Run Pipeline view */
const { useState, useEffect, useRef } = React;

function RunPipeline({ lang }) {
  const T = {
    title:      { en: "Run AI Pipeline", th: "รัน AI Pipeline" },
    sub:        { en: "Upload a CSV of listing URLs and let the 11 agents process them", th: "อัปโหลด CSV ที่มี URL ประกาศ แล้วให้ 11 agents ประมวลผล" },
    drop:       { en: "Drop your CSV here or click to browse", th: "วาง CSV ตรงนี้ หรือคลิกเพื่อเลือกไฟล์" },
    dropHint:   { en: "One URL per row, header: url", th: "URL 1 บรรทัด 1 URL, header: url" },
    ready:      { en: "Ready to run", th: "พร้อมรัน" },
    urls:       { en: "listings", th: "ประกาศ" },
    runBtn:     { en: "Run Pipeline", th: "รัน Pipeline" },
    running:    { en: "Pipeline running…", th: "Pipeline กำลังทำงาน…" },
    done:       { en: "Pipeline complete!", th: "Pipeline เสร็จสิ้น!" },
    viewRes:    { en: "View Results", th: "ดูผลลัพธ์" },
    exportBtn:  { en: "Export Standalone HTML", th: "ส่งออก HTML" },
    changeFile: { en: "Change file", th: "เปลี่ยนไฟล์" },
    progress:   { en: "Processing listing", th: "กำลังประมวลผล listing" },
    of:         { en: "of", th: "จาก" },
    log:        { en: "Live log", th: "Log แบบ Real-time" },
    errTitle:   { en: "Error", th: "ข้อผิดพลาด" },
    noServer:   { en: "Cannot connect to backend server. Make sure you started the app with server.py (not http.server).", th: "ไม่สามารถเชื่อมต่อ backend server ได้ กรุณาเปิดโปรแกรมด้วย server.py" },
    limitLabel: { en: "Process how many listings?", th: "จะประมวลผลกี่ประกาศ?" },
    limitAll:   { en: "All", th: "ทั้งหมด" },
    limitHint:  { en: "out of", th: "จาก" },
  };
  const L = (o) => o?.[lang] ?? o?.en ?? "";

  const [file, setFile]       = useState(null);
  const [urlCount, setUrlCount] = useState(0);
  const [urlRows, setUrlRows]  = useState([]);   // parsed URL preview
  const [limit, setLimit]     = useState(0);   // 0 = all
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState(null);
  const [serverOk, setServerOk] = useState(null);   // null=checking, true, false
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, log: [] });
  const inputRef = useRef();
  const logRef   = useRef();

  // Check if backend server is available
  useEffect(() => {
    fetch("/api/status")
      .then(r => { setServerOk(r.ok); return r.json(); })
      .then(s => {
        // restore state if pipeline was already running when page loaded
        if (s.running) { setRunning(true); setProgress({ current: s.current, total: s.total, log: s.log }); }
        if (s.done && !s.running) { setDone(true); if (s.error) setError(s.error); setProgress(p => ({ ...p, log: s.log })); }
      })
      .catch(() => setServerOk(false));
  }, []);

  // Poll status while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      fetch("/api/status")
        .then(r => r.json())
        .then(s => {
          setProgress({ current: s.current, total: s.total, log: s.log });
          if (!s.running && s.done) {
            setRunning(false);
            setDone(true);
            if (s.error) setError(s.error);
          }
        })
        .catch(() => {});
    }, 1500);
    return () => clearInterval(id);
  }, [running]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [progress.log]);

  // Parse URL slug → sale/rent, type, province hint
  const parseUrlHint = (url) => {
    const s = url.toLowerCase();
    const mode = s.includes("for-sale") || s.includes("/sale/") ? "sale" : "rent";
    let ptype = "condo";
    for (const t of ["villa","house","townhouse","townhome","shophouse","land","office"]) {
      if (s.includes(t)) { ptype = t; break; }
    }
    // province: last meaningful path segment hint
    const segs = s.split("/").filter(Boolean);
    const slug = segs[segs.length - 2] || segs[segs.length - 1] || "";
    const provinces = ["bangkok","pattaya","phuket","chiangmai","chiang-mai","huahin","hua-hin","samui","kosamui","rayong","chonburi","chiangrai"];
    let province = "";
    for (const p of provinces) { if (slug.includes(p)) { province = p.replace("-"," "); break; } }
    return { url, mode, ptype, province };
  };

  const handleFileObj = async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { setError("Please select a .csv file"); return; }
    setFile(f);
    setUploading(true);
    setDone(false);
    setError(null);

    // Parse CSV client-side for preview
    const text = await f.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("url") ? lines.slice(1) : lines;
    const parsed = dataLines.map(l => parseUrlHint(l.split(",")[0].trim())).filter(r => r.url.startsWith("http"));
    setUrlRows(parsed);

    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (j.error) setError(j.error);
      else setUrlCount(j.url_count);
    } catch (e) { setError("Upload failed — is the server running?"); }
    setUploading(false);
  };

  const runPipeline = async () => {
    setRunning(true);
    setDone(false);
    setError(null);
    setProgress({ current: 0, total: 0, log: [] });
    try {
      const r = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: limit || 0 }),
      });
      const j = await r.json();
      if (j.error) { setError(j.error); setRunning(false); }
    } catch (e) { setError("Could not start pipeline"); setRunning(false); }
  };

  const exportReport = async () => {
    try {
      await fetch("/api/export", { method: "POST" });
    } catch (e) {}
    window.open("/reports/team_report_standalone.html", "_blank");
  };

  // Drag-and-drop
  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFileObj(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Render ────────────────────────────────────────────────────────────────
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>{L(T.title)}</h1>
        <p style={{ color: "#8B8475", margin: 0, fontSize: 14 }}>{L(T.sub)}</p>
      </div>

      {/* No-server warning */}
      {serverOk === false && (
        <div style={{ background: "#FBE8E2", border: "1px solid rgba(212,91,60,.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#D45B3C", lineHeight: 1.6 }}>
          <b>⚠ {L(T.errTitle)}:</b> {L(T.noServer)}
          <div style={{ marginTop: 8, fontFamily: "monospace", background: "rgba(0,0,0,.06)", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
            python server.py
          </div>
        </div>
      )}

      {/* Upload area */}
      {!running && !done && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `2px dashed ${dragging ? "#0E9E78" : file ? "#0E9E78" : "#C9BEA8"}`,
            borderRadius: 16,
            background: dragging ? "rgba(14,158,120,.05)" : file ? "rgba(14,158,120,.03)" : "#fff",
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 20,
            transition: "all .2s",
          }}
        >
          <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
            onChange={e => handleFileObj(e.target.files[0])} />
          {uploading ? (
            <div style={{ color: "#0E9E78", fontWeight: 600 }}>Uploading…</div>
          ) : file ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{file.name}</div>
              <div style={{ color: "#0E9E78", fontWeight: 600, fontSize: 14 }}>
                {urlCount} {L(T.urls)} — {L(T.ready)}
              </div>
              <div style={{ fontSize: 12, color: "#8B8475", marginTop: 8, cursor: "pointer", textDecoration: "underline" }}>
                {L(T.changeFile)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{L(T.drop)}</div>
              <div style={{ color: "#8B8475", fontSize: 13 }}>{L(T.dropHint)}</div>
            </>
          )}
        </div>
      )}

      {/* URL Preview Table */}
      {urlRows.length > 0 && !running && !done && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E3DACB", marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #E3DACB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {lang === "th" ? "รายการ URL ที่ตรวจพบ" : "Detected listings"}
            </span>
            <span style={{ fontSize: 12, color: "#8B8475" }}>{urlRows.length} URLs</span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F6F2EB", position: "sticky", top: 0 }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#8B8475", fontWeight: 700 }}>#</th>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#8B8475", fontWeight: 700 }}>
                    {lang === "th" ? "ประเภท" : "Mode"}
                  </th>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#8B8475", fontWeight: 700 }}>
                    {lang === "th" ? "อสังหาฯ" : "Type"}
                  </th>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#8B8475", fontWeight: 700 }}>URL</th>
                </tr>
              </thead>
              <tbody>
                {urlRows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EAE0" }}>
                    <td style={{ padding: "7px 14px", color: "#8B8475" }}>{i+1}</td>
                    <td style={{ padding: "7px 14px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: r.mode === "sale" ? "#FFF3E0" : "#E4F4EE",
                        color:      r.mode === "sale" ? "#B45B00" : "#0A6B52",
                      }}>
                        {r.mode === "sale"
                          ? (lang === "th" ? "ขาย" : "Sale")
                          : (lang === "th" ? "เช่า" : "Rent")}
                      </span>
                    </td>
                    <td style={{ padding: "7px 14px", textTransform: "capitalize", color: "#3A3530" }}>{r.ptype}</td>
                    <td style={{ padding: "7px 14px", color: "#6B655C", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.url.replace("https://propertyscout.co.th","").replace("https://www.propertyscout.co.th","")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#FBE8E2", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#D45B3C" }}>
          <b>{L(T.errTitle)}:</b> {error}
        </div>
      )}

      {/* Limit selector */}
      {file && urlCount > 0 && !running && !done && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E3DACB", padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{L(T.limitLabel)}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {[0, 1, 3, 5, 10, 20].filter(n => n === 0 || n <= urlCount).map(n => (
              <button key={n} onClick={() => setLimit(n)} style={{
                padding: "8px 16px", borderRadius: 8, border: "1.5px solid",
                borderColor: limit === n ? "#0E9E78" : "#E3DACB",
                background: limit === n ? "#E4F4EE" : "#fff",
                color: limit === n ? "#0A6B52" : "#6B655C",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                {n === 0 ? `${L(T.limitAll)} (${urlCount})` : n}
              </button>
            ))}
            {/* custom input */}
            <input type="number" min="1" max={urlCount}
              placeholder="..."
              value={limit > 0 && ![1,3,5,10,20].includes(limit) ? limit : ""}
              onChange={e => { const v = parseInt(e.target.value); setLimit(isNaN(v) ? 0 : Math.min(v, urlCount)); }}
              style={{ width: 70, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E3DACB", fontSize: 13, fontFamily: "inherit", textAlign: "center" }}
            />
          </div>
          <div style={{ fontSize: 12, color: "#8B8475" }}>
            {limit === 0
              ? `${L(T.limitAll)} ${urlCount} ${L(T.urls)}`
              : `${limit} ${L(T.limitHint)} ${urlCount} ${L(T.urls)}`}
          </div>
        </div>
      )}

      {/* Run button */}
      {file && !running && !done && serverOk !== false && (
        <button
          onClick={runPipeline}
          style={{
            width: "100%", padding: "15px", borderRadius: 12, border: "none",
            background: "#0E9E78", color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 20,
          }}
        >
          {L(T.runBtn)} ({limit === 0 ? urlCount : limit} {L(T.urls)})
        </button>
      )}

      {/* Running progress */}
      {running && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E3DACB", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#0E9E78", animation: "agp-ping 1.2s infinite" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0A6B52" }}>{L(T.running)}</span>
          </div>

          {progress.total > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B655C", marginBottom: 6 }}>
                <span>{L(T.progress)} {progress.current} {L(T.of)} {progress.total}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#ECE5D8", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: pct + "%", background: "#0E9E78", borderRadius: 99, transition: "width .6s ease" }} />
              </div>
            </>
          )}

          {progress.log.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B8475", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{L(T.log)}</div>
              <div ref={logRef} style={{ background: "#1A1814", borderRadius: 8, padding: "12px 14px", maxHeight: 180, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: "#A0B890", lineHeight: 1.7 }}>
                {progress.log.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Done */}
      {done && !error && (
        <div style={{ background: "#E4F4EE", borderRadius: 16, padding: 24, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#0A6B52", marginBottom: 6 }}>{L(T.done)}</div>
          <div style={{ color: "#6B655C", fontSize: 13, marginBottom: 20 }}>
            {progress.total > 0 ? `${progress.total} ${L(T.urls)}` : ""} processed
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#" onClick={e => { e.preventDefault(); window.location.hash="results"; window.dispatchEvent(new CustomEvent("agp-nav", { detail: "results" })); }}
              style={{ background: "#0E9E78", color: "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              {L(T.viewRes)}
            </a>
            <button onClick={exportReport}
              style={{ background: "#fff", color: "#211E1A", border: "1.5px solid #C9BEA8", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {L(T.exportBtn)}
            </button>
          </div>
        </div>
      )}

      {/* CSV format hint */}
      {!running && !done && (
        <div style={{ background: "#F6F2EB", borderRadius: 12, padding: "16px 18px", fontSize: 13, color: "#6B655C", lineHeight: 1.7 }}>
          <b style={{ color: "#211E1A" }}>รูปแบบ CSV / CSV format:</b>
          <pre style={{ margin: "8px 0 0", fontFamily: "monospace", fontSize: 12, background: "#211E1A", color: "#A0C890", borderRadius: 8, padding: "10px 14px", overflowX: "auto" }}>{`url\nhttps://propertyscout.co.th/en/1-br-condo-...\nhttps://propertyscout.co.th/en/2-br-house-...`}</pre>
        </div>
      )}
    </div>
  );
}
