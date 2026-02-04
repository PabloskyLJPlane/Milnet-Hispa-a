// =======================================
// ORDERS.JS — Comunicados MILNET (SAFE)
// - Evita índices compuestos Firestore
// - Filtra por cliente
// - Publicación por permisos
// =======================================

let ORDERS_STATE = {
  loading: false,
  lastBranch: null
};

// ------------------------------
// Render Comunicados
// ------------------------------
async function renderOrders() {
  const box = document.getElementById("ordersList");
  if (!box) return;

  box.innerHTML = "Cargando comunicados…";

  try {
    const firestore = db();

    // ✅ SAFE QUERY: solo orderBy + limit
    const snap = await firestore
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));

    // ✅ Filtrado local por branch
    const branch = (MILNET.branch && MILNET.branch !== "ALL") ? MILNET.branch : null;

    const filtered = branch
      ? arr.filter(o => (o.branchId || "") === branch)
      : (canSeeAll?.() ? arr : arr.filter(o => (o.branchId || "") === (MILNET.profile?.branchId || "")));

    if (!filtered.length) {
      box.innerHTML = `<div class="small">No hay comunicados.</div>`;
      return;
    }

    box.innerHTML = "";
    filtered.slice(0, 80).forEach(o => box.appendChild(renderOrderCard(o)));

  } catch (err) {
    console.error("renderOrders error:", err);
    box.innerHTML = `
      <div class="card" style="padding:14px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.06)">
        <div style="font-weight:900;color:#fca5a5">Error cargando comunicados</div>
        <div class="small" style="margin-top:6px;color:#fca5a5">Mira F12 → Console</div>
      </div>
    `;
  }
}

// ------------------------------
// Card
// ------------------------------
function renderOrderCard(o) {
  const div = document.createElement("div");
  div.className = "card fade";
  div.style.padding = "14px";
  div.style.marginBottom = "10px";

  const pr = (o.priority || "NORMAL").toUpperCase();
  const prColor =
    pr === "URGENTE" ? "#ef4444" :
    pr === "ALTA" ? "#facc15" :
    "#9ca3af";

  div.innerHTML = `
    <div class="mono small" style="letter-spacing:2px;color:${prColor}">
      ${escapeHtml(pr)} • ${escapeHtml(o.branchId || "—")} • ${escapeHtml(o.scope || "CUERPO")}
    </div>
    <div style="font-weight:900;margin-top:6px">${escapeHtml(o.title || "—")}</div>
    <div class="small" style="margin-top:6px;color:#cbd5e1">${escapeHtml(o.body || "")}</div>
    <div class="mono small" style="margin-top:10px;color:#6b7280">
      ${o.createdAt ? formatDate(o.createdAt) : "—"} • por ${escapeHtml(o.author || "—")}
    </div>
  `;

  return div;
}

// ------------------------------
// Publicación
// ------------------------------
function canPublishOrders() {
  const p = MILNET.profile || {};
  return isKing?.() || (p.rankLevel || 0) >= 20 || (p.clearance === "OFFICER") || (p.clearance === "HIGH");
}

async function createOrder() {
  try {
    if (!canPublishOrders()) {
      alert("No tienes permiso para publicar.");
      return;
    }

    const priority = document.getElementById("oPriority")?.value || "NORMAL";
    const scope = document.getElementById("oScope")?.value || "CUERPO";
    const title = document.getElementById("oTitle")?.value.trim() || "";
    const body = document.getElementById("oBody")?.value.trim() || "";

    if (!title || !body) return alert("Falta título o contenido.");

    const branchId = (MILNET.branch && MILNET.branch !== "ALL")
      ? MILNET.branch
      : (MILNET.profile?.branchId || "ETH");

    const payload = {
      branchId,
      scope,
      priority,
      title,
      body,
      author: MILNET.profile?.name || MILNET.user?.email || "—",
      authorId: MILNET.user?.uid || "—",
      unitId: MILNET.profile?.unitId || "sin-unidad",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db().collection("orders").add(payload);

    // ✅ log opcional (si existe)
    if (typeof logAction === "function") {
      await logAction("CREATE_ORDER", { branchId, priority, scope, title });
    }

    // limpiar
    document.getElementById("oTitle").value = "";
    document.getElementById("oBody").value = "";
    document.getElementById("ordersCreateBox").style.display = "none";

    renderOrders();

  } catch (err) {
    console.error("createOrder error:", err);
    alert("No se pudo publicar. Mira la consola.");
  }
}
