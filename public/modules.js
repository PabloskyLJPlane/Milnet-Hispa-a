/* =========================================================
   MILNET Hispaña — modules.js
   Núcleo del sistema
   ---------------------------------------------------------
   Contiene:
   - Helpers globales
   - Seguridad básica
   - Permisos por rango / clearance
   - Logs
   - Validaciones
   - Utilidades compartidas
   ========================================================= */

/* ===============================
   PROTECCIÓN GLOBAL
================================= */
if (typeof window.MILNET !== "object") {
  window.MILNET = {};
}

/* ===============================
   UTILIDADES BÁSICAS
================================= */

/**
 * Escape HTML para evitar XSS
 */
function escapeHtml(input) {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

/**
 * Formato de fecha seguro
 */
function formatDate(ts) {
  try {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("es-ES");
  } catch {
    return "—";
  }
}

/**
 * UID corto para UI
 */
function shortId(id, len = 6) {
  if (!id) return "—";
  return id.slice(0, len).toUpperCase();
}

/* ===============================
   LOGS CENTRALIZADOS
================================= */

/**
 * Registra una acción en Firestore
 */
async function logAction(action, payload = {}) {
  try {
    if (!MILNET.user) return;
    const dbx = db();
    await dbx.collection("logs").add({
      action,
      payload,
      userId: MILNET.user.uid,
      branchId: MILNET.profile?.branchId || "—",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.warn("logAction falló:", err);
  }
}

/* ===============================
   PERMISOS Y ROLES
================================= */

const RANK_LEVELS = {
  soldado: 1,
  cabo: 5,
  sargento: 10,
  teniente: 20,
  capitan: 30,
  comandante: 40,
  coronel: 50,
  general: 70,
  rey: 99
};

/**
 * Nivel numérico del usuario
 */
function rankLevel() {
  return Number(MILNET.profile?.rankLevel || 0);
}

/**
 * ¿Es Rey?
 */
function isKing() {
  return (
    MILNET.profile?.clearance === "KING" ||
    rankLevel() >= 99
  );
}

/**
 * ¿Puede ver todo?
 */
function canSeeAll() {
  return isKing() || rankLevel() >= 70;
}

/**
 * ¿Puede administrar?
 */
function canAdmin() {
  return isKing() || rankLevel() >= 80;
}

/**
 * ¿Puede publicar comunicados?
 */
function canPublishOrders() {
  return isKing() || rankLevel() >= 30;
}

/**
 * ¿Puede crear unidades?
 */
function canCreateUnits() {
  return isKing() || rankLevel() >= 50;
}

function canManageUnits(){
  return isKing() || (MILNET.profile?.rankLevel || 0) >= 50;
}

/* ===============================
   VALIDADORES
================================= */

function requireAuth() {
  if (!MILNET.user) {
    throw new Error("Usuario no autenticado");
  }
}

function requireBranch() {
  if (!MILNET.branch || MILNET.branch === "ALL") {
    throw new Error("Cuerpo no seleccionado");
  }
}

/* ===============================
   HELPERS DE UI
================================= */

function show(el) {
  if (el) el.style.display = "";
}

function hide(el) {
  if (el) el.style.display = "none";
}

function byId(id) {
  return document.getElementById(id);
}

/**
 * Mostrar mensaje de error estándar
 */
function renderError(container, title, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="card" style="padding:14px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.06)">
      <div style="font-weight:900;color:#fca5a5">${escapeHtml(title)}</div>
      <div class="small" style="margin-top:6px">${escapeHtml(message)}</div>
    </div>
  `;
}

/**
 * Mostrar mensaje vacío
 */
function renderEmpty(container, msg) {
  if (!container) return;
  container.innerHTML = `<div class="small muted">${escapeHtml(msg)}</div>`;
}

/* ===============================
   ESTADO GLOBAL MILNET
================================= */

MILNET.branch = "ETH";
MILNET.config = null;
MILNET.profile = null;
MILNET.user = null;

/**
 * Cambiar cuerpo activo
 */
function setBranch(branchId) {
  MILNET.branch = branchId;
  const name = byId("branchName");
  if (name) name.textContent = branchId;

  if (typeof renderUnits === "function") renderUnits();
  if (typeof renderPersonnel === "function") renderPersonnel();
  if (typeof renderOrders === "function") renderOrders();
}

/* ===============================
   CONFIGURACIÓN GENERAL
================================= */

/**
 * Cargar config global (si existe)
 */
async function loadConfig() {
  try {
    const dbx = db();
    const snap = await dbx.collection("config").doc("org").get();
    if (snap.exists) {
      MILNET.config = snap.data();
    }
  } catch (err) {
    console.warn("loadConfig falló:", err);
  }
}

/* ===============================
   PROTECCIÓN DE ERRORES
================================= */

window.addEventListener("error", (e) => {
  console.error("Error global:", e.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Promise rechazada:", e.reason);
});
