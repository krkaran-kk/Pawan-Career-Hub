const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

const sentMessages = [];
const originalLoad = Module._load;
Module._load = function loadWithMock(request, parent, isMain) {
  if (request === "nodemailer") {
    return {
      createTransport() {
        return {
          async sendMail(message) {
            sentMessages.push(message);
          },
        };
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const submitForm = require("../api/submit-form");
Module._load = originalLoad;

function createResponse() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}

async function invoke(method, body) {
  const response = createResponse();
  await submitForm({ method, body }, response);
  return response;
}

async function run() {
  process.env.GMAIL_USER = "pawancareerhub@gmail.com";
  process.env.GMAIL_APP_PASSWORD = "test-app-password";

  const contactResponse = await invoke("POST", {
    formType: "Contact Form",
    name: "Test Visitor",
    email: "visitor@example.com",
    message: "Please contact me.",
  });
  assert.equal(contactResponse.statusCode, 200);
  assert.equal(contactResponse.body.sent, true);
  assert.equal(sentMessages[0].to, "pawancareerhub@gmail.com");
  assert.equal(sentMessages[0].replyTo, "visitor@example.com");

  const applicationResponse = await invoke("POST", {
    formType: "Job Application",
    name: "Test Candidate",
    email: "candidate@example.com",
    contactNumber: "+91 90000 00000",
    jobId: "job-1",
    jobTitle: "Cabin Crew Associate",
    jobMeta: "Delhi | Full time",
    message: "My test cover letter.",
  });
  assert.equal(applicationResponse.statusCode, 200);
  assert.match(sentMessages[1].subject, /Cabin Crew Associate/);
  assert.match(sentMessages[1].text, /Test Candidate/);

  const invalidEmailResponse = await invoke("POST", {
    name: "Test",
    email: "invalid",
    message: "Hello",
  });
  assert.equal(invalidEmailResponse.statusCode, 400);

  const invalidPhoneResponse = await invoke("POST", {
    formType: "Job Application",
    name: "Test",
    email: "test@example.com",
    contactNumber: "invalid",
    jobTitle: "Test Job",
    message: "Hello",
  });
  assert.equal(invalidPhoneResponse.statusCode, 400);

  const honeypotResponse = await invoke("POST", {
    website: "https://spam.example",
  });
  assert.equal(honeypotResponse.statusCode, 200);
  assert.equal(sentMessages.length, 2);

  delete process.env.GMAIL_APP_PASSWORD;
  const originalConsoleError = console.error;
  console.error = () => {};
  const unconfiguredResponse = await invoke("POST", {
    name: "Test",
    email: "test@example.com",
    message: "Hello",
  });
  console.error = originalConsoleError;
  assert.equal(unconfiguredResponse.statusCode, 503);

  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const browserScript = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.doesNotMatch(html, /9876543210|formspree|careers@skylineaviation/);
  assert.equal((html.match(/tel:\+918766328016/g) || []).length, 5);
  assert.equal((html.match(/action="\/api\/submit-form"/g) || []).length, 2);
  assert.match(browserScript, /setupFormSubmission\(\s*"contactForm"/);
  assert.match(browserScript, /setupFormSubmission\(\s*"applicationForm"/);

  console.log("Form endpoint and page integration tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
