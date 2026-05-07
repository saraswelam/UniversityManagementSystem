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
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    studentName: { type: String, required: true, trim: true },
    content:     { type: String, default: "" },
    fileName:    { type: String, default: "", trim: true },
    fileType:    { type: String, default: "", trim: true },
    fileData:    { type: String, default: "" },
    grade:       { type: Number, default: null, min: 0, max: 100 },
    feedback:    { type: String, default: "" },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    gradedAt:    { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const gradebookEntrySchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    studentName: { type: String, required: true, trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    grade: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, default: "" },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

gradebookEntrySchema.index({ submissionId: 1 }, { unique: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
const Submission  = mongoose.model("Submission",  submissionSchema);
const GradebookEntry = mongoose.model("GradebookEntry", gradebookEntrySchema);

module.exports = { Assignment, Submission, GradebookEntry };
