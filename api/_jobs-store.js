const DEFAULT_JOBS = [
  {
    id: "job-test-1",
    title: "Ground Staff Trainee",
    company: "Pawan Career Hub",
    description: "Testing vacancy for verifying the shared admin publishing flow across devices.",
    hours: "9-hour rotational shift",
    salary: "Rs 18,000 - Rs 22,000 / month",
    location: "Delhi Airport",
    type: "Ground Staff",
    status: "Active",
    badge: "Testing",
    icon: "support_agent",
    posted: "Just now",
  },
];

const STORAGE_KEY = "pawan_career_hub_jobs";
const ALLOWED_STATUSES = new Set(["Drafted", "Active", "Deleted"]);

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeStatus(status) {
  const cleaned = clean(status, 20);
  return ALLOWED_STATUSES.has(cleaned) ? cleaned : "Drafted";
}

function normalizeJob(job, index) {
  const type = clean(job && job.type, 60) || "Ground Staff";

  return {
    id: clean(job && job.id, 80) || `job-${Date.now()}-${index + 1}`,
    title: clean(job && job.title, 120) || "Untitled Job",
    company: clean(job && job.company, 120) || "Pawan Career Hub",
    description: clean(job && job.description, 1000),
    hours: clean(job && job.hours, 120),
    salary: clean(job && job.salary, 120),
    location: clean(job && job.location, 120),
    type,
    status: normalizeStatus(job && job.status),
    badge: clean(job && job.badge, 40) || type,
    icon: clean(job && job.icon, 40) || "work",
    posted: clean(job && job.posted, 40) || "Recently posted",
  };
}

function normalizeJobs(jobs) {
  if (!Array.isArray(jobs) || !jobs.length) {
    return DEFAULT_JOBS.map((job, index) => normalizeJob(job, index));
  }

  return jobs.map((job, index) => normalizeJob(job, index));
}

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function runKvCommand(command) {
  const response = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`KV request failed with status ${response.status}.`);
  }

  return response.json();
}

async function getJobs() {
  if (!isKvConfigured()) {
    return {
      jobs: normalizeJobs(DEFAULT_JOBS),
      storage: "fallback",
      writable: false,
      message: "Set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel to sync jobs across devices.",
    };
  }

  const payload = await runKvCommand(["GET", STORAGE_KEY]);
  const storedValue = payload && Object.prototype.hasOwnProperty.call(payload, "result")
    ? payload.result
    : null;

  if (!storedValue) {
    const seededJobs = normalizeJobs(DEFAULT_JOBS);
    await runKvCommand(["SET", STORAGE_KEY, JSON.stringify(seededJobs)]);
    return {
      jobs: seededJobs,
      storage: "kv",
      writable: true,
      seeded: true,
    };
  }

  let parsedJobs = [];
  try {
    parsedJobs = JSON.parse(storedValue);
  } catch {
    parsedJobs = DEFAULT_JOBS;
  }

  const normalizedJobs = normalizeJobs(parsedJobs);
  await runKvCommand(["SET", STORAGE_KEY, JSON.stringify(normalizedJobs)]);

  return {
    jobs: normalizedJobs,
    storage: "kv",
    writable: true,
  };
}

async function saveJobs(jobs) {
  if (!isKvConfigured()) {
    throw new Error("Shared job storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.");
  }

  const normalizedJobs = normalizeJobs(jobs);
  await runKvCommand(["SET", STORAGE_KEY, JSON.stringify(normalizedJobs)]);

  return normalizedJobs;
}

module.exports = {
  DEFAULT_JOBS,
  getJobs,
  saveJobs,
};
