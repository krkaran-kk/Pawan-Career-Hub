function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

module.exports = async (req, res) => {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN;
  if (!expectedToken) {
    return json(res, 500, { authenticated: false, message: "Admin session token is not configured." });
  }

  const currentToken = readCookie(req, "admin_session");
  return json(res, 200, { authenticated: currentToken === expectedToken });
};
