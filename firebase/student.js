// ===========================
// Student dashboard data wiring
// ===========================
import { auth, db, storage } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, onSnapshot,
  doc, getDoc, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const initials = (name="?") => name.split(/\s+/).map(s=>s[0]).join("").slice(0,2).toUpperCase();

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "login.html"; return; }

  // Profile fetch + topbar greeting
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : { name: user.email };
  const name = profile.name || user.email.split("@")[0];

  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = name);
  document.querySelectorAll("[data-user-initials]").forEach(el => el.textContent = initials(name));
  if (profile.role) {
    document.querySelectorAll("[data-user-role]").forEach(el => el.textContent = profile.role);
  }
  const greet = document.querySelector(".topbar-left h4");
  if (greet) greet.textContent = `Hi, ${name.split(" ")[0]} 👋`;

  // Live-load recommended jobs
  const grid = document.querySelector(".jobs-grid");
  if (grid) {
    const q = query(collection(db, "jobs"), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(12));
    onSnapshot(q, (qs) => {
      if (qs.empty) return; // keep static demo cards if nothing in DB yet
      grid.innerHTML = "";
      qs.forEach(d => grid.insertAdjacentHTML("beforeend", renderJob(d.id, d.data())));
      bindApply();
    }, console.error);
  }
});

function renderJob(id, j) {
  return `
  <div class="job-card" data-job-id="${id}">
    <div class="job-card-header">
      <div class="company-logo">${(j.company||"?")[0]}</div>
      <div class="job-title-wrap">
        <div class="job-title">${j.title || "Untitled"}</div>
        <div class="job-company">${j.company || ""}</div>
      </div>
      <span class="badge badge-green">Open</span>
    </div>
    <div class="job-meta">
      <div class="job-meta-item"><span>📍</span> ${j.location || "—"}</div>
      <div class="job-meta-item"><span>💰</span> ${j.salary || "—"}</div>
      <div class="job-meta-item"><span>📅</span> ${j.deadline || "—"}</div>
    </div>
    <div class="job-skills">${(j.skills||[]).map(s=>`<span class="skill-tag">${s}</span>`).join("")}</div>
    <div class="job-footer">
      <span class="text-muted" style="font-size:0.8rem">${j.type || ""}</span>
      <button class="btn btn-primary btn-sm btn-apply">Apply Now</button>
    </div>
  </div>`;
}

function bindApply() {
  document.querySelectorAll(".btn-apply").forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".job-card");
      const jobId = card?.dataset.jobId;
      if (!jobId || !auth.currentUser) return;
      try {
        await addDoc(collection(db, "applications"), {
          jobId, userId: auth.currentUser.uid,
          status: "applied", createdAt: serverTimestamp(),
        });
        btn.textContent = "Applied ✓"; btn.disabled = true;
        window.showToast?.("Application submitted.", "success");
      } catch (e) { window.showToast?.(e.message, "error"); }
    });
  });
}

// Resume upload helper — call from your Resume page when ready.
export async function uploadResume(file) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = ref(storage, `resumes/${auth.currentUser.uid}/${file.name}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
