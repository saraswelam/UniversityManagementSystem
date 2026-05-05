const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true, unique: true },
    roomName: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    equipment: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
