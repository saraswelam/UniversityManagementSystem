const express = require("express");
const Course = require("../models/Course");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const professorFilter = req.query.professor ? { professor: req.query.professor } : {};
    const courses = await Course.find(ownerFilter(req, professorFilter)).sort({ createdAt: -1 });
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
    const { name, code, description, department, creditHours, type, enrollmentCap } = req.body;

    if (!name || !code || !department) {
      return res.status(400).json({ error: "name, code, department required" });
    }

    const course = await Course.create(withOwner(req, {
      name,
      code,
      description,
      department,
      creditHours,
      type,
      enrollmentCap,
      professor: req.user.role === "professor" ? req.user.email : undefined,
    }));

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, code, description, department, creditHours, type, enrollmentCap } = req.body;
    const updates = removeUndefined({ name, code, description, department, creditHours, type, enrollmentCap });

    const course = await Course.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { professor: req.body.professor },
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
