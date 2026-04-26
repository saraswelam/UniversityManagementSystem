const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  await mongoose.connect(uri, {
    dbName,
    authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
    serverSelectionTimeoutMS: 10000
  });
}

module.exports = connectDB;
