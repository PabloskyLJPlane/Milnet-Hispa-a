/* ==========================================================
   MILNET Hispaña — milnet.js (actualizado)
   - SOLO inicializa MILNET si existe pageDash en el DOM
========================================================== */

if (!window.MILNET) window.MILNET = {};
MILNET.ready = false;
MILNET.branch = MILNET.branch || "ETH";
MILNET.pages = {};
MILNET.lastTab = null;

function registerPage(id) {
  const el = document.getElementById(id);
  if (el) MILNET.pages[id] = el;
}

function initMILNET() {
  // ✅ Guard: si esto no existe, no es app.html
  if (!document.getElementById("pageDash")) {
    // No hacemos nada (admin.html u otra página)
    return;
  }

  [
    "pageDash",
    "pageUnits",
    "pagePeople",
    "pageChat",
    "pageEquip",
    "pageOrders",
    "pageCUM"
  ].forEach(registerPage);

  MILNET.ready = true;
  openTab("pageDash");
}

function openTab(tabId) {
  if (!MILNET.ready) return;

  Object.values(MILNET.pages).forEach(p => p.style.display = "none");

  const page = MILNET.pages[tabId];
  if (!page) {
    console.warn("Página inexistente:", tabId);
    return;
  }

  page.style.display = "block";
  MILNET.lastTab = tabId;

  // Hooks
  if (tabId === "pageUnits" && typeof renderUnits === "function") renderUnits();
  if (tabId === "pagePeople" && typeof renderPersonnel === "function") renderPersonnel();
  if (tabId === "pageEquip" && typeof renderEquipment === "function") renderEquipment();
  if (tabId === "pageOrders" && typeof renderOrders === "function") renderOrders();
  if (tabId === "pageCUM" && typeof mountCUM === "function") mountCUM();
  if (tabId === "pageDash" && typeof safeRenderDashboard === "function") safeRenderDashboard(true);
}

function renderPermissions() {
  const createUnitBtn = document.getElementById("btnCreateUnit");
  if (createUnitBtn) createUnitBtn.style.display = (typeof canManageUnits==="function" ? canManageUnits() : false) ? "inline-flex" : "none";

  const seedBtn = document.getElementById("btnSeed");
  if (seedBtn) seedBtn.style.display = (typeof isKing==="function" ? isKing() : false) ? "inline-flex" : "none";

  const adminBtn = document.getElementById("btnAdmin");
  if (adminBtn) adminBtn.style.display = (typeof isKing==="function" ? isKing() : false) ? "inline-flex" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initMILNET, 50);
});
