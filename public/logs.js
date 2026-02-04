// logs.js — auditoría (sin índices)

async function logAction(action, meta){
  try{
    const firestore = db();
    await firestore.collection("logs").add({
      action,
      meta: meta || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid: MILNET.user?.uid || "",
      name: MILNET.profile?.name || "",
      branchId: MILNET.profile?.branchId || "",
      unitId: MILNET.profile?.unitId || "sin-unidad",
      rankId: MILNET.profile?.rankId || "",
      rankLevel: MILNET.profile?.rankLevel || 0
    });
  }catch(e){
    console.warn("logAction failed:", e);
  }
}

async function renderLogs(){
  const box = document.getElementById("logsList");
  if (!box) return;

  box.innerHTML = "Cargando registro…";

  try{
    const firestore = db();

    // ✅ solo orderBy (sin where) para evitar índices
    const snap = await firestore.collection("logs")
      .orderBy("createdAt","desc")
      .limit(200)
      .get();

    if (snap.empty){
      box.innerHTML = "<div class='small'>Sin eventos aún.</div>";
      return;
    }

    // filtrado local por cuerpo si no es ALL
    let arr = [];
    snap.forEach(d=>arr.push({id:d.id, ...(d.data()||{})}));

    if (MILNET.branch !== "ALL"){
      arr = arr.filter(l => (l.branchId||"") === MILNET.branch);
    }else{
      if (!canSeeAll()){
        box.innerHTML = "<div class='small'>Sin permiso GLOBAL.</div>";
        return;
      }
    }

    if (!arr.length){
      box.innerHTML = "<div class='small'>No hay eventos para este cuerpo.</div>";
      return;
    }

    box.innerHTML = "";
    arr.slice(0,100).forEach(l=>{
      const when = l.createdAt?.toDate ? l.createdAt.toDate().toLocaleString() : "";
      const div = document.createElement("div");
      div.className = "card fade";
      div.style.padding="12px";
      div.style.marginBottom="10px";
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div style="font-weight:900">${escapeHtml(l.action||"EVENTO")}</div>
          <div class="mono small" style="color:#6b7280">${escapeHtml(when)}</div>
        </div>
        <div class="small" style="color:#9ca3af;margin-top:4px">
          ${escapeHtml(l.name||"—")} • ${escapeHtml(l.branchId||"")} • unidad: ${escapeHtml(l.unitId||"sin-unidad")} • ${escapeHtml(l.rankId||"")}
        </div>
        <div class="small" style="margin-top:8px;color:#cbd5e1;white-space:pre-wrap">
          ${escapeHtml(JSON.stringify(l.meta||{}, null, 2))}
        </div>
      `;
      box.appendChild(div);
    });

  }catch(err){
    console.error("renderLogs error:", err);
    box.innerHTML = "<div class='small'>Error cargando logs. Mira F12 → Console.</div>";
  }
}
