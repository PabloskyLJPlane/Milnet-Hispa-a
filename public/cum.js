// =======================================
// CUM.JS — Centro Unificado de Mando
// =======================================

let CUM_STATE = {
  unsubscribe: null
};

// ===============================
// Arranque
// ===============================
async function mountCUM() {
  const box = document.getElementById("cumFeed");
  if (!box) return;

  box.innerHTML = "Cargando CUM…";

  if (CUM_STATE.unsubscribe) CUM_STATE.unsubscribe();

  const firestore = db();

  CUM_STATE.unsubscribe = firestore
    .collection("cum_events")
    .orderBy("createdAt", "desc")
    .limit(200)
    .onSnapshot(snap => {
      renderCUMFeed(snap);
    });
}

// ===============================
// Render principal
// ===============================
function renderCUMFeed(snapshot) {
  const box = document.getElementById("cumFeed");
  if (!box) return;

  box.innerHTML = "";

  if (snapshot.empty) {
    box.innerHTML = `<div class="small">Sin eventos.</div>`;
    return;
  }

  const isCommander = canSeeCUM();

  snapshot.forEach(doc => {
    const e = doc.data();
    const div = document.createElement("div");
    div.className = "card fade";
    div.style.padding = "14px";
    div.style.marginBottom = "10px";

    const levelColor =
      e.level === "ROJO" ? "#ef4444" :
      e.level === "AMARILLO" ? "#facc15" :
      "#22c55e";

    div.innerHTML = `
      <div class="mono small" style="letter-spacing:2px;color:${levelColor}">
        ${escapeHtml(e.level || "VERDE")}
      </div>

      <div style="font-weight:900;margin-top:6px">
        ${escapeHtml(e.title || "Evento")}
      </div>

      <div class="small muted" style="margin-top:6px">
        ${escapeHtml(e.body || "")}
      </div>

      <div class="mono small muted" style="margin-top:6px">
        ${formatDate(e.createdAt)} • ${escapeHtml(e.author || "—")}
      </div>
    `;

    box.appendChild(div);
  });

  if (isCommander) renderCUMComposer();
}

// ===============================
// Compositor (solo mandos)
// ===============================
function renderCUMComposer() {
  const box = document.getElementById("cumFeed");
  if (!box) return;

  if (document.getElementById("cumComposer")) return;

  const div = document.createElement("div");
  div.className = "card";
  div.id = "cumComposer";
  div.style.padding = "14px";
  div.style.marginBottom = "12px";

  div.innerHTML = `
    <div class="mono small" style="letter-spacing:2px;color:#6b7280">
      NUEVO EVENTO CUM
    </div>

    <select id="cumLevel" class="input">
      <option value="VERDE">VERDE</option>
      <option value="AMARILLO">AMARILLO</option>
      <option value="ROJO">ROJO</option>
    </select>

    <input id="cumTitle" class="input" placeholder="Título del evento"/>

    <textarea id="cumBody" class="input" style="height:120px"
      placeholder="Descripción…"></textarea>

    <button class="btn" onclick="createCUMEvent()">PUBLICAR</button>
  `;

  box.prepend(div);
}

// ===============================
// Crear evento
// ===============================
async function createCUMEvent() {
  if (!canSeeCUM()) {
    alert("No tienes permiso.");
    return;
  }

  const level = document.getElementById("cumLevel").value;
  const title = document.getElementById("cumTitle").value.trim();
  const body = document.getElementById("cumBody").value.trim();

  if (!title || !body) {
    alert("Falta título o descripción.");
    return;
  }

  const firestore = db();

  await firestore.collection("cum_events").add({
    level,
    title,
    body,
    author: MILNET.profile.name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  logAction("CUM_EVENT", { level, title });

  document.getElementById("cumTitle").value = "";
  document.getElementById("cumBody").value = "";
}
