const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User");
const { removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const professorFilter = req.query.professor ? { professor: req.query.professor } : {};
    const departmentFilter = req.query.department
      ? { department: req.query.department.trim() }
      : {};
    const typeFilter = req.query.type ? { type: req.query.type.trim() } : {};
    const courses = await Course.find({
      ...professorFilter,
      ...departmentFilter,
      ...typeFilter,
    }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create courses" });
    }

    const {
      name,
      code,
      description,
      department,
      creditHours,
      type,
      enrollmentCap,
      registrationStart,
      registrationEnd,
    } = req.body;

    if (!name || !code || !department) {
      return res.status(400).json({ error: "name, code, department required" });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Course.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({ error: "Course code already exists" });
    }

    const creditHoursValue = creditHours === undefined || creditHours === ""
      ? undefined
      : Number(creditHours);
    const enrollmentCapValue = enrollmentCap === undefined || enrollmentCap === ""
      ? undefined
      : Number(enrollmentCap);
    const registrationStartValue = registrationStart ? new Date(registrationStart) : null;
    const registrationEndValue = registrationEnd ? new Date(registrationEnd) : null;

    if (registrationStart && Number.isNaN(registrationStartValue?.getTime())) {
      return res.status(400).json({ error: "Invalid registrationStart date" });
    }
    if (registrationEnd && Number.isNaN(registrationEndValue?.getTime())) {
      return res.status(400).json({ error: "Invalid registrationEnd date" });
    }
    if (registrationStartValue && registrationEndValue && registrationStartValue > registrationEndValue) {
      return res.status(400).json({ error: "Registration start must be before end" });
    }

    const course = await Course.create(withOwner(req, {
      name,
      code: normalizedCode,
      description,
      department: department.trim(),
      creditHours: creditHoursValue,
      type,
      enrollmentCap: enrollmentCapValue,
      registrationStart: registrationStartValue,
      registrationEnd: registrationEndValue,
      professor: req.user.role === "professor" ? req.user.email : undefined,
    }));

    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Course code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update courses" });
    }

    const {
      name,
      code,
      description,
      department,
      creditHours,
      type,
      enrollmentCap,
      registrationStart,
      registrationEnd,
    } = req.body;
    const normalizedCode = code ? code.trim().toUpperCase() : undefined;
    const normalizedDepartment = department ? department.trim() : undefined;
    const creditHoursValue = creditHours === undefined || creditHours === ""
      ? undefined
      : Number(creditHours);
    const enrollmentCapValue = enrollmentCap === undefined || enrollmentCap === ""
      ? undefined
      : Number(enrollmentCap);
    const registrationStartValue = registrationStart === "" ? null : (registrationStart ? new Date(registrationStart) : undefined);
    const registrationEndValue = registrationEnd === "" ? null : (registrationEnd ? new Date(registrationEnd) : undefined);

    if (registrationStart && Number.isNaN(registrationStartValue?.getTime())) {
      return res.status(400).json({ error: "Invalid registrationStart date" });
    }
    if (registrationEnd && Number.isNaN(registrationEndValue?.getTime())) {
      return res.status(400).json({ error: "Invalid registrationEnd date" });
    }
    if (registrationStartValue && registrationEndValue && registrationStartValue > registrationEndValue) {
      return res.status(400).json({ error: "Registration start must be before end" });
    }

    if (normalizedCode) {
      const existing = await Course.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({ error: "Course code already exists" });
      }
    }

    const updates = removeUndefined({
      name,
      code: normalizedCode,
      description,
      department: normalizedDepartment,
      creditHours: creditHoursValue,
      type,
      enrollmentCap: enrollmentCapValue,
      registrationStart: registrationStartValue,
      registrationEnd: registrationEndValue,
    });

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Course code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can assign professors" });
    }

    const { professor } = req.body;

    if (!professor) {
      return res.status(400).json({ error: "professor is required" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if (course.professor && course.professor !== professor) {
      return res.status(409).json({ error: "Primary professor already assigned" });
    }

    const professorUser = await User.findOne({ email: professor, role: "professor" });
    if (!professorUser) {
      return res.status(400).json({ error: "Professor not found" });
    }

    course.professor = professor;
    await course.save();

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete courses" });
    }

    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
