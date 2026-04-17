const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    code:          { type: String, required: true, trim: true, uppercase: true, unique: true },
    description:   { type: String, default: "", trim: true },
    department:    { type: String, required: true, trim: true },
    creditHours:   { type: Number, default: 3, min: 1 },
    type:          { type: String, enum: ["core", "elective"], default: "core" },
    enrollmentCap: { type: Number, default: 40, min: 1 },
    enrolledCount: { type: Number, default: 0 },
    professor:     { type: String, trim: true, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

courseSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
