const mongoose = require("mongoose");

const officeHourSchema = new mongoose.Schema(
  {
    professor: { type: String, default: "General", trim: true },
    day:       { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime:   { type: String, required: true, trim: true },
    time:      { type: String, default: "", trim: true },
    location:  { type: String, default: "", trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    mode:      { type: String, default: "In person", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OfficeHour", officeHourSchema);
