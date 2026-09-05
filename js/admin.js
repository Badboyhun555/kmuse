/* ==========================================================
   K MUSE NOVA — ADMIN.JS
   Login, session, dashboard, applications, notes, settings.
   ========================================================== */

(function () {
  "use strict";

  if (!window.kmnSupabase) return;

  const loginScreen = document.getElementById("loginScreen");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");

  // ============ SESSION ============
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch { return null; }
  }
  function setSession(s) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.style.display = "flex";
    const s = getSession();
    if (s) document.getElementById("adminName").textContent = s.username || "Admin";
    loadStats();
    loadApplications();
    loadSettingsForm();
  }
  function showLogin() {
    loginScreen.style.display = "flex";
    dashboard.style.display = "none";
  }

  // ============ LOGIN ============
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;

    if (!username || !password) {
      window.showToast("Please enter username and password.", "error");
      return;
    }

    try {
      const { data, error } = await window.kmnSupabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("role", "admin")
        .eq("is_active", true)
        .single();

      if (error || !data) {
        window.showToast("Invalid username or password.", "error");
        return;
      }

      setSession({
        userId: data.id,
        username: data.username,
        role: data.role,
        loginTime: Date.now()
      });
      window.showToast("Welcome back, " + data.username, "success");
      showDashboard();
    } catch (err) {
      console.error(err);
      window.showToast("Login failed. Please try again.", "error");
    }
  });

  // ============ LOGOUT ============
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    showLogin();
    window.showToast("Logged out successfully.", "success");
  });

  // ============ SIDEBAR NAV ============
  const sideLinks = document.querySelectorAll(".side-link");
  const views = document.querySelectorAll(".view");
  const topbarTitle = document.getElementById("topbarTitle");

  sideLinks.forEach((link) => {
    if (link.id === "logoutBtn") return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      sideLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      views.forEach((v) => v.classList.remove("active"));
      const target = document.getElementById(`view-${view}`);
      if (target) target.classList.add("active");

      topbarTitle.textContent = link.textContent.trim();

      // Pre-fill applications list with status filter for status-based views
      if (["shortlisted", "interview", "selected", "rejected"].includes(view)) {
        const filter = document.getElementById("filterStatus");
        if (filter) {
          filter.value = view === "shortlisted" ? "shortlisted" :
                         view === "interview" ? "interview" :
                         view === "selected" ? "selected" : "rejected";
          switchToApplicationsView();
        }
      }
      closeSidebar();
    });
  });

  function switchToApplicationsView() {
    sideLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector('.side-link[data-view="applications"]').classList.add("active");
    views.forEach((v) => v.classList.remove("active"));
    document.getElementById("view-applications").classList.add("active");
    topbarTitle.textContent = "Applications";
    loadApplications();
  }

  // ============ MOBILE SIDEBAR ============
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
  });
  sidebarOverlay.addEventListener("click", closeSidebar);
  function closeSidebar() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  }

  // ============ STATS ============
  async function loadStats() {
    try {
      const { data, error } = await window.kmnSupabase
        .from("applications")
        .select("status");
      if (error) throw error;

      const counts = {
        total: data.length,
        submitted: 0, under_review: 0, shortlisted: 0,
        interview: 0, selected: 0, rejected: 0, archived: 0
      };
      data.forEach((r) => {
        if (counts[r.status] !== undefined) counts[r.status]++;
      });

      document.querySelectorAll("[data-stat]").forEach((el) => {
        const key = el.dataset.stat;
        el.textContent = counts[key] !== undefined ? counts[key] : "—";
      });
    } catch (e) {
      console.error(e);
    }
  }

  // ============ APPLICATIONS ============
  let allApps = [];

  async function loadApplications() {
    try {
      const { data, error } = await window.kmnSupabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      allApps = data || [];
      renderApplications();
    } catch (e) {
      console.error(e);
      window.showToast("Failed to load applications.", "error");
    }
  }

  function getFilteredApps() {
    const q = document.getElementById("searchInput").value.trim().toLowerCase();
    const status = document.getElementById("filterStatus").value;
    const cat = document.getElementById("filterCategory").value;
    const exp = document.getElementById("filterExperience").value;
    const sort = document.getElementById("sortSelect").value;

    let list = allApps.slice();

    if (q) {
      list = list.filter((a) =>
        (a.application_number || "").toLowerCase().includes(q) ||
        (a.full_name || "").toLowerCase().includes(q) ||
        (a.mobile || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
      );
    }
    if (status) list = list.filter((a) => a.status === status);
    if (cat) list = list.filter((a) => a.primary_category === cat);
    if (exp) list = list.filter((a) => a.experience_level === exp);

    switch (sort) {
      case "oldest": list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case "az": list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")); break;
      case "za": list.sort((a, b) => (b.full_name || "").localeCompare(a.full_name || "")); break;
      default: list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }

  function renderApplications() {
    const list = getFilteredApps();
    const tbody = document.getElementById("appTbody");
    const cards = document.getElementById("appCards");
    const empty = document.getElementById("emptyState");

    tbody.innerHTML = "";
    cards.innerHTML = "";

    if (!list.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    list.forEach((a) => {
      // Table row
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.application_number}</td>
        <td>${a.full_name}</td>
        <td>${a.primary_category || "—"}</td>
        <td>${a.age || "—"}</td>
        <td>${a.city || "—"}</td>
        <td><span class="status-badge">${window.formatStatus(a.status)}</span></td>
        <td>${window.formatDate(a.created_at)}</td>
        <td><button class="btn btn-ghost btn-sm" data-id="${a.id}">View</button></td>
      `;
      tr.querySelector("button").addEventListener("click", () => openDrawer(a.id));
      tbody.appendChild(tr);

      // Card (mobile)
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <div class="row"><span class="label">ID</span><span>${a.application_number}</span></div>
        <div class="row"><span class="label">Name</span><span>${a.full_name}</span></div>
        <div class="row"><span class="label">Category</span><span>${a.primary_category || "—"}</span></div>
        <div class="row"><span class="label">Age</span><span>${a.age || "—"}</span></div>
        <div class="row"><span class="label">City</span><span>${a.city || "—"}</span></div>
        <div class="row"><span class="label">Status</span><span class="status-badge">${window.formatStatus(a.status)}</span></div>
        <div class="row"><span class="label">Date</span><span>${window.formatDate(a.created_at)}</span></div>
        <div style="margin-top:12px;"><button class="btn btn-ghost btn-sm">View</button></div>
      `;
      card.querySelector("button").addEventListener("click", () => openDrawer(a.id));
      cards.appendChild(card);
    });
  }

  ["searchInput", "filterStatus", "filterCategory", "filterExperience", "sortSelect"]
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", renderApplications);
    });

  // ============ DRAWER ============
  const drawer = document.getElementById("appDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerClose = document.getElementById("drawerClose");
  const drawerBody = document.getElementById("drawerBody");

  drawerClose.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);

  function closeDrawer() {
    drawer.classList.remove("active");
    drawerOverlay.classList.remove("active");
  }

  async function openDrawer(appId) {
    const app = allApps.find((a) => a.id === appId);
    if (!app) return;

    drawerBody.innerHTML = `
      <div class="drawer-section">
        <div class="detail-row"><span class="label">Application ID</span><span class="value">${app.application_number}</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value"><span class="status-badge">${window.formatStatus(app.status)}</span></span></div>
        <div class="detail-row"><span class="label">Submitted</span><span class="value">${window.formatDate(app.created_at)}</span></div>
      </div>

      <div class="drawer-section">
        <h4>Personal Details</h4>
        ${detailRow("Full Name", app.full_name)}
        ${detailRow("Date of Birth", app.date_of_birth)}
        ${detailRow("Age", app.age)}
        ${detailRow("Gender", app.gender)}
        ${detailRow("City", app.city)}
        ${detailRow("State", app.state)}
        ${detailRow("Country", app.country)}
        ${detailRow("Mobile", app.mobile)}
        ${detailRow("Email", app.email)}
      </div>

      <div class="drawer-section">
        <h4>Professional Details</h4>
        ${detailRow("Primary Category", app.primary_category)}
        ${detailRow("Secondary Category", app.secondary_category)}
        ${detailRow("Experience", app.experience_level)}
        ${detailRow("Portfolio URL", app.portfolio_url)}
        ${detailRow("Instagram", app.instagram_url)}
        ${detailRow("Other Link", app.other_link)}
        ${detailRow("Languages", app.languages)}
        ${detailRow("Skills", app.skills)}
        ${detailRow("About", app.about)}
        ${detailRow("Motivation", app.motivation)}
      </div>

      <div class="drawer-section">
        <h4>Status Management</h4>
        <div class="status-actions">
          <button class="btn btn-ghost btn-sm" data-status="under_review">Mark Under Review</button>
          <button class="btn btn-ghost btn-sm" data-status="shortlisted">Shortlist</button>
          <button class="btn btn-ghost btn-sm" data-status="interview">Move to Interview</button>
          <button class="btn btn-ghost btn-sm" data-status="selected">Mark Selected</button>
          <button class="btn btn-ghost btn-sm" data-status="rejected">Reject</button>
          <button class="btn btn-ghost btn-sm" data-status="archived">Archive</button>
        </div>
      </div>

      <div class="drawer-section" id="gallerySection">
        <h4>Applicant Photos</h4>
        <p class="muted-text small">Loading photos…</p>
      </div>

      <div class="drawer-section" id="videoSection">
        <h4>Introduction Video</h4>
        <p class="muted-text small">Loading video…</p>
      </div>

      <div class="drawer-section">
        <h4>Admin Notes</h4>
        <textarea class="note-input" id="noteInput" placeholder="Write an internal note..."></textarea>
        <button class="btn btn-primary btn-sm" id="saveNoteBtn" style="margin-top:8px;">Save Note</button>
        <div class="notes-list" id="notesList"></div>
      </div>
    `;

    drawer.classList.add("active");
    drawerOverlay.classList.add("active");

    // Bind status buttons
    drawerBody.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const newStatus = btn.dataset.status;
        if (["rejected", "archived"].includes(newStatus)) {
          const ok = await window.confirmDialog(`Are you sure you want to ${newStatus === "rejected" ? "reject" : "archive"} this application?`);
          if (!ok) return;
        }
        await updateStatus(app.id, newStatus);
      });
    });

    // Load photos, video, notes
    loadApplicantPhotos(app.id, app.application_number);
    loadApplicantVideo(app.id, app.application_number);
    loadNotes(app.id);

    document.getElementById("saveNoteBtn").addEventListener("click", () => saveNote(app.id));
  }

  function detailRow(label, value) {
    return `<div class="detail-row"><span class="label">${label}</span><span class="value">${value || "—"}</span></div>`;
  }

  async function updateStatus(appId, status) {
    try {
      const { error } = await window.kmnSupabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", appId);
      if (error) throw error;

      // Update local
      const idx = allApps.findIndex((a) => a.id === appId);
      if (idx >= 0) allApps[idx].status = status;

      window.showToast("Application status updated.", "success");
      loadStats();
      renderApplications();
      // Update drawer badge
      openDrawer(appId);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to update status.", "error");
    }
  }

  // ============ APPLICANT PHOTOS ============
  async function loadApplicantPhotos(appId, appNumber) {
    const section = document.getElementById("gallerySection");
    try {
      const { data: files, error } = await window.kmnSupabase
        .from("application_files")
        .select("*")
        .eq("application_id", appId)
        .eq("file_type", "photo")
        .order("slot_number", { ascending: true });
      if (error) throw error;

      if (!files || !files.length) {
        section.innerHTML = "<h4>Applicant Photos</h4><p class='muted-text small'>No photos submitted.</p>";
        return;
      }

      const items = await Promise.all(files.map(async (f) => {
        const { data, error } = await window.kmnSupabase
          .storage
          .from("applications")
          .createSignedUrl(f.file_path, 3600);
        const url = data && data.signedUrl ? data.signedUrl : null;
        const slot = f.slot_number;
        const title = PHOTO_SLOTS[slot - 1] ? PHOTO_SLOTS[slot - 1].title : `Photo ${slot}`;
        return { title, url, error: !url };
      }));

      section.innerHTML = "<h4>Applicant Photos</h4>" +
        '<div class="gallery-grid">' +
        items.map((it, i) => `
          <div>
            <div class="gallery-caption">${String(i + 1).padStart(2, "0")} — ${it.title}</div>
            <div class="gallery-item" data-url="${it.url || ""}">
              ${it.url ? `<img src="${it.url}" alt="${it.title}" />` : '<div class="unavailable">Unavailable</div>'}
            </div>
          </div>
        `).join("") +
        "</div>";

      section.querySelectorAll(".gallery-item").forEach((el) => {
        el.addEventListener("click", () => {
          const url = el.dataset.url;
          if (!url) return;
          openImageModal(url);
        });
      });
    } catch (e) {
      console.error(e);
      section.innerHTML = "<h4>Applicant Photos</h4><p class='muted-text small'>Failed to load photos.</p>";
    }
  }

  // ============ APPLICANT VIDEO ============
  async function loadApplicantVideo(appId, appNumber) {
    const section = document.getElementById("videoSection");
    try {
      const { data: files, error } = await window.kmnSupabase
        .from("application_files")
        .select("*")
        .eq("application_id", appId)
        .eq("file_type", "video")
        .maybeSingle();
      if (error) throw error;

      if (!files) {
        section.innerHTML = "<h4>Introduction Video</h4><p class='muted-text small'>No introduction video submitted.</p>";
        return;
      }
      const { data, error: urlErr } = await window.kmnSupabase
        .storage
        .from("applications")
        .createSignedUrl(files.file_path, 3600);
      if (urlErr || !data) throw urlErr;

      section.innerHTML = `
        <h4>Introduction Video</h4>
        <video controls src="${data.signedUrl}" style="width:100%;border:1px solid var(--border);border-radius:6px;"></video>
      `;
    } catch (e) {
      console.error(e);
      section.innerHTML = "<h4>Introduction Video</h4><p class='muted-text small'>Failed to load video.</p>";
    }
  }

  // ============ IMAGE MODAL ============
  const imgModal = document.getElementById("imgModal");
  const imgModalImg = document.getElementById("imgModalImg");
  const imgModalClose = document.getElementById("imgModalClose");

  imgModalClose.addEventListener("click", () => imgModal.classList.remove("active"));
  imgModal.addEventListener("click", (e) => {
    if (e.target === imgModal) imgModal.classList.remove("active");
  });

  function openImageModal(url) {
    imgModalImg.src = url;
    imgModal.classList.add("active");
  }

  // ============ NOTES ============
  async function loadNotes(appId) {
    try {
      const { data, error } = await window.kmnSupabase
        .from("application_notes")
        .select("*")
        .eq("application_id", appId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const list = document.getElementById("notesList");
      list.innerHTML = (data || []).map((n) => `
        <div class="note-item">
          <div class="note-item-meta">${window.formatDate(n.created_at)}</div>
          <div>${escapeHtml(n.note)}</div>
        </div>
      `).join("");
    } catch (e) {
      console.error(e);
    }
  }

  async function saveNote(appId) {
    const input = document.getElementById("noteInput");
    const note = input.value.trim();
    if (!note) return;
    const s = getSession();
    try {
      const { error } = await window.kmnSupabase
        .from("application_notes")
        .insert({
          application_id: appId,
          admin_user_id: s.userId,
          note
        });
      if (error) throw error;
      input.value = "";
      window.showToast("Note saved.", "success");
      loadNotes(appId);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to save note.", "error");
    }
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ============ SETTINGS ============
  async function loadSettingsForm() {
    try {
      const { data, error } = await window.kmnSupabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => (map[r.setting_key] = r.setting_value));

      document.getElementById("setAgencyName").value = map.agency_name || "";
      document.getElementById("setAgencyEmail").value = map.agency_email || "";
      document.getElementById("setInstagram").value = map.instagram_url || "";
      document.getElementById("setApplicationsOpen").value = map.applications_open || "true";
      document.getElementById("setMaintenance").value = map.maintenance_mode || "false";
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById("saveSettingsBtn").addEventListener("click", async () => {
    const updates = {
      agency_name: document.getElementById("setAgencyName").value,
      agency_email: document.getElementById("setAgencyEmail").value,
      instagram_url: document.getElementById("setInstagram").value,
      applications_open: document.getElementById("setApplicationsOpen").value,
      maintenance_mode: document.getElementById("setMaintenance").value
    };
    try {
      for (const [k, v] of Object.entries(updates)) {
        const { error } = await window.kmnSupabase
          .from("site_settings")
          .update({ setting_value: v, updated_at: new Date().toISOString() })
          .eq("setting_key", k);
        if (error) throw error;
      }
      window.showToast("Settings saved.", "success");
    } catch (e) {
      console.error(e);
      window.showToast("Failed to save settings.", "error");
    }
  });

  // ============ INIT ============
  const session = getSession();
  if (session && session.userId && session.role === "admin") {
    showDashboard();
  } else {
    showLogin();
  }
})();
