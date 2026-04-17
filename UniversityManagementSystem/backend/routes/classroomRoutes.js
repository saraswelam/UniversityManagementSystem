const express = require("express");
const Classroom = require("../models/Classroom");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function normalizeEquipment(equipment) {
  if (!equipment) return [];
  const list = Array.isArray(equipment) ? equipment : [equipment];
  return list
    .map((item) => String(item).trim())
    .filter(Boolean);
}

router.get("/", async (req, res) => {
  try {
    const rooms = await Classroom.find({ isActive: true }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { roomNumber, roomName, maxCapacity, equipment } = req.body;

    if (!roomNumber || !roomName || !maxCapacity) {
      return res.status(400).json({ error: "roomNumber, roomName, and maxCapacity are required" });
    }

    const parsedCapacity = Number(maxCapacity);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({ error: "maxCapacity must be a positive number" });
    }

    const room = await Classroom.create({
      roomNumber: roomNumber.trim(),
      roomName: roomName.trim(),
      maxCapacity: parsedCapacity,
      equipment: normalizeEquipment(equipment),
    });

    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Room number must be unique" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { roomNumber, roomName, maxCapacity, equipment, isActive } = req.body;
    const updates = {};

    if (roomNumber) updates.roomNumber = roomNumber.trim();
    if (roomName) updates.roomName = roomName.trim();
    if (maxCapacity !== undefined) {
      const parsedCapacity = Number(maxCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({ error: "maxCapacity must be a positive number" });
      }
      updates.maxCapacity = parsedCapacity;
    }
    if (equipment !== undefined) updates.equipment = normalizeEquipment(equipment);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const room = await Classroom.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!room) return res.status(404).json({ error: "Classroom not found" });

    res.json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Room number must be unique" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const room = await Classroom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: "Classroom not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
