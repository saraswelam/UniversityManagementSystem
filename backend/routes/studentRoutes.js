const express = require("express");
const User = require("../models/User");

const router = express.Router();

const allowedStatuses = ["active", "inactive", "graduated", "withdrawn"];
const studentSelect = "firstName lastName email studentId department studentStatus studentsStatus";

function normalizeStudent(student) {
  const object = student.toObject ? student.toObject() : student;
  return {
    ...object,
    studentStatus: object.studentStatus || object.studentsStatus || "active",
  };
}

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
      filter.$or = [
        { studentStatus: status },
        { studentsStatus: status },
        ...(status === "active" ? [{ studentStatus: { $exists: false }, studentsStatus: { $exists: false } }] : []),
      ];
    }

    const students = await User.find(filter)
      .select(studentSelect)
      .sort({ lastName: 1, firstName: 1 });

    res.json(students.map(normalizeStudent));
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
      { studentStatus: status, studentsStatus: status },
      { new: true, runValidators: true }
    ).select(studentSelect);

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json(normalizeStudent(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
