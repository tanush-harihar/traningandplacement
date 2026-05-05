// ===========================
// TPC dashboard wiring
// ===========================
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) { window.location.href = "login.html"; return; }

  // Live pending approvals
  const list = document.querySelector(".approvals-list");
  if (list) {
    const q = query(collection(db, "jobs"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    onSnapshot(q, (qs) => {
      if (qs.empty) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><p>No pending approvals. You're all caught up!</p></div>`;
        return;
      }
      list.innerHTML = "";
      qs.forEach(d => {
        const j = d.data();
        list.insertAdjacentHTML("beforeend", `
          <div class="approval-card" data-id="${d.id}">
            <div class="company-logo">${(j.company||"?")[0]}</div>
            <div class="approval-info">
              <h5>${j.title}</h5>
              <div class="approval-meta">${j.company} · ${j.location||""} · ${j.salary||""} · Deadline: ${j.deadline||"—"}</div>
              <div class="approval-tags">
                ${(j.skills||[]).map(s=>`<span class="skill-tag">${s}</span>`).join("")}
                <span class="badge badge-gray">${j.type||""}</span>
              </div>
            </div>
            <div class="approval-actions">
              <button class="btn btn-success btn-sm" data-act="approve">✓ Approve</button>
              <button class="btn btn-danger btn-sm"  data-act="reject">✕ Reject</button>
            </div>
          </div>`);
      });
      bindApprovals();
    });
  }

  // Stats counters
  refreshStats();
});

function bindApprovals() {
  document.querySelectorAll('.approval-card [data-act]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".approval-card");
      const id = card.dataset.id;
      const newStatus = btn.dataset.act === "approve" ? "approved" : "rejected";
      try {
        await updateDoc(doc(db, "jobs", id), { status: newStatus });
        window.showToast?.(`Job ${newStatus}.`, newStatus === "approved" ? "success" : "error");
      } catch (e) { window.showToast?.(e.message, "error"); }
    });
  });
}

async function refreshStats() {
  try {
    const cards = document.querySelectorAll(".analytics-grid .stat-mini-text .value");
    if (cards.length < 4) return;
    const [students, jobs, apps] = await Promise.all([
      getCountFromServer(query(collection(db, "users"), where("role","==","student"))),
      getCountFromServer(query(collection(db, "jobs"),  where("status","==","approved"))),
      getCountFromServer(collection(db, "applications")),
    ]);
    cards[0].textContent = students.data().count;
    cards[1].textContent = jobs.data().count;
    cards[2].textContent = apps.data().count;
  } catch (e) { console.warn("Stats unavailable:", e.message); }
}
