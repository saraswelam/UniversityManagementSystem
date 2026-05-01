const express = require("express");
const OfficeHour = require("../models/OfficeHour");
const Course = require("../models/Course");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

async function validateCourse(req, courseId) {
  if (!courseId) return true;
  return Boolean(await Course.findOne(ownerFilter(req, { _id: courseId })));
}

function officeHourReadFilter(req, extra = {}) {
  if (req.user?.role === "student") return extra;
  return ownerFilter(req, extra);
}

router.get("/", async (req, res) => {
  try {
    const professorFilter = req.query.professor ? { professor: req.query.professor } : {};
    const officeHours = await OfficeHour.find(officeHourReadFilter(req, professorFilter))
      .populate("courseId", "name code")
      .sort({ day: 1, startTime: 1 });

    res.json(officeHours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { professor, day, startTime, endTime, time, location, courseId, mode } = req.body;
    const resolvedStartTime = startTime || time;
    const resolvedEndTime = endTime || time;

    if (!day || !resolvedStartTime || !resolvedEndTime) {
      return res.status(400).json({ error: "day, startTime, endTime required" });
    }

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const entry = await OfficeHour.create(withOwner(req, {
      professor: professor || req.user.email,
      day,
      startTime: resolvedStartTime,
      endTime: resolvedEndTime,
      time: time || `${resolvedStartTime} - ${resolvedEndTime}`,
      location,
      courseId: courseId || null,
      mode,
    }));

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { professor, day, startTime, endTime, time, location, courseId, mode } = req.body;

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updates = removeUndefined({
      professor,
      day,
      startTime,
      endTime,
      time: time || (startTime && endTime ? `${startTime} - ${endTime}` : undefined),
      location,
      courseId,
      mode,
    });

    const entry = await OfficeHour.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    ).populate("courseId", "name code");

    if (!entry) return res.status(404).json({ error: "Office hours not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entry = await OfficeHour.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));
    if (!entry) return res.status(404).json({ error: "Office hours not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
