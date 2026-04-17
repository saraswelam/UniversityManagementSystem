const express = require("express");
const RoomBooking = require("../models/RoomBooking");
const Classroom = require("../models/Classroom");
const { ownerFilter, withOwner } = require("../utils/ownership");

const router = express.Router();

// Get all room bookings (staff see only their bookings, admin sees all)
router.get("/", async (req, res) => {
  try {
    const bookings = await RoomBooking.find(ownerFilter(req)).sort({ date: -1, startTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available rooms for a specific date and time
router.get("/available", async (req, res) => {
  try {
    const { date, startTime } = req.query;
    
    if (!date || !startTime) {
      return res.status(400).json({ error: "date and startTime are required" });
    }

    // Find all active bookings for the given date and time
    const existingBookings = await RoomBooking.find({
      date,
      startTime,
      status: "active",
    });

    const allRooms = await Classroom.find({ isActive: true }).sort({ roomNumber: 1 });

    // Filter out booked rooms
    const bookedRoomNumbers = existingBookings.map(b => b.roomNumber);
    const availableRooms = allRooms
      .filter((room) => !bookedRoomNumbers.includes(room.roomNumber))
      .map((room) => ({
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        capacity: room.maxCapacity,
        equipment: room.equipment || [],
      }));

    res.json(availableRooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new room booking
router.post("/", async (req, res) => {
  try {
    const { roomNumber, roomName, date, startTime, purpose } = req.body;

    if (!roomNumber || !roomName || !date || !startTime) {
      return res.status(400).json({ error: "roomNumber, roomName, date, and startTime are required" });
    }

    // Calculate end time (1 hour session)
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = (hours + 1) % 24;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    // Check if room is already booked
    const existingBooking = await RoomBooking.findOne({
      roomNumber,
      date,
      startTime,
      status: "active",
    });

    if (existingBooking) {
      return res.status(400).json({ error: "This room is already booked for the selected time" });
    }

    const room = await Classroom.findOne({ roomNumber, isActive: true });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const user = req.user;
    const booking = await RoomBooking.create(withOwner(req, {
      roomNumber,
      roomName: roomName || room.roomName,
      date,
      startTime,
      endTime,
      purpose,
      staffName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      staffEmail: user.email,
    }));

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel a room booking
router.patch("/:id/cancel", async (req, res) => {
  try {
    const booking = await RoomBooking.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { status: "cancelled" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a room booking
router.delete("/:id", async (req, res) => {
  try {
    const booking = await RoomBooking.findOneAndDelete(ownerFilter(req, { _id: req.params.id }));

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
