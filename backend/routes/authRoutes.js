const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

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

    // Find user by email or ID
    let user = await User.findOne({ 
      $or: [
        { email: identifier },
        { studentId: identifier },
        { employeeId: identifier }
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
    const { email, password, role, firstName, lastName, studentId, employeeId, department } = req.body;

    // Validate required fields
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ 
        message: "Email, password, role, firstName, and lastName are required" 
      });
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
      employeeId: ["professor", "staff"].includes(role) ? employeeId : undefined,
      department,
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
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
