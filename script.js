const STORAGE_KEYS = {
  jobs: "skyport_jobs",
  applications: "skyport_applications",
  contacts: "skyport_contacts",
};

const defaultJobs = [
  {
    id: "job-1",
    title: "Cabin Crew Associate",
    company: "Skyline Aviation",
    description: "Assist passengers with boarding, in-flight service, safety guidance, and a polished travel experience.",
    hours: "Rotational shifts",
    salary: "Rs 38,000 - Rs 52,000 / month",
    location: "Delhi International Airport",
    type: "Cabin Crew",
    status: "Active",
    badge: "Full Time",
    icon: "flight_class",
    posted: "2 days ago",
  },
  {
    id: "job-2",
    title: "Ground Staff Executive",
    company: "SkyPort Services",
    description: "Support check-in, boarding assistance, passenger queries, and daily terminal coordination.",
    hours: "Day and evening shifts",
    salary: "Rs 24,000 - Rs 32,000 / month",
    location: "Mumbai Airport",
    type: "Ground Staff",
    status: "Active",
    badge: "Entry Level",
    icon: "support_agent",
    posted: "5 hours ago",
  },
  {
    id: "job-3",
    title: "Customer Service Officer",
    company: "Terminal Connect",
    description: "Provide front-desk support, lounge assistance, and customer care for airport passengers.",
    hours: "8-hour flexible roster",
    salary: "Rs 30,000 - Rs 40,000 / month",
    location: "Bengaluru Airport",
    type: "Customer Service",
    status: "Active",
    badge: "Immediate",
    icon: "badge",
    posted: "1 day ago",
  },
  {
    id: "job-4",
    title: "Ramp Operations Agent",
    company: "RunwayLink Logistics",
    description: "Handle baggage coordination, aircraft support tasks, and apron-side operational assistance.",
    hours: "Rotational 12-hour shifts",
    salary: "Rs 26,000 - Rs 35,000 / month",
    location: "Hyderabad Airport",
    type: "Ramp Operations",
    status: "Active",
    badge: "Contract",
    icon: "engineering",
    posted: "3 days ago",
  },
  {
    id: "job-5",
    title: "Airport Security Assistant",
    company: "SecureWing Support",
    description: "Assist with airport access control, screening support, and passenger safety procedures.",
    hours: "Rotational shifts",
    salary: "Rs 22,000 - Rs 30,000 / month",
    location: "Chennai Airport",
    type: "Security",
    status: "Active",
    badge: "Full Time",
    icon: "shield",
    posted: "Today",
  },
];

const elements = {
  jobListings: document.getElementById("jobListings"),
  emptyJobsState: document.getElementById("emptyJobsState"),
  jobSearchInput: document.getElementById("jobSearchInput"),
  jobCategoryFilter: document.getElementById("jobCategoryFilter"),
  activeJobsStat: document.getElementById("activeJobsStat"),
  selectedJobTitle: document.getElementById("selectedJobTitle"),
  selectedJobMeta: document.getElementById("selectedJobMeta"),
  applicationForm: document.getElementById("applicationForm"),
  applicationMessage: document.getElementById("applicationMessage"),
  applicationJobId: document.getElementById("applicationJobId"),
  applicationModal: document.getElementById("applicationModal"),
  closeApplicationModalButton: document.getElementById("closeApplicationModalButton"),
  contactForm: document.getElementById("contactForm"),
  contactMessageStatus: document.getElementById("contactMessageStatus"),
};

let jobs = loadJobs();

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

function persistCollection(storageKey, value) {
  const current = JSON.parse(localStorage.getItem(storageKey) || "[]");
  current.push(value);
  localStorage.setItem(storageKey, JSON.stringify(current));
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
  return "bg-sky-100 text-sky-700";
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
  elements.applicationJobId.value = job.id;
  elements.selectedJobTitle.textContent = job.title;
  elements.selectedJobMeta.textContent = `${job.company} | ${job.location} | ${job.salary}`;
  elements.applicationMessage.textContent = "";
  elements.applicationModal.classList.remove("hidden");
  elements.applicationModal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function closeApplicationModal() {
  elements.applicationModal.classList.add("hidden");
  elements.applicationModal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
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

elements.applicationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!elements.applicationJobId.value) {
    elements.applicationMessage.textContent = "Please select a job before submitting the form.";
    return;
  }

  const resumeInput = document.getElementById("resumeFile");
  persistCollection(STORAGE_KEYS.applications, {
    id: `app-${Date.now()}`,
    jobId: elements.applicationJobId.value,
    fullName: document.getElementById("fullName").value.trim(),
    contactNumber: document.getElementById("contactNumber").value.trim(),
    emailAddress: document.getElementById("emailAddress").value.trim(),
    resumeFileName: resumeInput.files[0] ? resumeInput.files[0].name : "",
    coverLetter: document.getElementById("coverLetter").value.trim(),
    submittedAt: new Date().toISOString(),
  });

  elements.applicationForm.reset();
  elements.applicationJobId.value = "";
  elements.selectedJobTitle.textContent = "Choose a vacancy to begin your application.";
  elements.selectedJobMeta.textContent = "Your selected role details will appear here.";
  elements.applicationMessage.textContent = "Your application has been submitted successfully.";
  window.setTimeout(closeApplicationModal, 1200);
});

elements.contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.contactForm);

  persistCollection(STORAGE_KEYS.contacts, {
    id: `contact-${Date.now()}`,
    name: formData.get("contactName"),
    email: formData.get("contactEmail"),
    message: formData.get("contactMessage"),
    submittedAt: new Date().toISOString(),
  });

  elements.contactForm.reset();
  elements.contactMessageStatus.textContent = "Your message has been sent successfully.";
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.applicationModal.classList.contains("hidden")) {
    closeApplicationModal();
  }
});

renderJobs();
