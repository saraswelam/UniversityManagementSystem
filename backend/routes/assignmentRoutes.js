const express = require("express");
const { Assignment, Submission } = require("../models/Assignment");
const Course = require("../models/Course");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

async function resolveCourse(req, courseId, courseCode) {
  if (!courseId) return { courseId: null, courseCode };

  const course = await Course.findOne(ownerFilter(req, { _id: courseId }));
  if (!course) return null;

  return {
    courseId,
    courseCode: course.code,
  };
}

router.get("/", async (req, res) => {
  try {
    const filter = ownerFilter(
      req,
      req.query.courseCode ? { courseCode: req.query.courseCode.toUpperCase() } : {}
    );
    const assignments = await Assignment.find(filter)
      .populate("courseId", "name code")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, courseId, courseCode, dueDate, weightage } = req.body;

    if (!title || !dueDate || (!courseId && !courseCode)) {
      return res.status(400).json({ error: "title, course, dueDate required" });
    }

    const resolvedCourse = await resolveCourse(req, courseId, courseCode);
    if (!resolvedCourse) return res.status(404).json({ error: "Course not found" });

    const assignment = await Assignment.create(withOwner(req, {
      title,
      description,
      courseId: resolvedCourse.courseId,
      courseCode: resolvedCourse.courseCode,
      dueDate,
      weightage,
    }));

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/submissions", async (req, res) => {
  try {
    const filter = ownerFilter(
      req,
      req.query.assignmentId ? { assignmentId: req.query.assignmentId } : {}
    );
    const submissions = await Submission.find(filter)
      .populate("assignmentId", "title courseCode")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/submissions", async (req, res) => {
  try {
    const { assignmentId, studentName, content } = req.body;
    if (!assignmentId || !studentName || !content) {
      return res.status(400).json({ error: "assignmentId, studentName, content required" });
    }

    const assignment = await Assignment.findOne(ownerFilter(req, { _id: assignmentId }));
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const submission = await Submission.create(withOwner(req, { assignmentId, studentName, content }));
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/submissions/:id/grade", async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { grade, feedback },
      { new: true, runValidators: true }
    );

    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { title, description, courseId, courseCode, dueDate, weightage } = req.body;
    const updates = removeUndefined({ title, description, courseId, courseCode, dueDate, weightage });

    if (courseId) {
      const resolvedCourse = await resolveCourse(req, courseId, courseCode);
      if (!resolvedCourse) return res.status(404).json({ error: "Course not found" });
      updates.courseCode = resolvedCourse.courseCode;
    }

    const assignment = await Assignment.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    ).populate("courseId", "name code");

    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    await Submission.deleteMany(ownerFilter(req, { assignmentId: req.params.id }));
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
