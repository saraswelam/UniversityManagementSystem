const express = require("express");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Only admins can access enrollments" });
    return false;
  }
  return true;
}

function requireStudent(req, res) {
  if (req.user?.role !== "student") {
    res.status(403).json({ error: "Only students can enroll in courses" });
    return false;
  }
  return true;
}

function isRegistrationOpen(course, now) {
  const start = course.registrationStart ? new Date(course.registrationStart) : null;
  const end = course.registrationEnd ? new Date(course.registrationEnd) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function normalizeStudent(student) {
  if (!student) return student;
  const object = student.toObject ? student.toObject() : student;
  return {
    ...object,
    studentStatus: object.studentStatus || object.studentsStatus || "active",
  };
}

function normalizeEnrollment(enrollment) {
  const object = enrollment.toObject ? enrollment.toObject() : enrollment;
  return {
    ...object,
    student: normalizeStudent(object.student),
  };
}

router.get("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { courseId, department, studentId } = req.query;
    const filter = {};

    if (courseId) {
      filter.course = courseId;
    } else if (department) {
      const courses = await Course.find({ department: department.trim() }).select("_id");
      const courseIds = courses.map((course) => course._id);
      filter.course = { $in: courseIds };
    }

    if (studentId) {
      filter.student = studentId;
    }

    const enrollments = await Enrollment.find(filter)
      .populate("student", "firstName lastName email studentId department studentStatus studentsStatus")
      .populate("course", "name code department type enrollmentCap enrolledCount registrationStart registrationEnd")
      .sort({ createdAt: -1 });

    res.json(enrollments.map(normalizeEnrollment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/mine", async (req, res) => {
  try {
    if (!requireStudent(req, res)) return;

    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate("course", "name code department type enrollmentCap enrolledCount registrationStart registrationEnd")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/student/:id", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const student = await User.findOne({ _id: req.params.id, role: "student" })
      .select("firstName lastName email studentId department studentStatus studentsStatus");

    if (!student) return res.status(404).json({ error: "Student not found" });

    const enrollments = await Enrollment.find({ student: student._id })
      .populate("course", "name code department type")
      .sort({ createdAt: -1 });

    res.json({
      student: normalizeStudent(student),
      courses: enrollments.map((enrollment) => enrollment.course),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!requireStudent(req, res)) return;

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if (course.type !== "elective") {
      return res.status(400).json({ error: "Only elective courses are open for enrollment" });
    }

    const now = new Date();
    if (!isRegistrationOpen(course, now)) {
      return res.status(400).json({ error: "Registration window is closed" });
    }

    const existing = await Enrollment.findOne({ student: req.user.id, course: course._id });
    if (existing) {
      return res.status(409).json({ error: "You are already enrolled in this course" });
    }

    if (course.enrollmentCap !== null && course.enrolledCount >= course.enrollmentCap) {
      return res.status(409).json({ error: "Error: This course has reached its maximum enrollment capacity." });
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: course._id, enrolledCount: { $lt: course.enrollmentCap } },
      { $inc: { enrolledCount: 1 } },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(409).json({ error: "Error: This course has reached its maximum enrollment capacity." });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course._id,
    });

    res.status(201).json(enrollment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "You are already enrolled in this course" });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
