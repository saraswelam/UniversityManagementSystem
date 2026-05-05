const express = require("express");
const User = require("../models/User");

const router = express.Router();

const allowedStatuses = ["active", "inactive", "graduated", "withdrawn"];

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Only admins can manage students" });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const status = (req.query.status || "active").toLowerCase();
    const filter = { role: "student" };

    if (status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      filter.studentStatus = status;
    }

    const students = await User.find(filter)
      .select("firstName lastName email studentId department studentStatus")
      .sort({ lastName: 1, firstName: 1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { status } = req.body;
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Valid status is required" });
    }

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      { studentStatus: status },
      { new: true, runValidators: true }
    ).select("firstName lastName email studentId department studentStatus");

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
