function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );

  return json(res, 200, { authenticated: false });
};
