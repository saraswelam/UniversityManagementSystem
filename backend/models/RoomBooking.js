const mongoose = require("mongoose");

const roomBookingSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true },
    roomName: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true }, // HH:MM format
    purpose: { type: String, default: "", trim: true },
    staffName: { type: String, required: true, trim: true },
    staffEmail: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for checking availability
roomBookingSchema.index({ roomNumber: 1, date: 1, startTime: 1 });

module.exports = mongoose.model("RoomBooking", roomBookingSchema);
