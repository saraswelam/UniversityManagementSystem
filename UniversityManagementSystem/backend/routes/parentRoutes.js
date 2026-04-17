const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();

// Get parent's linked child information
router.get("/child", async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can access this endpoint" });
    }

    const parent = await User.findById(req.user.id).populate("linkedStudentId");

    if (!parent || !parent.linkedStudentId) {
      return res.status(404).json({ error: "No linked child found" });
    }

    const child = parent.linkedStudentId;
    
    res.json({
      id: child._id,
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.email,
      studentId: child.studentId,
      department: child.department,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get child's courses and instructors
router.get("/child/courses", async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can access this endpoint" });
    }

    const parent = await User.findById(req.user.id).populate("linkedStudentId");

    if (!parent || !parent.linkedStudentId) {
      return res.status(404).json({ error: "No linked child found" });
    }

    // Get all courses (in a real system, this would be filtered by student enrollment)
    const courses = await Course.find({ professor: { $ne: null } }).sort({ name: 1 });

    // Get unique professors
    const professorEmails = [...new Set(courses.map(c => c.professor).filter(Boolean))];
    
    // Get professor details
    const professors = await User.find({
      email: { $in: professorEmails },
      role: "professor",
    }).select("firstName lastName email department");

    // Map courses with professor details
    const coursesWithInstructors = courses.map(course => {
      const instructor = professors.find(p => p.email === course.professor);
      return {
        _id: course._id,
        name: course.name,
        code: course.code,
        department: course.department,
        instructor: instructor ? {
          email: instructor.email,
          name: `${instructor.firstName} ${instructor.lastName}`,
          department: instructor.department,
        } : null,
      };
    }).filter(c => c.instructor); // Only include courses with instructors

    res.json({
      child: {
        firstName: parent.linkedStudentId.firstName,
        lastName: parent.linkedStudentId.lastName,
        studentId: parent.linkedStudentId.studentId,
      },
      courses: coursesWithInstructors,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all instructors (for parents to contact)
router.get("/instructors", async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can access this endpoint" });
    }

    const instructors = await User.find({
      role: "professor",
      isActive: true,
    })
      .select("firstName lastName email department")
      .sort({ lastName: 1 });

    res.json(instructors.map(instructor => ({
      email: instructor.email,
      name: `${instructor.firstName} ${instructor.lastName}`,
      department: instructor.department,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
