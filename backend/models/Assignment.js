const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    dueDate:    { type: String, required: true },
    weightage:  { type: Number, default: 10, min: 1, max: 100 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentName: { type: String, required: true, trim: true },
    content:     { type: String, required: true },
    grade:       { type: Number, default: null, min: 0, max: 100 },
    feedback:    { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);
const Submission  = mongoose.model("Submission",  submissionSchema);

module.exports = { Assignment, Submission };
