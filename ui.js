/* ==========================================================
   MILNET Hispaña — ui.js
   Sistema visual y navegación
========================================================== */

function flash(el) {
  if (!el) return;
  el.classList.remove("fade");
  void el.offsetWidth;
  el.classList.add("fade");
}

/* ===============================
   ALERTAS
================================= */

function uiAlert(msg) {
  alert(msg);
}

/* ===============================
   TOAST SIMPLE
================================= */

function toast(msg, ok=true){
  const t=document.createElement("div");
  t.textContent=msg;
  t.style.position="fixed";
  t.style.bottom="20px";
  t.style.right="20px";
  t.style.background=ok?"#022c22":"#2b0202";
  t.style.border="1px solid rgba(255,255,255,.1)";
  t.style.padding="10px 14px";
  t.style.borderRadius="10px";
  t.style.color="#e5e7eb";
  t.style.zIndex=9999;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

/* ===============================
   SAFE RENDER
================================= */

async function safe(fn){
  try{
    await fn();
  }catch(e){
    console.error("UI error:",e);
    toast("Error visual — mira consola",false);
  }
}

/* ===============================
   CARGA
================================= */

function showLoader(id){
  const el=document.getElementById(id);
  if(el) el.innerHTML="<div class='small'>Cargando…</div>";
}

/* ===============================
   DEBUG PANEL
================================= */

window.debugMILNET=function(){
  console.log("MILNET:",MILNET);
}

/* ===============================
   ATAJOS TECLADO
================================= */

document.addEventListener("keydown",e=>{
  if(e.key==="1") openTab("pageDash");
  if(e.key==="2") openTab("pageUnits");
  if(e.key==="3") openTab("pagePeople");
  if(e.key==="4") openTab("pageChat");
  if(e.key==="5") openTab("pageEquip");
  if(e.key==="6") openTab("pageOrders");
  if(e.key==="7") openTab("pageCUM");
});

/* ===============================
   SCROLL FIX
================================= */

document.addEventListener("click",e=>{
  if(e.target.tagName==="BUTTON"){
    setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),50);
  }
});
