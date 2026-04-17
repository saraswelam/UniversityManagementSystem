const express = require("express");
const Meeting = require("../models/Meeting");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const professorFilter = req.query.professor ? { professor: req.query.professor } : {};
    const meetings = await Meeting.find(ownerFilter(req, professorFilter)).sort({ date: 1, time: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, link, studentName, professor, date, time, mode } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "title and date required" });
    }

    const meeting = await Meeting.create(withOwner(req, {
      title,
      description,
      link,
      studentName: studentName || req.user.email,
      professor,
      date,
      time,
      mode,
    }));

    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { title, description, link, studentName, professor, date, time, mode } = req.body;
    const updates = removeUndefined({ title, description, link, studentName, professor, date, time, mode });

    const meeting = await Meeting.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    );

    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const meeting = await Meeting.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { status },
      { new: true, runValidators: true }
    );

    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
