require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ums";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "ums";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
    });
    console.log("Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "professor@university.edu" });
    
    if (existingUser) {
      console.log("Test user already exists");
      console.log("Email: professor@university.edu");
      console.log("Password: password123");
      console.log("Role: professor");
    } else {
      // Create test users for each role
      const testUsers = [
        {
          email: "admin@university.edu",
          password: "password123",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
          employeeId: "EMP001",
          department: "Administration",
        },
        {
          email: "professor@university.edu",
          password: "password123",
          role: "professor",
          firstName: "John",
          lastName: "Smith",
          employeeId: "EMP002",
          department: "Computer Science",
        },
        {
          email: "student@university.edu",
          password: "password123",
          role: "student",
          firstName: "Jane",
          lastName: "Doe",
          studentId: "STU001",
          department: "Computer Science",
        },
        {
          email: "staff@university.edu",
          password: "password123",
          role: "staff",
          firstName: "Bob",
          lastName: "Johnson",
          employeeId: "EMP003",
          department: "Registrar",
        },
        {
          email: "parent@university.edu",
          password: "password123",
          role: "parent",
          firstName: "Mary",
          lastName: "Johnson",
        },
      ];

      for (const userData of testUsers) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log("\n=== Test Credentials ===");
    console.log("Email: professor@university.edu");
    console.log("Password: password123");
    console.log("Role: professor");
    console.log("========================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
}

seed();