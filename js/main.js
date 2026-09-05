/* ==========================================================
   K MUSE NOVA — MAIN.JS
   Navigation, mobile menu, toast, common helpers.
   ========================================================== */

(function () {
  "use strict";

  // ----- Year -----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Mobile nav toggle -----
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
    });
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });
  }

  // ----- Toast system -----
  window.showToast = function (message, type = "success", duration = 3500) {
    const wrap = document.getElementById("toastWrap");
    if (!wrap) return alert(message);
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, duration);
  };

  // ----- Helpers -----
  window.formatDate = function (iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
    } catch { return iso; }
  };

  window.formatBytes = function (bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return bytes.toFixed(1) + " " + units[i];
  };

  window.formatStatus = function (s) {
    return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // ----- Confirm dialog -----
  window.confirmDialog = function (text) {
    return new Promise((resolve) => {
      const modal = document.getElementById("confirmModal");
      const txt = document.getElementById("confirmText");
      const ok = document.getElementById("confirmOk");
      const cancel = document.getElementById("confirmCancel");
      if (!modal) { resolve(window.confirm(text)); return; }
      txt.textContent = text;
      modal.classList.add("active");
      const close = (val) => {
        modal.classList.remove("active");
        ok.onclick = null;
        cancel.onclick = null;
        resolve(val);
      };
      ok.onclick = () => close(true);
      cancel.onclick = () => close(false);
    });
  };
})();
