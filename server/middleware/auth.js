export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}

export function requireAdmin(req, res, next) {
  if (req.session && req.session.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}