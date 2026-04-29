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
    location: { type: String, default: "", trim: true },
    pinned:   { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
