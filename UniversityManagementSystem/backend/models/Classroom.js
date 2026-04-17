const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true, unique: true },
    roomName: { type: String, required: true, trim: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    equipment: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

classroomSchema.index({ roomNumber: 1 }, { unique: true });

module.exports = mongoose.model("Classroom", classroomSchema);
