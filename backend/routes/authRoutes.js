const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

const router = express.Router();
const FIXED_ADMIN_EMAIL = "sara.swelam@gmail.com";

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    // Validate input
    if (!identifier || !password || !role) {
      return res.status(400).json({ 
        message: "Email/ID, password, and role are required" 
      });
    }

    const normalizedIdentifier = identifier.trim();
    const normalizedEmail = normalizedIdentifier.toLowerCase();

    // Find user by email or ID
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { studentId: normalizedIdentifier },
        { employeeId: normalizedIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify role matches
    if (user.role !== role) {
      return res.status(401).json({ 
        message: `Invalid role. Your account is registered as ${user.role}` 
      });
    }

    if (role === "admin" && user.email !== FIXED_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Admin access is restricted to the system admin account" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token
    res.json({
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Register endpoint (for creating new users)
router.post("/register", async (req, res) => {
  try {
    const {
      email: rawEmail,
      password,
      role,
      firstName,
      lastName,
      studentId,
      employeeId,
      department,
      linkedStudentId,
      phone,
      address,
      dateOfBirth,
    } = req.body;

    // Validate required fields
    if (!rawEmail || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ 
        message: "Email, password, role, firstName, and lastName are required" 
      });
    }

    const email = rawEmail.toLowerCase().trim();

    if (role === "admin") {
      return res.status(403).json({ message: "Admin registration is disabled" });
    }

    const allowedRoles = ["student", "professor", "parent", "staff"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    if (role === "student" && (!studentId || !department)) {
      return res.status(400).json({ message: "Student ID and department are required for students" });
    }

    if (["professor", "staff"].includes(role) && (!employeeId || !department)) {
      return res.status(400).json({ message: "Employee ID and department are required for this role" });
    }

    let linkedStudentObjectId;
    if (role === "parent") {
      if (!linkedStudentId) {
        return res.status(400).json({ message: "Child Student ID is required for parents" });
      }

      const linkedStudent = await User.findOne({ role: "student", studentId: linkedStudentId });
      if (!linkedStudent) {
        return res.status(400).json({ message: "No student account found with that Student ID" });
      }

      linkedStudentObjectId = linkedStudent._id;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(studentId ? [{ studentId }] : []),
        ...(employeeId ? [{ employeeId }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      firstName,
      lastName,
      studentId: role === "student" ? studentId : undefined,
      studentsStatus: role === "student" ? "active" : undefined,
      employeeId: ["professor", "staff"].includes(role) ? employeeId : undefined,
      department: ["student", "professor", "staff"].includes(role) ? department : undefined,
      linkedStudentId: linkedStudentObjectId,
      phone: phone || undefined,
      address: role === "parent" ? address : undefined,
      dateOfBirth: role === "student" && dateOfBirth ? dateOfBirth : undefined,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Logout endpoint (client-side token removal, but we can track it)
router.post("/logout", (req, res) => {
  // In a more advanced setup, you might want to blacklist the token
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ message: "Server error while loading user" });
  }
});

module.exports = router;
