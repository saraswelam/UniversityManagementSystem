const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

enrollmentSchema.index({ course: 1, createdAt: -1 });

enrollmentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
