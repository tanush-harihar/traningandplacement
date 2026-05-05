// ===========================
// Auth flows for login.html
// Email/password sign-in + role lookup from Firestore /users/{uid}
// ===========================

import { auth, db } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const REDIRECTS = {
  student:   "student-dashboard.html",
  recruiter: "recruiter-dashboard.html",
  tpc:       "tpc-dashboard.html",
};

function toast(msg, type = "info") {
  if (window.showToast) window.showToast(msg, type);
}

// Override the demo login handler in script.js
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  // Remove existing demo listeners by cloning
  const fresh = form.cloneNode(true);
  form.parentNode.replaceChild(fresh, form);

  fresh.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = fresh.querySelector("#email").value.trim();
    const pwd   = fresh.querySelector("#password").value;
    const role  = document.querySelector(".role-option:checked")?.value;

    if (!email || !pwd) return toast("Please enter email and password.", "error");
    if (!role)          return toast("Please select a role.", "error");

    const btn = fresh.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Signing in…";

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, pwd);
      } catch (err) {
        // First-time demo: auto-create account
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          cred = await createUserWithEmailAndPassword(auth, email, pwd);
          await setDoc(doc(db, "users", cred.user.uid), {
            email, role, createdAt: serverTimestamp(),
          });
        } else { throw err; }
      }

      // Lookup role
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const userRole = snap.exists() ? snap.data().role : role;

      toast(`Welcome! Redirecting…`, "success");
      setTimeout(() => { window.location.href = REDIRECTS[userRole] || "index.html"; }, 700);
    } catch (err) {
      console.error(err);
      toast(err.message || "Sign-in failed.", "error");
      btn.disabled = false;
      btn.textContent = "Sign In →";
    }
  });
});

// Logout helper (used by .user-logout links)
export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}
window.placeiqLogout = logout;
