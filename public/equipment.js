// equipment.js - Gestión de equipos

// Verificar dependencias
if (typeof window.escapeHtml !== 'function') {
  window.escapeHtml = function(str) {
    return (str || '').replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  };
}

// El resto del archivo permanece igual...
async function renderEquipment(){
  const firestore = db();
  const box = document.getElementById("equipList");
  box.innerHTML = "Cargando equipos…";

  try {
    const unitId = (MILNET.profile?.unitId || "sin-unidad");
    const q = await firestore.collection("equipment")
      .where("branchId","==", MILNET.branch)
      .where("unitId","==", unitId)
      .limit(300)
      .get();

    if (q.empty){
      box.innerHTML = "<div class='small'>No hay equipos registrados para tu unidad en este cuerpo.</div>";
      return;
    }

    const arr = [];
    q.forEach(d => arr.push({ id:d.id, ...d.data() }));
    arr.sort((a,b)=> (a.status||"").localeCompare(b.status||"") || (a.type||"").localeCompare(b.type||""));

    box.innerHTML = "";
    arr.forEach(e=>{
      const div = document.createElement("div");
      div.className = "card fade";
      div.style.padding="14px";
      div.style.marginBottom="10px";
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div>
            <div class="mono small" style="letter-spacing:2px;color:#6b7280">${e.type || "EQUIPO"}</div>
            <div style="font-weight:900;margin-top:6px">${e.name || "(sin nombre)"}</div>
            <div class="small" style="margin-top:4px">
              Serie: ${e.serial || "—"} • Estado: <b>${e.status || "—"}</b>
            </div>
          </div>
          <button class="btn btn2" style="max-width:160px;padding:10px;margin-top:0"
            onclick="openEquipEdit('${e.id}')">EDITAR</button>
        </div>
        ${e.notes ? `<div class="small" style="margin-top:8px;color:#9ca3af">${escapeHtml(e.notes)}</div>` : ""}
      `;
      box.appendChild(div);
    });

  } catch (err){
    console.error("equip error", err);
    box.innerHTML = `<div class="small" style="color:#fca5a5">Error cargando equipos. Mira F12 → Console.</div>`;
  }
}

async function createEquipment(){
  const firestore = db();

  const type = document.getElementById("eqType").value.trim();
  const name = document.getElementById("eqName").value.trim();
  const serial = document.getElementById("eqSerial").value.trim();
  const status = document.getElementById("eqStatus").value;
  const notes = document.getElementById("eqNotes").value.trim();

  if (!type || !name) return alert("Falta tipo o nombre.");

  try{
    await firestore.collection("equipment").add({
      branchId: MILNET.branch,
      unitId: (MILNET.profile?.unitId || "sin-unidad"),
      type, name,
      serial: serial || "",
      status: status || "OPERATIVO",
      notes: notes || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: MILNET.user.uid
    });

    document.getElementById("eqType").value="";
    document.getElementById("eqName").value="";
    document.getElementById("eqSerial").value="";
    document.getElementById("eqStatus").value="OPERATIVO";
    document.getElementById("eqNotes").value="";
    document.getElementById("equipCreateBox").style.display="none";

    renderEquipment();
  }catch(err){
    console.error(err);
    alert("No se pudo crear el equipo. Revisa reglas.");
  }
}

// editor simple (status/notes)
async function openEquipEdit(id){
  const firestore = db();
  const snap = await firestore.collection("equipment").doc(id).get();
  if (!snap.exists) return alert("No existe.");
  const e = snap.data();

  document.getElementById("eqEditId").value = id;
  document.getElementById("eqEditStatus").value = e.status || "OPERATIVO";
  document.getElementById("eqEditNotes").value = e.notes || "";
  document.getElementById("equipEditBox").style.display = "block";
}

async function saveEquipEdit(){
  const firestore = db();
  const id = document.getElementById("eqEditId").value;
  const status = document.getElementById("eqEditStatus").value;
  const notes = document.getElementById("eqEditNotes").value.trim();

  await firestore.collection("equipment").doc(id).set({
    status, notes
  }, { merge:true });

  document.getElementById("equipEditBox").style.display="none";
  renderEquipment();
}
