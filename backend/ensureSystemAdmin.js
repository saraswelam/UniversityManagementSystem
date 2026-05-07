const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/User");

const SYSTEM_ADMIN = {
  email: "sara.swelam@gmail.com",
  password: "adminsara",
  role: "admin",
  firstName: "Sara",
  lastName: "Swelam",
  isActive: true,
};

async function ensureSystemAdmin() {
  await User.deleteMany({ role: "admin", email: { $ne: SYSTEM_ADMIN.email } });

  const admin = await User.findOne({ email: SYSTEM_ADMIN.email });
  if (admin) {
    admin.password = SYSTEM_ADMIN.password;
    admin.role = SYSTEM_ADMIN.role;
    admin.firstName = SYSTEM_ADMIN.firstName;
    admin.lastName = SYSTEM_ADMIN.lastName;
    admin.isActive = true;
    await admin.save();
  } else {
    await new User(SYSTEM_ADMIN).save();
  }

  try {
    await User.syncIndexes();
  } catch (error) {
    console.warn(`System admin ready, but user indexes could not be synced: ${error.message}`);
  }

  const adminCount = await User.countDocuments({ role: "admin" });
  console.log(`System admin ready. Admin accounts in database: ${adminCount}`);
}

async function runStandalone() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in backend/.env");
  }

  await mongoose.connect(uri, {
    dbName,
    authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
  });

  await ensureSystemAdmin();
}

if (require.main === module) {
  runStandalone()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = {
  SYSTEM_ADMIN,
  ensureSystemAdmin,
};
