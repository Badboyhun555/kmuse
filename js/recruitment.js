/* ==========================================================
   K MUSE NOVA — RECRUITMENT.JS
   Form handling, age calc, 6 photos, validation, submission.
   ========================================================== */

(function () {
  "use strict";

  const form = document.getElementById("applicationForm");
  if (!form) return;

  const photos = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  let video = null;
  let maintenanceOn = false;
  let applicationsOpen = true;

  // ============ SETTINGS CHECK ============
  async function loadSettings() {
    try {
      const { data, error } = await window.kmnSupabase
        .from("site_settings")
        .select("setting_key, setting_value");
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => (map[r.setting_key] = r.setting_value));
      maintenanceOn = map.maintenance_mode === "true";
      applicationsOpen = map.applications_open !== "false";

      const banner = document.getElementById("maintenanceBanner");
      const pill = document.getElementById("appOpenPill");
      if (maintenanceOn || !applicationsOpen) {
        if (banner) banner.style.display = "block";
        if (pill) pill.innerHTML = '<span class="dot" style="background:#C0392B;"></span><span>Applications closed</span>';
        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn) submitBtn.disabled = true;
      }
    } catch (e) {
      console.warn("Settings load failed:", e.message);
    }
  }

  // ============ AGE CALC ============
  const dobInput = document.getElementById("dob");
  const ageInput = document.getElementById("age");
  const ageWarning = document.getElementById("ageWarning");
  const submitBtn = document.getElementById("submitBtn");

  function calculateAge(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  if (dobInput) {
    dobInput.addEventListener("change", () => {
      const age = calculateAge(dobInput.value);
      if (age === null) {
        ageInput.value = "";
        ageWarning.style.display = "none";
        return;
      }
      ageInput.value = age;
      if (age < 18) {
        ageWarning.style.display = "block";
      } else {
        ageWarning.style.display = "none";
      }
      updateSubmitState();
    });
  }

  // ============ CONSENT ============
  const consents = document.querySelectorAll(".consent");
  consents.forEach((c) => c.addEventListener("change", updateSubmitState));

  function updateSubmitState() {
    const allConsents = Array.from(consents).every((c) => c.checked);
    const age = parseInt(ageInput.value, 10);
    const ageOk = age && age >= 18;
    submitBtn.disabled = !(allConsents && ageOk && !maintenanceOn && applicationsOpen);
  }

  // ============ PHOTO SLOTS ============
  const photoGrid = document.getElementById("photoGrid");

  function renderPhotoSlots() {
    photoGrid.innerHTML = "";
    PHOTO_SLOTS.forEach((slot) => {
      const demoUrl = DEMO_IMAGES["photo" + slot.num];

      const card = document.createElement("div");
      card.className = "photo-card";
      card.innerHTML = `
        <div class="photo-card-head">
          <span class="num">${String(slot.num).padStart(2, "0")}</span>
          <h4>${slot.title}</h4>
        </div>
        <p class="instruction">${slot.instruction}</p>

        <div class="photo-block">
          <div class="photo-block-label">Reference Photo</div>
          <div class="photo-area" id="demo-area-${slot.num}">
            <div class="placeholder">
              <p class="label">Loading reference…</p>
            </div>
          </div>
        </div>

        <div class="photo-block">
          <div class="photo-block-label">Your Photo</div>
          <div class="photo-area placeholder" id="upload-area-${slot.num}">
            <p class="label">Upload your photo</p>
            <button type="button" class="btn btn-ghost btn-sm" data-slot="${slot.num}">Choose Photo</button>
          </div>
          <input type="file" id="file-input-${slot.num}" accept="image/jpeg,image/png,image/webp" hidden />
          <div class="file-info" id="file-info-${slot.num}" style="display:none;">
            <span id="file-name-${slot.num}"></span>
            <span id="file-size-${slot.num}"></span>
          </div>
          <div class="file-actions" id="file-actions-${slot.num}" style="display:none;">
            <button type="button" class="btn btn-ghost btn-sm" data-replace="${slot.num}">Replace</button>
            <button type="button" class="btn btn-ghost btn-sm" data-remove="${slot.num}">Remove</button>
          </div>
        </div>
      `;
      photoGrid.appendChild(card);

      // Load demo image
      const demoArea = card.querySelector(`#demo-area-${slot.num}`);
      const img = new Image();
      img.onload = () => {
        demoArea.innerHTML = "";
        demoArea.classList.remove("placeholder");
        demoArea.appendChild(img);
      };
      img.onerror = () => {
        demoArea.innerHTML = '<div class="unavailable">Reference image unavailable</div>';
      };
      img.src = demoUrl;
      img.alt = `Reference ${slot.title}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      // Bind file input
      const fileInput = card.querySelector(`#file-input-${slot.num}`);
      const chooseBtn = card.querySelector(`button[data-slot="${slot.num}"]`);
      chooseBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => handlePhotoSelect(slot.num, e.target.files[0]));

      // Replace / Remove
      card.querySelector(`button[data-replace="${slot.num}"]`).addEventListener("click", () => fileInput.click());
      card.querySelector(`button[data-remove="${slot.num}"]`).addEventListener("click", () => removePhoto(slot.num));
    });
  }

  function handlePhotoSelect(slotNum, file) {
    if (!file) return;
    if (!UPLOAD_LIMITS.photoTypes.includes(file.type)) {
      window.showToast("Please upload a JPG, JPEG, PNG or WEBP image under 5 MB.", "error");
      return;
    }
    if (file.size > UPLOAD_LIMITS.photoMaxMB * 1024 * 1024) {
      window.showToast("Image must be under 5 MB.", "error");
      return;
    }

    photos[slotNum] = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadArea = document.getElementById(`upload-area-${slotNum}`);
      uploadArea.innerHTML = "";
      uploadArea.classList.remove("placeholder");
      const img = document.createElement("img");
      img.src = e.target.result;
      uploadArea.appendChild(img);

      document.getElementById(`file-info-${slotNum}`).style.display = "flex";
      document.getElementById(`file-name-${slotNum}`).textContent = file.name;
      document.getElementById(`file-size-${slotNum}`).textContent = window.formatBytes(file.size);
      document.getElementById(`file-actions-${slotNum}`).style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(slotNum) {
    photos[slotNum] = null;
    const uploadArea = document.getElementById(`upload-area-${slotNum}`);
    uploadArea.innerHTML = `
      <p class="label">Upload your photo</p>
      <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('file-input-${slotNum}').click()">Choose Photo</button>
    `;
    uploadArea.classList.add("placeholder");
    document.getElementById(`file-info-${slotNum}`).style.display = "none";
    document.getElementById(`file-actions-${slotNum}`).style.display = "none";
    document.getElementById(`file-input-${slotNum}`).value = "";
  }

  // ============ VIDEO ============
  const videoFile = document.getElementById("videoFile");
  const videoPlaceholder = document.getElementById("videoPlaceholder");
  const videoPreview = document.getElementById("videoPreview");
  const videoPlayer = document.getElementById("videoPlayer");
  const videoRemove = document.getElementById("videoRemove");

  videoFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!UPLOAD_LIMITS.videoTypes.includes(file.type)) {
      window.showToast("Video must be MP4, MOV or WEBM under 50 MB.", "error");
      videoFile.value = "";
      return;
    }
    if (file.size > UPLOAD_LIMITS.videoMaxMB * 1024 * 1024) {
      window.showToast("Video must be under 50 MB.", "error");
      videoFile.value = "";
      return;
    }
    video = file;
    videoPlayer.src = URL.createObjectURL(file);
    videoPlaceholder.style.display = "none";
    videoPreview.style.display = "block";
    document.getElementById("videoFileName").textContent = file.name;
    document.getElementById("videoFileSize").textContent = window.formatBytes(file.size);
  });

  videoRemove.addEventListener("click", () => {
    video = null;
    videoFile.value = "";
    videoPlayer.src = "";
    videoPlaceholder.style.display = "block";
    videoPreview.style.display = "none";
  });

  // ============ APPLICATION NUMBER ============
  async function generateApplicationNumber() {
    const year = new Date().getFullYear();
    const prefix = `KMN-${year}-`;
    // Find the highest existing number for this year
    const { data } = await window.kmnSupabase
      .from("applications")
      .select("application_number")
      .like("application_number", `${prefix}%`);

    let max = 0;
    (data || []).forEach((r) => {
      const n = parseInt(r.application_number.replace(prefix, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return prefix + String(max + 1).padStart(6, "0");
  }

  // ============ VALIDATION ============
  function validateAll() {
    if (maintenanceOn || !applicationsOpen) {
      window.showToast("Applications are currently closed.", "error");
      return false;
    }
    const age = parseInt(ageInput.value, 10);
    if (!age || age < 18) {
      window.showToast("Applicants must be 18 years or older to apply.", "error");
      return false;
    }
    const required = ["fullName", "dob", "city", "country", "mobile", "primaryCat"];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        window.showToast("Please complete all required fields.", "error");
        el && el.focus();
        return false;
      }
    }
    for (let i = 1; i <= 6; i++) {
      if (!photos[i]) {
        window.showToast("Please upload all six required photos.", "error");
        return false;
      }
    }
    if (!Array.from(consents).every((c) => c.checked)) {
      window.showToast("Please accept all consent checkboxes.", "error");
      return false;
    }
    return true;
  }

  // ============ SUBMIT ============
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    if (!validateAll()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Application...";

    try {
      // Re-validate age
      const finalAge = calculateAge(dobInput.value);
      if (finalAge < 18) throw new Error("Underage applicant.");

      // Generate application number
      const appNumber = await generateApplicationNumber();

      // Insert application row
      const insertData = {
        application_number: appNumber,
        full_name: document.getElementById("fullName").value.trim(),
        date_of_birth: document.getElementById("dob").value,
        age: finalAge,
        gender: document.getElementById("gender").value,
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        country: document.getElementById("country").value.trim(),
        mobile: document.getElementById("mobile").value.trim(),
        email: document.getElementById("email").value.trim(),
        primary_category: document.getElementById("primaryCat").value,
        secondary_category: document.getElementById("secondaryCat").value,
        experience_level: document.getElementById("experience").value,
        portfolio_url: document.getElementById("portfolio").value.trim(),
        instagram_url: document.getElementById("instagram").value.trim(),
        other_link: document.getElementById("otherLink").value.trim(),
        languages: document.getElementById("languages").value.trim(),
        skills: document.getElementById("skills").value.trim(),
        about: document.getElementById("about").value.trim(),
        motivation: document.getElementById("motivation").value.trim(),
        status: "submitted",
        consent_confirmed: true
      };

      const { data: appRow, error: appErr } = await window.kmnSupabase
        .from("applications")
        .insert(insertData)
        .select()
        .single();
      if (appErr) throw appErr;

      const appId = appRow.id;

      // Upload photos
      const fileRecords = [];
      for (let i = 1; i <= 6; i++) {
        const file = photos[i];
        const ext = file.name.split(".").pop().toLowerCase();
        const path = `${appNumber}/photos/photo-${String(i).padStart(2, "0")}.${ext}`;
        const { error: upErr } = await window.kmnSupabase
          .storage
          .from("applications")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        fileRecords.push({
          application_id: appId,
          file_type: "photo",
          slot_number: i,
          file_path: path,
          original_filename: file.name,
          mime_type: file.type,
          file_size: file.size
        });
      }

      // Upload video (optional)
      if (video) {
        const ext = video.name.split(".").pop().toLowerCase();
        const vpath = `${appNumber}/video/introduction.${ext}`;
        const { error: vErr } = await window.kmnSupabase
          .storage
          .from("applications")
          .upload(vpath, video, { upsert: true });
        if (vErr) throw vErr;
        fileRecords.push({
          application_id: appId,
          file_type: "video",
          slot_number: null,
          file_path: vpath,
          original_filename: video.name,
          mime_type: video.type,
          file_size: video.size
        });
      }

      // Insert file records
      const { error: fErr } = await window.kmnSupabase
        .from("application_files")
        .insert(fileRecords);
      if (fErr) throw fErr;

      // Success
      document.getElementById("applicationForm").style.display = "none";
      document.getElementById("successScreen").style.display = "block";
      document.getElementById("appNumber").textContent = appNumber;
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.showToast("Application submitted successfully.", "success");

    } catch (err) {
      console.error(err);
      window.showToast("Submission failed. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });

  // ============ INIT ============
  renderPhotoSlots();
  loadSettings();
})();
