function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function isAdminAuthenticated(req) {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN;
  if (!expectedToken) {
    return false;
  }

  return readCookie(req, "admin_session") === expectedToken;
}

module.exports = {
  isAdminAuthenticated,
  readCookie,
};
