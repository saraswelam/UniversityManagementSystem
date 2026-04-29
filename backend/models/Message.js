const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from:    { type: String, required: true, trim: true },
    to:      { type: String, required: true, trim: true },
    subject: { type: String, default: "", trim: true },
    content: { type: String, required: true },
    text:    { type: String, default: "" },
    read:    { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
