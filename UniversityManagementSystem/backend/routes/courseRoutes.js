const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function validateProfessor(email) {
  if (!email) return true;
  const professor = await User.findOne({ email, role: "professor", isActive: true });
  return Boolean(professor);
}

router.get("/", async (req, res) => {
  try {
    const professorFilter = req.query.professor ? { professor: req.query.professor } : {};
    const departmentFilter = req.query.department ? { department: req.query.department } : {};
    const courses = await Course.find(ownerFilter(req, {
      ...professorFilter,
      ...departmentFilter,
    })).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findOne(ownerFilter(req, { _id: req.params.id }));

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, code, description, department, creditHours, type, enrollmentCap, professor } = req.body;

    if (!name || !code || !department) {
      return res.status(400).json({ error: "name, code, department required" });
    }

    const normalizedCode = normalizeCode(code);
    const existingCourse = await Course.findOne({ code: normalizedCode });

    if (existingCourse) {
      return res.status(409).json({ error: "Course code must be unique" });
    }

    const resolvedProfessor = req.user.role === "professor"
      ? req.user.email
      : professor;
    const normalizedProfessor = resolvedProfessor ? normalizeEmail(resolvedProfessor) : "";

    if (resolvedProfessor && req.user.role !== "admin" && resolvedProfessor !== req.user.email) {
      return res.status(403).json({ error: "Only admins can assign professors to courses" });
    }

    if (!(await validateProfessor(normalizedProfessor))) {
      return res.status(400).json({ error: "Selected professor is not available" });
    }

    const course = await Course.create(withOwner(req, {
      name: name.trim(),
      code: normalizedCode,
      description,
      department: department.trim(),
      creditHours,
      type,
      enrollmentCap,
      professor: normalizedProfessor || undefined,
    }));

    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Course code must be unique" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, code, description, department, creditHours, type, enrollmentCap, professor } = req.body;
    const updates = removeUndefined({
      name,
      code,
      description,
      department,
      creditHours,
      type,
      enrollmentCap,
      professor,
    });

    if (updates.professor !== undefined) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can assign professors to courses" });
      }

      if (updates.professor) {
        updates.professor = normalizeEmail(updates.professor);
      }

      if (updates.professor && !(await validateProfessor(updates.professor))) {
        return res.status(400).json({ error: "Selected professor is not available" });
      }
    }

    if (updates.code) {
      const normalizedCode = normalizeCode(updates.code);
      const existingCourse = await Course.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });

      if (existingCourse) {
        return res.status(409).json({ error: "Course code must be unique" });
      }

      updates.code = normalizedCode;
    }

    if (updates.name) {
      updates.name = updates.name.trim();
    }

    if (updates.department) {
      updates.department = updates.department.trim();
    }

    const course = await Course.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Course code must be unique" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can assign professors to courses" });
    }

    const normalizedProfessor = req.body.professor ? normalizeEmail(req.body.professor) : "";

    if (!(await validateProfessor(normalizedProfessor))) {
      return res.status(400).json({ error: "Selected professor is not available" });
    }

    const course = await Course.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { professor: normalizedProfessor },
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
