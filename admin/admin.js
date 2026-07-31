const DEFAULT_POSITION_TYPES = [
  "Cabin Crew",
  "Ground Staff",
  "Customer Service",
  "Ramp Operations",
  "Security",
];

const CUSTOM_POSITION_TYPE_VALUE = "__custom__";

const SESSION_ENDPOINTS = {
  login: "/api/admin-login",
  session: "/api/admin-session",
  logout: "/api/admin-logout",
};

const JOBS_ENDPOINT = "/api/jobs";

const elements = {
  adminAuth: document.getElementById("adminAuth"),
  adminContent: document.getElementById("adminContent"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminLoginMessage: document.getElementById("adminLoginMessage"),
  adminUsernameInput: document.getElementById("adminUsernameInput"),
  adminPasswordInput: document.getElementById("adminPasswordInput"),
  adminLogoutButton: document.getElementById("adminLogoutButton"),
  jobForm: document.getElementById("jobForm"),
  jobFormHeading: document.getElementById("jobFormHeading"),
  jobFormMessage: document.getElementById("jobFormMessage"),
  resetJobFormButton: document.getElementById("resetJobFormButton"),
  adminJobList: document.getElementById("adminJobList"),
  jobId: document.getElementById("jobId"),
  jobTitle: document.getElementById("jobTitle"),
  companyName: document.getElementById("companyName"),
  jobDescription: document.getElementById("jobDescription"),
  workingHours: document.getElementById("workingHours"),
  salary: document.getElementById("salary"),
  jobLocation: document.getElementById("jobLocation"),
  positionType: document.getElementById("positionType"),
  customPositionTypeField: document.getElementById("customPositionTypeField"),
  customPositionType: document.getElementById("customPositionType"),
  jobStatus: document.getElementById("jobStatus"),
};

let jobs = [];
let positionTypes = [...DEFAULT_POSITION_TYPES];
let adminAuthenticated = false;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return map[char];
  });
}

function statusClasses(status) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "Deleted") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

function derivePositionTypes() {
  return [...new Set([
    ...DEFAULT_POSITION_TYPES,
    ...jobs.map((job) => job.type).filter(Boolean),
  ])].sort((first, second) => first.localeCompare(second));
}

function renderPositionTypes(selectedType = "") {
  positionTypes = derivePositionTypes();

  elements.positionType.innerHTML = [
    ...positionTypes.map(
      (type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`
    ),
    `<option value="${CUSTOM_POSITION_TYPE_VALUE}">+ Add a new position type</option>`,
  ].join("");

  if (selectedType && !positionTypes.includes(selectedType)) {
    elements.positionType.value = CUSTOM_POSITION_TYPE_VALUE;
    elements.customPositionType.value = selectedType;
    toggleCustomPositionType();
    return;
  }

  elements.positionType.value = selectedType || positionTypes[0] || "Ground Staff";
}

function toggleCustomPositionType() {
  const isCustom = elements.positionType.value === CUSTOM_POSITION_TYPE_VALUE;
  elements.customPositionTypeField.classList.toggle("hidden", !isCustom);
  elements.customPositionType.required = isCustom;

  if (isCustom) {
    elements.customPositionType.focus();
  } else {
    elements.customPositionType.value = "";
  }
}

function resetJobForm() {
  elements.jobForm.reset();
  elements.jobId.value = "";
  elements.jobFormHeading.textContent = "Post a new vacancy";
  renderPositionTypes();
  toggleCustomPositionType();
  elements.jobStatus.value = "Drafted";
}

function fillJobForm(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) {
    return;
  }

  elements.jobFormHeading.textContent = "Update vacancy";
  elements.jobId.value = job.id;
  elements.jobTitle.value = job.title;
  elements.companyName.value = job.company;
  elements.jobDescription.value = job.description;
  elements.workingHours.value = job.hours;
  elements.salary.value = job.salary;
  elements.jobLocation.value = job.location;
  renderPositionTypes(job.type);
  toggleCustomPositionType();
  elements.jobStatus.value = job.status;
}

function renderAdminJobs() {
  const sortedJobs = [...jobs].sort((first, second) => second.id.localeCompare(first.id));
  elements.adminJobList.innerHTML = sortedJobs
    .map(
      (job) => `
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-3">
                <h4 class="text-lg font-bold text-slate-900">${escapeHtml(job.title)}</h4>
                <span class="rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClasses(job.status)}">${escapeHtml(job.status)}</span>
              </div>
              <p class="text-sm text-slate-500">${escapeHtml(job.company)} | ${escapeHtml(job.type)} | ${escapeHtml(job.location)}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button class="admin-edit rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white" type="button" data-job-id="${escapeHtml(job.id)}">Edit</button>
              <button class="admin-status rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Drafted">Draft</button>
              <button class="admin-status rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Active">Activate</button>
              <button class="admin-status rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Deleted">Delete</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function syncAdminView() {
  elements.adminAuth.classList.toggle("hidden", adminAuthenticated);
  elements.adminContent.classList.toggle("hidden", !adminAuthenticated);

  if (adminAuthenticated) {
    renderAdminJobs();
  }
}

async function loadJobsFromServer() {
  try {
    const response = await fetch(JOBS_ENDPOINT, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || "Unable to load jobs.");
    }

    jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
    renderPositionTypes();
    renderAdminJobs();

    if (payload.writable === false && payload.message) {
      elements.jobFormMessage.textContent = payload.message;
    }
  } catch (error) {
    jobs = [];
    renderPositionTypes();
    renderAdminJobs();
    elements.jobFormMessage.textContent = error.message || "Unable to load jobs.";
  }
}

async function saveJobsToServer(successMessage) {
  const response = await fetch(JOBS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ jobs }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Unable to save jobs.");
  }

  jobs = Array.isArray(payload.jobs) ? payload.jobs : jobs;
  renderPositionTypes();
  renderAdminJobs();
  elements.jobFormMessage.textContent = successMessage;
}

async function checkAdminSession() {
  try {
    const response = await fetch(SESSION_ENDPOINTS.session, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = await response.json();
    adminAuthenticated = Boolean(payload.authenticated);
  } catch {
    adminAuthenticated = false;
  }

  syncAdminView();

  if (adminAuthenticated) {
    await loadJobsFromServer();
  }
}

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest(".admin-edit");
  if (editButton) {
    fillJobForm(editButton.dataset.jobId);
    return;
  }

  const statusButton = event.target.closest(".admin-status");
  if (statusButton) {
    const job = jobs.find((item) => item.id === statusButton.dataset.jobId);
    if (!job) {
      return;
    }

    job.status = statusButton.dataset.status;

    try {
      await saveJobsToServer(`Job status updated to ${job.status}.`);
    } catch (error) {
      elements.jobFormMessage.textContent = error.message || "Unable to update job status.";
      await loadJobsFromServer();
    }
  }
});

elements.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  elements.adminLoginMessage.textContent = "Signing in...";

  try {
    const response = await fetch(SESSION_ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        username: elements.adminUsernameInput.value.trim(),
        password: elements.adminPasswordInput.value,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      elements.adminLoginMessage.textContent = payload.message || "Login failed.";
      return;
    }

    adminAuthenticated = true;
    elements.adminUsernameInput.value = "";
    elements.adminPasswordInput.value = "";
    elements.adminLoginMessage.textContent = "";
    syncAdminView();
    await loadJobsFromServer();
  } catch {
    elements.adminLoginMessage.textContent = "Unable to reach the login service.";
  }
});

elements.adminLogoutButton.addEventListener("click", async () => {
  try {
    await fetch(SESSION_ENDPOINTS.logout, {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Ignore logout network errors and clear the UI state anyway.
  }

  adminAuthenticated = false;
  resetJobForm();
  syncAdminView();
});

elements.jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isCustomType = elements.positionType.value === CUSTOM_POSITION_TYPE_VALUE;
  const selectedPositionType = isCustomType
    ? elements.customPositionType.value.trim()
    : elements.positionType.value;

  if (!selectedPositionType) {
    elements.customPositionType.reportValidity();
    return;
  }

  const existingJob = jobs.find((job) => job.id === elements.jobId.value);
  const payload = {
    id: elements.jobId.value || `job-${Date.now()}`,
    title: elements.jobTitle.value.trim(),
    company: elements.companyName.value.trim(),
    description: elements.jobDescription.value.trim(),
    hours: elements.workingHours.value.trim(),
    salary: elements.salary.value.trim(),
    location: elements.jobLocation.value.trim(),
    type: selectedPositionType,
    status: elements.jobStatus.value,
    badge: existingJob && existingJob.badge ? existingJob.badge : selectedPositionType,
    icon: existingJob && existingJob.icon ? existingJob.icon : "work",
    posted: existingJob && existingJob.posted ? existingJob.posted : "Recently posted",
  };

  const existingIndex = jobs.findIndex((job) => job.id === payload.id);
  if (existingIndex >= 0) {
    jobs[existingIndex] = payload;
  } else {
    jobs.unshift(payload);
  }

  try {
    await saveJobsToServer(existingIndex >= 0 ? "Job updated successfully." : "Job created successfully.");
    resetJobForm();
  } catch (error) {
    elements.jobFormMessage.textContent = error.message || "Unable to save job.";
    await loadJobsFromServer();
  }
});

elements.resetJobFormButton.addEventListener("click", () => {
  resetJobForm();
  elements.jobFormMessage.textContent = "Form cleared.";
});

elements.positionType.addEventListener("change", toggleCustomPositionType);

renderPositionTypes();
resetJobForm();
checkAdminSession();
