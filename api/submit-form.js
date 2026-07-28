const nodemailer = require("nodemailer");

const DESTINATION_EMAIL = "pawancareerhub@gmail.com";
const MAX_LENGTHS = {
  name: 100,
  email: 254,
  contactNumber: 30,
  message: 5000,
  jobId: 100,
  jobTitle: 200,
  jobMeta: 500,
};

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function normalizeBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body && typeof body === "object" ? body : {};
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { message: "Method not allowed." });
  }

  const body = normalizeBody(req.body);

  // Silently accept bot submissions caught by the hidden honeypot field.
  if (clean(body.website, 200)) {
    return json(res, 200, { sent: true });
  }

  const formType = body.formType === "Job Application"
    ? "Job Application"
    : "Contact Form";
  const data = Object.fromEntries(
    Object.entries(MAX_LENGTHS).map(([field, maxLength]) => [
      field,
      clean(body[field], maxLength),
    ])
  );

  if (!data.name || !data.email || !data.message) {
    return json(res, 400, { message: "Please complete all required fields." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return json(res, 400, { message: "Please enter a valid email address." });
  }

  if (formType === "Job Application" && (!data.contactNumber || !data.jobTitle)) {
    return json(res, 400, { message: "Please provide the required application details." });
  }

  if (
    formType === "Job Application" &&
    !/^[+\d][\d\s()-]{6,29}$/.test(data.contactNumber)
  ) {
    return json(res, 400, { message: "Please enter a valid contact number." });
  }

  const gmailUser = process.env.GMAIL_USER || DESTINATION_EMAIL;
  const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");
  if (!gmailAppPassword) {
    console.error("GMAIL_APP_PASSWORD is not configured.");
    return json(res, 503, {
      message: "Email delivery is temporarily unavailable. Please call 8766328016.",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const subject = formType === "Job Application"
    ? `New application: ${data.jobTitle.replace(/[\r\n]+/g, " ")}`
    : `New website enquiry from ${data.name}`;
  const fields = [
    ["Form", formType],
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.contactNumber || "Not provided"],
    ["Job", data.jobTitle || "Not applicable"],
    ["Job ID", data.jobId || "Not applicable"],
    ["Job details", data.jobMeta || "Not applicable"],
    ["Message", data.message],
  ];
  const text = fields.map(([label, value]) => `${label}: ${value}`).join("\n\n");
  const html = fields
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  try {
    await transporter.sendMail({
      from: `Pawan Career Hub <${gmailUser}>`,
      to: DESTINATION_EMAIL,
      replyTo: data.email,
      subject,
      text,
      html,
    });
    return json(res, 200, { sent: true });
  } catch (error) {
    console.error("Unable to deliver form email:", error);
    return json(res, 502, {
      message: "We could not send your details. Please call 8766328016.",
    });
  }
};
