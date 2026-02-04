// ==========================================
// ADMIN.JS — Panel Rey (MILNET)
// Router propio + Gestión global
// ==========================================

const ADMIN = {
  pages: {},
  ready: false,
  user: null,
  profile: null
};

// ---------- Router ----------
function adminRegister(id){
  const el = document.getElementById(id);
  if (el) ADMIN.pages[id] = el;
}

function adminOpenTab(id){
  if (!ADMIN.ready) return;

  Object.keys(ADMIN.pages).forEach(k=>{
    ADMIN.pages[k].classList.remove("active");
    ADMIN.pages[k].style.display = "none";
  });

  const page = ADMIN.pages[id];
  if(!page){
    console.warn("Admin página inexistente:", id);
    return;
  }

  page.style.display = "block";
  page.classList.add("active");

  // Hooks
  if (id === "aDash") adminRefreshAll();
  if (id === "aUsers") adminRenderUsers();
  if (id === "aUnits") adminRenderUnits();
  if (id === "aOrders") adminRenderOrders();
  if (id === "aCUM") adminRenderCUM();
  if (id === "aOps") adminRenderOps();
  if (id === "aSettings") adminDiagnostics();
}

function adminInit(){
  [
    "aDash","aUsers","aUnits","aOrders","aCUM","aOps","aSettings"
  ].forEach(adminRegister);

  ADMIN.ready = true;
  adminOpenTab("aDash");
}

// ---------- Seguridad ----------
function adminIsKing(p){
  return (p?.clearance === "KING") || ((p?.rankLevel||0) >= 99);
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", async () => {
  const auth = initFirebase();
  const firestore = db();

  auth.onAuthStateChanged(async (user)=>{
    if(!user) return location.href="login.html";
    ADMIN.user = user;

    // cargar perfil
    const snap = await firestore.collection("users").doc(user.uid).get();
    ADMIN.profile = snap.data() || {};

    if(!adminIsKing(ADMIN.profile)){
      alert("Acceso denegado. Solo el Rey.");
      return location.href="app.html";
    }

    document.getElementById("adminWho").textContent =
      `${ADMIN.profile.name || user.email} • KING`;

    document.getElementById("adminScope").textContent =
      `SCOPE: GLOBAL`;

    // logout
    document.getElementById("adminLogout").onclick = async ()=>{
      await auth.signOut();
      location.href="login.html";
    };

    adminInit();
  });
});

// ==========================================
// DASHBOARD ADMIN
// ==========================================

async function adminRefreshAll(){
  await Promise.all([
    adminRenderKPIs(),
    adminRenderLogs()
  ]);
}

async function adminRenderKPIs(){
  const firestore = db();

  // Usuarios
  const uSnap = await firestore.collection("users").limit(500).get();
  document.getElementById("kUsers").textContent = uSnap.size;
  document.getElementById("kUsersSub").textContent = "Total registrados";

  // Unidades
  const unSnap = await firestore.collection("units").limit(500).get();
  document.getElementById("kUnits").textContent = unSnap.size;
  document.getElementById("kUnitsSub").textContent = "Total unidades";

  // Orders
  const oSnap = await firestore.collection("orders").limit(500).get();
  document.getElementById("kOrders").textContent = oSnap.size;
  document.getElementById("kOrdersSub").textContent = "Comunicados totales";

  // CUM
  const cSnap = await firestore.collection("cum_events").limit(500).get();
  document.getElementById("kCUM").textContent = cSnap.size;
  document.getElementById("kCUMSub").textContent = "Eventos totales";
}

async function adminRenderLogs(){
  const box = document.getElementById("adminLogs");
  if(!box) return;
  box.innerHTML = "Cargando…";

  try{
    const snap = await db().collection("logs").orderBy("createdAt","desc").limit(12).get();
    if(snap.empty){
      box.innerHTML = "<div class='small muted'>Sin logs.</div>";
      return;
    }

    box.innerHTML = "";
    snap.forEach(d=>{
      const l = d.data()||{};
      const div = document.createElement("div");
      div.className="card fade";
      div.style.padding="12px";
      div.style.marginBottom="10px";
      div.innerHTML = `
        <div class="mono small" style="letter-spacing:2px;color:#86efac">LOG</div>
        <div style="font-weight:900;margin-top:6px">${escapeHtml(l.action||"—")}</div>
        <div class="small muted" style="margin-top:6px">
          user: ${escapeHtml(l.userId||"—")} • branch: ${escapeHtml(l.branchId||"—")}
        </div>
      `;
      box.appendChild(div);
    });
  }catch(e){
    console.error(e);
    box.innerHTML="<div class='small'>Error logs</div>";
  }
}

// ==========================================
// USERS — listar y editar
// ==========================================

async function adminRenderUsers(useSearch=false){
  const box = document.getElementById("usersTable");
  if(!box) return;
  box.innerHTML="Cargando usuarios…";

  const firestore = db();
  const q = await firestore.collection("users").limit(250).get();

  let arr=[];
  q.forEach(d=>arr.push({id:d.id, ...d.data()}));

  // búsqueda
  if(useSearch){
    const s = (document.getElementById("uSearch").value||"").toLowerCase().trim();
    if(s){
      arr = arr.filter(u =>
        (u.name||"").toLowerCase().includes(s) ||
        (u.email||"").toLowerCase().includes(s) ||
        (u.branchId||"").toLowerCase().includes(s)
      );
    }
  }

  // ordenar por rank
  arr.sort((a,b)=>(b.rankLevel||0)-(a.rankLevel||0));

  box.innerHTML = `
    <table class="tbl">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Cuerpo</th>
          <th>Unidad</th>
          <th>Rango</th>
          <th>Lvl</th>
          <th>Clearance</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="usersBody"></tbody>
    </table>
  `;

  const body = document.getElementById("usersBody");
  arr.forEach(u=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${escapeHtml(u.name||"—")}</td>
      <td>${escapeHtml(u.email||"—")}</td>
      <td>
        <select class="input" style="margin-top:0;max-width:120px" data-k="branchId" data-id="${u.id}">
          ${["ETH","EAEH","ARM","PMH","GCH"].map(b=>`<option ${u.branchId===b?"selected":""}>${b}</option>`).join("")}
        </select>
      </td>
      <td><input class="input" style="margin-top:0;max-width:170px" data-k="unitId" data-id="${u.id}" value="${escapeHtml(u.unitId||"sin-unidad")}"/></td>
      <td><input class="input" style="margin-top:0;max-width:140px" data-k="rankId" data-id="${u.id}" value="${escapeHtml(u.rankId||"—")}"/></td>
      <td><input class="input" style="margin-top:0;max-width:70px" data-k="rankLevel" data-id="${u.id}" value="${escapeHtml(u.rankLevel||0)}"/></td>
      <td>
        <select class="input" style="margin-top:0;max-width:140px" data-k="clearance" data-id="${u.id}">
          ${["BASIC","OFFICER","HIGH","KING"].map(c=>`<option ${u.clearance===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </td>
      <td class="row">
        <button class="btn btn2" style="max-width:120px" onclick="adminSaveUser('${u.id}')">GUARDAR</button>
        <button class="btn btndanger" style="max-width:120px" onclick="adminResetPass('${escapeHtml(u.email||"")}')">RESET</button>
      </td>
    `;
    body.appendChild(tr);
  });

  // hint
  if(!arr.length){
    box.innerHTML="<div class='small muted'>No hay resultados.</div>";
  }
}

async function adminSaveUser(userId){
  const firestore=db();

  const fields = Array.from(document.querySelectorAll(`[data-id="${userId}"]`));
  const patch={};
  fields.forEach(el=>{
    const k = el.getAttribute("data-k");
    let v = el.value;
    if(k==="rankLevel") v = Number(v||0);
    patch[k]=v;
  });

  await firestore.collection("users").doc(userId).set(patch,{merge:true});
  await logAction("ADMIN_UPDATE_USER",{userId, patch});
  alert("✅ Guardado.");
}

async function adminResetPass(email){
  if(!email){ alert("No hay email."); return; }
  try{
    await firebase.auth().sendPasswordResetEmail(email);
    await logAction("ADMIN_RESET_PASSWORD",{email});
    alert("✅ Enviado email de reset.");
  }catch(e){
    console.error(e);
    alert("No se pudo enviar reset (revisa consola).");
  }
}

// ==========================================
// UNITS — Crear/Listar/Eliminar
// ==========================================

function adminToggleUnitCreate(on){
  document.getElementById("unitCreateBox").style.display = on ? "block" : "none";
}

async function adminCreateUnit(){
  const branchId = document.getElementById("auBranch").value;
  const type = document.getElementById("auType").value.trim();
  const name = document.getElementById("auName").value.trim();
  const base = document.getElementById("auBase").value.trim();

  if(!type || !name) return alert("Falta tipo o nombre.");

  await db().collection("units").add({
    branchId,type,name,base,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: ADMIN.user.uid
  });

  await logAction("ADMIN_CREATE_UNIT",{branchId,type,name});
  adminToggleUnitCreate(false);
  adminRenderUnits();
}

async function adminRenderUnits(){
  const box=document.getElementById("unitsTable");
  if(!box) return;
  box.innerHTML="Cargando unidades…";

  const snap = await db().collection("units").limit(400).get();
  const arr=[];
  snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
  arr.sort((a,b)=>(a.branchId||"").localeCompare(b.branchId||"") || (a.name||"").localeCompare(b.name||""));

  box.innerHTML=`
    <table class="tbl">
      <thead><tr>
        <th>ID</th><th>Cuerpo</th><th>Tipo</th><th>Nombre</th><th>Base</th><th>Acción</th>
      </tr></thead>
      <tbody id="unitsBody"></tbody>
    </table>
  `;

  const body=document.getElementById("unitsBody");
  arr.forEach(u=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td class="mono">${escapeHtml(u.id)}</td>
      <td><span class="tag">${escapeHtml(u.branchId||"—")}</span></td>
      <td>${escapeHtml(u.type||"—")}</td>
      <td style="font-weight:800">${escapeHtml(u.name||"—")}</td>
      <td>${escapeHtml(u.base||"—")}</td>
      <td><button class="btn btndanger" style="max-width:140px" onclick="adminDeleteUnit('${u.id}')">ELIMINAR</button></td>
    `;
    body.appendChild(tr);
  });

  if(!arr.length) box.innerHTML="<div class='small muted'>Sin unidades.</div>";
}

async function adminDeleteUnit(id){
  if(!confirm("¿Eliminar unidad?")) return;
  await db().collection("units").doc(id).delete();
  await logAction("ADMIN_DELETE_UNIT",{id});
  adminRenderUnits();
}

// ==========================================
// ORDERS — listar y borrar
// ==========================================

async function adminRenderOrders(){
  const box=document.getElementById("ordersTable");
  if(!box) return;
  box.innerHTML="Cargando comunicados…";

  const snap = await db().collection("orders").orderBy("createdAt","desc").limit(80).get();
  if(snap.empty){ box.innerHTML="<div class='small muted'>Sin comunicados.</div>"; return; }

  box.innerHTML=`
    <table class="tbl">
      <thead><tr>
        <th>Fecha</th><th>Cuerpo</th><th>Prioridad</th><th>Título</th><th>Acción</th>
      </tr></thead>
      <tbody id="ordersBody"></tbody>
    </table>
  `;

  const body=document.getElementById("ordersBody");
  snap.forEach(d=>{
    const o=d.data()||{};
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${escapeHtml(o.createdAt ? formatDate(o.createdAt) : "—")}</td>
      <td><span class="tag">${escapeHtml(o.branchId||"—")}</span></td>
      <td>${escapeHtml(o.priority||"—")}</td>
      <td style="font-weight:800">${escapeHtml(o.title||"—")}</td>
      <td><button class="btn btndanger" style="max-width:140px" onclick="adminDeleteOrder('${d.id}')">ELIMINAR</button></td>
    `;
    body.appendChild(tr);
  });
}

async function adminDeleteOrder(id){
  if(!confirm("¿Eliminar comunicado?")) return;
  await db().collection("orders").doc(id).delete();
  await logAction("ADMIN_DELETE_ORDER",{id});
  adminRenderOrders();
}

// ==========================================
// CUM — listar y borrar
// ==========================================

async function adminRenderCUM(){
  const box=document.getElementById("cumTable");
  if(!box) return;
  box.innerHTML="Cargando CUM…";

  const snap = await db().collection("cum_events").orderBy("createdAt","desc").limit(80).get();
  if(snap.empty){ box.innerHTML="<div class='small muted'>Sin eventos CUM.</div>"; return; }

  box.innerHTML=`
    <table class="tbl">
      <thead><tr>
        <th>Fecha</th><th>Nivel</th><th>Título</th><th>Autor</th><th>Acción</th>
      </tr></thead>
      <tbody id="cumBody"></tbody>
    </table>
  `;

  const body=document.getElementById("cumBody");
  snap.forEach(d=>{
    const e=d.data()||{};
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${escapeHtml(e.createdAt ? formatDate(e.createdAt) : "—")}</td>
      <td><span class="tag">${escapeHtml(e.level||"—")}</span></td>
      <td style="font-weight:800">${escapeHtml(e.title||"—")}</td>
      <td>${escapeHtml(e.author||"—")}</td>
      <td><button class="btn btndanger" style="max-width:140px" onclick="adminDeleteCUM('${d.id}')">ELIMINAR</button></td>
    `;
    body.appendChild(tr);
  });
}

async function adminDeleteCUM(id){
  if(!confirm("¿Eliminar evento CUM?")) return;
  await db().collection("cum_events").doc(id).delete();
  await logAction("ADMIN_DELETE_CUM",{id});
  adminRenderCUM();
}

// ==========================================
// OPS — modo sin índices (safe)
// ==========================================

async function adminRenderOps(){
  const box=document.getElementById("opsTable");
  if(!box) return;
  box.innerHTML="Cargando operaciones…";

  // Modo seguro: solo orderBy, sin where+orderBy (evita index)
  try{
    const snap = await db().collection("operations").orderBy("createdAt","desc").limit(80).get();

    if(snap.empty){
      box.innerHTML="<div class='small muted'>Sin operaciones.</div>";
      return;
    }

    box.innerHTML=`
      <table class="tbl">
        <thead><tr>
          <th>Fecha</th><th>Scope</th><th>Cuerpo</th><th>Nombre</th><th>Estado</th>
        </tr></thead>
        <tbody id="opsBody"></tbody>
      </table>
    `;

    const body=document.getElementById("opsBody");
    snap.forEach(d=>{
      const o=d.data()||{};
      const tr=document.createElement("tr");
      tr.innerHTML=`
        <td>${escapeHtml(o.createdAt ? formatDate(o.createdAt) : "—")}</td>
        <td>${escapeHtml(o.scope||"—")}</td>
        <td><span class="tag">${escapeHtml(o.scopeBranch||"—")}</span></td>
        <td style="font-weight:800">${escapeHtml(o.name||"—")}</td>
        <td>${escapeHtml(o.status||"—")}</td>
      `;
      body.appendChild(tr);
    });
  }catch(e){
    console.error(e);
    box.innerHTML="<div class='small'>Error operaciones (mira consola).</div>";
  }
}

// ==========================================
// SETTINGS — config + diagnóstico
// ==========================================

async function adminLoadConfig(){
  const cfg = document.getElementById("cfgBox");
  cfg.textContent="Cargando…";
  const snap = await db().collection("config").doc("org").get();
  cfg.textContent = JSON.stringify(snap.data()||{},null,2);
}

function adminDiagnostics(){
  const box = document.getElementById("diagBox");
  if(!box) return;

  const p = ADMIN.profile||{};
  box.innerHTML = `
    <div>UID: <span class="mono">${escapeHtml(ADMIN.user?.uid||"—")}</span></div>
    <div>Email: <span class="mono">${escapeHtml(ADMIN.user?.email||"—")}</span></div>
    <div>Clearance: <span class="mono">${escapeHtml(p.clearance||"—")}</span></div>
    <div>RankLevel: <span class="mono">${escapeHtml(p.rankLevel||0)}</span></div>
    <div>Firestore OK: <span class="mono">Sí (si no hay errores arriba)</span></div>
  `;
}
