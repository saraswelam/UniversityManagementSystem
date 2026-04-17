const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    body:   { type: String, required: true },
  },
  { timestamps: true }
);

const discussionSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    author:  { type: String, default: "Unknown", trim: true },
    content: { type: String, required: true },
    body:    { type: String, default: "" },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
