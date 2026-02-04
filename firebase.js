// firebase.js - CORREGIDO
const firebaseConfig = {
  apiKey: "AIzaSyBhqNU1BunEQXtB5DxrCCe5QwC8hmVVDYw",
  authDomain: "hispana---intranet-militar.firebaseapp.com",
  projectId: "hispana---intranet-militar",
  storageBucket: "hispana---intranet-militar.firebasestorage.app",
  messagingSenderId: "606861326260",
  appId: "1:606861326260:web:6af6aee35d8535e7c3e4e1",
  measurementId: "G-JZX7NNS6JF"
};

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase.auth();
}

function db() {
  return firebase.firestore();
}

function fb() {
  return firebase;
}

// Exportar para uso global
window.initFirebase = initFirebase;
window.db = db;
window.fb = fb;