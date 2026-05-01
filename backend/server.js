require("dotenv").config();

const express           = require("express");
const cors              = require("cors");
const connectDB         = require("./config/db");
const healthRoutes      = require("./routes/healthRoutes");
const authRoutes        = require("./routes/authRoutes");
const courseRoutes      = require("./routes/courseRoutes");
const assignmentRoutes  = require("./routes/assignmentRoutes");
const discussionRoutes  = require("./routes/discussionRoutes");
const officeHourRoutes  = require("./routes/officeHourRoutes");
const meetingRoutes     = require("./routes/meetingRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const messageRoutes     = require("./routes/messageRoutes");
const roomBookingRoutes = require("./routes/roomBookingRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const payrollRoutes     = require("./routes/payrollRoutes");
const parentRoutes      = require("./routes/parentRoutes");
const { requireAuth }    = require("./middleware/auth");

const app  = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

    if (!origin || isLocalDevOrigin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "UMS API is running" });
});

app.get("/api", (req, res) => {
  res.json({
    message: "UMS API is running",
    endpoints: {
      auth: "/api/auth",
      health: "/api/health",
    },
  });
});

app.use("/api/auth",       authRoutes);
app.use("/api/health",        healthRoutes);
app.use("/api/courses",       requireAuth, courseRoutes);
app.use("/api/assignments",   requireAuth, assignmentRoutes);
app.use("/api/discussions",   requireAuth, discussionRoutes);
app.use("/api/office-hours",  requireAuth, officeHourRoutes);
app.use("/api/meetings",      requireAuth, meetingRoutes);
app.use("/api/announcements", requireAuth, announcementRoutes);
app.use("/api/messages",      requireAuth, messageRoutes);
app.use("/api/room-bookings", requireAuth, roomBookingRoutes);
app.use("/api/leave-requests", requireAuth, leaveRequestRoutes);
app.use("/api/payroll",       requireAuth, payrollRoutes);
app.use("/api/parent",        requireAuth, parentRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
