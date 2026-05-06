const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.auth = decoded;
    req.user = {
      ...user.toObject(),
      id: String(user._id),
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  JWT_SECRET,
  requireAuth,
};
