const express = require("express");
const { Assignment, Submission, GradebookEntry } = require("../models/Assignment");
const Course = require("../models/Course");
//const Enrollment = require("../models/Enrollment");
const Enrollment = require("../models/Enrollment");
const { isAdmin, ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

function isProfessor(req) {
  return req.user?.role === "professor";
}

function isStudent(req) {
  return req.user?.role === "student";
}

function assignmentFilter(req, extra = {}) {
  if (isAdmin(req) || isStudent(req)) return { ...extra };
  return { ...extra, createdBy: req.user.id };
}

async function getReviewableAssignment(req, assignmentId) {
  if (!assignmentId) return null;
  return Assignment.findOne({ _id: assignmentId, createdBy: req.user.id });
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl) return null;
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() : dataUrl;
  return Buffer.from(base64, "base64");
}

async function resolveCourse(req, courseId, courseCode) {
  if (!courseId) {
    const normalizedCode = courseCode?.trim().toUpperCase();
    if (!normalizedCode) return { courseId: null, courseCode };

    const course = await Course.findOne({ code: normalizedCode });
    if (!course) return null;
    if (isProfessor(req) && course.professor !== req.user.email) return null;

    return { courseId: course._id, courseCode: course.code };
  }

  const course = await Course.findById(courseId);
  if (!course) return null;
  if (isProfessor(req) && course.professor !== req.user.email) return null;

  return {
    courseId,
    courseCode: course.code,
  };
}

async function studentCanAccessAssignment(req, assignment) {
  if (!assignment?.courseCode) return false;

  const enrollments = await Enrollment.find({ student: req.user.id })
    .populate("course", "code");

  return enrollments.some((item) => item.course?.code === assignment.courseCode.toUpperCase());
}

router.get("/", async (req, res) => {
  try {
    if (req.user.role === "student") {
      const enrollments = await Enrollment.find({ student: req.user.id })
        .populate("course", "code");
      const courseCodes = enrollments
        .map((enrollment) => enrollment.course?.code)
        .filter(Boolean);

      if (courseCodes.length === 0) return res.json([]);

      const filter = {
        courseCode: req.query.courseCode
          ? req.query.courseCode.toUpperCase()
          : { $in: courseCodes },
      };

      if (req.query.courseCode && !courseCodes.includes(filter.courseCode)) {
        return res.json([]);
      }

      const assignments = await Assignment.find(filter)
        .populate("courseId", "name code")
        .sort({ dueDate: 1, createdAt: -1 });

      return res.json(assignments);
    }

    if (req.user.role === "student") {
      const enrollments = await Enrollment.find({ student: req.user.id })
        .populate("course", "code");
      const courseCodes = enrollments
        .map((enrollment) => enrollment.course?.code)
        .filter(Boolean);

      if (courseCodes.length === 0) return res.json([]);

      const filter = {
        courseCode: req.query.courseCode
          ? req.query.courseCode.toUpperCase()
          : { $in: courseCodes },
      };

      if (req.query.courseCode && !courseCodes.includes(filter.courseCode)) {
        return res.json([]);
      }

      const assignments = await Assignment.find(filter)
        .populate("courseId", "name code")
        .sort({ dueDate: 1, createdAt: -1 });

      return res.json(assignments);
    }

    if (req.user.role === "student") {
      const enrollments = await Enrollment.find({ student: req.user.id })
        .populate("course", "code");
      const courseCodes = enrollments
        .map((enrollment) => enrollment.course?.code)
        .filter(Boolean);

      if (courseCodes.length === 0) return res.json([]);

      const filter = {
        courseCode: req.query.courseCode
          ? req.query.courseCode.toUpperCase()
          : { $in: courseCodes },
      };

      if (req.query.courseCode && !courseCodes.includes(filter.courseCode)) {
        return res.json([]);
      }

      const assignments = await Assignment.find(filter)
        .populate("courseId", "name code")
        .sort({ dueDate: 1, createdAt: -1 });

      return res.json(assignments);
    }

    const filter = assignmentFilter(
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
    if (!isProfessor(req)) {
      return res.status(403).json({ error: "Only professors can create assignments" });
    }

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
    let filter = {};

    if (req.query.assignmentId) {
      filter.assignmentId = req.query.assignmentId;
    }

    if (isStudent(req)) {
      filter = {
        ...filter,
        $or: [
          { studentUserId: req.user.id },
          { createdBy: req.user.id },
        ],
      };
    } else if (!isAdmin(req)) {
      const assignments = await Assignment.find({ createdBy: req.user.id }).select("_id");
      const assignmentIds = assignments.map((assignment) => assignment._id);

      if (req.query.assignmentId && !assignmentIds.some((id) => String(id) === req.query.assignmentId)) {
        return res.status(403).json({ error: "You can only review submissions for your assignments" });
      }

      filter.assignmentId = req.query.assignmentId || { $in: assignmentIds };
    }

    const submissions = await Submission.find(filter)
      .populate("assignmentId", "title courseCode")
      .populate("studentUserId", "firstName lastName email studentId")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/submissions", async (req, res) => {
  try {
    const { assignmentId, studentName, content, fileName, fileType, fileData } = req.body;
    if (!isStudent(req)) {
      return res.status(403).json({ error: "Only students can submit assignments" });
    }

    if (!assignmentId || (!content && !fileData)) {
      return res.status(400).json({ error: "assignmentId and submission content or file required" });
    }

    const assignment = await Assignment.findOne(assignmentFilter(req, { _id: assignmentId }));
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    if (!(await studentCanAccessAssignment(req, assignment))) {
      return res.status(403).json({ error: "You can only submit assignments for enrolled courses" });
    }

    const resolvedStudentName = studentName
      || `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
      || req.user.email;

    const submission = await Submission.findOneAndUpdate(
      {
        assignmentId,
        $or: [
          { studentUserId: req.user.id },
          { createdBy: req.user.id },
        ],
      },
      withOwner(req, {
        assignmentId,
        studentUserId: req.user.id,
        studentName: resolvedStudentName,
        content: content || "",
        fileName: fileName || "",
        fileType: fileType || "",
        fileData: fileData || "",
        submittedAt: new Date(),
      }),
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/submissions/:id/download", async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("assignmentId", "title createdBy");
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const ownsSubmission = String(submission.createdBy || "") === req.user.id
      || String(submission.studentUserId || "") === req.user.id;
    const canReview = isProfessor(req)
      && String(submission.assignmentId?.createdBy || "") === req.user.id;

    if (!ownsSubmission && !canReview) {
      return res.status(403).json({ error: "You cannot download this submission" });
    }

    const safeName = (submission.fileName || `${submission.studentName}-submission.txt`)
      .replace(/[^\w.\- ]+/g, "_");

    if (submission.fileData) {
      const buffer = dataUrlToBuffer(submission.fileData);
      res.setHeader("Content-Type", submission.fileType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      return res.send(buffer);
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    return res.send(submission.content || "");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/submissions/download/bulk", async (req, res) => {
  try {
    const assignment = await getReviewableAssignment(req, req.query.assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const submissions = await Submission.find({ assignmentId: assignment._id }).sort({ studentName: 1 });
    const bundle = submissions.map((submission) => [
      `Student: ${submission.studentName}`,
      `Submitted: ${submission.submittedAt.toISOString()}`,
      `File: ${submission.fileName || "Text submission"}`,
      `Grade: ${submission.grade ?? "Not graded"}`,
      "",
      submission.content || (submission.fileName ? "File attached. Download individually for the original file." : ""),
      "",
      "----------------------------------------",
      "",
    ].join("\n")).join("\n");

    const fileName = `${assignment.title.replace(/[^\w.\- ]+/g, "_")}-submissions.txt`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(bundle || "No submissions found.");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/submissions/:id/grade", async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (!isProfessor(req)) {
      return res.status(403).json({ error: "Only professors can grade submissions" });
    }

    const numericGrade = Number(grade);
    if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return res.status(400).json({ error: "Grade must be a number between 0 and 100" });
    }

    const existingSubmission = await Submission.findById(req.params.id).populate("assignmentId");
    if (!existingSubmission) return res.status(404).json({ error: "Submission not found" });

    const assignment = existingSubmission.assignmentId;
    if (!assignment || String(assignment.createdBy || "") !== req.user.id) {
      return res.status(403).json({ error: "You can only grade submissions for your assignments" });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        grade: numericGrade,
        feedback: feedback || "",
        gradedBy: req.user.id,
        gradedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("assignmentId", "title courseCode");

    const gradebookEntry = await GradebookEntry.findOneAndUpdate(
      { submissionId: submission._id },
      {
        assignmentId: assignment._id,
        submissionId: submission._id,
        studentUserId: submission.studentUserId || submission.createdBy,
        studentName: submission.studentName,
        courseId: assignment.courseId,
        courseCode: assignment.courseCode,
        grade: numericGrade,
        feedback: feedback || "",
        gradedBy: req.user.id,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ submission, gradebookEntry });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Gradebook entry already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/gradebook", async (req, res) => {
  try {
    const filter = {};

    if (isStudent(req)) {
      filter.$or = [
        { studentUserId: req.user.id },
        { studentName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() },
      ];
    } else if (isProfessor(req)) {
      filter.gradedBy = req.user.id;
    } else {
      return res.status(403).json({ error: "Only students and professors can view the gradebook" });
    }

    const entries = await GradebookEntry.find(filter)
      .populate("assignmentId", "title dueDate")
      .populate("studentUserId", "firstName lastName email studentId")
      .sort({ updatedAt: -1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!isProfessor(req)) {
      return res.status(403).json({ error: "Only professors can update assignments" });
    }

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
    if (!isProfessor(req)) {
      return res.status(403).json({ error: "Only professors can delete assignments" });
    }

    const assignment = await Assignment.findOneAndDelete(
      ownerFilter(req, { _id: req.params.id })
    );
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    await Submission.deleteMany({ assignmentId: req.params.id });
    await GradebookEntry.deleteMany({ assignmentId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
