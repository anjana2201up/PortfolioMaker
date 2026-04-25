const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  // Support both "Authorization: Bearer <token>" and "x-auth-token: <token>"
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null) || req.headers["x-auth-token"];

  if (!token) {
    return res.status(401).json({ error: "No token — authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token is not valid" });
  }
};