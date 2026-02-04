// operations.js — Operaciones (sin índices compuestos)

function mountOperations() {
  renderOperations();
}
window.mountOperations = mountOperations;

function opVisible(op) {
  const p = MILNET.profile || {};

  if (MILNET.branch !== "ALL") {
    const b = MILNET.branch;
    if ((op.scopeBranch || op.branchId || "") !== b) return false;
  } else {
    if (!canSeeAll()) return false;
  }

  if (op.scope === "UNIDAD" && !canSeeAll()) {
    return (op.scopeUnitId || "") === (p.unitId || "sin-unidad");
  }

  return true;
}

async function renderOperations() {
  const box = document.getElementById("opsList");
  if (!box) return;

  box.innerHTML = "Cargando operaciones…";

  try {
    const firestore = db();

    const snap = await firestore.collection("operations")
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();

    let arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...(d.data() || {}) }));
    arr = arr.filter(opVisible);

    if (!arr.length) {
      box.innerHTML = "<div class='small'>No hay operaciones visibles.</div>";
      return;
    }

    box.innerHTML = "";
    arr.slice(0, 80).forEach(op => {
      const when = op.createdAt?.toDate ? op.createdAt.toDate().toLocaleString("es-ES") : "";
      const status = (op.status || "ACTIVA").toUpperCase();
      const c = status === "ACTIVA" ? "#86efac" : status === "PAUSADA" ? "#fbbf24" : "#fca5a5";

      const div = document.createElement("div");
      div.className = "card fade";
      div.style.padding = "14px";
      div.style.marginBottom = "10px";

      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="flex:1">
            <div style="font-weight:900">${escapeHtml(op.name || "Operación")}</div>
            <div class="small muted" style="margin-top:6px">
              estado: <span style="color:${c}">${escapeHtml(status)}</span>
              • ${escapeHtml(op.scope || "CUERPO")}
              • ${escapeHtml(op.scopeBranch || op.branchId || "")}
            </div>
          </div>
          <div class="mono small" style="color:#6b7280">${escapeHtml(when)}</div>
        </div>
        ${op.notes ? `<div class="small" style="white-space:pre-wrap;margin-top:10px">${escapeHtml(op.notes)}</div>` : ""}
      `;
      box.appendChild(div);
    });

  } catch (err) {
    console.error("renderOperations error:", err);
    box.innerHTML = "<div class='small'>Error cargando operaciones. Mira F12 → Console.</div>";
  }
}
window.renderOperations = renderOperations;
