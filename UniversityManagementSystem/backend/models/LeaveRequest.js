const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    staffName: { type: String, required: true, trim: true },
    staffEmail: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, trim: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD format
    endDate: { type: String, required: true }, // YYYY-MM-DD format
    leaveType: {
      type: String,
      enum: ["sick", "vacation", "personal", "emergency", "other"],
      default: "vacation",
    },
    reason: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, default: null, trim: true },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: "", trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for filtering by staff and status
leaveRequestSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
