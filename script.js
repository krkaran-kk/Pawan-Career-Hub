const JOBS_ENDPOINT = "/api/jobs";

const elements = {
  jobListings: document.getElementById("jobListings"),
  emptyJobsState: document.getElementById("emptyJobsState"),
  jobSearchInput: document.getElementById("jobSearchInput"),
  jobCategoryFilter: document.getElementById("jobCategoryFilter"),
  activeJobsStat: document.getElementById("activeJobsStat"),
  selectedJobTitle: document.getElementById("selectedJobTitle"),
  selectedJobMeta: document.getElementById("selectedJobMeta"),
  applicationJobId: document.getElementById("applicationJobId"),
  applicationJobTitle: document.getElementById("applicationJobTitle"),
  applicationJobMeta: document.getElementById("applicationJobMeta"),
  applicationModal: document.getElementById("applicationModal"),
  closeApplicationModalButton: document.getElementById("closeApplicationModalButton"),
};

let jobs = [];

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

function badgeClasses(badge) {
  if (badge === "Full Time") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (badge === "Entry Level") {
    return "bg-blue-100 text-blue-700";
  }
  if (badge === "Contract") {
    return "bg-amber-100 text-amber-700";
  }
  if (badge === "Testing") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-slate-100 text-slate-700";
}

function renderCategoryOptions() {
  const selectedCategory = elements.jobCategoryFilter.value || "all";
  const categories = [...new Set(
    jobs
      .filter((job) => job.status === "Active" && job.type)
      .map((job) => job.type)
  )].sort((first, second) => first.localeCompare(second));

  elements.jobCategoryFilter.innerHTML = [
    '<option value="all">All Departments</option>',
    ...categories.map(
      (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ),
  ].join("");

  elements.jobCategoryFilter.value = categories.includes(selectedCategory)
    ? selectedCategory
    : "all";
}

function renderJobs() {
  const query = elements.jobSearchInput.value.trim().toLowerCase();
  const category = elements.jobCategoryFilter.value;
  const activeJobs = jobs.filter((job) => job.status === "Active");
  const filteredJobs = activeJobs.filter((job) => {
    const matchesQuery =
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query);
    const matchesCategory = category === "all" || job.type === category;
    return matchesQuery && matchesCategory;
  });

  elements.activeJobsStat.textContent = String(activeJobs.length);
  elements.emptyJobsState.textContent = activeJobs.length
    ? "No jobs match your current search."
    : "No active jobs are published right now.";
  elements.emptyJobsState.classList.toggle("hidden", filteredJobs.length > 0);

  elements.jobListings.innerHTML = filteredJobs
    .map(
      (job) => `
        <article class="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span class="material-symbols-outlined text-3xl">${escapeHtml(job.icon || "work")}</span>
            </div>
            <span class="${badgeClasses(job.badge)} rounded-full px-3 py-1 text-xs font-bold uppercase">
              ${escapeHtml(job.badge || job.type)}
            </span>
          </div>

          <h3 class="mb-1 text-xl font-bold">${escapeHtml(job.title)}</h3>
          <p class="mb-3 text-sm text-slate-500">${escapeHtml(job.company)} | ${escapeHtml(job.location)}</p>
          <p class="mb-5 text-sm leading-6 text-slate-600">${escapeHtml(job.description)}</p>

          <div class="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-base">payments</span>
              ${escapeHtml(job.salary)}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-base">schedule</span>
              ${escapeHtml(job.posted || job.hours)}
            </span>
          </div>

          <button class="apply-button w-full rounded-lg bg-primary/10 py-3 font-bold text-primary transition-colors hover:bg-primary hover:text-white" data-job-id="${escapeHtml(job.id)}" type="button">
            Apply Now
          </button>
        </article>
      `
    )
    .join("");
}

function openApplicationModal(job) {
  const jobMeta = `${job.company} | ${job.location} | ${job.salary}`;
  elements.applicationJobId.value = job.id;
  elements.applicationJobTitle.value = job.title;
  elements.applicationJobMeta.value = jobMeta;
  elements.selectedJobTitle.textContent = job.title;
  elements.selectedJobMeta.textContent = jobMeta;
  elements.applicationModal.classList.remove("hidden");
  elements.applicationModal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function closeApplicationModal() {
  elements.applicationModal.classList.add("hidden");
  elements.applicationModal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

async function fetchJobs() {
  try {
    const response = await fetch(JOBS_ENDPOINT, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || "Unable to load jobs right now.");
    }

    jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  } catch (error) {
    console.error("Unable to load jobs:", error);
    jobs = [];
  }

  renderCategoryOptions();
  renderJobs();
}

document.addEventListener("click", (event) => {
  const applyButton = event.target.closest(".apply-button");
  if (applyButton) {
    const job = jobs.find((item) => item.id === applyButton.dataset.jobId && item.status === "Active");
    if (job) {
      openApplicationModal(job);
    }
    return;
  }

  if (event.target === elements.applicationModal) {
    closeApplicationModal();
  }
});

elements.closeApplicationModalButton.addEventListener("click", closeApplicationModal);
elements.jobSearchInput.addEventListener("input", renderJobs);
elements.jobCategoryFilter.addEventListener("change", renderJobs);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.applicationModal.classList.contains("hidden")) {
    closeApplicationModal();
  }
});

function setupFormSubmission(formId, statusId, successMessage) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent.trim();
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    status.classList.remove("text-rose-600", "text-emerald-600");
    status.classList.add("text-slate-500");
    status.textContent = "Sending your details...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Unable to send your details right now.");
      }

      form.reset();
      status.classList.remove("text-slate-500", "text-rose-600");
      status.classList.add("text-emerald-600");
      status.textContent = successMessage;

      if (formId === "applicationForm") {
        elements.selectedJobTitle.textContent = "Choose a vacancy to begin your application.";
        elements.selectedJobMeta.textContent = "Your selected role details will appear here.";
      }
    } catch (error) {
      status.classList.remove("text-slate-500", "text-emerald-600");
      status.classList.add("text-rose-600");
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

setupFormSubmission(
  "contactForm",
  "contactMessageStatus",
  "Thank you. Your message has been sent successfully."
);
setupFormSubmission(
  "applicationForm",
  "applicationMessage",
  "Thank you. Your application has been sent successfully."
);

fetchJobs();
