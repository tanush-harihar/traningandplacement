/* ===========================
   PLACEMENT PORTAL — script.js
   Basic UI Interactions
   =========================== */

// ── Toast Notification System ──
function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '🔔'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

// ── Sidebar Active State ──
function initSidebar() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', function () {
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// ── Apply Button Handler ──
function initApplyButtons() {
  document.querySelectorAll('.btn-apply').forEach(btn => {
    btn.addEventListener('click', function () {
      const jobTitle = this.closest('.job-card')?.querySelector('.job-title')?.textContent || 'this job';
      this.textContent = 'Applied ✓';
      this.classList.remove('btn-primary');
      this.classList.add('btn-success');
      this.disabled = true;
      showToast(`Application submitted for "${jobTitle}"`, 'success');
    });
  });
}

// ── Post Job Form ──
function initPostJobForm() {
  const form = document.getElementById('post-job-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const title   = form.querySelector('#job-title')?.value.trim();
    const company = form.querySelector('#job-company')?.value.trim();

    if (!title || !company) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    showToast(`Job "${title}" posted successfully! Pending TPC approval.`, 'success');

    // Append new card to posted jobs
    const grid = document.getElementById('posted-jobs-grid');
    if (grid) {
      const card = buildPostedJobCard({ title, company, location: form.querySelector('#job-location')?.value || 'Remote', salary: form.querySelector('#job-salary')?.value || 'N/A', deadline: form.querySelector('#job-deadline')?.value || 'TBD' });
      grid.insertAdjacentHTML('afterbegin', card);
    }

    form.reset();
  });
}

function buildPostedJobCard({ title, company, location, salary, deadline }) {
  return `
    <div class="posted-job-card">
      <div class="job-status-bar">
        <span class="badge badge-yellow">Pending Approval</span>
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.posted-job-card').remove(); showToast('Job deleted.', 'info')">✕</button>
      </div>
      <div class="job-title">${title}</div>
      <div class="job-company">${company} · ${location}</div>
      <div class="job-stats-row">
        <div class="job-stat-mini"><strong>0</strong> Applicants</div>
        <div class="job-stat-mini"><strong>${salary || '—'}</strong> Salary</div>
        <div class="job-stat-mini"><strong>${deadline || '—'}</strong> Deadline</div>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm">👁️ View</button>
      </div>
    </div>`;
}

// ── TPC Approve / Reject ──
function initApprovals() {
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = this.closest('.approval-card');
      const jobName = card?.querySelector('h5')?.textContent || 'job';
      card?.remove();
      showToast(`"${jobName}" approved successfully!`, 'success');
      checkEmptyApprovals();
    });
  });

  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = this.closest('.approval-card');
      const jobName = card?.querySelector('h5')?.textContent || 'job';
      card?.remove();
      showToast(`"${jobName}" has been rejected.`, 'error');
      checkEmptyApprovals();
    });
  });
}

function checkEmptyApprovals() {
  const list = document.querySelector('.approvals-list');
  if (list && list.children.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><p>No pending approvals. You're all caught up!</p></div>`;
  }
}

// ── Table Row Hover Feedback ──
function initTableRows() {
  document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', function () {
      const name = this.querySelector('.student-name')?.textContent;
      if (name) showToast(`Viewing profile: ${name}`, 'info');
    });
  });
}

// ── Login Form ──
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = form.querySelector('#email')?.value.trim();
    const role  = document.querySelector('.role-option:checked')?.value;

    if (!email) { showToast('Please enter your email.', 'error'); return; }
    if (!role)  { showToast('Please select a role.', 'error'); return; }

    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    const redirects = {
      student:   'student-dashboard.html',
      recruiter: 'recruiter-dashboard.html',
      tpc:       'tpc-dashboard.html',
    };

    setTimeout(() => {
      showToast(`Welcome! Redirecting to ${role} dashboard…`, 'success');
      setTimeout(() => { window.location.href = redirects[role] || '#'; }, 900);
    }, 900);
  });
}

// ── Landing CTA buttons ──
function initLandingCTA() {
  document.querySelectorAll('[data-cta="login"]').forEach(btn => {
    btn.addEventListener('click', () => { window.location.href = 'login.html'; });
  });
}

// ── Init on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initApplyButtons();
  initPostJobForm();
  initApprovals();
  initTableRows();
  initLoginForm();
  initLandingCTA();
  initJobFilterSort();
  initStudentUI();
  initLiveSearch();
  initTPCSearch();
});
function initTPCSearch() {
  const searchInput = document.getElementById('tpc-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('.data-table tbody tr');

    let visibleCount = 0;

    rows.forEach(row => {
      const name = row.querySelector('.student-name')?.textContent.toLowerCase() || "";
      const email = row.querySelector('.student-email')?.textContent.toLowerCase() || "";
      const branch = row.children[1]?.textContent.toLowerCase() || "";
      const status = row.children[4]?.textContent.toLowerCase() || "";

      const fullText = `${name} ${email} ${branch} ${status}`;

      if (fullText.includes(query)) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    handleEmptyState(visibleCount);
  });
}
function handleEmptyState(count) {
  let empty = document.getElementById('no-results');

  if (count === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.id = 'no-results';
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-icon">🔍</div>
        <p>No students found</p>
      `;
      document.querySelector('.students-table-wrap').appendChild(empty);
    }
  } else {
    if (empty) empty.remove();
  }
}
let students = [];

function initStudentUI() {
  const addBtn = document.querySelector('.btn-primary.btn-sm');
  const modal = document.getElementById('student-modal');
  const closeBtn = document.getElementById('close-modal');
  const saveBtn = document.getElementById('save-student');

  if (!addBtn || !modal) return;

  // Open modal
  addBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Save student
  saveBtn.addEventListener('click', () => {
    const name = document.getElementById('student-name').value.trim();
    const email = document.getElementById('student-email').value.trim();
    const branch = document.getElementById('student-branch').value.trim();
    const cgpa = document.getElementById('student-cgpa').value.trim();

    if (!name || !email || !branch || !cgpa) {
      showToast("Fill all fields", "error");
      return;
    }

    if (cgpa < 0 || cgpa > 10) {
      showToast("CGPA must be between 0-10", "error");
      return;
    }

    const student = {
      name,
      email,
      branch,
      cgpa,
      applications: 0,
      status: "Not Applied"
    };

    students.push(student);
    addStudentToTable(student);

    modal.classList.remove('active');
    clearForm();

    showToast("Student added", "success");
  });
}

// Add to table
function addStudentToTable(student) {
  const tbody = document.querySelector('.data-table tbody');

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <div class="student-name">${student.name}</div>
      <div class="student-email">${student.email}</div>
    </td>
    <td>${student.branch}</td>
    <td><strong>${student.cgpa}</strong></td>
    <td>${student.applications}</td>
    <td><span class="badge badge-gray">${student.status}</span></td>
    <td><button class="btn btn-ghost btn-sm">View</button></td>
  `;

  tbody.appendChild(row);
}

// Clear form
function clearForm() {
  document.getElementById('student-name').value = "";
  document.getElementById('student-email').value = "";
  document.getElementById('student-branch').value = "";
  document.getElementById('student-cgpa').value = "";
}
function initJobFilterSort() {
  const filterBtn = document.getElementById('filter-btn');
  const sortBtn = document.getElementById('sort-btn');
  const container = document.querySelector('.jobs-grid');

  if (!filterBtn || !sortBtn || !container) return;

  // 🔍 FILTER
  filterBtn.addEventListener('click', () => {
    const query = prompt("Filter by skill / location / company:").toLowerCase();

    document.querySelectorAll('.job-card').forEach(card => {
      const text = card.innerText.toLowerCase();

      if (text.includes(query)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });

    showToast("Filter applied", "info");
  });

  // 🔃 SORT
  let sortState = 0;

  sortBtn.addEventListener('click', () => {
    const cards = Array.from(document.querySelectorAll('.job-card'));

    if (sortState === 0) {
      // Sort by match %
      cards.sort((a, b) => {
        const aVal = getMatch(a);
        const bVal = getMatch(b);
        return bVal - aVal;
      });
      showToast("Sorted by Match %", "success");
    } else {
      // Sort by salary
      cards.sort((a, b) => {
        const aVal = getSalary(a);
        const bVal = getSalary(b);
        return bVal - aVal;
      });
      showToast("Sorted by Salary", "success");
    }

    sortState = (sortState + 1) % 2;

    container.innerHTML = "";
    cards.forEach(c => container.appendChild(c));
  });
}
function getMatch(card) {
  const val = card.querySelector('.score-inner')?.textContent || "0";
  return parseInt(val);
}

function getSalary(card) {
  const text = card.innerText;

  // Extract numbers like 18–22 → take higher
  const match = text.match(/₹(\d+)[–-](\d+)/);

  if (!match) return 0;

  return parseInt(match[2]); // higher salary
}
function initLiveSearch() {
  const searchInput = document.getElementById('job-search');

  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();

    document.querySelectorAll('.job-card').forEach(card => {
      const title = card.querySelector('.job-title')?.textContent.toLowerCase() || "";
      const company = card.querySelector('.job-company')?.textContent.toLowerCase() || "";
      const skills = Array.from(card.querySelectorAll('.skill-tag'))
        .map(s => s.textContent.toLowerCase())
        .join(" ");
      const meta = card.querySelector('.job-meta')?.textContent.toLowerCase() || "";

      const fullText = `${title} ${company} ${skills} ${meta}`;

      if (fullText.includes(query)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
}
