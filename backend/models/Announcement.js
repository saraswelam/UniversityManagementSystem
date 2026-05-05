const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    content:  { type: String, default: "", trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    date:     { type: String, default: () => new Date().toISOString().split("T")[0] },
    time:     { type: String, default: "" },
    location: { type: String, default: "", trim: true },
    pinned:   { type: Boolean, default: false },
    cancelled:{ type: Boolean, default: false },
    expiresAt:{ type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
