// storage.js — helpers de subida MILNET (Firebase Storage compat)

function storage(){
  return firebase.storage();
}

function guessFileKind(file){
  const t = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (t.startsWith("image/")) return "image";
  if (t === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (t.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) return "doc";
  if (t.includes("spreadsheet") || name.endsWith(".xls") || name.endsWith(".xlsx")) return "sheet";
  if (t.includes("presentation") || name.endsWith(".ppt") || name.endsWith(".pptx")) return "slides";
  if (t.startsWith("text/") || name.endsWith(".txt")) return "text";
  return "file";
}

function safeName(name){
  return (name || "archivo")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 80);
}

/**
 * Sube un archivo a:
 *  milnet_uploads/<area>/<channelOrOrderId>/<uid>/<timestamp>_<filename>
 * Devuelve { url, path, name, type, size, kind }
 */
async function uploadMilnetFile({ area, targetId, file }){
  if (!MILNET?.user) throw new Error("No user");
  if (!file) throw new Error("No file");

  // límites sanos (puedes subirlo luego si quieres)
  const MAX_MB = 10;
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_MB) throw new Error(`Archivo demasiado grande (${sizeMB.toFixed(1)}MB). Máximo ${MAX_MB}MB`);

  const ts = Date.now();
  const clean = safeName(file.name);
  const path = `milnet_uploads/${area}/${targetId}/${MILNET.user.uid}/${ts}_${clean}`;

  const ref = storage().ref().child(path);
  const meta = {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      uploader: MILNET.user.uid,
      branchId: MILNET.profile?.branchId || "",
      unitId: MILNET.profile?.unitId || "",
      area: area || ""
    }
  };

  const snap = await ref.put(file, meta);
  const url = await snap.ref.getDownloadURL();

  return {
    url,
    path,
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
    kind: guessFileKind(file)
  };
}
