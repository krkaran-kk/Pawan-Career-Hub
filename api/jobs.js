const { isAdminAuthenticated } = require("./_admin-auth");
const { getJobs, saveJobs } = require("./_jobs-store");

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const payload = await getJobs();
      return json(res, 200, payload);
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return json(res, 405, { message: "Method not allowed." });
    }

    if (!isAdminAuthenticated(req)) {
      return json(res, 401, { message: "You must be signed in as admin to update jobs." });
    }

    const nextJobs = req.body && Array.isArray(req.body.jobs) ? req.body.jobs : null;
    if (!nextJobs) {
      return json(res, 400, { message: "A jobs array is required." });
    }

    const savedJobs = await saveJobs(nextJobs);
    return json(res, 200, {
      saved: true,
      jobs: savedJobs,
      storage: "kv",
      writable: true,
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return json(res, 500, {
      message: error && error.message ? error.message : "Unable to process jobs right now.",
    });
  }
};
