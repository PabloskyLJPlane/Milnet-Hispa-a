// ===============================
// UNITS.JS — Gestión de Unidades
// ===============================

let UNIT_INDEX = {}; // cache

async function loadUnitIndex() {
  const firestore = db();
  UNIT_INDEX = {};

  let ref = firestore.collection("units");
  if (MILNET.branch !== "ALL") {
    ref = ref.where("branchId", "==", MILNET.branch);
  }

  const snap = await ref.limit(500).get();
  snap.forEach(doc => {
    const d = doc.data() || {};
    UNIT_INDEX[doc.id] = {
      name: d.name || doc.id,
      type: d.type || "UNIDAD",
      base: d.base || "—",
      branchId: d.branchId || ""
    };
  });
}

// Render principal
async function renderUnits() {
  const list = document.getElementById("unitsList");
  if (!list) return;

  list.innerHTML = "Cargando unidades…";

  try {
    await loadUnitIndex();
    const keys = Object.keys(UNIT_INDEX);

    if (!keys.length) {
      list.innerHTML = "<div class='small'>No hay unidades.</div>";
      return;
    }

    list.innerHTML = "";

    keys.forEach(id => {
      const u = UNIT_INDEX[id];
      const div = document.createElement("div");
      div.className = "card fade";
      div.style.padding = "14px";
      div.style.marginBottom = "10px";

      div.innerHTML = `
        <div class="mono small" style="letter-spacing:2px;color:#6b7280">
          ${escapeHtml(u.branchId)} • ${escapeHtml(u.type)}
        </div>
        <div style="font-weight:900;margin-top:6px">
          ${escapeHtml(u.name)}
        </div>
        <div class="small muted" style="margin-top:4px">
          Base: ${escapeHtml(u.base)} • ID: ${id}
        </div>
      `;

      list.appendChild(div);
    });

  } catch (err) {
    console.error("renderUnits error:", err);
    list.innerHTML = "<div class='small'>Error cargando unidades.</div>";
  }
}

// Crear unidad (solo mandos)
async function createUnit() {
  if (!canManageUnits()) {
    alert("No tienes permiso para crear unidades.");
    return;
  }

  const type = document.getElementById("uType").value.trim();
  const name = document.getElementById("uName").value.trim();
  const base = document.getElementById("uBase").value.trim();

  if (!type || !name) {
    alert("Falta tipo o nombre.");
    return;
  }

  const firestore = db();
  await firestore.collection("units").add({
    branchId: MILNET.branch,
    type,
    name,
    base,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: MILNET.user.uid
  });

  logAction("CREATE_UNIT", { name, type, base });
  renderUnits();
}
