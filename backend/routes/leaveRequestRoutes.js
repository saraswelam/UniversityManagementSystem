const express = require("express");
const LeaveRequest = require("../models/LeaveRequest");
const { ownerFilter, withOwner } = require("../utils/ownership");

const router = express.Router();

// Get all leave requests (staff see only their requests, admin sees all)
router.get("/", async (req, res) => {
  try {
    const requests = await LeaveRequest.find(ownerFilter(req)).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single leave request
router.get("/:id", async (req, res) => {
  try {
    const request = await LeaveRequest.findOne(ownerFilter(req, { _id: req.params.id }));

    if (!request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new leave request
router.post("/", async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const user = req.user;
    const request = await LeaveRequest.create(withOwner(req, {
      staffName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      staffEmail: user.email,
      employeeId: user.employeeId || "N/A",
      startDate,
      endDate,
      leaveType: leaveType || "vacation",
      reason: reason || "",
    }));

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update leave request status (admin only)
router.patch("/:id/status", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update leave request status" });
    }

    const { status, reviewNotes } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Valid status (approved/rejected) is required" });
    }

    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes: reviewNotes || "",
        reviewedBy: req.user.email,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a leave request (only if pending)
router.delete("/:id", async (req, res) => {
  try {
    const request = await LeaveRequest.findOne(ownerFilter(req, { _id: req.params.id }));

    if (!request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Cannot delete a leave request that has been reviewed" });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Leave request deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
