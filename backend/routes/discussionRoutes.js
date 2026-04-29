const express = require("express");
const Discussion = require("../models/Discussion");
const Course = require("../models/Course");
const { ownerFilter, removeUndefined, withOwner } = require("../utils/ownership");

const router = express.Router();

function normalizeDiscussion(discussion) {
  return {
    ...discussion,
    content: discussion.content || discussion.body || "",
    comments: discussion.replies || [],
  };
}

async function validateCourse(req, courseId) {
  if (!courseId) return true;
  return Boolean(await Course.findOne(ownerFilter(req, { _id: courseId })));
}

router.get("/", async (req, res) => {
  try {
    const discussions = await Discussion.find(ownerFilter(req))
      .populate("courseId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    res.json(discussions.map(normalizeDiscussion));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, author, body, content, courseId } = req.body;
    const discussionContent = content || body;

    if (!title || !discussionContent) {
      return res.status(400).json({ error: "title and content required" });
    }

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const discussion = await Discussion.create(withOwner(req, {
      title,
      author: author || req.user.email,
      content: discussionContent,
      body: discussionContent,
      courseId: courseId || null,
    }));

    res.status(201).json(discussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { title, author, body, content, courseId } = req.body;
    const discussionContent = content || body;

    if (!(await validateCourse(req, courseId))) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updates = removeUndefined({
      title,
      author,
      content: discussionContent,
      body: discussionContent,
      courseId,
    });

    const discussion = await Discussion.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    ).populate("courseId", "name code");

    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.json(discussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/reply", async (req, res) => {
  try {
    const { author, body } = req.body;
    if (!body) return res.status(400).json({ error: "body required" });

    const discussion = await Discussion.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { $push: { replies: { author: author || req.user.email, body } } },
      { new: true, runValidators: true }
    );

    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.status(201).json(discussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const discussion = await Discussion.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
