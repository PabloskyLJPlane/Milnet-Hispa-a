// =======================================
// DASHBOARD.JS — Centro de Mando (SAFE)
// - Evita índices compuestos Firestore
// - No crashea si profile aún no existe
// =======================================

let DASHBOARD_STATE = { loading: false };

// ------------------------------
// Render principal
// ------------------------------
async function renderDashboard(force = false) {
  if (DASHBOARD_STATE.loading && !force) return;
  DASHBOARD_STATE.loading = true;

  const feed = document.getElementById("dashFeed");
  if (!feed) { DASHBOARD_STATE.loading = false; return; }

  feed.innerHTML = "Cargando dashboard…";

  try {
    renderBasicKPIsSafe();
    await renderDashboardFeedSafe();
  } catch (err) {
    console.error("renderDashboard error:", err);
    feed.innerHTML = `<div class="small">Error cargando dashboard. Mira F12 → Console.</div>`;
  }

  DASHBOARD_STATE.loading = false;
}

// ------------------------------
// KPIs básicos
// ------------------------------
function renderBasicKPIsSafe() {
  const p = MILNET.profile || {};

  safeText("dashBranch", p.branchId || "—");
  safeText("dashUnit", p.unitId || "sin-unidad");
  safeText("dashRank", p.rankId || "—");
  safeText("dashClr", p.clearance || "BASIC");

  safeText("dashBranchSub", "Cuerpo asignado");
  safeText("dashUnitSub", "Unidad actual");
  safeText("dashRankSub", "Tu rango");
  safeText("dashClrSub", "Nivel de acceso");
}

// ------------------------------
// Feed SAFE
// ------------------------------
async function renderDashboardFeedSafe() {
  const feed = document.getElementById("dashFeed");
  if (!feed) return;

  feed.innerHTML = "";

  const firestore = db();
  const blocks = [];

  // ===========================
  // 1) Comunicados (SAFE)
  // ===========================
  try {
    const snap = await firestore
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(120)
      .get();

    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));

    const branch = (MILNET.branch && MILNET.branch !== "ALL")
      ? MILNET.branch
      : (MILNET.profile?.branchId || null);

    const filtered = branch ? arr.filter(o => o.branchId === branch) : arr;

    filtered.slice(0, 5).forEach(o => blocks.push(renderOrderBlock(o)));
  } catch (e) {
    console.warn("dashboard orders error", e);
    blocks.push(renderWarnBlock("No se pudieron cargar comunicados (índices/permiso)."));
  }

  // ===========================
  // 2) CUM (solo si puede)
  // ===========================
  if (typeof canSeeCUM === "function" && canSeeCUM()) {
    try {
      const snap = await firestore
        .collection("cum_events")
        .orderBy("createdAt", "desc")
        .limit(3)
        .get();

      snap.forEach(d => blocks.push(renderCUMBlock(d.data())));
    } catch (e) {
      console.warn("dashboard cum error", e);
    }
  }

  // ===========================
  // 3) Logs (solo Rey)
  // ===========================
  if (typeof isKing === "function" && isKing()) {
    try {
      const snap = await firestore
        .collection("logs")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      snap.forEach(d => blocks.push(renderLogBlock(d.data())));
    } catch (e) {
      console.warn("dashboard logs error", e);
    }
  }

  if (!blocks.length) {
    feed.innerHTML = `<div class="small">Sin actividad reciente.</div>`;
    return;
  }

  blocks.forEach(b => feed.appendChild(b));
}

// ------------------------------
// UI blocks
// ------------------------------
function renderOrderBlock(o) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.style.padding = "12px";
  div.style.marginBottom = "10px";

  div.innerHTML = `
    <div class="mono small" style="letter-spacing:2px;color:#6b7280">
      COMUNICADO • ${escapeHtml((o.priority || "NORMAL").toUpperCase())} • ${escapeHtml(o.branchId || "—")}
    </div>
    <div style="font-weight:900;margin-top:6px">${escapeHtml(o.title || "—")}</div>
    <div class="small muted" style="margin-top:6px">${escapeHtml(o.body || "")}</div>
  `;
  return div;
}

function renderCUMBlock(e) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.style.padding = "12px";
  div.style.marginBottom = "10px";

  div.innerHTML = `
    <div class="mono small" style="letter-spacing:2px;color:#facc15">
      CUM • ${escapeHtml(e.level || "VERDE")}
    </div>
    <div style="font-weight:900;margin-top:6px">${escapeHtml(e.title || "—")}</div>
    <div class="small muted" style="margin-top:6px">${escapeHtml(e.body || "")}</div>
  `;
  return div;
}

function renderLogBlock(l) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.style.padding = "12px";
  div.style.marginBottom = "10px";

  div.innerHTML = `
    <div class="mono small" style="letter-spacing:2px;color:#86efac">LOG</div>
    <div class="small muted" style="margin-top:6px">
      ${escapeHtml(l.action || "—")} • user: ${escapeHtml(l.userId || "—")}
    </div>
  `;
  return div;
}

function renderWarnBlock(msg) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.style.padding = "12px";
  div.style.marginBottom = "10px";
  div.style.border = "1px solid rgba(239,68,68,.25)";
  div.style.background = "rgba(239,68,68,.06)";

  div.innerHTML = `
    <div style="font-weight:900;color:#fca5a5">Aviso</div>
    <div class="small muted" style="margin-top:6px">${escapeHtml(msg)}</div>
  `;
  return div;
}

function safeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
