const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    highSchool: { type: String, required: true, trim: true },
    highSchoolGrade: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
