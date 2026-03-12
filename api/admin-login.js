function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function getConfiguredCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;

  if (!username || !password || !sessionToken) {
    return null;
  }

  return { username, password, sessionToken };
}

function createCookie(token) {
  return `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  const configured = getConfiguredCredentials();
  if (!configured) {
    return json(res, 500, { message: "Admin credentials are not configured on the server." });
  }

  const { username, password } = req.body || {};
  if (
    String(username || "").trim().toLowerCase() !== configured.username.toLowerCase() ||
    String(password || "") !== configured.password
  ) {
    return json(res, 401, { message: "Invalid username/email or password." });
  }

  res.setHeader("Set-Cookie", createCookie(configured.sessionToken));
  return json(res, 200, { authenticated: true });
};
