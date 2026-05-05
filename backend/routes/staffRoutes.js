const express = require("express");
const User = require("../models/User");

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Only admins can manage staff" });
    return false;
  }
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get staff directory (admin only)
router.get("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const role = req.query.role;
    const roleFilter = role ? { role } : { role: { $in: ["professor", "staff"] } };

    const staff = await User.find(roleFilter)
      .select("firstName lastName email phone officeHours role department")
      .sort({ lastName: 1, firstName: 1 });

    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create staff profile (admin only)
router.post("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { firstName, lastName, email, phone, officeHours, role } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "firstName, lastName, and email are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const staffRole = role && ["professor", "staff"].includes(role) ? role : "professor";

    const user = new User({
      email: normalizedEmail,
      password: "password123",
      role: staffRole,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : "",
      officeHours: officeHours ? officeHours.trim() : "",
    });

    await user.save();

    res.status(201).json({
      user: user.getPublicProfile(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
