// ===========================
// Firebase Bootstrap (modular SDK v10+, via CDN)
// Loaded as ES module from each HTML page.
// ===========================
//
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Enable: Authentication (Email/Password), Firestore, Storage
// 3. Replace the firebaseConfig values below with your project config
// 4. (Optional) Tighten Firestore + Storage security rules — see /firebase/RULES.md

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const app     = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Make available globally for non-module scripts (optional convenience)
window.PlaceIQ = { app, auth, db, storage };
