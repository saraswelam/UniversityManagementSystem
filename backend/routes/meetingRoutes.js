const express = require("express");
const Meeting = require("../models/Meeting");
const Message = require("../models/Message");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

function buildMeetingSummary(meeting) {
  const lines = [
    `Meeting subject: ${meeting.title}`,
    `Date: ${meeting.date}${meeting.time ? ` ${meeting.time}` : ""}`,
    `Mode: ${meeting.mode || "In person"}`,
  ];

  if (meeting.link) lines.push(`Link: ${meeting.link}`);
  return lines.join("\n");
}

async function sendMeetingConfirmation(req, meeting) {
  if (req.user?.role !== "student") return;
  if (!meeting.professor || !req.user?.email) return;

  const summary = buildMeetingSummary(meeting);
  const systemFrom = "no-reply@ums.local";

  try {
    await Message.create(withOwner(req, {
      from: systemFrom,
      to: req.user.email,
      subject: "Meeting confirmation",
      content: summary,
      text: summary,
    }));

    const professorContent = `Student: ${req.user.email}\n${summary}`;
    await Message.create(withOwner(req, {
      from: systemFrom,
      to: meeting.professor,
      subject: "New meeting booked",
      content: professorContent,
      text: professorContent,
    }));
  } catch (err) {
    console.error("Failed to send meeting confirmation:", err.message);
  }
}

function parseDateParts(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function parseTimeParts(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(":");
  if (parts.length < 2) return null;
  const [hour, minute] = parts.map(Number);
  if ([hour, minute].some((part) => Number.isNaN(part))) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

router.get("/busy", async (req, res) => {
  try {
    const { professor, startDate, endDate } = req.query;

    if (!professor) {
      return res.status(400).json({ error: "professor is required" });
    }

    const filter = {
      professor,
      status: { $in: ["pending", "approved"] },
      time: { $ne: "" },
    };

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = startDate;
    }

    const meetings = await Meeting.find(filter)
      .select("date time status professor durationMinutes")
      .sort({ date: 1, time: 1 })
      .lean();

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    const dateParts = parseDateParts(date);
    if (!dateParts) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetingDate = new Date(dateParts.year, dateParts.month - 1, dateParts.day);
    if (meetingDate < today) {
      return res.status(400).json({ error: "Meeting date must be today or later" });
    }

    if (time) {
      const timeParts = parseTimeParts(time);
      if (!timeParts) {
        return res.status(400).json({ error: "Invalid time format" });
      }
      const meetingDateTime = new Date(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        timeParts.hour,
        timeParts.minute
      );
      if (meetingDateTime <= now) {
        return res.status(400).json({ error: "Meeting time must be in the future" });
      }
    }

    if (professor && date && time) {
      const existingMeeting = await Meeting.findOne({
        professor,
        date,
        time,
        status: { $in: ["pending", "approved"] },
      });

      if (existingMeeting) {
        return res.status(409).json({ error: "This slot is already booked" });
      }
    }

    const meeting = await Meeting.create(withOwner(req, {
      title,
      description,
      link,
      studentName: studentName || req.user.email,
      professor,
      date,
      time,
      durationMinutes: 15,
      mode,
    }));

    await sendMeetingConfirmation(req, meeting);
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { title, description, link, studentName, professor, date, time, mode } = req.body;
    const updates = removeUndefined({ title, description, link, studentName, professor, date, time, mode, durationMinutes: 15 });

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
    if (!["pending", "approved", "declined", "cancelled"].includes(status)) {
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
    const meeting = await Meeting.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { status: "cancelled" },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
