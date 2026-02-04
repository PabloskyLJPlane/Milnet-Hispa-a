// =================================
// PERSONNEL.JS — Personal Militar
// =================================

async function renderPersonnel() {
  const box = document.getElementById("peopleList");
  if (!box) return;

  box.innerHTML = "Cargando personal…";
  const firestore = db();

  try {
    let ref = firestore.collection("users");

    if (MILNET.branch !== "ALL") {
      ref = ref.where("branchId", "==", MILNET.branch);
    } else if (!canSeeAll()) {
      box.innerHTML = "<div class='small'>Sin permiso global.</div>";
      return;
    }

    const snap = await ref.limit(300).get();

    if (snap.empty) {
      box.innerHTML = "<div class='small'>No hay personal.</div>";
      return;
    }

    const arr = [];
    snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
    arr.sort((a, b) => (b.rankLevel || 0) - (a.rankLevel || 0));

    box.innerHTML = "";

    arr.forEach(p => {
      const div = document.createElement("div");
      div.className = "card fade";
      div.style.padding = "14px";
      div.style.marginBottom = "10px";

      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:900">
              ${escapeHtml(p.name || "Sin nombre")}
            </div>
            <div class="small">
              ${escapeHtml(p.branchId)} • ${escapeHtml(p.rankId)}
              <span class="mono small muted">
                • unidad: ${escapeHtml(p.unitId || "sin-unidad")}
              </span>
            </div>
          </div>
          <div class="mono small" style="color:#86efac">
            ${escapeHtml(p.clearance || "BASIC")}
          </div>
        </div>
      `;

      box.appendChild(div);
    });

  } catch (err) {
    console.error("renderPersonnel error:", err);
    box.innerHTML = "<div class='small'>Error cargando personal.</div>";
  }
}
