const STORAGE_KEYS = {
  jobs: "skyport_jobs",
};

const SESSION_ENDPOINTS = {
  login: "/api/admin-login",
  session: "/api/admin-session",
  logout: "/api/admin-logout",
};

const defaultJobs = [
  {
    id: "job-1",
    title: "Cabin Crew Associate",
    company: "SkyPort Line",
    description:
      "Assist passengers with boarding, in-flight service, safety guidance, and a professional travel experience.",
    hours: "Rotational shifts, 9 hours",
    salary: "Rs 38,000 - Rs 52,000 / month",
    location: "Delhi International Airport",
    type: "Cabin Crew",
    status: "Active",
  },
  {
    id: "job-2",
    title: "Ground Staff Executive",
    company: "AeroBridge Services",
    description:
      "Support check-in, boarding assistance, passenger queries, and daily terminal coordination.",
    hours: "Day and evening shifts",
    salary: "Rs 24,000 - Rs 32,000 / month",
    location: "Mumbai Airport",
    type: "Ground Staff",
    status: "Active",
  },
  {
    id: "job-3",
    title: "Guest Service Officer",
    company: "Terminal One Hospitality",
    description:
      "Provide front-desk support, lounge assistance, and customer care for passengers at the airport.",
    hours: "8-hour flexible roster",
    salary: "Rs 30,000 - Rs 40,000 / month",
    location: "Bengaluru Airport",
    type: "Customer Service",
    status: "Drafted",
  },
  {
    id: "job-4",
    title: "Ramp Operations Agent",
    company: "RunwayLink Logistics",
    description:
      "Handle baggage coordination, aircraft support tasks, and apron-side operational assistance.",
    hours: "Rotational 12-hour shifts",
    salary: "Rs 26,000 - Rs 35,000 / month",
    location: "Hyderabad Airport",
    type: "Ramp Operations",
    status: "Active",
  },
];

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
  jobStatus: document.getElementById("jobStatus"),
};

let jobs = loadJobs();
let adminAuthenticated = false;

function loadJobs() {
  const stored = localStorage.getItem(STORAGE_KEYS.jobs);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(defaultJobs));
    return [...defaultJobs];
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(defaultJobs));
    return [...defaultJobs];
  }
}

function saveJobs() {
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs));
}

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

function resetJobForm() {
  elements.jobForm.reset();
  elements.jobId.value = "";
  elements.jobFormHeading.textContent = "Post a new vacancy";
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
  elements.positionType.value = job.type;
  elements.jobStatus.value = job.status;
}

function renderAdminJobs() {
  const sortedJobs = [...jobs].sort((first, second) => second.id.localeCompare(first.id));
  elements.adminJobList.innerHTML = sortedJobs
    .map(
      (job) => `
        <article class="admin-listing-item">
          <div>
            <div class="job-card-head">
              <h4>${escapeHtml(job.title)}</h4>
              <span class="status-pill" data-status="${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
            </div>
            <p>${escapeHtml(job.company)} | ${escapeHtml(job.type)} | ${escapeHtml(job.location)}</p>
            <div class="admin-actions">
              <button class="button button-secondary admin-edit" type="button" data-job-id="${escapeHtml(job.id)}">Edit</button>
              <button class="button button-secondary admin-status" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Drafted">Draft</button>
              <button class="button button-secondary admin-status" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Active">Activate</button>
              <button class="button button-secondary admin-status" type="button" data-job-id="${escapeHtml(job.id)}" data-status="Deleted">Delete</button>
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

async function checkAdminSession() {
  try {
    const response = await fetch(SESSION_ENDPOINTS.session, {
      credentials: "same-origin",
    });
    const payload = await response.json();
    adminAuthenticated = Boolean(payload.authenticated);
  } catch {
    adminAuthenticated = false;
  }

  syncAdminView();
}

document.addEventListener("click", (event) => {
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
    saveJobs();
    renderAdminJobs();
    elements.jobFormMessage.textContent = `Job status updated to ${job.status}.`;
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

elements.jobForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: elements.jobId.value || `job-${Date.now()}`,
    title: elements.jobTitle.value.trim(),
    company: elements.companyName.value.trim(),
    description: elements.jobDescription.value.trim(),
    hours: elements.workingHours.value.trim(),
    salary: elements.salary.value.trim(),
    location: elements.jobLocation.value.trim(),
    type: elements.positionType.value,
    status: elements.jobStatus.value,
  };

  const existingIndex = jobs.findIndex((job) => job.id === payload.id);
  if (existingIndex >= 0) {
    jobs[existingIndex] = payload;
    elements.jobFormMessage.textContent = "Job updated successfully.";
  } else {
    jobs.unshift(payload);
    elements.jobFormMessage.textContent = "Job created successfully.";
  }

  saveJobs();
  renderAdminJobs();
  resetJobForm();
});

elements.resetJobFormButton.addEventListener("click", () => {
  resetJobForm();
  elements.jobFormMessage.textContent = "Form cleared.";
});

checkAdminSession();
