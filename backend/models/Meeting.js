const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    link:        { type: String, default: "", trim: true },
    studentName: { type: String, default: "Unknown", trim: true },
    professor:   { type: String, default: "General", trim: true },
    date:        { type: String, required: true },
    time:        { type: String, default: "" },
    mode:        { type: String, default: "In person", trim: true },
    status:      {
      type: String,
      enum: ["pending", "approved", "declined", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
