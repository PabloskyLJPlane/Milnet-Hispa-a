// ========================================
// CHAT.JS — MILNET CHAT SYSTEM
// ========================================

// Estado interno del chat
const CHAT = {
  currentType: null, // "CHANNEL" | "PRIVATE"
  currentId: null,   // channelId o userId
  unsubscribe: null
};

// ===============================
// Inicialización general
// ===============================
function wireChatUI() {
  const select = document.getElementById("channelSelect");
  if (!select) return;

  select.onchange = () => {
    const val = select.value;
    if (!val) return;

    if (val.startsWith("P:")) {
      openPrivateChat(val.replace("P:", ""));
    } else {
      openChannel(val);
    }
  };

  const form = document.getElementById("chatForm");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      await sendChatMessage();
    };
  }
}

// ===============================
// Cargar canales + privados
// ===============================
async function refreshChannels() {
  const select = document.getElementById("channelSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Cargando canales…</option>`;
  const firestore = db();

  const options = [];

  // --- Canal general del cuerpo
  options.push({
    id: `branch-${MILNET.branch}`,
    label: `📢 ${MILNET.branch} • General`
  });

  // --- Canal de unidad
  if (MILNET.profile.unitId && MILNET.profile.unitId !== "sin-unidad") {
    options.push({
      id: `unit-${MILNET.profile.unitId}`,
      label: `🪖 Unidad • ${MILNET.profile.unitId}`
    });
  }

  // --- Alto mando
  if (canSeeHighCommand()) {
    options.push({
      id: `high-command`,
      label: `⭐ Alto Mando`
    });
  }

  // --- CUM
  if (canSeeCUM()) {
    options.push({
      id: `cum`,
      label: `🚨 CUM`
    });
  }

  // --- Chats privados
  try {
    const usersSnap = await firestore
      .collection("users")
      .where("branchId", "==", MILNET.profile.branchId)
      .limit(100)
      .get();

    usersSnap.forEach(doc => {
      if (doc.id === MILNET.user.uid) return;
      const u = doc.data();
      options.push({
        id: `P:${doc.id}`,
        label: `💬 ${u.name || doc.id}`
      });
    });

  } catch (err) {
    console.error("refreshChannels error:", err);
  }

  // Pintar
  select.innerHTML = `<option value="">Selecciona chat…</option>`;
  options.forEach(o => {
    select.appendChild(new Option(o.label, o.id));
  });
}

// ===============================
// Abrir canal público
// ===============================
function openChannel(channelId) {
  cleanupChat();
  CHAT.currentType = "CHANNEL";
  CHAT.currentId = channelId;

  document.getElementById("chatMeta").textContent =
    `Canal: ${channelId}`;

  listenMessages(
    db().collection("channels").doc(channelId).collection("messages")
  );
}

// ===============================
// Abrir chat privado
// ===============================
function openPrivateChat(otherUserId) {
  cleanupChat();
  CHAT.currentType = "PRIVATE";
  CHAT.currentId = otherUserId;

  const uid = MILNET.user.uid;
  const chatId = uid < otherUserId
    ? `${uid}_${otherUserId}`
    : `${otherUserId}_${uid}`;

  document.getElementById("chatMeta").textContent =
    `Chat privado`;

  listenMessages(
    db().collection("privateChats").doc(chatId).collection("messages")
  );
}

// ===============================
// Escuchar mensajes
// ===============================
function listenMessages(ref) {
  const box = document.getElementById("chatBox");
  const input = document.getElementById("chatInput");
  const btn = document.getElementById("sendBtn");

  box.innerHTML = "Cargando mensajes…";
  input.disabled = false;
  btn.disabled = false;

  CHAT.unsubscribe = ref
    .orderBy("createdAt", "asc")
    .limit(200)
    .onSnapshot(snap => {
      box.innerHTML = "";
      snap.forEach(doc => {
        renderMessage(doc.data());
      });
      box.scrollTop = box.scrollHeight;
    });
}

// ===============================
// Render mensaje individual
// ===============================
function renderMessage(m) {
  const box = document.getElementById("chatBox");
  const mine = m.uid === MILNET.user.uid;

  const div = document.createElement("div");
  div.style.marginBottom = "8px";
  div.style.textAlign = mine ? "right" : "left";

  div.innerHTML = `
    <div style="
      display:inline-block;
      max-width:80%;
      padding:10px 12px;
      border-radius:14px;
      background:${mine ? "rgba(99,102,241,.25)" : "rgba(17,17,20,.8)"};
      border:1px solid rgba(148,163,184,.12);
    ">
      <div class="small mono" style="opacity:.7">
        ${escapeHtml(m.name || "—")}
      </div>
      <div>${escapeHtml(m.text)}</div>
    </div>
  `;

  box.appendChild(div);
}

// ===============================
// Enviar mensaje
// ===============================
async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  let ref;

  if (CHAT.currentType === "CHANNEL") {
    ref = db().collection("channels")
      .doc(CHAT.currentId)
      .collection("messages");
  }

  if (CHAT.currentType === "PRIVATE") {
    const uid = MILNET.user.uid;
    const other = CHAT.currentId;
    const chatId = uid < other ? `${uid}_${other}` : `${other}_${uid}`;

    ref = db().collection("privateChats")
      .doc(chatId)
      .collection("messages");
  }

  if (!ref) return;

  await ref.add({
    uid: MILNET.user.uid,
    name: MILNET.profile.name,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
}

// ===============================
// Limpieza
// ===============================
function cleanupChat() {
  if (CHAT.unsubscribe) {
    CHAT.unsubscribe();
    CHAT.unsubscribe = null;
  }
}

// ===============================
// Permisos
// ===============================
function canSeeHighCommand() {
  return (MILNET.profile.rankLevel || 0) >= 6;
}

function canSeeCUM() {
  return (MILNET.profile.clearance === "KING") ||
         ((MILNET.profile.rankLevel || 0) >= 8);
}
// =======================================
// PATCH PERMISOS — evita crash por null
// =======================================

function isKing(){
  const p = MILNET.profile || {};
  return (p.clearance === "KING") || ((p.rankLevel||0) >= 99);
}

function canSeeAll(){
  const p = MILNET.profile || {};
  return isKing() || (p.clearance === "HIGH") || ((p.rankLevel||0) >= 60);
}

function canSeeCUM(){
  const p = MILNET.profile || {};
  // ✅ importante: NO leer clearance si profile es null
  return isKing() || (p.clearance === "HIGH") || ((p.rankLevel||0) >= 40);
}
