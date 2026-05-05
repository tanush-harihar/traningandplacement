// ===========================
// Recruiter dashboard wiring
// ===========================
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) { window.location.href = "login.html"; return; }

  // Hook the post-job form into Firestore
  const form = document.getElementById("post-job-form");
  if (form) {
    const fresh = form.cloneNode(true);
    form.parentNode.replaceChild(fresh, form);
    fresh.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        title:       fresh.querySelector("#job-title").value.trim(),
        company:     fresh.querySelector("#job-company").value.trim(),
        description: fresh.querySelector("#job-description").value.trim(),
        skills:      fresh.querySelector("#job-skills").value.split(",").map(s=>s.trim()).filter(Boolean),
        eligibility: fresh.querySelector("#job-eligibility").value.trim(),
        location:    fresh.querySelector("#job-location").value.trim(),
        salary:      fresh.querySelector("#job-salary").value.trim(),
        deadline:    fresh.querySelector("#job-deadline").value,
        type:        fresh.querySelector("#job-type").value,
        recruiterId: user.uid,
        status:      "pending",
        createdAt:   serverTimestamp(),
      };
      if (!data.title || !data.company) return window.showToast?.("Fill required fields.", "error");
      try {
        await addDoc(collection(db, "jobs"), data);
        window.showToast?.("Job submitted for TPC approval.", "success");
        fresh.reset();
      } catch (err) { window.showToast?.(err.message, "error"); }
    });
  }

  // Live recruiter's own jobs
  const grid = document.getElementById("posted-jobs-grid");
  if (grid) {
    const q = query(collection(db, "jobs"), where("recruiterId", "==", user.uid), orderBy("createdAt", "desc"));
    onSnapshot(q, (qs) => {
      if (qs.empty) return;
      grid.innerHTML = "";
      qs.forEach(d => {
        const j = d.data();
        const badge = j.status === "approved" ? "badge-green" : j.status === "rejected" ? "badge-red" : "badge-yellow";
        grid.insertAdjacentHTML("beforeend", `
          <div class="posted-job-card">
            <div class="job-status-bar">
              <span class="badge ${badge}">${j.status}</span>
              <button class="btn btn-ghost btn-sm">⋯</button>
            </div>
            <div class="job-title">${j.title}</div>
            <div class="job-company">${j.company} · ${j.location||""}</div>
            <div class="job-stats-row">
              <div class="job-stat-mini"><strong>0</strong> Applicants</div>
              <div class="job-stat-mini"><strong>${j.salary||"—"}</strong> CTC</div>
              <div class="job-stat-mini"><strong>${j.deadline||"—"}</strong> Deadline</div>
            </div>
          </div>`);
      });
    });
  }
});
