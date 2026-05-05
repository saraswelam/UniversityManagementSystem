const express = require("express");
const Room = require("../models/Room");

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Only admins can manage rooms" });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { roomNumber, roomName, capacity, equipment } = req.body;

    if (!roomNumber || !roomName || capacity === undefined) {
      return res.status(400).json({ error: "roomNumber, roomName, capacity required" });
    }

    const normalizedNumber = roomNumber.trim();
    const normalizedName = roomName.trim();
    const numericCapacity = Number(capacity);

    if (Number.isNaN(numericCapacity) || numericCapacity < 1) {
      return res.status(400).json({ error: "capacity must be a positive number" });
    }

    const existing = await Room.findOne({ roomNumber: normalizedNumber });
    if (existing) {
      return res.status(409).json({ error: "Room number already exists" });
    }

    const room = await Room.create({
      roomNumber: normalizedNumber,
      roomName: normalizedName,
      capacity: numericCapacity,
      equipment: Array.isArray(equipment)
        ? equipment.map((item) => item.trim()).filter(Boolean)
        : [],
    });

    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Room number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { roomNumber, roomName, capacity, equipment } = req.body;
    const updates = {};

    if (roomNumber) updates.roomNumber = roomNumber.trim();
    if (roomName) updates.roomName = roomName.trim();
    if (capacity !== undefined) {
      const numericCapacity = Number(capacity);
      if (Number.isNaN(numericCapacity) || numericCapacity < 1) {
        return res.status(400).json({ error: "capacity must be a positive number" });
      }
      updates.capacity = numericCapacity;
    }
    if (Array.isArray(equipment)) {
      updates.equipment = equipment.map((item) => item.trim()).filter(Boolean);
    }

    const room = await Room.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Room number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
