const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staffName: { type: String, required: true, trim: true },
    staffEmail: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, trim: true },
    month: { type: String, required: true }, // YYYY-MM format
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "pending",
    },
    paymentDate: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
payrollSchema.index({ staffId: 1, month: 1 });

module.exports = mongoose.model("Payroll", payrollSchema);
