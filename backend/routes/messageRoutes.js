const express = require("express");
const Message = require("../models/Message");
const { isAdmin, withOwner } = require("../utils/ownership");

const router = express.Router();

function messageAccessFilter(req, extra = {}) {
  if (isAdmin(req)) return { ...extra };

  return {
    ...extra,
    $or: [
      { createdBy: req.user.id },
      { to: req.user.email },
    ],
  };
}

function normalizeMessage(message) {
  return {
    ...message,
    sender: { name: message.from },
    subject: message.subject || "Message",
    content: message.content || message.text || "",
  };
}

router.get("/", async (req, res) => {
  try {
    const recipientFilter = req.query.to ? { to: req.query.to } : {};
    const messages = await Message.find(messageAccessFilter(req, recipientFilter))
      .sort({ createdAt: -1 })
      .lean();

    res.json(messages.map(normalizeMessage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { from, to, subject, content, text } = req.body;
    const messageContent = content || text;

    if (!to || !messageContent) {
      return res.status(400).json({ error: "to and content required" });
    }

    const message = await Message.create(withOwner(req, {
      from: from || req.user.email,
      to,
      subject,
      content: messageContent,
      text: text || messageContent,
    }));

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      messageAccessFilter(req, { _id: req.params.id }),
      { read: true },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: "Message not found" });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findOneAndDelete(messageAccessFilter(req, { _id: req.params.id }));
    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
