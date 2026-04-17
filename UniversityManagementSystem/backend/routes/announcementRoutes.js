const express = require("express");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

async function validateCourse(req, courseId) {
  if (!courseId) return true;
  return Boolean(await Course.findOne(ownerFilter(req, { _id: courseId })));
}

function normalizeAnnouncement(announcement) {
  return {
    ...announcement,
    content: announcement.content || announcement.location || "",
  };
}

router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find(ownerFilter(req))
      .populate("courseId", "name code")
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    res.json(announcements.map(normalizeAnnouncement));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, content, courseId, date, location, pinned } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const announcement = await Announcement.create(withOwner(req, {
      title,
      content: content || location || "",
      courseId: courseId || null,
      date,
      location,
      pinned,
    }));

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { title, content, courseId, date, location, pinned } = req.body;

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updates = removeUndefined({ title, content, courseId, date, location, pinned });
    const announcement = await Announcement.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    ).populate("courseId", "name code");

    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
