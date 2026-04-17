const express = require("express");
const User = require("../models/User");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function generateTempPassword() {
  return `${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}1A`;
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const roleFilter = req.query.role ? { role: req.query.role } : { role: { $in: ["professor", "staff"] } };
    const staff = await User.find({ ...roleFilter, isActive: true })
      .select("firstName lastName email phone officeHours department role")
      .sort({ lastName: 1, firstName: 1 });

    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      officeHours,
      department,
      role = "professor",
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "firstName, lastName, and email are required" });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!["professor", "staff"].includes(role)) {
      return res.status(400).json({ error: "Role must be professor or staff" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    const tempPassword = generateTempPassword();
    const user = new User({
      email: normalizedEmail,
      password: tempPassword,
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || undefined,
      officeHours: officeHours || undefined,
      department: department || undefined,
    });

    await user.save();

    res.status(201).json({
      user: user.getPublicProfile(),
      tempPassword,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email is already in use" });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
