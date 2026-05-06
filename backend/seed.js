require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ums";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "ums";
const SYSTEM_ADMIN = {
  email: "sara.swelam@gmail.com",
  password: "adminsara",
  role: "admin",
  firstName: "Sara",
  lastName: "Swelam",
};

async function ensureSystemAdmin() {
  await User.deleteMany({ role: "admin", email: { $ne: SYSTEM_ADMIN.email } });

  const admin = await User.findOne({ email: SYSTEM_ADMIN.email });
  if (admin) {
    admin.password = SYSTEM_ADMIN.password;
    admin.role = "admin";
    admin.firstName = SYSTEM_ADMIN.firstName;
    admin.lastName = SYSTEM_ADMIN.lastName;
    admin.isActive = true;
    await admin.save();
    return;
  }

  await new User(SYSTEM_ADMIN).save();
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
    });
    console.log("Connected to MongoDB");
    await ensureSystemAdmin();

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "professor@university.edu" });
    
    if (existingUser) {
      console.log("Test users already exist");
      
      // Link parent to student if not already linked
      const parent = await User.findOne({ email: "parent@university.edu" });
      const student = await User.findOne({ email: "student@university.edu" });
      
      if (parent && student && !parent.linkedStudentId) {
        parent.linkedStudentId = student._id;
        await parent.save();
        console.log("✓ Linked parent to student");
      }
      
      console.log("\n=== Test Credentials ===");
      console.log("Professor: professor@university.edu / password123");
      console.log("Student: student@university.edu / password123");
      console.log("Parent: parent@university.edu / password123");
      console.log("Staff: staff@university.edu / password123");
      console.log("========================\n");
    } else {
      // Create test users for each role
      const testUsers = [
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

      // Link parent to student
      const parent = await User.findOne({ email: "parent@university.edu" });
      const student = await User.findOne({ email: "student@university.edu" });
      
      if (parent && student) {
        parent.linkedStudentId = student._id;
        await parent.save();
        console.log("✓ Linked parent (Mary Johnson) to student (Jane Doe)");
      }
    }

    console.log("\n=== Test Credentials ===");
    console.log("Admin: sara.swelam@gmail.com / adminsara");
    console.log("Professor: professor@university.edu / password123");
    console.log("Student: student@university.edu / password123");
    console.log("Parent: parent@university.edu / password123 (linked to Jane Doe)");
    console.log("Staff: staff@university.edu / password123");
    console.log("========================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
}

seed();
